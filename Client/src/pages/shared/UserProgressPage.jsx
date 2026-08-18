import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DailyProgressCalendar from '../../components/DailyProgressCalendar';
import UserAvatar from '../../components/UserAvatar';
import { 
  Users, 
  Search, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Flame, 
  Filter, 
  CheckCircle2, 
  RefreshCw,
  Trophy,
  ChevronDown,
  Layers,
  ChevronUp
} from 'lucide-react';

const UserProgressPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = (currentUser?.roleLevel || 1) >= 3;

  const [membersProgress, setMembersProgress] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsedMembers, setCollapsedMembers] = useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    loadProgressMatrix();
  }, [selectedGroupId]);

  const loadGroups = async () => {
    if (isSuperAdmin) {
      try {
        const res = await api.get('/admin/group-overview');
        if (res.data.success) {
          setGroups(res.data.groups || []);
        }
      } catch (err) {
        console.error('Error loading group overview:', err);
      }
    }
  };

  const loadProgressMatrix = async () => {
    try {
      setLoading(true);
      let url = '/leetcode/progress-matrix';
      if (selectedGroupId !== 'all') {
        url += `?groupId=${selectedGroupId}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setMembersProgress(res.data.membersProgress || []);
      }
    } catch (err) {
      console.error('Error loading progress matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (userId) => {
    setCollapsedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredMembers = membersProgress.filter((item) => {
    if (!item || !item.user) return false;
    const user = item.user;
    if (!search || !search.trim()) return true;
    const term = search.toLowerCase().trim();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.leetcodeUsername && user.leetcodeUsername.toLowerCase().includes(term)) ||
      (user.groupId?.name && user.groupId.name.toLowerCase().includes(term))
    );
  });


  // Calculate aggregated stats across all filtered members
  let totalSolvedTodayOrg = 0;
  let totalSolvedWeekOrg = 0;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const dayOfWeek = now.getDay();
  const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distToMon);

  filteredMembers.forEach((item) => {
    const logs = item.logs || [];
    const logMap = {};
    logs.forEach(l => { if (l && l.date) logMap[l.date] = l; });

    if (logMap[todayStr]) {
      totalSolvedTodayOrg += logMap[todayStr].count || 0;
    }

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dy = dayDate.getFullYear();
      const dm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const dateKey = `${dy}-${dm}-${dd}`;
      if (logMap[dateKey]) {
        totalSolvedWeekOrg += logMap[dateKey].count || 0;
      }
    }
  });


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-950 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  All Members Daily Progress Board
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Live All-In-One Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                View daily progress calendars, streaks, and submission counts for all members from every batch and team simultaneously.
              </p>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={loadProgressMatrix}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Board</span>
          </button>
        </div>

        {/* Global Controls & Aggregated Metrics Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Filter Batch:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Batches & Teams</option>
                  {groups.map(g => (
                    <option key={g._id} value={g._id} className="bg-slate-900">{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, handle, or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Aggregated Overview Pills */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-300 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <strong>{filteredMembers.length}</strong> Members Displayed
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Today Total: <strong>{totalSolvedTodayOrg}</strong> Solved
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              Weekly Total: <strong>{totalSolvedWeekOrg}</strong> Solved
            </span>
          </div>
        </div>
      </div>

      {/* Members Progress Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading daily progress calendars for all members...
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="space-y-6">
          {filteredMembers.map(({ user: memberUser, stats: memberStats, logs: memberLogs }) => {
            const isSelf = memberUser._id === (currentUser?._id || currentUser?.id);
            const isCollapsed = collapsedMembers[memberUser._id];


            return (
              <div 
                key={memberUser._id}
                className={`bg-[#111625] border rounded-3xl p-5 shadow-xl transition-all ${
                  isSelf ? 'border-indigo-500/50 bg-indigo-950/10' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Member Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3.5">
                    <UserAvatar user={memberUser} className="w-11 h-11 rounded-2xl text-sm font-bold" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white">{memberUser.name}</h3>
                        {isSelf && (
                          <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            YOU
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                          Level {memberUser.level || 1}
                        </span>
                        {memberUser.groupId?.name && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                            {memberUser.groupId.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-medium">
                        <span>Handle: <strong className="text-indigo-400">@{memberUser.leetcodeUsername || 'unlinked'}</strong></span>
                        <span>&bull;</span>
                        <span>{(memberUser.xp || 0).toLocaleString()} XP</span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Pills & Expand Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                        Total Solved: <strong className="text-white">{memberStats?.totalSolved || 0}</strong>
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {memberStats?.currentStreak || 0}d Streak
                      </span>
                    </div>

                    <button
                      onClick={() => toggleCollapse(memberUser._id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      title={isCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Embedded Daily Progress Calendar for Member */}
                {!isCollapsed && (
                  <div className="pt-4">
                    <DailyProgressCalendar userId={memberUser._id} initialLogs={memberLogs} />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#111625] border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
          No members found matching your search filter or selected batch.
        </div>
      )}
    </div>
  );
};

export default UserProgressPage;
