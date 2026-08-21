const path = require('path');
const serverDir = 'd:/Projects/Leetpluse/Server';
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(serverDir, '.env') });
const connectDB = require(path.join(serverDir, 'src/config/db'));

async function migrateUsersToInstitution() {
  try {
    await connectDB();

    const User = require(path.join(serverDir, 'src/models/User'));
    const Institution = require(path.join(serverDir, 'src/models/Institution'));
    const Department = require(path.join(serverDir, 'src/models/Department'));
    const AcademicYear = require(path.join(serverDir, 'src/models/AcademicYear'));
    const Batch = require(path.join(serverDir, 'src/models/Batch'));
    const Section = require(path.join(serverDir, 'src/models/Section'));

    // Find primary registered institution
    let primaryInst = await Institution.findOne({});
    if (!primaryInst) {
      console.log('No institution found in DB. Creating default institution...');
      primaryInst = await Institution.create({
        name: 'Mar Ephraem Collge of Engineering and Technolgoy',
        code: 'MECET',
        slug: 'mecet',
        contactEmail: 'placement@marephraem.edu.in'
      });
    }

    console.log(`Primary Registered Institution: ${primaryInst.name} (${primaryInst._id})`);

    // Ensure default Department, Batch, Section, AcademicYear exist under primaryInst
    let defaultDept = await Department.findOne({ institutionId: primaryInst._id });
    if (!defaultDept) {
      defaultDept = await Department.create({
        institutionId: primaryInst._id,
        name: 'Computer Science and Engineering',
        code: 'CSE'
      });
    }

    let defaultYear = await AcademicYear.findOne({ institutionId: primaryInst._id });
    if (!defaultYear) {
      defaultYear = await AcademicYear.create({
        institutionId: primaryInst._id,
        yearLabel: '2026-2027',
        displayName: 'Academic Year 2026-2027',
        isCurrent: true
      });
    }

    let defaultBatch = await Batch.findOne({ institutionId: primaryInst._id });
    if (!defaultBatch) {
      defaultBatch = await Batch.create({
        institutionId: primaryInst._id,
        departmentId: defaultDept._id,
        academicYearId: defaultYear._id,
        name: 'CSE Batch 2023-2027',
        cohortRange: '2023-2027'
      });
    }

    let defaultSec = await Section.findOne({ institutionId: primaryInst._id });
    if (!defaultSec) {
      defaultSec = await Section.create({
        institutionId: primaryInst._id,
        batchId: defaultBatch._id,
        name: 'Section A'
      });
    }

    // Update all Level 1 and Level 2 users to be assigned under primaryInst
    const level1And2Filter = { roleLevel: { $in: [1, 2] } };
    const usersToUpdate = await User.find(level1And2Filter);

    console.log(`\nMigrating ${usersToUpdate.length} Level 1 & 2 Users to Institution (${primaryInst.name})...`);

    let updatedCount = 0;
    for (const u of usersToUpdate) {
      let modified = false;
      if (!u.institutionId || u.institutionId.toString() !== primaryInst._id.toString()) {
        u.institutionId = primaryInst._id;
        modified = true;
      }
      if (!u.departmentId) {
        u.departmentId = defaultDept._id;
        modified = true;
      }
      if (!u.academicYearId) {
        u.academicYearId = defaultYear._id;
        modified = true;
      }
      if (!u.batchId) {
        u.batchId = defaultBatch._id;
        modified = true;
      }
      if (!u.sectionId) {
        u.sectionId = defaultSec._id;
        modified = true;
      }
      if (!u.semester) {
        u.semester = 1;
        u.yearLevel = 1;
        modified = true;
      }
      if (modified) {
        await u.save();
        updatedCount++;
      }
    }

    console.log(`Successfully migrated ${updatedCount} users to Institution: ${primaryInst.name} (${primaryInst.code})`);

    const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration error:', err);
  }
}

migrateUsersToInstitution();
