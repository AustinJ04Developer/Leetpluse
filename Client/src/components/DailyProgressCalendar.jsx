import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Award, 
  BarChart2,
  X,
  Sparkles
} from 'lucide-react';

const DailyProgressCalendar = ({ userId, initialLogs = null }) => {
  const [logs, setLogs] = useState(initialLogs || []);
  const [loading, setLoading] = useState(!initialLogs);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

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
      console.error('Failed to fetch submission logs for calendar:', err);
    } finally {
      setLoading(false);
    }
  };


  // Map logs by YYYY-MM-DD for fast lookup
  const logMap = {};
  logs.forEach((log) => {
    logMap[log.date] = log;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Days in current month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Determine starting offset (0 for Monday, 6 for Sunday)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // Sunday becomes 6

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // Monthly aggregated statistics
  let monthSolved = 0;
  let monthActiveDays = 0;
  let maxSingleDay = 0;
  let monthEasy = 0;
  let monthMedium = 0;
  let monthHard = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const log = logMap[dateStr];
    if (log && log.count > 0) {
      monthSolved += log.count;
      monthActiveDays++;
      if (log.count > maxSingleDay) maxSingleDay = log.count;
      monthEasy += log.easy || 0;
      monthMedium += log.medium || 0;
      monthHard += log.hard || 0;
    }
  }

  // Calculate Today's Solved and Current Week's Total Solved
  const getTodayAndWeeklyStats = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;
    const todayLog = logMap[todayKey];
    const todayCount = todayLog ? todayLog.count : 0;

    // Current week (Monday to Sunday)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    let weeklyCount = 0;
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dy = dayDate.getFullYear();
      const dm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const dateKey = `${dy}-${dm}-${dd}`;
      if (logMap[dateKey]) {
        weeklyCount += logMap[dateKey].count || 0;
      }
    }

    return { todayCount, weeklyCount };
  };

  const { todayCount, weeklyCount } = getTodayAndWeeklyStats();

  // Intensity color styling function
  const getIntensityClass = (count, isToday) => {
    let bgClass = 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:border-slate-700';
    if (count >= 5) {
      bgClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 hover:scale-105';
    } else if (count >= 3) {
      bgClass = 'bg-emerald-700/80 border-emerald-500/60 text-emerald-100 font-semibold hover:scale-105';
    } else if (count >= 1) {
      bgClass = 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300 font-medium hover:scale-105';
    }

    if (isToday) {
      bgClass += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950';
    }

    return bgClass;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#111625] border border-slate-800/80 rounded-2xl p-3 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Daily Progress Calendar
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                {monthNames[month]} {year}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Track problem submissions and daily active streaks
            </p>
          </div>
        </div>

        {/* Month selector controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-indigo-400 hover:bg-indigo-600/10 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary statistics bar featuring Daily Solved & Weekly Total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 sm:p-3 rounded-xl">
          <div className="text-[11px] sm:text-xs text-emerald-400 font-semibold flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>Today Solved</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-300">{todayCount} <span className="text-[10px] sm:text-xs text-emerald-400/80 font-normal">solved</span></div>
        </div>

        <div className="bg-indigo-950/30 border border-indigo-500/30 p-2.5 sm:p-3 rounded-xl">
          <div className="text-[11px] sm:text-xs text-indigo-400 font-semibold flex items-center gap-1 mb-1">
            <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
            <span>Weekly Total</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-indigo-300">{weeklyCount} <span className="text-[10px] sm:text-xs text-indigo-400/80 font-normal">this week</span></div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 sm:p-3 rounded-xl">
          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>Monthly Solved</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-100">{monthSolved} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">problems</span></div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 sm:p-3 rounded-xl">
          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
            <span>Active Days</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-100">{monthActiveDays} / {totalDaysInMonth} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">days</span></div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 sm:p-3 rounded-xl col-span-2 sm:col-span-1">
          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mb-1">
            <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
            <span>Difficulty Ratio</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs mt-1">
            <span className="text-emerald-400 font-semibold">{monthEasy}E</span>
            <span className="text-amber-400 font-semibold">{monthMedium}M</span>
            <span className="text-rose-400 font-semibold">{monthHard}H</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="h-48 sm:h-64 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
          Loading calendar statistics...
        </div>
      ) : (
        <div className="space-y-1 sm:space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank leading slots */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-14 sm:h-20 rounded-lg sm:rounded-xl bg-slate-950/20 border border-slate-900/30 opacity-30" />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDay = String(dayNum).padStart(2, '0');
              const formattedMonth = String(month + 1).padStart(2, '0');
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
              const log = logMap[dateStr];
              const count = log ? log.count : 0;
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay({ dateStr, dayNum, log, isToday })}
                  className={`h-14 sm:h-20 rounded-lg sm:rounded-xl border p-1 sm:p-2 flex flex-col justify-between cursor-pointer transition-all duration-200 ${getIntensityClass(count, isToday)}`}
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium">
                    <span>{dayNum}</span>
                    {isToday && (
                      <span className="text-[8px] sm:text-[10px] px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-indigo-500 text-white font-bold uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  {count > 0 ? (
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="text-[10px] sm:text-xs font-extrabold flex items-center justify-between">
                        <span>{count} <span className="hidden sm:inline">solved</span></span>
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-80 hidden sm:block" />
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] opacity-90 flex-wrap">
                        {log.easy > 0 && <span className="px-0.5 sm:px-1 bg-emerald-900/70 text-emerald-200 rounded">{log.easy}e</span>}
                        {log.medium > 0 && <span className="px-0.5 sm:px-1 bg-amber-900/70 text-amber-200 rounded">{log.medium}m</span>}
                        {log.hard > 0 && <span className="px-0.5 sm:px-1 bg-rose-900/70 text-rose-200 rounded">{log.hard}h</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] opacity-40 text-right">0</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Selected Day Detail Modal / Card */}
      {selectedDay && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-center min-w-[3.5rem]">
              <div className="text-xs text-emerald-300 uppercase">{monthNames[month].slice(0, 3)}</div>
              <div className="text-xl">{selectedDay.dayNum}</div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Activity for {selectedDay.dateStr}
              </h4>
              {selectedDay.log && selectedDay.log.count > 0 ? (
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                  <span>Total: <strong className="text-emerald-400">{selectedDay.log.count} solved</strong></span>
                  <span>Easy: <strong className="text-emerald-400">{selectedDay.log.easy || 0}</strong></span>
                  <span>Medium: <strong className="text-amber-400">{selectedDay.log.medium || 0}</strong></span>
                  <span>Hard: <strong className="text-rose-400">{selectedDay.log.hard || 0}</strong></span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">No submissions recorded on this date.</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Heatmap Legend Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Daily Activity Log
        </span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-slate-900 border border-slate-800" title="0" />
            <div className="w-3 h-3 rounded bg-emerald-950 border border-emerald-700" title="1-2" />
            <div className="w-3 h-3 rounded bg-emerald-700 border border-emerald-500" title="3-4" />
            <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" title="5+" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressCalendar;
