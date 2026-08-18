import React from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

const GroupReportsPage = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Cohort Performance Reports</h1>
        <p className="text-xs text-slate-400">Generate and export group-wide problem solving analytics</p>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
          <FileText className="w-8 h-8 text-indigo-400" />
          <div>
            <h3 className="font-bold text-white text-base">Export Full Cohort CSV Report</h3>
            <p className="text-xs text-slate-400">Includes member handles, total solves, easy/medium/hard breakdown, current streak & XP level.</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <a
            href="/api/admin/export-csv"
            download="group_performance_report.csv"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Group CSV Report
          </a>
        </div>
      </div>
    </div>
  );
};

export default GroupReportsPage;
