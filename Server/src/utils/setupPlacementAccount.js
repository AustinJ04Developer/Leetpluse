const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../../.env' });
const connectDB = require('../config/db');
const User = require('../models/User');
const Institution = require('../models/Institution');

async function setupAccount() {
  await connectDB();
  
  let inst = await Institution.findOne({ slug: 'mar-ephraem' });
  if (!inst) {
    inst = await Institution.create({
      name: 'Mar Ephraem College of Engineering & Technology',
      slug: 'mar-ephraem',
      code: 'MEC',
      primaryColor: '#6366f1'
    });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  let user = await User.findOne({ email: 'placement@marephraem.edu.in' });
  if (user) {
    user.passwordHash = passwordHash;
    user.role = 'institution_admin';
    user.roleLevel = 5;
    user.institutionId = inst._id;
    user.isActive = true;
    await user.save();
    console.log('✅ Updated placement@marephraem.edu.in credentials!');
  } else {
    user = await User.create({
      name: 'Placement Director (Mar Ephraem)',
      email: 'placement@marephraem.edu.in',
      passwordHash,
      role: 'institution_admin',
      roleLevel: 5,
      institutionId: inst._id,
      isActive: true
    });
    console.log('✅ Created placement@marephraem.edu.in account!');
  }

  console.log('\n======================================================');
  console.log('⚡ PLACEMENT ACCOUNT CREDENTIALS CREATED / RESET:');
  console.log('------------------------------------------------------');
  console.log('Email:    placement@marephraem.edu.in');
  console.log('Password: Password123!');
  console.log('Role:     Institution Admin (Level 5)');
  console.log('======================================================\n');
  process.exit(0);
}

setupAccount().catch(err => {
  console.error('Error setting up placement account:', err);
  process.exit(1);
});
