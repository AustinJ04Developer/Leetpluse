import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AlertTriangle, RefreshCw, Mail, ExternalLink, ShieldAlert } from 'lucide-react';

const AtRiskStudentPage = () => {
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [thresholdDays, setThresholdDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const fetchAtRisk = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/at-risk');
      if (res.data.success) {
        setAtRiskStudents(res.data.data);
        setThresholdDays(res.data.thresholdDays || 7);
      }
    } catch (err) {
      console.error('Failed to load at-risk students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtRisk();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-rose-950/40 p-6 rounded-2xl border border-rose-800/60 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>At-Risk Student Monitor</span>
            </h1>
            <p className="text-sm text-rose-300/80">
              Students inactive for &gt;{thresholdDays} days or with zero problem activity requiring faculty intervention
            </p>
          </div>
        </div>
        <button
          onClick={fetchAtRisk}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 text-sm font-medium border border-rose-700/60 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Alert Monitor</span>
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Scanning for at-risk students...</div>
        ) : atRiskStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-semibold text-white">All Clear!</h3>
            <p className="text-sm text-slate-500">No students currently flagged for risk or inactivity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="p-4">Reg #</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Department & Batch</th>
                  <th className="p-4">Risk Flag</th>
                  <th className="p-4">LeetCode Activity</th>
                  <th className="p-4 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {atRiskStudents.map(s => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-4 font-mono text-xs text-rose-400 font-semibold">{s.registerNumber || 'N/A'}</td>
                    <td className="p-4 font-medium text-white">
                      <div>{s.name}</div>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      {s.institutionId?.name && (
                        <div className="text-[11px] text-indigo-400 font-medium truncate max-w-[160px]" title={s.institutionId.name}>
                          🏛️ {s.institutionId.name}
                        </div>
                      )}
                      <span className="font-semibold text-slate-200">{s.departmentId?.code || 'N/A'}</span>
                      <span className="text-slate-400"> • {s.batchId?.name || 'N/A'} ({s.sectionId?.name || 'A'})</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30">
                        {s.riskReason}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <div>Solved: <span className="font-semibold text-white">{s.stats?.totalSolved || 0}</span></div>
                      <div className="text-slate-400">Streak: {s.stats?.currentStreak || 0} Days</div>
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={`mailto:${s.email}?subject=LeetCode Performance Follow-up`}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Alert Email</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtRiskStudentPage;
