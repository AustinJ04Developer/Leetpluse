import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import UserCalendarModal from '../../components/UserCalendarModal';
import DailyProgressCalendar from '../../components/DailyProgressCalendar';
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
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ExternalLink,
  Eye,
  Mail,
  Grid,
  List,
  UserCheck,
  MoreHorizontal
} from 'lucide-react';

const UserProgressPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = (currentUser?.roleLevel || 1) >= 3;
  const isAdminOrHigher = (currentUser?.roleLevel || 1) >= 2;

  const [membersProgress, setMembersProgress] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Interactive inspection states
  const [inspectingUserModal, setInspectingUserModal] = useState(null);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Date Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFilterPreset, setDateFilterPreset] = useState('today'); // 'today' | 'yesterday' | '7days' | 'month' | 'custom' | 'all'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [sortBy, setSortBy] = useState('daily-solved'); // 'daily-solved' | 'total-solved' | 'streak' | 'xp'

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

  const toggleExpand = (userId) => {
    setExpandedMemberId(prev => (prev === userId ? null : userId));
  };

  // Helper to compute date string for presets
  const getPresetDateRange = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      return { start: yestStr, end: yestStr };
    }
    if (preset === '7days') {
      const sevenAgo = new Date(today);
      sevenAgo.setDate(today.getDate() - 6);
      return { start: sevenAgo.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstOfMonth.toISOString().split('T')[0], end: todayStr };
    }
    return { start: '', end: '' };
  };

  // Calculate daily stats for each member based on current date filter
  const processedMembers = useMemo(() => {
    const { start, end } = getPresetDateRange(dateFilterPreset);

    return membersProgress.map((item) => {
      const logs = item.logs || [];
      let dailySolved = 0;
      let dailyEasy = 0;
      let dailyMedium = 0;
      let dailyHard = 0;

      if (dateFilterPreset === 'custom') {
        const targetLog = logs.find(l => l.date === selectedDate);
        if (targetLog) {
          dailySolved = targetLog.count || 0;
          dailyEasy = targetLog.easy || 0;
          dailyMedium = targetLog.medium || 0;
          dailyHard = targetLog.hard || 0;
        }
      } else if (dateFilterPreset === 'all') {
        logs.forEach(l => {
          dailySolved += l.count || 0;
          dailyEasy += l.easy || 0;
          dailyMedium += l.medium || 0;
          dailyHard += l.hard || 0;
        });
      } else if (start && end) {
        logs.forEach(l => {
          if (l.date >= start && l.date <= end) {
            dailySolved += l.count || 0;
            dailyEasy += l.easy || 0;
            dailyMedium += l.medium || 0;
            dailyHard += l.hard || 0;
          }
        });
      }

      return {
        ...item,
        dailySolved,
        dailyEasy,
        dailyMedium,
        dailyHard
      };
    });
  }, [membersProgress, dateFilterPreset, selectedDate]);

  // Filter members by search text and sort
  const filteredMembers = useMemo(() => {
    let result = processedMembers.filter((item) => {
      if (!item || !item.user) return false;
      const u = item.user;
      if (!search || !search.trim()) return true;
      const term = search.toLowerCase().trim();
      return (
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.leetcodeUsername && u.leetcodeUsername.toLowerCase().includes(term)) ||
        (u.groupId?.name && u.groupId.name.toLowerCase().includes(term))
      );
    });

    // Sort members for ranking
    result.sort((a, b) => {
      if (sortBy === 'daily-solved') {
        if (b.dailySolved !== a.dailySolved) return b.dailySolved - a.dailySolved;
        return (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0);
      }
      if (sortBy === 'total-solved') {
        return (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0);
      }
      if (sortBy === 'streak') {
        return (b.stats?.currentStreak || 0) - (a.stats?.currentStreak || 0);
      }
      if (sortBy === 'xp') {
        return (b.user?.xp || 0) - (a.user?.xp || 0);
      }
      return 0;
    });

    return result;
  }, [processedMembers, search, sortBy]);

  // Aggregated Summary Statistics for selected filter
  const aggregatedStats = useMemo(() => {
    let totalSolved = 0;
    let activeSolvers = 0;
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;
    let topPerformer = null;

    filteredMembers.forEach(m => {
      if (m.dailySolved > 0) {
        totalSolved += m.dailySolved;
        activeSolvers++;
        totalEasy += m.dailyEasy;
        totalMedium += m.dailyMedium;
        totalHard += m.dailyHard;
      }
    });

    if (filteredMembers.length > 0 && filteredMembers[0].dailySolved > 0) {
      topPerformer = filteredMembers[0];
    }

    return { totalSolved, activeSolvers, totalEasy, totalMedium, totalHard, topPerformer };
  }, [filteredMembers]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-950 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Daily Progress Leaderboard
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Filtered Rankings
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Common leaderboard standings with interactive profile controls and date filtering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Leaderboard Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <button
              onClick={loadProgressMatrix}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters & Date Selector Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date Presets */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl flex-wrap">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Date' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setDateFilterPreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    dateFilterPreset === p.id 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Batch Filter & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-400">Batch:</span>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-transparent font-bold text-white outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">All Batches</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id} className="bg-slate-900">{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search member, handle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-white outline-none cursor-pointer"
                >
                  <option value="daily-solved" className="bg-slate-900">Daily Solved (Desc)</option>
                  <option value="total-solved" className="bg-slate-900">Total Solved</option>
                  <option value="streak" className="bg-slate-900">Active Streak</option>
                  <option value="xp" className="bg-slate-900">XP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Date Input Bar if preset is 'custom' */}
          {dateFilterPreset === 'custom' && (
            <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-300">Target Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white font-bold px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400 font-medium">Filtered stats for date: <strong className="text-white">{selectedDate}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Aggregated Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" /> Filtered Daily Solved
            </div>
            <div className="text-2xl font-extrabold text-white">{aggregatedStats.totalSolved}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold">{aggregatedStats.activeSolvers} Active Solvers</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
              <Users className="w-4 h-4" /> Participation Rate
            </div>
            <div className="text-2xl font-extrabold text-white">
              {filteredMembers.length > 0 ? Math.round((aggregatedStats.activeSolvers / filteredMembers.length) * 100) : 0}%
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-400 font-semibold">{aggregatedStats.activeSolvers} of {filteredMembers.length} active</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mb-1">
              <Medal className="w-4 h-4" /> Top Performer
            </div>
            <div className="text-sm font-extrabold text-white truncate max-w-[140px]">
              {aggregatedStats.topPerformer ? aggregatedStats.topPerformer.user.name : 'None'}
            </div>
          </div>
          {aggregatedStats.topPerformer && (
            <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs">
              🔥 {aggregatedStats.topPerformer.dailySolved} Solved
            </div>
          )}
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Filter Split
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold mt-1">
              <span className="text-emerald-400">{aggregatedStats.totalEasy} Easy</span>
              <span className="text-amber-400">{aggregatedStats.totalMedium} Med</span>
              <span className="text-rose-400">{aggregatedStats.totalHard} Hard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table / Cards Section */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-400 animate-pulse text-sm">
          Loading daily progress leaderboard...
        </div>
      ) : filteredMembers.length > 0 ? (
        viewMode === 'table' ? (
          /* Common Leaderboard Table View with Hover Profile Controls */
          <div className="glass-card rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Programmer</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Daily Solved</th>
                    <th className="py-3.5 px-4">Daily Breakdown</th>
                    <th className="py-3.5 px-4">Active Streak</th>
                    <th className="py-3.5 px-4 text-right">XP Points</th>
                    <th className="py-3.5 px-4 text-center">Profile Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredMembers.map(({ user: memberUser, stats: memberStats, logs: memberLogs, dailySolved, dailyEasy, dailyMedium, dailyHard }, index) => {
                    const isSelf = memberUser._id === (currentUser?._id || currentUser?.id);
                    const rank = index + 1;
                    const isExpanded = expandedMemberId === memberUser._id;

                    return (
                      <React.Fragment key={memberUser._id}>
                        <tr 
                          className={`group transition-all duration-200 hover:bg-slate-800/40 relative ${
                            isSelf ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 px-4 font-extrabold text-sm">
                            {rank === 1 ? (
                              <span className="w-8 h-8 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-extrabold shadow-md shadow-amber-500/20">🥇</span>
                            ) : rank === 2 ? (
                              <span className="w-8 h-8 rounded-2xl bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center justify-center font-extrabold">🥈</span>
                            ) : rank === 3 ? (
                              <span className="w-8 h-8 rounded-2xl bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center font-extrabold">🥉</span>
                            ) : (
                              <span className="text-slate-400 font-mono pl-1.5">#{rank}</span>
                            )}
                          </td>

                          {/* Programmer info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={memberUser} className="w-9 h-9 rounded-xl text-xs font-bold" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-white text-sm">{memberUser.name}</p>
                                  {isSelf && (
                                    <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.2 rounded">YOU</span>
                                  )}
                                  {memberUser.role === 'devadmin' && (
                                    <span className="text-[9px] font-extrabold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded uppercase">DEVADMIN</span>
                                  )}
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                    Lvl {memberUser.level || 1}
                                  </span>
                                </div>
                                <p className="text-[11px] text-indigo-400 font-mono">@{memberUser.leetcodeUsername || 'unlinked'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Batch */}
                          <td className="py-4 px-4">
                            {memberUser.groupId?.name ? (
                              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[11px]">
                                {memberUser.groupId.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[11px]">General</span>
                            )}
                          </td>

                          {/* Daily Solved for Filter */}
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-xs border ${
                              dailySolved > 0
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}>
                              <Sparkles className={`w-3.5 h-3.5 ${dailySolved > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                              <span>{dailySolved} Solved</span>
                            </div>
                          </td>

                          {/* Daily Breakdown */}
                          <td className="py-4 px-4">
                            {dailySolved > 0 ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                                {dailyEasy > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {dailyEasy}E
                                  </span>
                                )}
                                {dailyMedium > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {dailyMedium}M
                                  </span>
                                )}
                                {dailyHard > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    {dailyHard}H
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[11px] italic">0 solved</span>
                            )}
                          </td>

                          {/* Streak */}
                          <td className="py-4 px-4 font-bold text-amber-400">
                            🔥 {memberStats?.currentStreak || 0} Days
                          </td>

                          {/* XP Points */}
                          <td className="py-4 px-4 text-right font-extrabold text-indigo-400 text-sm">
                            {(memberUser.xp || 0).toLocaleString()} XP
                          </td>

                          {/* Profile Options: Interactive Cursor-Hover Toggled Controls */}
                          <td className="py-4 px-4 text-center relative min-w-[150px]">
                            {/* Default view when cursor is removed */}
                            <div className="flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                              <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                                <MoreHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Options</span>
                              </div>
                            </div>

                            {/* Active profile options view when cursor is near / hovered */}
                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto bg-[#111625]/95 backdrop-blur-sm px-2">
                              {/* Toggle Inline Logs */}
                              <button
                                onClick={() => toggleExpand(memberUser._id)}
                                className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                                title="Toggle Daily Progress Log History"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{isExpanded ? 'Hide' : 'Logs'}</span>
                              </button>

                              {/* Open Calendar / Inspection Modal */}
                              <button
                                onClick={() => setInspectingUserModal(memberUser)}
                                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all"
                                title="Inspect Full Progress Modal"
                              >
                                <CalendarIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* LeetCode External Link */}
                              {memberUser.leetcodeUsername && (
                                <a
                                  href={`https://leetcode.com/u/${memberUser.leetcodeUsername}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
                                  title="Open LeetCode Profile"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Inline Expanded Log Row */}
                        {isExpanded && (
                          <tr className="bg-slate-950/60">
                            <td colSpan={8} className="p-4 border-b border-slate-800">
                              <div className="bg-[#111625] border border-slate-800/80 rounded-2xl p-4">
                                <h4 className="text-xs font-extrabold text-white mb-2 flex items-center gap-2">
                                  <span>Daily Progress Log History for {memberUser.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">(@{memberUser.leetcodeUsername})</span>
                                </h4>
                                <DailyProgressCalendar userId={memberUser._id} initialLogs={memberLogs} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid View with Hover Profile Controls */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map(({ user: memberUser, stats: memberStats, logs: memberLogs, dailySolved, dailyEasy, dailyMedium, dailyHard }, index) => {
              const isSelf = memberUser._id === (currentUser?._id || currentUser?.id);
              const rank = index + 1;
              const isExpanded = expandedMemberId === memberUser._id;

              return (
                <div
                  key={memberUser._id}
                  className={`group relative bg-[#111625] border rounded-3xl p-5 shadow-xl transition-all ${
                    isSelf ? 'border-indigo-500/60 bg-indigo-950/15' : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        #{rank}
                      </div>
                      <UserAvatar user={memberUser} className="w-10 h-10 rounded-2xl text-sm font-bold" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-white">{memberUser.name}</h3>
                          {isSelf && (
                            <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-2 py-0.2 rounded">YOU</span>
                          )}
                          {memberUser.role === 'devadmin' && (
                            <span className="text-[9px] font-extrabold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded uppercase">DEVADMIN</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">@{memberUser.leetcodeUsername || 'unlinked'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Total XP</div>
                      <div className="text-sm font-extrabold text-indigo-400">{(memberUser.xp || 0).toLocaleString()} XP</div>
                    </div>
                  </div>

                  {/* Daily Solved & Metrics */}
                  <div className="py-4 flex items-center justify-between gap-3">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs ${
                      dailySolved > 0 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{dailySolved} Solved</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold">
                        🔥 {memberStats?.currentStreak || 0}d
                      </span>
                    </div>
                  </div>

                  {/* Hover-Toggled Profile Options Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => toggleExpand(memberUser._id)}
                      className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isExpanded ? 'Hide Activity' : 'View Daily Log'}</span>
                    </button>

                    <button
                      onClick={() => setInspectingUserModal(memberUser)}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-800 font-bold transition-all flex items-center gap-1.5"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Inspect Profile</span>
                    </button>
                  </div>

                  {/* Inline Expanded Log */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <DailyProgressCalendar userId={memberUser._id} initialLogs={memberLogs} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500 text-sm border border-slate-800">
          No members found matching your search criteria or selected batch.
        </div>
      )}

      {/* User Inspection Modal */}
      {inspectingUserModal && (
        <UserCalendarModal
          user={inspectingUserModal}
          onClose={() => setInspectingUserModal(null)}
        />
      )}
    </div>
  );
};

export default UserProgressPage;
