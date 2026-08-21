const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'institution_admin', 'hod', 'faculty', 'student_rep', 'student', 'devadmin', 'admin', 'user'], 
    default: 'student' 
  },
  roleLevel: { type: Number, enum: [1, 2, 3, 4, 5, 6], default: 1 },
  // Level 6: SuperAdmin (Platform Lead / Global System)
  // Level 5: Institution Admin (Institutional Manager / Principal)
  // Level 4: HOD (Head of Department)
  // Level 3: Faculty (Faculty Mentor / Batch Instructor)
  // Level 2: Student Representative (Class Representative / Student Lead)
  // Level 1: Student


  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },

  // Legacy compatibility fields
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  studentId: { type: String, default: '' },
  registerNumber: { type: String, default: '' },
  phone: { type: String, default: '' },
  semester: { type: Number, default: 1 },

  leetcodeUsername: { type: String, default: null },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  lastSyncAt: { type: Date, default: null },
  syncStatus: { type: String, enum: ['idle', 'syncing', 'synced', 'error'], default: 'idle' },
  syncErrorMsg: { type: String, default: '' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpire: { type: Date, default: null }
}, { timestamps: true });

// Allow all user roles (including SuperAdmin developers) to link LeetCode accounts
module.exports = mongoose.model('User', userSchema);

