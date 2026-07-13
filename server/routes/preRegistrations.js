const express          = require('express');
const router           = express.Router();
const jwt              = require('jsonwebtoken');
const mongoose         = require('mongoose');
const PreRegistration  = require('../models/PreRegistration');
const ActivityLog      = require('../models/ActivityLog');
const Site             = require('../models/Site');
const VisitorGroup     = require('../models/VisitorGroup');
const Member           = require('../models/Member');
const { sendPreRegistrationInviteEmail, sendVisitorArrivalNotificationEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const verifyAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token' });
  try {
    const d = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const role = String(d.role || '').toLowerCase();
    if (!['admin', 'superadmin', 'guard', 'manager'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = { ...d, role };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const verifyStrictAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token' });
  try {
    const d = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (!['admin', 'superadmin'].includes(d.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = d;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const fmt = (p) => ({
  id: p._id, name: p.name, email: p.email, phone: p.phone, notes: p.notes,
  expected_date: p.expectedDate,
  site_id: p.siteId,
  visitor_group_id: p.visitorGroupId,
  visitor_group_name: p.visitorGroupName,
  member_id: p.memberId, status: p.status, created_at: p.createdAt,
});

const resolveFirst = async (siteId) => {
  if (siteId && siteId !== 'all') return siteId;
  const s = await Site.findOne().sort({createdAt:1}).lean(); return s?._id||null;
};

const normalizeVisitorGroup = ({ visitor_group_id, visitor_group_name }) => {
  // visitor_group_id must be a valid Mongo ObjectId for visitorGroupId field.
  // If mobile sends a label like "Visitor", store it as visitorGroupName instead.
  if (visitor_group_id && mongoose.isValidObjectId(visitor_group_id)) {
    return { visitorGroupId: visitor_group_id, visitorGroupName: undefined };
  }
  if (visitor_group_name && String(visitor_group_name).trim()) {
    return { visitorGroupId: null, visitorGroupName: String(visitor_group_name).trim() };
  }
  // Backward compat: if a non-objectid string was passed in visitor_group_id, treat it as name.
  if (visitor_group_id && String(visitor_group_id).trim()) {
    return { visitorGroupId: null, visitorGroupName: String(visitor_group_id).trim() };
  }
  return { visitorGroupId: null, visitorGroupName: undefined };
};

router.get('/', verifyAdmin, async (req,res) => {
  const { site_id, date_from, date_to, status, search } = req.query;
  try {
    const sid = await resolveFirst(site_id);
    const filter = {}; if (sid) filter.siteId = sid;
    if (status && status !== 'All') filter.status = status;
    if (date_from || date_to) { filter.expectedDate={}; if(date_from) filter.expectedDate.$gte=new Date(`${date_from}T00:00:00`); if(date_to) filter.expectedDate.$lte=new Date(`${date_to}T23:59:59`); }
    if (search) filter.name = new RegExp(search,'i');
    const items = await PreRegistration.find(filter).sort({expectedDate:1}).lean();
    res.json(items.map(fmt));
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.post('/', verifyAdmin, async (req,res) => {
  const { site_id, name, email, phone, notes, expected_date, visitor_group_id, visitor_group_name, member_id, send_invitation } = req.body;
  if (!name) return res.status(400).json({error:'name is required'});
  try {
    const sid = await resolveFirst(site_id);
    if (!sid) return res.status(400).json({error:'No site found'});

    const group = normalizeVisitorGroup({ visitor_group_id, visitor_group_name });
    const expected = expected_date ? new Date(expected_date) : null;
    if (expected_date && Number.isNaN(expected?.getTime?.())) {
      return res.status(400).json({ error: 'Invalid expected_date' });
    }

    const item = await PreRegistration.create({
      siteId: sid,
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      expectedDate: expected,
      visitorGroupId: group.visitorGroupId || null,
      visitorGroupName: group.visitorGroupName || undefined,
      memberId: member_id || null,
      status: 'Pending'
    });
    // Send email asynchronously so the API responds fast (important for mobile UX)
    if (send_invitation && email) {
      setImmediate(async () => {
        try {
          const site = await Site.findById(sid).lean();
          await sendPreRegistrationInviteEmail({
            email,
            name,
            siteName: site?.name,
            expectedDate: item.expectedDate,
            notes: item.notes,
          });
        } catch (e) {
          console.error('Pre-registration email failed:', e?.message || e);
        }
      });
    }
    res.status(201).json({success:true, pre_registration: fmt(item)});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.put('/:id', verifyAdmin, async (req,res) => {
  const { name, email, phone, notes, expected_date, visitor_group_id, visitor_group_name, status } = req.body;
  const u={};
  if(name!==undefined)            u.name=name;
  if(email!==undefined)           u.email=email;
  if(phone!==undefined)           u.phone=phone;
  if(notes!==undefined)           u.notes=notes;
  if(expected_date!==undefined)   u.expectedDate=expected_date?new Date(expected_date):null;
  if (expected_date !== undefined && expected_date && Number.isNaN(u.expectedDate?.getTime?.())) {
    return res.status(400).json({ error: 'Invalid expected_date' });
  }
  if(visitor_group_id!==undefined || visitor_group_name!==undefined) {
    const group = normalizeVisitorGroup({ visitor_group_id, visitor_group_name });
    u.visitorGroupId = group.visitorGroupId || null;
    u.visitorGroupName = group.visitorGroupName || undefined;
  }
  if(status!==undefined)          u.status=status;
  try {
    const item = await PreRegistration.findByIdAndUpdate(req.params.id, u, {new:true}).lean();
    if (!item) return res.status(404).json({error:'Not found'});
    res.json({success:true, pre_registration: fmt(item)});
  } catch(err){ res.status(500).json({error:'Server error'}); }
});

router.delete('/:id', verifyStrictAdmin, async (req,res) => {
  try { await PreRegistration.findByIdAndDelete(req.params.id); res.json({success:true}); }
  catch { res.status(500).json({error:'Server error'}); }
});

router.post('/:id/arrive', verifyAdmin, async (req,res) => {
  try {
    const prereg = await PreRegistration.findById(req.params.id).lean();
    if (!prereg) return res.status(404).json({error:'Not found'});
    const now=new Date(); const dateStr=now.toISOString().split('T')[0];
    const timeStr=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let groupName = 'Visitor';
    if (prereg.visitorGroupName) groupName = prereg.visitorGroupName;
    if (prereg.visitorGroupId) {
      try {
        const g = await VisitorGroup.findById(prereg.visitorGroupId).lean();
        if (g) groupName = g.name;
      } catch {}
    }
    
    const isGuard = req.user && ['guard', 'security'].includes(req.user.role);
    const guardName = req.user ? (req.user.name || req.user.firstName || 'Guard') : 'Guard';
    
    const log = await ActivityLog.create({
      siteId: prereg.siteId,
      memberId: prereg.memberId||null,
      name: prereg.name,
      userType: groupName,
      date: dateStr,
      timeIn: timeStr,
      checkIn: now,
      reason: prereg.notes||'',
      preRegistered: true,
      checkedInByGuard: isGuard,
      checkedInBy: isGuard ? guardName : undefined
    });
    
    await PreRegistration.findByIdAndUpdate(req.params.id,{status:'Arrived'});
    
    const io = req.app.get('io');
    if (io) io.emit('newAttendance', { name: prereg.name, date: dateStr });

    // Notify the host (if attached) and all managers at this site
    setImmediate(async () => {
      try {
        const site = prereg.siteId ? await Site.findById(prereg.siteId).lean() : null;
        const siteName = site?.name || 'your site';
        
        // 1. Notify host if pre-registration had a member (host) attached
        if (prereg.memberId) {
          try {
            const host = await Member.findById(prereg.memberId).lean();
            if (host?.email) {
              await sendVisitorArrivalNotificationEmail({
                hostEmail: host.email,
                hostName: `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email,
                visitorName: prereg.name,
                siteName,
                arrivalTime: now,
              });
              console.log(`[PRE-REG] Arrival notification sent to host ${host.email} for visitor ${prereg.name}`);
            }
            // Emit socket notification to the host's dashboard
            if (io && host) {
              io.emit('visitorArrived', {
                visitorName: prereg.name,
                hostId: String(host._id),
                siteName,
                arrivedAt: now,
              });
            }
          } catch (e) {
            console.error('[PRE-REG] Host notification error:', e?.message || e);
          }
        }
        
        // 2. Notify all managers at this site
        if (prereg.siteId) {
          try {
            const managers = await Member.find({
              siteId: prereg.siteId,
              mobileRole: 'manager',
              status: 'Current',
              email: { $exists: true, $ne: null, $ne: '' }
            }).lean();
            
            for (const manager of managers) {
              if (manager.email && (!prereg.memberId || String(manager._id) !== String(prereg.memberId))) {
                try {
                  await sendVisitorArrivalNotificationEmail({
                    hostEmail: manager.email,
                    hostName: `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.email,
                    visitorName: prereg.name,
                    siteName,
                    arrivalTime: now,
                  });
                  console.log(`[PRE-REG] Arrival notification sent to manager ${manager.email} for visitor ${prereg.name}`);
                } catch (e) {
                  console.error(`[PRE-REG] Manager ${manager.email} notification error:`, e?.message || e);
                }
              }
            }
            
            // Emit socket notification to all managers
            if (io && managers.length > 0) {
              io.emit('visitorArrivedToManagers', {
                visitorName: prereg.name,
                siteId: String(prereg.siteId),
                siteName,
                arrivedAt: now,
                managerIds: managers.map(m => String(m._id)),
              });
            }
          } catch (e) {
            console.error('[PRE-REG] Managers notification error:', e?.message || e);
          }
        }
      } catch (e) {
        console.error('[PRE-REG] Arrival notification error:', e?.message || e);
      }
    });
    
    res.json({success:true, log_id: log._id});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

module.exports = router;
