import React from 'react';

const ContributionHeatmap = ({ submissionLogs = [] }) => {
  // Map submission logs into key-value pair { "YYYY-MM-DD": count }
  const logMap = {};
  submissionLogs.forEach(l => {
    logMap[l.date] = l.count;
  });

  // Generate last 365 days
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: logMap[dateStr] || 0
    });
  }

  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-900/90 border border-slate-800/80';
    if (count === 1) return 'bg-emerald-950 border border-emerald-800 text-emerald-300';
    if (count <= 3) return 'bg-emerald-700 border border-emerald-600 text-emerald-100';
    return 'bg-emerald-500 border border-emerald-400 text-white shadow-sm shadow-emerald-500/50';
  };

  const totalSubmissionsInYear = submissionLogs.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Solve Activity Heatmap</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              365 Days
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">Visual submission breakdown over the past year</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-white">{totalSubmissionsInYear}</span>
          <span className="text-xs text-slate-400 ml-1">solves logged</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[720px]">
          {days.map((day, idx) => (
            <div
              key={idx}
              title={`${day.date}: ${day.count} solved`}
              className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${getColorClass(day.count)}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <span>Less</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700 border border-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
