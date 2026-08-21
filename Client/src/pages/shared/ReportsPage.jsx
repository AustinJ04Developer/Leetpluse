import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Download, FileText, Filter, CheckCircle } from 'lucide-react';

const ReportsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [deptFilter, setDeptFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [secFilter, setSecFilter] = useState('');
  
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [dRes, bRes, sRes] = await Promise.all([
          api.get('/institutions/departments/list'),
          api.get('/institutions/batches/list'),
          api.get('/institutions/sections/list')
        ]);
        if (dRes.data.success) setDepartments(dRes.data.data);
        if (bRes.data.success) setBatches(bRes.data.data);
        if (sRes.data.success) setSections(sRes.data.data);
      } catch (err) {
        console.error('Failed to load report filters:', err);
      }
    };
    fetchFilters();
  }, []);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      let url = '/reports/students/csv?';
      if (deptFilter) url += `departmentId=${deptFilter}&`;
      if (batchFilter) url += `batchId=${batchFilter}&`;
      if (secFilter) url += `sectionId=${secFilter}&`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `institutional_student_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" />
            <span>Institutional Reports Generator</span>
          </h1>
          <p className="text-sm text-slate-400">Export student coding performance, solved difficulty counts, and streaks into CSV format</p>
        </div>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-400" />
          <span>Report Export Scope & Filters</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Department</label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Batch</label>
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Section</label>
            <select
              value={secFilter}
              onChange={e => setSecFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating CSV...' : 'Download Student Performance Report (CSV)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
