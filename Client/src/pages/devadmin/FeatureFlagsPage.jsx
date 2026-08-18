import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Sliders, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

const FeatureFlagsPage = () => {
  const [flags, setFlags] = useState([]);
  const [msg, setMsg] = useState('');

  const loadFlags = async () => {
    try {
      const res = await api.get('/devadmin/feature-flags');
      if (res.data.success) {
        setFlags(res.data.flags || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (key, currentEnabled) => {
    try {
      const res = await api.post('/devadmin/feature-flags/toggle', {
        key,
        enabled: !currentEnabled
      });
      if (res.data.success) {
        setMsg(`Feature flag "${key}" set to ${!currentEnabled ? 'ENABLED' : 'DISABLED'}`);
        loadFlags();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Feature Flags Matrix</h1>
        <p className="text-xs text-slate-400">Toggle live platform behavior dynamically</p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 border border-slate-800">
        <div className="divide-y divide-slate-800/80">
          {flags.map((flag) => (
            <div key={flag._id} className="py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-400">{flag.key}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    flag.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {flag.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
              </div>

              <button
                onClick={() => handleToggle(flag.key, flag.enabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  flag.enabled 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-400" /> Enabled
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-500" /> Disabled
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
