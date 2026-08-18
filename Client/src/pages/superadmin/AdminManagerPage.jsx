import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserPlus, Shield, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const AdminManagerPage = () => {
  const [admins, setAdmins] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const loadAdmins = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setAdmins(res.data.users.filter(u => u.roleLevel === 2) || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/superadmin/create-admin', {
        name,
        email,
        password,
        groupName
      });
      if (res.data.success) {
        setStatusMsg(`Admin created successfully! Login with Email: ${email} | Password: ${password}`);
        setName('');
        setEmail('');
        setPassword('Password123!');
        setGroupName('');
        setModalOpen(false);
        loadAdmins();
      }
    } catch (err) {
      setStatusAlert(err.response?.data?.message || 'Error creating admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Admin Management</h1>
          <p className="text-xs text-slate-400">Create, assign & manage Level 2 cohort administrators</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Create Level 2 Admin
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {statusMsg}
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Active Cohort Administrators</h3>
        <div className="divide-y divide-slate-800/80">
          {admins.map((a) => (
            <div key={a._id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <UserAvatar user={a} className="w-9 h-9 rounded-xl text-xs" />
                <div>
                  <p className="font-bold text-white">{a.name}</p>
                  <p className="text-[11px] text-slate-400">{a.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {a.groupId?.name || 'Cohort Admin'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Create Admin Account</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="e.g. Marcus Brody"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="Password123!"
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Cohort Name (Optional)</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="e.g. Gamma Cohort 2026"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerPage;
