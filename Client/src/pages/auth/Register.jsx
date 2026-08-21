import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, User as UserIcon, Code, ArrowRight, Eye, EyeOff, Building2, GraduationCap, Hash, Globe, MapPin } from 'lucide-react';
import api from '../../services/api';

const Register = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'institution'
  
  // Common Options
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
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
  const [departmentId, setDepartmentId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [sectionId, setSectionId] = useState('');

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

  useEffect(() => {
    api.get('/institutions')
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          setInstitutions(res.data.data);
          setInstitutionId(res.data.data[0]._id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      api.get(`/institutions/departments/list?institutionId=${institutionId}`),
      api.get(`/institutions/batches/list?institutionId=${institutionId}`),
      api.get(`/institutions/sections/list?institutionId=${institutionId}`)
    ]).then(([dRes, bRes, sRes]) => {
      if (dRes.data.success) setDepartments(dRes.data.data);
      if (bRes.data.success) setBatches(bRes.data.data);
      if (sRes.data.success) setSections(sRes.data.data);
    }).catch(err => console.error(err));
  }, [institutionId]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        leetcodeUsername,
        institutionId,
        departmentId,
        batchId,
        sectionId,
        registerNumber,
        studentId
      });

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
                    placeholder="e.g. 961421104001"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-01"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Institution Hierarchy Selectors */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / College</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
              >
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Dept</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">No Section</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Username (Optional)</label>
              <div className="relative">
                <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
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
