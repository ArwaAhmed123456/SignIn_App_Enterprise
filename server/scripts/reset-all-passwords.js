/**
 * reset-all-passwords.js
 * Directly resets all admin passwords with single bcrypt hash.
 * Run: node scripts/reset-all-passwords.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const accounts = [
    { email: 'admin@signinapp.com',      password: 'Admin@1234',    role: 'superadmin', first_name: 'Abid',   last_name: 'Fiaz',   organization: 'Observant Security Services' },
    { email: 'ian.hoskin@ibvogt.com',    password: 'Horton@2026!',  role: 'admin',      first_name: 'Ian',    last_name: 'Hoskin', organization: 'IB Vogt - Horton Solar Farm'  },
    { email: 'samuel.kemp@ibvogt.com',   password: 'Rayleigh@2026!',role: 'admin',      first_name: 'Samuel', last_name: 'Kemp',   organization: 'IB Vogt - Rayleigh Solar Farm'},
  ];

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    await Admin.findOneAndUpdate(
      { email: acc.email },
      {
        password:     hashed,
        first_name:   acc.first_name,
        last_name:    acc.last_name,
        organization: acc.organization,
        role:         acc.role,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ ${acc.email}  /  ${acc.password}  [${acc.role}]`);
  }

  await mongoose.disconnect();
  console.log('\nAll passwords reset. Login with credentials above.');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
