import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, User as UserIcon, Code, ArrowRight, Eye, EyeOff, Building2, GraduationCap, Hash, Globe, MapPin } from 'lucide-react';
import api from '../../services/api';

const Register = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'institution'
  
  // Dynamic Options Loaded from Server
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);

  // Student Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  
  // Dual Select/Type Fields
  const [departmentId, setDepartmentId] = useState('');
  const [departmentCustom, setDepartmentCustom] = useState('');

  const [academicYearId, setAcademicYearId] = useState('');
  const [academicYearCustom, setAcademicYearCustom] = useState('');

  const [batchId, setBatchId] = useState('');
  const [batchCustom, setBatchCustom] = useState('');

  const [sectionId, setSectionId] = useState('');
  const [sectionCustom, setSectionCustom] = useState('');

  const [yearLevel, setYearLevel] = useState(1);
  const [semester, setSemester] = useState(1);

  const [academicStatus, setAcademicStatus] = useState('Pursuing');
  const [cohortCustom, setCohortCustom] = useState(''); // Optional!

  // Institution Form State
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [instPassword, setInstPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  // Load registration options for chosen institution
  const fetchRegistrationOptions = (targetInstId) => {
    const query = targetInstId ? `?institutionId=${targetInstId}` : '';
    api.get(`/auth/registration-options${query}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          const { institutions: insts, selectedInstitutionId, departments: depts, academicYears: years, batches: bts, sections: secs } = res.data.data;
          setInstitutions(insts || []);
          if (!institutionId && selectedInstitutionId) {
            setInstitutionId(selectedInstitutionId);
          }
          setDepartments(depts || []);
          setAcademicYears(years || []);
          setBatches(bts || []);
          setSections(secs || []);
        }
      })
      .catch(err => {
        console.error('Error fetching registration options:', err);
      });
  };

  useEffect(() => {
    fetchRegistrationOptions(institutionId);
  }, [institutionId]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || !email || !password || !registerNumber || !studentId || !leetcodeUsername) {
        setError('All registration fields (Full Name, Email, Password, Register No, Student ID, LeetCode Username) are required.');
        setLoading(false);
        return;
      }

      if (!departmentId || (departmentId === '__custom__' && !departmentCustom.trim())) {
        setError('Please select or type your Department.');
        setLoading(false);
        return;
      }

      if (!academicYearId || (academicYearId === '__custom__' && !academicYearCustom.trim())) {
        setError('Please select or type your Academic Year.');
        setLoading(false);
        return;
      }

      if (!batchId || (batchId === '__custom__' && !batchCustom.trim())) {
        setError('Please select or type your Academic Batch.');
        setLoading(false);
        return;
      }

      const isCustomDept = departmentId === '__custom__';
      const isCustomYear = academicYearId === '__custom__';
      const isCustomBatch = batchId === '__custom__';
      const isCustomSection = sectionId === '__custom__';

      const payload = {
        name,
        email,
        password,
        leetcodeUsername,
        institutionId,
        departmentId: isCustomDept ? '' : departmentId,
        departmentCustom: isCustomDept ? departmentCustom : '',
        academicYearId: isCustomYear ? '' : academicYearId,
        academicYearCustom: isCustomYear ? academicYearCustom : '',
        batchId: isCustomBatch ? '' : batchId,
        batchCustom: isCustomBatch ? batchCustom : '',
        academicBatch: isCustomBatch ? batchCustom : '',
        sectionId: isCustomSection ? '' : sectionId,
        sectionCustom: isCustomSection ? sectionCustom : '',
        yearLevel: Number(yearLevel),
        semester: Number(semester),
        academicStatus,
        cohortCustom, // Optional!
        registerNumber,
        studentId
      };

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        await refreshUser();
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register-institution', {
        institutionName: instName,
        code: instCode,
        adminName,
        adminEmail,
        password: instPassword,
        website,
        city,
        phone
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        await refreshUser();
        navigate('/institution/dashboard');
      } else {
        setError(res.data.message || 'Institution onboarding failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Institution onboarding error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-y-auto my-6">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10 my-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <Code2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Platform Account</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Join LeetPulse Academic Monitoring SaaS</p>
        </div>

        {/* Tab Selection: Student vs Institution Registration */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student / User Registration</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('institution'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'institution' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Register Institution / College</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* FORM 1: STUDENT / USER REGISTRATION */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Register Number / Roll No</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 961421104001"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2026-01"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Institution / College Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / College</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">Select Institution</option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>

            {/* Dual Select / Type: Department & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Department</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                  <option value="__custom__">＋ Type Custom / New Dept</option>
                </select>
                {departmentId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Department (e.g. Computer Science)"
                    value={departmentCustom}
                    onChange={(e) => setDepartmentCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Year</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(y => (
                    <option key={y._id} value={y._id}>{y.displayName || y.yearLabel}</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Academic Year</option>
                </select>
                {academicYearId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Year (e.g. 2026-2027 or 3rd Year)"
                    value={academicYearCustom}
                    onChange={(e) => setAcademicYearCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>
            </div>

            {/* Academic Status & Academic Batch (4-Year Range) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Status</label>
                <select
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Pursuing">Pursuing</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>

              {/* Academic Batch (4 Years Range e.g. 2023 - 2027) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Batch (Degree 4-Year Range)</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Academic Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.cohortRange || 'Cohort'})</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Batch (e.g. 2023 - 2027)</option>
                </select>
                {batchId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Batch Range (e.g. 2023 - 2027)"
                    value={batchCustom}
                    onChange={(e) => setBatchCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn font-mono"
                  />
                )}
              </div>
            </div>

            {/* Section & Academic Cohort (Special Team / Group - OPTIONAL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Section</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Section</option>
                </select>
                {sectionId === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter Section (e.g. Section A)"
                    value={sectionCustom}
                    onChange={(e) => setSectionCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>

              {/* Academic Cohort (Special Training Team / Group - NOT MANDATORY) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Cohort (Special Teams / Groups)</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elite Training Batch, MPM Batch (Optional)"
                  value={cohortCustom}
                  onChange={(e) => setCohortCustom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Mapped Year Level & Semester Selectors (1 Year = 2 Semesters Rule) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Year Level</label>
                <select
                  value={yearLevel}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    setYearLevel(yr);
                    const minSem = (yr * 2) - 1;
                    const maxSem = yr * 2;
                    if (semester < minSem || semester > maxSem) {
                      setSemester(minSem);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value={1}>1st Year (Freshman)</option>
                  <option value={2}>2nd Year (Sophomore)</option>
                  <option value={3}>3rd Year (Pre-Final Year)</option>
                  <option value={4}>4th Year (Final Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Semester (Mapped to Year {yearLevel})</label>
                <select
                  value={semester}
                  onChange={(e) => {
                    const sem = Number(e.target.value);
                    setSemester(sem);
                    setYearLevel(Math.ceil(sem / 2));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                >
                  {[((Number(yearLevel) || 1) * 2) - 1, (Number(yearLevel) || 1) * 2].map(sem => (
                    <option key={sem} value={sem}>Semester {sem} (Year {Math.ceil(sem / 2)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Username</label>
              <div className="relative">
                <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                  placeholder="e.g. sarah_connor"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Student Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM 2: INSTITUTION REGISTRATION */}
        {activeTab === 'institution' && (
          <form onSubmit={handleInstitutionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / College Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="Mar Ephraem College"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Code / Acronym</label>
                <input
                  type="text"
                  placeholder="e.g. MEC"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="Placement Officer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="placement@college.edu.in"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL (Optional)</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    placeholder="https://college.edu.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City / Campus Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Nagercoil"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={instPassword}
                  onChange={(e) => setInstPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Onboarding Institution...' : 'Register New Institution & Admin'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
