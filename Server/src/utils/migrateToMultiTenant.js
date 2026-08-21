const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });
const connectDB = require('../config/db');

const User = require('../models/User');
const Organization = require('../models/Organization');
const Group = require('../models/Group');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const AcademicYear = require('../models/AcademicYear');
const Batch = require('../models/Batch');
const Section = require('../models/Section');

const migrateToMultiTenant = async () => {
  try {
    await connectDB();
    console.log('[Migration] Starting multi-tenant academic database migration...');

    const userCountBefore = await User.countDocuments();
    const orgCountBefore = await Organization.countDocuments();
    const groupCountBefore = await Group.countDocuments();

    console.log(`[Migration Stats - BEFORE] Users: ${userCountBefore}, Organizations: ${orgCountBefore}, Groups: ${groupCountBefore}`);

    // 1. Migrate Organizations -> Institutions
    const orgs = await Organization.find({});
    const orgToInstMap = new Map();

    for (const org of orgs) {
      let inst = await Institution.findOne({ slug: org.slug });
      if (!inst) {
        inst = await Institution.create({
          name: org.name,
          slug: org.slug,
          code: org.name.substring(0, 4).toUpperCase(),
          logoUrl: org.branding?.logoUrl || '',
          primaryColor: org.branding?.primaryColor || '#6366f1',
          companyName: org.branding?.companyName || org.name,
          plan: org.plan || 'Enterprise',
          maxUsers: org.maxUsers || 2000,
          billingStatus: org.billingStatus || 'Active'
        });
      }
      orgToInstMap.set(org._id.toString(), inst._id);
    }

    // Default Fallback Institution if no orgs exist
    let defaultInst = await Institution.findOne({ slug: 'default-academy' });
    if (!defaultInst) {
      defaultInst = await Institution.create({
        name: 'Mar Ephraem College of Engineering & Technology',
        slug: 'mar-ephraem',
        code: 'MEC',
        primaryColor: '#6366f1'
      });
    }

    // 2. Migrate Groups -> Departments / Academic Years / Batches / Sections
    const groups = await Group.find({});
    const groupToSectionMap = new Map();

    for (const grp of groups) {
      const instId = orgToInstMap.get(grp.orgId?.toString()) || defaultInst._id;

      // Department
      let dept = await Department.findOne({ institutionId: instId, code: 'CSE' });
      if (!dept) {
        dept = await Department.create({
          institutionId: instId,
          name: 'Computer Science & Engineering',
          code: 'CSE'
        });
      }

      // Academic Year
      let acYear = await AcademicYear.findOne({ institutionId: instId, yearLabel: '2026-2027' });
      if (!acYear) {
        acYear = await AcademicYear.create({
          institutionId: instId,
          yearLabel: '2026-2027',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-05-31')
        });
      }

      // Batch
      let batch = await Batch.findOne({ institutionId: instId, departmentId: dept._id, name: grp.name });
      if (!batch) {
        batch = await Batch.create({
          institutionId: instId,
          departmentId: dept._id,
          academicYearId: acYear._id,
          name: grp.name,
          targetDailySolved: grp.targetDailySolved || 2,
          targetWeeklySolved: grp.targetWeeklySolved || 10
        });
      }

      // Section
      let sec = await Section.findOne({ batchId: batch._id, name: 'Section A' });
      if (!sec) {
        sec = await Section.create({
          institutionId: instId,
          batchId: batch._id,
          name: 'Section A',
          facultyId: grp.adminId || null
        });
      }

      groupToSectionMap.set(grp._id.toString(), {
        institutionId: instId,
        departmentId: dept._id,
        academicYearId: acYear._id,
        batchId: batch._id,
        sectionId: sec._id
      });
    }

    // 3. Migrate Users to Multi-Tenant Structure & Role Hierarchy
    const users = await User.find({});
    let migratedUsersCount = 0;

    for (const u of users) {
      const instId = orgToInstMap.get(u.orgId?.toString()) || defaultInst._id;
      let secMapping = u.groupId ? groupToSectionMap.get(u.groupId.toString()) : null;

      if (!secMapping) {
        // Create default hierarchy mapping for user without a group
        let dept = await Department.findOne({ institutionId: instId, code: 'CSE' });
        if (!dept) dept = await Department.create({ institutionId: instId, name: 'Computer Science & Engineering', code: 'CSE' });

        let acYear = await AcademicYear.findOne({ institutionId: instId, yearLabel: '2026-2027' });
        if (!acYear) acYear = await AcademicYear.create({ institutionId: instId, yearLabel: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31') });

        let batch = await Batch.findOne({ institutionId: instId, departmentId: dept._id, name: 'General Batch' });
        if (!batch) batch = await Batch.create({ institutionId: instId, departmentId: dept._id, academicYearId: acYear._id, name: 'General Batch' });

        let sec = await Section.findOne({ batchId: batch._id, name: 'Section A' });
        if (!sec) sec = await Section.create({ institutionId: instId, batchId: batch._id, name: 'Section A' });

        secMapping = {
          institutionId: instId,
          departmentId: dept._id,
          academicYearId: acYear._id,
          batchId: batch._id,
          sectionId: sec._id
        };
      }

      // Map roles & role levels cleanly
      let updatedRole = u.role;
      let updatedRoleLevel = u.roleLevel || 1;

      if (u.role === 'devadmin') {
        updatedRole = 'superadmin';
        updatedRoleLevel = 5; // Global Platform Admin
      } else if (u.role === 'superadmin') {
        updatedRole = 'institution_admin';
        updatedRoleLevel = 4; // Institution Admin
      } else if (u.role === 'admin') {
        updatedRole = 'faculty';
        updatedRoleLevel = 2; // Faculty / Mentor
      } else if (u.role === 'user') {
        updatedRole = 'student';
        updatedRoleLevel = 1; // Student
      }

      u.institutionId = secMapping.institutionId;
      u.departmentId = secMapping.departmentId;
      u.academicYearId = secMapping.academicYearId;
      u.batchId = secMapping.batchId;
      u.sectionId = secMapping.sectionId;
      u.role = updatedRole;
      u.roleLevel = updatedRoleLevel;

      if (!u.registerNumber) {
        u.registerNumber = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      if (!u.studentId) {
        u.studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      await u.save();
      migratedUsersCount++;
    }

    const userCountAfter = await User.countDocuments();
    const instCountAfter = await Institution.countDocuments();
    const deptCountAfter = await Department.countDocuments();
    const batchCountAfter = await Batch.countDocuments();
    const sectionCountAfter = await Section.countDocuments();

    console.log('\n======================================================');
    console.log('✅ MULTI-TENANT MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('------------------------------------------------------');
    console.log(`Users Before:        ${userCountBefore}`);
    console.log(`Users After:         ${userCountAfter}`);
    console.log(`Migrated Users:      ${migratedUsersCount}`);
    console.log(`Institutions Count:  ${instCountAfter}`);
    console.log(`Departments Count:   ${deptCountAfter}`);
    console.log(`Batches Count:       ${batchCountAfter}`);
    console.log(`Sections Count:      ${sectionCountAfter}`);
    console.log('======================================================\n');

    return { success: true };
  } catch (err) {
    console.error('[Migration] Migration error:', err);
    throw err;
  }
};

if (require.main === module) {
  migrateToMultiTenant().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateToMultiTenant;
