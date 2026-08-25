import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Building2, Users, Award, AlertTriangle, BookOpen, Layers, RefreshCw, UserCheck, UserX, ShieldAlert, Clock, Check, X } from 'lucide-react';

const InstitutionDashboard = () => {
  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [instRes, deptRes, stuRes, riskRes, pendingRes] = await Promise.all([
        api.get('/institutions'),
        api.get('/institutions/departments/list'),
        api.get('/students?limit=100'),
        api.get('/students/at-risk'),
        api.get('/institutions/pending-approvals').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (instRes.data.success && instRes.data.data.length > 0) {
        setInstitution(instRes.data.data[0]);
      }
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (stuRes.data.success) setStudents(stuRes.data.data);
      if (riskRes.data.success) setAtRiskCount(riskRes.data.count);
      if (pendingRes.data?.success) setPendingUsers(pendingRes.data.data || []);
    } catch (err) {
      console.error('Failed to load institution dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (userId, name) => {
    setActionLoading(userId);
    setMsg('');
    try {
      const res = await api.post(`/institutions/approve-user/${userId}`);
      if (res.data.success) {
        setMsg(`Approved ${name}'s account successfully!`);
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      setMsg(`Error approving user: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, name) => {
    setActionLoading(userId);
    setMsg('');
    try {
      const res = await api.post(`/institutions/reject-user/${userId}`);
      if (res.data.success) {
        setMsg(`Rejected ${name}'s registration.`);
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      setMsg(`Error rejecting user: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

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
              Code: <span className="font-mono text-indigo-400">{institution?.code || 'INST'}</span> • Multi-Tenant Institutional Governance
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

      {msg && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          subtext={`${activeStudents} active on LeetCode`}
        />
        <StatCard
          title="Pending Role Approvals"
          value={pendingUsers.length}
          icon={Clock}
          subtext="Awaiting HOD / Admin Approval"
          trend={pendingUsers.length > 0 ? 'down' : 'up'}
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

      {/* PENDING APPROVALS SECTION */}
      {pendingUsers.length > 0 && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Pending Role Approvals ({pendingUsers.length})</span>
            </h2>
            <span className="text-xs text-amber-300 font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              Grant Approval Required
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Requested Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Registered Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingUsers.map(user => (
                  <tr key={user._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {user.name}
                      {user.designation && <span className="block text-[11px] text-slate-400 font-normal">{user.designation}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        user.role === 'hod' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        user.role === 'faculty' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {user.role === 'hod' ? 'HOD (Level 4)' : user.role === 'faculty' ? 'Staff (Level 3)' : user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.departmentId?.name || 'All Departments'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(user._id, user.name)}
                        disabled={actionLoading === user._id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 inline-flex transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Grant Approval</span>
                      </button>
                      <button
                        onClick={() => handleReject(user._id, user.name)}
                        disabled={actionLoading === user._id}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 inline-flex transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
