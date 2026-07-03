const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('../models/Admin');

dotenv.config({ path: path.join(__dirname, '../.env') });

const promote = async () => {
    const email = process.argv[2];
    if (!email) {
        console.log('Usage: node scripts/promote_superadmin.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log(`Admin with email ${email} not found`);
            process.exit(1);
        }

        admin.role = 'superadmin';
        await admin.save();
        console.log(`Successfully promoted ${email} to superadmin`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

promote();
