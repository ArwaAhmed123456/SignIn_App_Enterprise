const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugLogin = async () => {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Usage: node scripts/debug_login.js <email> <password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('User not found');
            process.exit(1);
        }

        console.log('Stored Role:', admin.role);
        const match = await bcrypt.compare(password, admin.password);
        console.log('Password Match:', match);

        if (!match) {
            // Check if it looks like a double-hash
            const isDoubleHashed = admin.password.startsWith('$2a$10$') && admin.password.length > 60;
            console.log('Password hash length:', admin.password.length);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

debugLogin();
