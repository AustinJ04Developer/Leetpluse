import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Filter, 
  Search, 
  BarChart2, 
  ArrowUpDown,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode
} from 'lucide-react';

const DailyProgressCalendar = ({ userId, initialLogs = null }) => {
  const [logs, setLogs] = useState(initialLogs || []);
  const [loading, setLoading] = useState(!initialLogs);
  const [expandedDate, setExpandedDate] = useState(null);
  
  // Date Filter states
  const [dateFilterPreset, setDateFilterPreset] = useState('month'); // 'today' | '7days' | 'month' | 'custom' | 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'count-desc'

  useEffect(() => {
    if (initialLogs && Array.isArray(initialLogs)) {
      setLogs(initialLogs);
      setLoading(false);
    } else {
      fetchSubmissionLogs();
    }
  }, [userId, initialLogs]);

  const fetchSubmissionLogs = async () => {
    try {
      setLoading(true);
      const url = userId ? `/leetcode/heatmap/${userId}` : '/leetcode/heatmap';
      const res = await api.get(url);
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch submission logs for daily list:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format date string to friendly format
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Today';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleExpandDate = (dateStr) => {
    setExpandedDate(prev => (prev === dateStr ? null : dateStr));
  };

  // Filter logs based on date presets or custom range
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilterPreset === 'today') {
      result = result.filter(l => l.date === todayStr);
    } else if (dateFilterPreset === '7days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const minDateStr = sevenDaysAgo.toISOString().split('T')[0];
      result = result.filter(l => l.date >= minDateStr && l.date <= todayStr);
    } else if (dateFilterPreset === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const minDateStr = firstOfMonth.toISOString().split('T')[0];
      result = result.filter(l => l.date >= minDateStr);
    } else if (dateFilterPreset === 'custom') {
      if (startDate) {
        result = result.filter(l => l.date >= startDate);
      }
      if (endDate) {
        result = result.filter(l => l.date <= endDate);
      }
    }

    if (searchDate.trim()) {
      const term = searchDate.toLowerCase().trim();
      result = result.filter(l => l.date.includes(term) || formatFriendlyDate(l.date).toLowerCase().includes(term));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'count-desc') return (b.count || 0) - (a.count || 0);
      return 0;
    });

    return result;
  }, [logs, dateFilterPreset, startDate, endDate, searchDate, sortBy, todayStr]);

  // Aggregated summary metrics for filtered logs
  const aggregatedStats = useMemo(() => {
    let totalSolved = 0;
    let activeDays = 0;
    let easyTotal = 0;
    let mediumTotal = 0;
    let hardTotal = 0;
    let maxSingleDay = 0;

    filteredLogs.forEach(l => {
      const count = l.count || 0;
      if (count > 0) {
        totalSolved += count;
        activeDays++;
        if (count > maxSingleDay) maxSingleDay = count;
        easyTotal += l.easy || 0;
        mediumTotal += l.medium || 0;
        hardTotal += l.hard || 0;
      }
    });

    return { totalSolved, activeDays, easyTotal, mediumTotal, hardTotal, maxSingleDay };
  }, [filteredLogs]);

  return (
    <div className="bg-[#111625] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>Date-Wise Submission History</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                Live Log
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Detailed problem submissions breakdown per date from LeetCode
            </p>
          </div>
        </div>

        {/* Date Filter Presets */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl flex-wrap">
          {[
            { id: 'today', label: 'Today' },
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extended Custom Date Inputs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {dateFilterPreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1.5 rounded-xl outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1.5 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search date (YYYY-MM-DD)..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 text-white border border-slate-800 px-2.5 py-1.5 rounded-xl outline-none text-xs cursor-pointer focus:border-indigo-500 font-medium"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="count-desc">Highest Solved Count</option>
          </select>
        </div>
      </div>

      {/* Aggregated Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
          <div className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Total Solved
          </div>
          <div className="text-xl font-extrabold text-white">
            {aggregatedStats.totalSolved} <span className="text-xs font-normal text-slate-400">problems</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Days
          </div>
          <div className="text-xl font-extrabold text-white">
            {aggregatedStats.activeDays} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20">
          <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Best Single Day
          </div>
          <div className="text-xl font-extrabold text-white">
            {aggregatedStats.maxSingleDay} <span className="text-xs font-normal text-slate-400">solved</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Difficulty Ratio
          </div>
          <div className="flex items-center gap-2 text-xs font-extrabold mt-1">
            <span className="text-emerald-400">{aggregatedStats.easyTotal}E</span>
            <span className="text-amber-400">{aggregatedStats.mediumTotal}M</span>
            <span className="text-rose-400">{aggregatedStats.hardTotal}H</span>
          </div>
        </div>
      </div>

      {/* Progress Log Table / List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
          Loading date-wise submission records...
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const count = log.count || 0;
            const isToday = log.date === todayStr;
            const isExpanded = expandedDate === log.date;
            const subsList = log.submissions || [];

            return (
              <div
                key={log.date}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isToday
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : count > 0
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                }`}
              >
                {/* Date Summary Row Header */}
                <div 
                  onClick={() => count > 0 && toggleExpandDate(log.date)}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    count > 0 ? 'cursor-pointer hover:bg-slate-800/40' : ''
                  }`}
                >
                  {/* Date Tag */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl font-bold text-center min-w-[3.2rem] text-xs ${
                      count > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {log.date.slice(5)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">
                          {formatFriendlyDate(log.date)}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-indigo-600 text-white">
                            TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {log.date}
                      </p>
                    </div>
                  </div>

                  {/* Metrics & Expand Indicator */}
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    {count > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-xl font-extrabold border bg-emerald-950/60 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                          🔥 {count} Solved
                        </span>

                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                          {(log.easy || 0) > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                              {log.easy} Easy
                            </span>
                          )}
                          {(log.medium || 0) > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                              {log.medium} Med
                            </span>
                          )}
                          {(log.hard || 0) > 0 && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                              {log.hard} Hard
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium italic">
                        No problems solved
                      </span>
                    )}

                    {count > 0 && (
                      <button className="p-1 text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Date-Wise Problem Submissions List */}
                {isExpanded && subsList.length > 0 && (
                  <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Problems Solved on {log.date} ({subsList.length} submissions)</span>
                    </div>

                    <div className="space-y-1.5">
                      {subsList.map((sub, sIdx) => (
                        <div 
                          key={`${sub.titleSlug || sIdx}-${sIdx}`}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex-shrink-0 ${
                              sub.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              sub.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {sub.difficulty || 'Medium'}
                            </span>

                            <span className="font-bold text-white truncate">{sub.title}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Accepted
                            </span>

                            {sub.titleSlug && (
                              <a
                                href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="View Problem on LeetCode"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
          No daily progress records match the selected date filter.
        </div>
      )}
    </div>
  );
};

export default DailyProgressCalendar;
