require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const ianHash    = await bcrypt.hash('Horton@2026!', 10);
  const samuelHash = await bcrypt.hash('Rayleigh@2026!', 10);

  await Admin.findOneAndUpdate({ email: 'ian.hoskin@ibvogt.com' },    { password: ianHash });
  await Admin.findOneAndUpdate({ email: 'samuel.kemp@ibvogt.com' }, { password: samuelHash });

  console.log('✓ ian.hoskin@ibvogt.com    → Horton@2026!');
  console.log('✓ samuel.kemp@ibvogt.com  → Rayleigh@2026!');

  await mongoose.disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
