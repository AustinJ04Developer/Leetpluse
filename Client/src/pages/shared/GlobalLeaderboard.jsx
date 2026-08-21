import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Trophy, Flame, Award, Globe, Users, Building2, Filter } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const GlobalLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [loading, setLoading] = useState(true);

  const roleLevel = user?.roleLevel || 1;
  const isManagementOversight = roleLevel >= 3;


  const loadGroups = async () => {
    try {
      const res = await api.get('/institutions/batches/list');
      if (res.data.success) {
        setGroups(res.data.data || []);
      }
    } catch (err) {
      // Fallback
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let url = '/leetcode/leaderboard';
      if (selectedGroupId && selectedGroupId !== 'all') {
        url += `?groupId=${selectedGroupId}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGroupId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Institutional Global Leaderboard
          </h1>
          <p className="text-xs text-slate-400">
            Official standings for all student coders across all departments and batches
          </p>
        </div>

        {/* Batch / Department Filter */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <Filter className="w-4 h-4 text-indigo-400 ml-2" />
          <span className="text-xs font-semibold text-slate-300">Filter Batch:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-indigo-500"
          >
            <option value="all">All Students (Institution-Wide)</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name} ({g.departmentId?.code || 'Dept'})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading student standings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Programmer</th>
                  <th className="py-3 px-4">Department & Batch</th>
                  <th className="py-3 px-4">Total Solved</th>
                  <th className="py-3 px-4">Difficulty Breakdown</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4 text-right">XP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {leaderboard.map((item, idx) => {
                  const u = item.userId || {};
                  const rank = idx + 1;
                  const isCurrentLoggedUser = u._id === user?.id || u._id === user?._id;

                  return (
                    <tr key={item._id} className={`hover:bg-slate-800/30 transition-colors ${
                      isCurrentLoggedUser ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                    }`}>
                      <td className="py-3.5 px-4 font-extrabold text-sm">
                        {rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">🥇</span>
                        ) : rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/30 flex items-center justify-center font-bold">🥈</span>
                        ) : rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center font-bold">🥉</span>
                        ) : (
                          <span className="text-slate-400 font-mono pl-2">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} className="w-9 h-9 rounded-xl text-xs" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm">{u.name || 'Anonymous'}</p>
                              {isCurrentLoggedUser && (
                                <span className="text-[9px] font-extrabold bg-indigo-500 text-white px-1.5 py-0.2 rounded">YOU</span>
                              )}
                            </div>
                            <p className="text-[11px] text-indigo-400 font-mono">@{item.leetcodeUsername || u.leetcodeUsername}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.institutionId?.name && (
                          <div className="text-[11px] text-indigo-400 font-medium truncate max-w-[160px]" title={u.institutionId.name}>
                            🏛️ {u.institutionId.name}
                          </div>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {u.departmentId?.code || 'CSE'}
                        </span>
                        <span className="text-slate-400 text-xs ml-1.5">
                          {u.batchId?.name || 'Batch'} ({u.sectionId?.name || 'Sec A'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-white text-sm">
                        {item.totalSolved}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            E: {item.easySolved}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            M: {item.mediumSolved}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            H: {item.hardSolved}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        🔥 {item.currentStreak} Days
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-400 text-sm">
                        {(u.xp || 0).toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
