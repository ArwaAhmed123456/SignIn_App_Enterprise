/**
 * seed-guards.js
 * Creates Gate-1 and Gate-2 portal accounts and grants both access
 * to the Horton Solar Farm site data.
 * Run: node scripts/seed-guards.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');
const Site     = require('../models/Site');

const normalizeEmails = (...values) => (
  [...new Set(
    values
      .flat()
      .filter(Boolean)
      .map((email) => String(email).trim().toLowerCase())
      .filter(Boolean)
  )]
);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const accounts = [
    {
      email:        'gate1.horton@ibvogt.com',
      password:     'Gate1@Horton!',
      first_name:   'Gate 1',
      last_name:    'Security',
      organization: 'IB Vogt - Horton Solar Farm',
      role:         'admin',
    },
    {
      email:        'gate2.horton@ibvogt.com',
      password:     'Gate2@Horton!',
      first_name:   'Gate 2',
      last_name:    'Security',
      organization: 'IB Vogt - Horton Solar Farm',
      role:         'admin',
    },
  ];

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    const result = await Admin.findOneAndUpdate(
      { email: acc.email.toLowerCase() },
      {
        email:        acc.email.toLowerCase(),
        password:     hashed,
        first_name:   acc.first_name,
        last_name:    acc.last_name,
        organization: acc.organization,
        role:         acc.role,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ ${acc.email}  /  ${acc.password}  [${acc.role}]  → ${result._id}`);
  }

  const guardEmails = accounts.map((acc) => acc.email.toLowerCase());
  const hortonSites = await Site.find({
    name: { $regex: /horton\s+solar\s+farm/i },
  });

  if (hortonSites.length === 0) {
    console.warn('\n! No site matched "Horton solar Farm", so no site access was updated.');
  } else {
    for (const site of hortonSites) {
      const mergedEmails = normalizeEmails(site.adminEmail, site.adminEmails || [], guardEmails);
      await Site.findByIdAndUpdate(site._id, {
        adminEmail: mergedEmails[0],
        adminEmails: mergedEmails,
      });
      console.log(`✓ Updated site access for "${site.name}" → ${mergedEmails.join(', ')}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n─────────────────────────────────────────────────────');
  console.log('GATE GUARD LOGIN CREDENTIALS — Horton Solar Farm');
  console.log('─────────────────────────────────────────────────────');
  console.log('Gate 1:  gate1.horton@ibvogt.com  /  Gate1@Horton!');
  console.log('Gate 2:  gate2.horton@ibvogt.com  /  Gate2@Horton!');
  console.log('─────────────────────────────────────────────────────');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
