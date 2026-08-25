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
  // Level 6: Overall Developer & Super Administrator
  // Level 5: Institutional Administrator (Institutional Manager / Principal)
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
  yearLevel: { type: Number, enum: [1, 2, 3, 4], default: 1 }, // 1=1st Year, 2=2nd Year, 3=3rd Year (Pre-Final), 4=4th Year (Final)
  academicStatus: { type: String, enum: ['Pursuing', 'Graduated', 'Alumni', 'Discontinued'], default: 'Pursuing' },
  academicBatch: { type: String, default: '' }, // e.g. "2023 - 2027" (Degree Batch 4-year range)
  academicCohorts: [{ type: String }], // Optional special training teams/groups e.g. ["Elite Training Batch", "MPM Batch"]

  // Role-specific professional & social fields
  designation: { type: String, default: '' }, // e.g. "Professor & Head", "Principal", "Student Lead"
  specialization: { type: String, default: '' }, // e.g. "AI & Machine Learning", "Data Structures"
  officeLocation: { type: String, default: '' }, // e.g. "Room 304, IT Block"
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  website: { type: String, default: '' },

  leetcodeUsername: { type: String, default: null },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
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

