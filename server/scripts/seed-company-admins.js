require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');
const Site     = require('../models/Site');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected to:', process.env.MONGO_URI.split('/').pop().split('?')[0]);

  const password = 'IBVogt@2026';
  const hashed   = await bcrypt.hash(password, 10);

  // ── 1. Ian Hoskin — IB Vogt Horton Solar Farm ─────────────────────────
  const ian = await Admin.findOneAndUpdate(
    { email: 'ian.hoskin@ibvogt.com' },
    {
      password,     // will be hashed by pre-save hook on create; plain for upsert
      first_name:   'Ian',
      last_name:    'Hoskin',
      organization: 'IB Vogt - Horton Solar Farm',
      role:         'admin',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // Set hashed password directly (bypass pre-save for upsert)
  await Admin.findByIdAndUpdate(ian._id, { password: hashed });
  console.log('✓ Ian Hoskin ready: ian.hoskin@ibvogt.com / IBVogt@2026 (IB Vogt - Horton Solar Farm)');

  // Create site for Ian's company if it doesn't exist
  const hortonSite = await Site.findOne({ name: 'IB Vogt - Horton Solar Farm' });
  if (!hortonSite) {
    const sitePass = await bcrypt.hash('Horton@2026', 10);
    await Site.create({
      name:       'IB Vogt - Horton Solar Farm',
      code:       'IBVGT-HSF',
      password:   sitePass,
      adminEmail: 'ian.hoskin@ibvogt.com',
    });
    console.log('  ↳ Site created: IB Vogt - Horton Solar Farm (code: IBVGT-HSF)');
  } else {
    console.log('  ↳ Site already exists: IB Vogt - Horton Solar Farm');
  }

  // ── 2. Samuel Kemp — IB Vogt Rayleigh Solar Farm ──────────────────────
  const samuel = await Admin.findOneAndUpdate(
    { email: 'samuel.kemp@ibvogt.com' },
    {
      password,
      first_name:   'Samuel',
      last_name:    'Kemp',
      organization: 'IB Vogt - Rayleigh Solar Farm',
      role:         'admin',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Admin.findByIdAndUpdate(samuel._id, { password: hashed });
  console.log('✓ Samuel Kemp ready: samuel.kemp@ibvogt.com / IBVogt@2026 (IB Vogt - Rayleigh Solar Farm)');

  // Create site for Samuel's company if it doesn't exist
  const rayleighSite = await Site.findOne({ name: 'IB Vogt - Rayleigh Solar Farm' });
  if (!rayleighSite) {
    const sitePass = await bcrypt.hash('Rayleigh@2026', 10);
    await Site.create({
      name:       'IB Vogt - Rayleigh Solar Farm',
      code:       'IBVGT-RSF',
      password:   sitePass,
      adminEmail: 'samuel.kemp@ibvogt.com',
    });
    console.log('  ↳ Site created: IB Vogt - Rayleigh Solar Farm (code: IBVGT-RSF)');
  } else {
    console.log('  ↳ Site already exists: IB Vogt - Rayleigh Solar Farm');
  }

  await mongoose.disconnect();
  console.log('\n─────────────────────────────────────');
  console.log('LOGIN CREDENTIALS:');
  console.log('Ian Hoskin    → ian.hoskin@ibvogt.com   / IBVogt@2026');
  console.log('Samuel Kemp   → samuel.kemp@ibvogt.com  / IBVogt@2026');
  console.log('─────────────────────────────────────');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
