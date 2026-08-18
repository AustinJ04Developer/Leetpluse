import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, ShieldAlert, Filter } from 'lucide-react';

const LogsViewerPage = () => {
  const [logs, setLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [tab, setTab] = useState('system');

  const loadLogs = async () => {
    try {
      const res = await api.get(`/devadmin/logs?level=${levelFilter}`);
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setAuditLogs(res.data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [levelFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Logs & Audit Trail</h1>
          <p className="text-xs text-slate-400">Structured system log stream and authentication audit records</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'system' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            System Logs
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'audit' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Security Audit Trail
          </button>
        </div>
      </div>

      {tab === 'system' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-300">Filter Severity:</span>
              {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    levelFilter === lvl ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto space-y-2 border border-slate-800/80 max-h-[500px]">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-3 border-b border-slate-900/60 pb-1.5">
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-400' :
                  log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {log.level}
                </span>
                <span className="text-purple-400 font-semibold">[{log.module}]</span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <div className="divide-y divide-slate-800/80 text-xs">
            {auditLogs.map((a) => (
              <div key={a._id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white font-mono">{a.action}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Actor: <strong className="text-indigo-400">{a.actorEmail}</strong>
                    {a.targetName && ` \u2022 Target: ${a.targetName}`}
                  </p>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(a.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsViewerPage;
