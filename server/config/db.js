const mongoose = require('mongoose');
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) throw new Error('missing configuration');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch {
    // Never log connection strings: driver errors can contain Atlas credentials.
    console.error('MongoDB connection failed. Check MONGO_URI, network access and database permissions.');
    process.exit(1);
  }
}
module.exports = connectDB;
