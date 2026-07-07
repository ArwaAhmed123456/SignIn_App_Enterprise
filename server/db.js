const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // Log clearly but do NOT crash — server stays up so the static site still loads
    console.error('=================================================');
    console.error('WARNING: MONGO_URI is not set.');
    console.error('Go to Render dashboard → Environment and set:');
    console.error('MONGO_URI = mongodb+srv://arwa95025:arwa95025@cluster0.xalem4o.mongodb.net/Tripod_SignIn_App?retryWrites=true&w=majority');
    console.error('JWT_SECRET = e7b92c4a16904f839218391294801235123985712123');
    console.error('=================================================');
    return; // Do not exit — keep server running
  }

  try {
    const conn = await mongoose.connect(uri, { dbName: 'Tripod_SignIn_App' });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Retry after 5 seconds instead of crashing
    console.log('Retrying MongoDB connection in 5s...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
