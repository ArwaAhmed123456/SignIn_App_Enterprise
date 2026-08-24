const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://arwa95025:arwa95025@cluster0.xalem4o.mongodb.net/Tripod_SignIn_App?retryWrites=true&w=majority';

async function updateAccount() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const email = 'edward.sutherland@shirleyparsons.com';
  const rawPassword = 'Edw@rd432%';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const hortonSiteId = new mongoose.Types.ObjectId('6a4b862a4355708ceaa92b41');

  // 1. Add email to Site adminEmails so /projects endpoint associates Horton Solar Farm with Edward
  const siteRes = await db.collection('sites').updateOne(
    { _id: hortonSiteId },
    { $addToSet: { adminEmails: email } }
  );
  console.log('Site updated (adminEmails):', siteRes.modifiedCount);

  // 2. Update Admin record for portal login
  const adminRes = await db.collection('admins').updateOne(
    { email: email },
    {
      $set: {
        email: email,
        password: hashedPassword,
        first_name: 'Edward',
        last_name: 'Sutherland',
        organization: 'IB Vogt - Horton Solar Farm',
        role: 'admin',
        site_id: hortonSiteId
      }
    },
    { upsert: true }
  );
  console.log('Admin account updated:', adminRes.modifiedCount || adminRes.upsertedCount);

  // 3. Update Member record (for mobile app & team directory)
  const memberRes = await db.collection('members').updateOne(
    { email: email },
    {
      $set: {
        firstName: 'Edward',
        lastName: 'Sutherland',
        email: email,
        password: hashedPassword,
        role: 'Site Manager',
        mobileRole: 'manager',
        approvalStatus: 'approved',
        status: 'Current',
        siteId: hortonSiteId,
        siteName: 'ib vogt ltd - Horton Solar Farm'
      }
    },
    { upsert: true }
  );
  console.log('Member record updated:', memberRes.modifiedCount || memberRes.upsertedCount);

  // Verify
  const updatedSite = await db.collection('sites').findOne({ _id: hortonSiteId });
  console.log('\n--- VERIFIED SITE ---');
  console.log({
    id: updatedSite._id,
    name: updatedSite.name,
    code: updatedSite.code,
    adminEmails: updatedSite.adminEmails
  });

  const updatedAdmin = await db.collection('admins').findOne({ email: email });
  const isMatch = await bcrypt.compare(rawPassword, updatedAdmin.password);
  console.log('\n--- VERIFIED ADMIN ---');
  console.log({
    email: updatedAdmin.email,
    first_name: updatedAdmin.first_name,
    last_name: updatedAdmin.last_name,
    organization: updatedAdmin.organization,
    role: updatedAdmin.role,
    site_id: updatedAdmin.site_id,
    passwordMatches: isMatch
  });

  await mongoose.disconnect();
}

updateAccount().catch(console.error);
