import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, Monitor, LogOut, CheckCircle2, Key } from 'lucide-react';

const SettingsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [msg, setMsg] = useState('');

  const loadSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      if (res.data.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (id) => {
    try {
      const res = await api.delete(`/auth/sessions/${id}`);
      if (res.data.success) {
        setMsg('Session revoked successfully');
        loadSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Security & Active Sessions</h1>
        <p className="text-xs text-slate-400">View logged-in devices, active sessions, and access tokens</p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-indigo-400" />
          Active Signed-In Devices
        </h3>

        <div className="divide-y divide-slate-800/80">
          {sessions.map((s) => (
            <div key={s._id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{s.device}</p>
                <p className="text-[11px] text-slate-400">
                  IP: <span className="font-mono text-slate-300">{s.ip}</span> &bull; Last active: {new Date(s.lastActive).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => handleRevoke(s._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Revoke Session
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
