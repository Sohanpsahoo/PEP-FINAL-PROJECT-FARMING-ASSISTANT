const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false, // Prevents operations from hanging if not connected
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  MongoDB not available: ${error.message}`);
    console.warn('   → Running with in-memory cache (data won\'t persist across restarts)');
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
