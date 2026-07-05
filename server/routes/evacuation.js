const express          = require('express');
const router           = express.Router();
const jwt              = require('jsonwebtoken');
const EvacuationReport = require('../models/EvacuationReport');
const ActivityLog      = require('../models/ActivityLog');
const Site             = require('../models/Site');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const verifyAdmin = (req,res,next) => {
  const auth=req.headers['authorization'];
  if(!auth) return res.status(403).json({error:'No token'});
  try { const d=jwt.verify(auth.split(' ')[1],JWT_SECRET); if(!['admin','superadmin'].includes(d.role)) return res.status(403).json({error:'Admin only'}); req.user=d; next(); }
  catch { res.status(401).json({error:'Unauthorized'}); }
};

const actor = (u) => `${u.firstName||''} ${u.lastName||''}`.trim()||u.email||'Admin';
const parseJ = (v,fb) => { try { return JSON.parse(v||'null')||fb; } catch { return fb; } };
const fmt = (r) => {
  const p = parseJ(r.participantsJson,[]);
  return { id:r._id, site_id:r.siteId, status:r.status, started_at:r.startedAt, started_by:r.startedBy,
    ended_at:r.endedAt, ended_by:r.endedBy, duration_s:r.durationSeconds,
    accounted_for: r.accountedFor||`${p.filter(x=>x.safe).length} of ${p.length} present`,
    leave_report: r.leaveReport||'', notifications: parseJ(r.notificationsJson,[]), participants: p };
};

const firstSite = async (siteId) => {
  if (siteId) return Site.findById(siteId).lean();
  return Site.findOne().sort({createdAt:1}).lean();
};

router.get('/reports', verifyAdmin, async (req,res) => {
  try {
    const site = await firstSite(req.query.site_id);
    const f = { status:'Completed' }; if(site) f.siteId=site._id;
    const reports = await EvacuationReport.find(f).sort({startedAt:-1}).lean();
    res.json(reports.map(fmt));
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.get('/active', verifyAdmin, async (req,res) => {
  try {
    const site = await firstSite(req.query.site_id);
    const active = site ? await EvacuationReport.findOne({siteId:site._id, status:'Active'}).sort({startedAt:-1}).lean() : null;
    res.json({active: active?fmt(active):null});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.post('/start', verifyAdmin, async (req,res) => {
  try {
    const site = await firstSite(req.body.site_id);
    if (!site) return res.status(400).json({error:'No site found'});
    const existing = await EvacuationReport.findOne({siteId:site._id, status:'Active'}).lean();
    if (existing) return res.status(409).json({error:'Evacuation already active', evacuation:fmt(existing)});
    const today = new Date().toISOString().split('T')[0];
    const signedIn = await ActivityLog.find({siteId:site._id, date:today, timeOut:null}, 'name userType').lean();
    const participants = signedIn.map(l=>({log_id:l._id?.toString(), name:l.name||'Unknown', group:l.userType||'—', safe:false, marked_by:null, marked_at:null}));
    const evac = await EvacuationReport.create({ siteId:site._id, status:'Active', startedBy:actor(req.user), participantsJson:JSON.stringify(participants), notificationsJson:'[]' });
    const io=req.app.get('io'); if(io) io.emit('evacuationStarted',{site_id:site._id, site_name:site.name});
    res.status(201).json({success:true, evacuation:fmt(evac)});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.post('/mark-safe', verifyAdmin, async (req,res) => {
  const {site_id, participant_id, safe} = req.body;
  try {
    const site = await firstSite(site_id);
    const evac = site ? await EvacuationReport.findOne({siteId:site._id,status:'Active'}).lean() : null;
    if (!evac) return res.status(404).json({error:'No active evacuation'});
    const markedBy=actor(req.user);
    const p=parseJ(evac.participantsJson,[]).map(x=>x.log_id===participant_id?{...x,safe:safe!==false,marked_by:markedBy,marked_at:new Date().toISOString()}:x);
    const upd=await EvacuationReport.findByIdAndUpdate(evac._id,{participantsJson:JSON.stringify(p),accountedFor:`${p.filter(x=>x.safe).length} of ${p.length} present`},{new:true}).lean();
    res.json({success:true, evacuation:fmt(upd)});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.post('/notify', verifyAdmin, async (req,res) => {
  const {site_id, message} = req.body;
  try {
    const site = await firstSite(site_id);
    const evac = site ? await EvacuationReport.findOne({siteId:site._id,status:'Active'}).lean() : null;
    if (!evac) return res.status(404).json({error:'No active evacuation'});
    const notes=parseJ(evac.notificationsJson,[]);
    const entry={id:`${Date.now()}`, message:message?.trim()||'Notification sent', sent_at:new Date().toISOString(), sent_by:actor(req.user)};
    const upd=await EvacuationReport.findByIdAndUpdate(evac._id,{notificationsJson:JSON.stringify([entry,...notes])},{new:true}).lean();
    const io=req.app.get('io'); if(io) io.emit('evacuationNotification',{site_id:site._id,notification:entry});
    res.json({success:true, evacuation:fmt(upd), notification:entry});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.put('/leave-report', verifyAdmin, async (req,res) => {
  try {
    const site=await firstSite(req.body.site_id);
    const evac=site?await EvacuationReport.findOne({siteId:site._id,status:'Active'}).lean():null;
    if(!evac) return res.status(404).json({error:'No active evacuation'});
    const upd=await EvacuationReport.findByIdAndUpdate(evac._id,{leaveReport:req.body.leave_report||''},{new:true}).lean();
    res.json({success:true, evacuation:fmt(upd)});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

router.post('/end', verifyAdmin, async (req,res) => {
  try {
    const site=await firstSite(req.body.site_id);
    const evac=site?await EvacuationReport.findOne({siteId:site._id,status:'Active'}).lean():null;
    if(!evac) return res.status(404).json({error:'No active evacuation'});
    const p=parseJ(evac.participantsJson,[]); const endedAt=new Date();
    const report=await EvacuationReport.findByIdAndUpdate(evac._id,{ status:'Completed', endedAt, endedBy:actor(req.user), durationSeconds:Math.round((endedAt-new Date(evac.startedAt))/1000), accountedFor:`${p.filter(x=>x.safe).length} of ${p.length} present` },{new:true}).lean();
    res.json({success:true, report:fmt(report)});
  } catch(err){ console.error(err); res.status(500).json({error:'Server error'}); }
});

module.exports = router;
