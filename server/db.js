const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI env var is not set. Set it in Render dashboard → Environment.');
    console.error('Value needed: mongodb+srv://arwa95025:arwa95025@cluster0.xalem4o.mongodb.net/Tripod_SignIn_App?retryWrites=true&w=majority');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'Tripod_SignIn_App'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
