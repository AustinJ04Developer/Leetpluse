import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import ContributionHeatmap from '../../components/ContributionHeatmap';
import TopicRadarChart from '../../components/TopicRadarChart';

import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Zap, 
  Sparkles, 
  Calendar, 
  Target,
  Medal,
  Clock
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin/analytics" replace />;
  }

  const { lastSyncEvent } = useSocket();
  const [stats, setStats] = useState(null);
  const [heatmapLogs, setHeatmapLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const [statsRes, heatmapRes, goalsRes, leaderboardRes] = await Promise.all([
        api.get('/leetcode/stats'),
        api.get('/leetcode/heatmap'),
        api.get('/goals'),
        api.get('/leetcode/leaderboard?scope=global')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (heatmapRes.data.success) {
        setHeatmapLogs(heatmapRes.data.logs || []);
      }
      if (goalsRes.data.success) {
        setGoals(goalsRes.data.goals || []);
      }
      if (leaderboardRes.data.success) {
        const lb = leaderboardRes.data.leaderboard || [];
        const index = lb.findIndex(item => item.userId?._id === user?.id || item.userId === user?.id);
        if (index !== -1) {
          setUserRank(index + 1);
        } else {
          setUserRank(lb.length + 1);
        }
      }
    } catch (err) {
      console.error('Error loading user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (lastSyncEvent && lastSyncEvent.type === 'user_updated') {
      loadUserData();
    }
  }, [lastSyncEvent]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading personal analytics...
      </div>
    );
  }

  const easy = stats?.easySolved || 0;
  const medium = stats?.mediumSolved || 0;
  const hard = stats?.hardSolved || 0;
  const total = stats?.totalSolved || 0;

  // Calculate Today's Solved and Current Week's Total Solved from logs
  const getTodayAndWeeklyStats = () => {
    const logMap = {};
    heatmapLogs.forEach((log) => {
      logMap[log.date] = log;
    });

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;
    const todayLog = logMap[todayKey];
    const todaySolved = todayLog ? todayLog.count : 0;

    const dayOfWeek = now.getDay();
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    let weeklySolved = 0;
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dy = dayDate.getFullYear();
      const dm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const dateKey = `${dy}-${dm}-${dd}`;
      if (logMap[dateKey]) {
        weeklySolved += logMap[dateKey].count || 0;
      }
    }

    return { todaySolved, weeklySolved };
  };

  const { todaySolved, weeklySolved } = getTodayAndWeeklyStats();

  return (
    <div className="space-y-6">
      {/* Header Profile Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 relative overflow-hidden bg-gradient-to-r from-indigo-900/20 via-slate-900/40 to-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{user?.name}</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Level {user?.level || 1}
                </span>
                {userRank && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Medal className="w-3 h-3" /> Rank #{userRank}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                <span>Handle: <strong className="text-slate-200">@{user?.leetcodeUsername || 'not_linked'}</strong></span>
                <span>&bull;</span>
                <span className="text-indigo-400 font-semibold">{user?.xp || 0} XP Earned</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Streak</span>
              <span className="text-lg font-extrabold text-amber-400 flex items-center justify-end gap-1">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
                {stats?.currentStreak || 0} Days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Daily Solved"
          value={`${todaySolved}`}
          subtitle={`Weekly Total: ${weeklySolved} solved`}
          icon={Sparkles}
          color="emerald"
          badgeText="Daily & Weekly"
        />

        <StatCard
          title="Total Solved"
          value={total}
          subtitle={`Global rank #${(stats?.globalRanking || 42000).toLocaleString()}`}
          icon={Trophy}
          color="indigo"
          badgeText="All Time"
        />

        <StatCard
          title="Active Streak"
          value={`${stats?.currentStreak || 0} Days`}
          subtitle={`Personal Best: ${stats?.longestStreak || 0} Days`}
          icon={Flame}
          color="amber"
          badgeText="Daily target met"
        />

        <StatCard
          title="Acceptance Rate"
          value={`${stats?.acceptanceRate || 64.5}%`}
          subtitle="Clean submission ratio"
          icon={CheckCircle2}
          color="emerald"
          badgeText="Accuracy tier"
        />

        <StatCard
          title="Contest Rating"
          value={stats?.contestRating || 1750}
          subtitle="Knight / Guardian"
          icon={TrendingUp}
          color="purple"
          badgeText="Rated contestant"
        />
      </div>


      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Problem Difficulty Arc & Cards */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Difficulty Distribution</h3>
            <p className="text-xs text-slate-400">Problem breakdown by complexity tier</p>
          </div>

          <div className="space-y-3">
            {/* Easy */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-emerald-400">Easy Solved</span>
                <span className="font-bold text-white">{easy}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (easy / 300) * 100)}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-amber-400">Medium Solved</span>
                <span className="font-bold text-white">{medium}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (medium / 300) * 100)}%` }} />
              </div>
            </div>

            {/* Hard */}
            <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-rose-400">Hard Solved</span>
                <span className="font-bold text-white">{hard}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (hard / 100) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Topic Mastery Radar */}
        <div className="lg:col-span-2">
          <TopicRadarChart topicMastery={stats?.topicMastery || []} />
        </div>
      </div>

      {/* Goals & Progress Summary */}
      {goals.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Active Goals & Targets
            </h3>
            <span className="text-xs text-indigo-400 font-semibold">{goals.length} Goals Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.slice(0, 2).map((g) => {
              const pct = Math.min(100, Math.round((g.currentSolved / g.targetSolved) * 100));
              return (
                <div key={g._id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{g.title}</span>
                    <span className="text-indigo-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 365-Day Contribution Heatmap */}
      <ContributionHeatmap submissionLogs={heatmapLogs} />
    </div>
  );
};

export default UserDashboard;
