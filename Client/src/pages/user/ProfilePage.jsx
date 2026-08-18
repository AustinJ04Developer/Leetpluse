import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { User, Code, Save, CheckCircle2, ShieldCheck, Image } from 'lucide-react';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [leetcodeUsername, setLeetcodeUsername] = useState(user?.leetcodeUsername || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await api.put('/users/profile', {
        name,
        leetcodeUsername: isSuperAdmin ? null : leetcodeUsername,
        avatar: avatar.trim(),
        bio,
        mfaEnabled
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Profile Settings</h1>
        <p className="text-xs text-slate-400">Manage account information & credentials</p>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800">
        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {msg}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <UserAvatar name={name} avatar={avatar} className="w-16 h-16 rounded-2xl text-xl" />
          <div>
            <h2 className="text-base font-bold text-white">{name || 'User'}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <p className="text-[11px] text-indigo-400 font-semibold uppercase mt-0.5">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Image URL (Optional)</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                placeholder="https://example.com/my-photo.jpg (Leave empty to use initials badge)"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Provide a custom image URL or clear it to display an initials avatar badge.</p>
          </div>

          {!isSuperAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Username</label>
              <div className="relative">
                <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="e.g. sarah_connor"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">This handle will be synced automatically every 5 minutes.</p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Super Admin Management Role:</strong> Super Admins do not link personal LeetCode accounts or appear on competitive leaderboards.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Headline</label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Platform Manager & Administrator..."
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
              />
              <span className="text-xs font-medium text-slate-300">
                Enable Multi-Factor Authentication (MFA / TOTP) — Recommended
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
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
