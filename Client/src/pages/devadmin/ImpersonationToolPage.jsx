import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { UserCheck, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImpersonationToolPage = () => {
  const { startImpersonating } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users').then(res => {
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleImpersonate = async (targetUserId) => {
    try {
      const res = await api.post('/devadmin/impersonate', { targetUserId });
      if (res.data.success) {
        await startImpersonating(targetUserId);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.leetcodeUsername && u.leetcodeUsername.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">User Impersonation Tool</h1>
        <p className="text-xs text-slate-400">Assume any user identity for live testing & troubleshooting</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Audit Notice:</strong> Impersonating a user logs a security entry in the system audit trail. An amber banner will remain visible at the top of the platform allowing instant return to your account.
        </span>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name, email, or handle..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredUsers.map((u) => (
            <div key={u._id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar user={u} className="w-9 h-9 rounded-xl text-xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm">{u.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      {u.role} (L{u.roleLevel})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{u.email} &bull; Handle: @{u.leetcodeUsername || 'unlinked'}</p>
                </div>
              </div>

              <button
                onClick={() => handleImpersonate(u._id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                Impersonate User
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImpersonationToolPage;
