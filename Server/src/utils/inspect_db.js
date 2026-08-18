const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function inspect() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leetpulse';
  await mongoose.connect(mongoUri);
  const allUsers = await User.find({});
  console.log('All Users Count:', allUsers.length);
  allUsers.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Handle: ${u.leetcodeUsername}, Role: ${u.role}`);
  });
  process.exit(0);
}

inspect();
