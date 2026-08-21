const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Local connection failed (${err.message}). Starting Mongo Memory Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB Memory Server] Connected fallback DB at: ${uri}`);
      return conn;
    } catch (memErr) {
      console.error('[MongoDB] Memory Server initialization error:', memErr);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
