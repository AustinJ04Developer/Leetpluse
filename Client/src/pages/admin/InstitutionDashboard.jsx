import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Building2, Users, Award, AlertTriangle, BookOpen, Layers, RefreshCw } from 'lucide-react';

const InstitutionDashboard = () => {
  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [instRes, deptRes, stuRes, riskRes] = await Promise.all([
        api.get('/institutions'),
        api.get('/institutions/departments/list'),
        api.get('/students?limit=100'),
        api.get('/students/at-risk')
      ]);

      if (instRes.data.success && instRes.data.data.length > 0) {
        setInstitution(instRes.data.data[0]);
      }
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (stuRes.data.success) setStudents(stuRes.data.data);
      if (riskRes.data.success) setAtRiskCount(riskRes.data.count);
    } catch (err) {
      console.error('Failed to load institution dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Institutional Analytics...</div>;
  }

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.stats && s.stats.totalSolved > 0).length;
  const totalSolved = students.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0);
  const avgSolved = totalStudents > 0 ? Math.round(totalSolved / totalStudents) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{institution?.name || 'Academic Institution Platform'}</h1>
            <p className="text-sm text-slate-400">
              Code: <span className="font-mono text-indigo-400">{institution?.code || 'INST'}</span> • Multi-Institution Coding Performance Monitor
            </p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          subtext={`${activeStudents} active on LeetCode`}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          icon={Layers}
          subtext="Configured Academic Units"
        />
        <StatCard
          title="Avg Solved / Student"
          value={avgSolved}
          icon={Award}
          subtext={`Total: ${totalSolved.toLocaleString()} problems`}
        />
        <StatCard
          title="At-Risk Students"
          value={atRiskCount}
          icon={AlertTriangle}
          subtext="Requires Immediate Attention"
          trend={atRiskCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Departments Overview */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Academic Departments Overview</span>
          </h2>
        </div>

        {departments.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No departments configured yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const deptStudents = students.filter(s => s.departmentId?.code === dept.code || s.departmentId === dept._id);
              const deptSolved = deptStudents.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0);

              return (
                <div key={dept._id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-400">{deptStudents.length} Students</span>
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">{dept.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">HOD: {dept.hodId?.name || 'Unassigned'}</p>
                  <div className="pt-2 border-t border-slate-700/50 flex justify-between text-xs text-slate-300">
                    <span>Total Solved:</span>
                    <span className="font-semibold text-emerald-400">{deptSolved.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDashboard;
