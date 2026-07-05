require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'Tripod_SignIn_App'
  });
  console.log('MongoDB connected to Tripod_SignIn_App');

  const password = 'Admin@1234';
  const hashed   = await bcrypt.hash(password, 10);

  // Upsert superadmin
  await Admin.findOneAndUpdate(
    { email: 'admin@signinapp.com' },
    {
      password:     hashed,
      first_name:   'Abid',
      last_name:    'Fiaz',
      organization: 'Observant Security Services',
      role:         'superadmin',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('✓ Superadmin ready: admin@signinapp.com / Admin@1234');

  // Upsert test admin
  await Admin.findOneAndUpdate(
    { email: 'test@tripod.com' },
    {
      password:     hashed,
      first_name:   'Test',
      last_name:    'User',
      organization: 'Tripod Demo',
      role:         'admin',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('✓ Test admin ready: test@tripod.com / Admin@1234');

  await mongoose.disconnect();
  console.log('\nAll done.');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
