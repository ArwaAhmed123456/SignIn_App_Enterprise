require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

async function run() {
  const password = 'Admin@1234';
  const hash = await bcrypt.hash(password, 10);

  // Update superadmin with known password + real name
  await prisma.admin.update({
    where: { email: 'admin@signinapp.com' },
    data: {
      password:     hash,
      firstName:    'Abid',
      lastName:     'Fiaz',
      organization: 'Observant Security Services',
    }
  });
  console.log('✓ Superadmin updated: admin@signinapp.com / Admin@1234');

  // Create a regular test admin
  const exists = await prisma.admin.findUnique({ where: { email: 'test@tripod.com' } });
  if (!exists) {
    await prisma.admin.create({
      data: {
        email:        'test@tripod.com',
        password:     hash,
        firstName:    'Test',
        lastName:     'User',
        role:         'admin',
        organization: 'Tripod Demo',
      }
    });
    console.log('✓ Test admin created: test@tripod.com / Admin@1234');
  } else {
    await prisma.admin.update({
      where: { email: 'test@tripod.com' },
      data:  { password: hash }
    });
    console.log('✓ Test admin password reset: test@tripod.com / Admin@1234');
  }

  await prisma.$disconnect();
  console.log('\nAll done.');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
