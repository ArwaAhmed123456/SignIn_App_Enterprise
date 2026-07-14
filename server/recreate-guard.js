/**
 * Script to recreate deleted guard account
 * Run: node server/recreate-guard.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripod-signin';

async function recreateGuard() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Gate2@Horton!', 10);

    // Create the guard
    const guard = await Member.create({
      firstName: 'Gate 2',
      lastName: 'Horton',
      email: 'gate2.horton@ibvogt.com',
      password: hashedPassword,
      phone: '',
      role: 'Guard',
      mobileRole: 'guard',
      status: 'Current',
      approvalStatus: 'approved',
      approvedAt: new Date(),
    });

    console.log('✓ Guard recreated successfully:');
    console.log('  Email:', guard.email);
    console.log('  Password: Gate2@Horton!');
    console.log('  ID:', guard._id);

    await mongoose.connection.close();
    console.log('✓ Done');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

recreateGuard();
