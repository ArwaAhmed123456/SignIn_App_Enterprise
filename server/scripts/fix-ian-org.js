require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Site  = require('../models/Site');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Fix Ian — organization = Horton (not Rayleigh)
  const ian = await Admin.findOneAndUpdate(
    { email: 'ian.hoskin@ibvogt.com' },
    { organization: 'IB Vogt - Horton Solar Farm' },
    { new: true }
  );
  console.log('Ian org fixed:', ian?.organization);

  // Verify Samuel = Rayleigh
  const samuel = await Admin.findOne({ email: 'samuel.kemp@ibvogt.com' });
  console.log('Samuel org:', samuel?.organization);

  // Also fix site adminEmail mapping
  // Horton site → ian
  await Site.findOneAndUpdate(
    { name: 'IB Vogt - Horton Solar Farm' },
    { adminEmail: 'ian.hoskin@ibvogt.com' }
  );
  // Rayleigh site → samuel
  await Site.findOneAndUpdate(
    { name: 'IB Vogt - Rayleigh Solar Farm' },
    { adminEmail: 'samuel.kemp@ibvogt.com' }
  );
  console.log('Site adminEmails fixed');

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
