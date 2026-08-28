import React, { useState } from 'react';
import api from '../../services/api';
import { Download, FileText } from 'lucide-react';

const GroupReportsPage = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCohortCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/admin/export-csv', { responseType: 'blob' });
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        alert(json.message || 'Failed to download cohort report');
        return;
      }

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `group_performance_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Failed to download cohort report CSV');
    } finally {
      setDownloading(false);
    }
  };

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
          <button
            onClick={handleDownloadCohortCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${downloading ? 'animate-spin' : ''}`} />
            <span>{downloading ? 'Generating Report...' : 'Download Group CSV Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupReportsPage;
