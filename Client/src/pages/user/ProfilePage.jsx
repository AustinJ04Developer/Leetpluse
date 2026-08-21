import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import RoleBadge from '../../components/RoleBadge';
import { User, Code, Save, CheckCircle2, ShieldCheck, Image, GraduationCap, Building, Calendar, Hash, Phone } from 'lucide-react';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  
  // Basic Info State
  const [name, setName] = useState(user?.name || '');
  const [leetcodeUsername, setLeetcodeUsername] = useState(user?.leetcodeUsername || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);

  // Institutional Info State
  const [departmentId, setDepartmentId] = useState(user?.departmentId?._id || user?.departmentId || '');
  const [academicYearId, setAcademicYearId] = useState(user?.academicYearId?._id || user?.academicYearId || '');
  const [batchId, setBatchId] = useState(user?.batchId?._id || user?.batchId || '');
  const [sectionId, setSectionId] = useState(user?.sectionId?._id || user?.sectionId || '');
  const [registerNumber, setRegisterNumber] = useState(user?.registerNumber || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [semester, setSemester] = useState(user?.semester || 1);
  const [phone, setPhone] = useState(user?.phone || '');

  // Options List from API
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dRes, yRes, bRes, sRes] = await Promise.all([
          api.get('/institutions/departments/list'),
          api.get('/institutions/academic-years/list'),
          api.get('/institutions/batches/list'),
          api.get('/institutions/sections/list')
        ]);

        if (dRes.data.success) setDepartments(dRes.data.data);
        if (yRes.data.success) setAcademicYears(yRes.data.data);
        if (bRes.data.success) setBatches(bRes.data.data);
        if (sRes.data.success) setSections(sRes.data.data);
      } catch (err) {
        console.error('Failed to load institutional options:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await api.put('/users/profile', {
        name,
        leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : null,
        avatar: avatar.trim(),
        bio,
        mfaEnabled,
        departmentId: departmentId || null,
        academicYearId: academicYearId || null,
        batchId: batchId || null,
        sectionId: sectionId || null,
        registerNumber,
        studentId,
        semester: Number(semester),
        phone
      });
      if (res.data.success) {
        setMsg('Profile updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Profile Settings</h1>
        <p className="text-xs text-slate-400">Manage personal details, academic department, batch, and credentials</p>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {msg}
          </div>
        )}

        {/* User Summary Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <UserAvatar name={name} avatar={avatar} className="w-16 h-16 rounded-2xl text-xl font-bold" />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{name || 'User'}</h2>
              <RoleBadge role={user?.role} roleLevel={user?.roleLevel} />
            </div>
            <p className="text-xs text-slate-400">{user?.email}</p>
            {user?.institutionId && (
              <p className="text-xs text-slate-400 font-medium">
                🏛️ {user.institutionId.name || 'Academic Institution'}
              </p>
            )}
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Avatar URL (Optional)</label>
              <div className="relative">
                <Image className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Headline</label>
              <textarea
                rows="2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                placeholder="Software Engineering & Competitive Coding Enthusiast..."
              />
            </div>
          </div>

          {/* SECTION 2: ACADEMIC DETAILS */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Register Number / Roll No</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 961421104001"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID / Employee ID</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. STU-2026-04"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(y => (
                    <option key={y._id} value={y._id}>{y.yearLabel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Name</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Section (Optional)</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">No Section / General Class</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: LEETCODE & INTEGRATIONS */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>LeetCode Integration</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Handle</label>
              <div className="relative">
                <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. alexmercer_dev"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Synced automatically every 5 minutes with live LeetCode stats.</p>
            </div>

          </div>

          {/* SECTION 4: SECURITY */}
          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
              />
              <span className="text-xs font-medium text-slate-300">
                Enable Multi-Factor Authentication (MFA / TOTP)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
