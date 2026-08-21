import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, Award, AlertTriangle, Target, RefreshCw, CheckCircle } from 'lucide-react';

const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Goal modal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [targetSolved, setTargetSolved] = useState(10);
  const [period, setPeriod] = useState('weekly');
  const [endDate, setEndDate] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch faculty overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleDispatchGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !endDate || !selectedSection) return;

    setSubmittingGoal(true);
    try {
      const res = await api.post('/faculty/goals/assign', {
        title: goalTitle,
        targetSolved: Number(targetSolved),
        period,
        endDate,
        targetType: 'section',
        sectionId: selectedSection
      });

      if (res.data.success) {
        alert('Goal dispatched to section successfully!');
        setGoalTitle('');
        setSelectedSection('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Goal creation failed');
    } finally {
      setSubmittingGoal(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Faculty Overview...</div>;
  }

  const { sections = [], totalStudents = 0, activeStudents = 0, atRiskStudents = 0, averageSolved = 0, students = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Faculty Monitoring Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400">Track assigned sections, monitor coding progress, and assign target goals</p>
        </div>
        <button
          onClick={fetchFacultyData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Overview</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Students" value={totalStudents} icon={Users} subtext={`${sections.length} Sections Assigned`} />
        <StatCard title="Active Coding" value={activeStudents} icon={CheckCircle} subtext="Regular LeetCode Submissions" />
        <StatCard title="Avg Solved" value={averageSolved} icon={Award} subtext="Problems per Student" />
        <StatCard title="At-Risk Alerts" value={atRiskStudents} icon={AlertTriangle} subtext="Requires Attention" trend={atRiskStudents > 0 ? 'down' : 'up'} />
      </div>

      {/* Section Goal Dispatch & Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Dispatch Form */}
        <form onSubmit={handleDispatchGoal} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Dispatch Section Target Goal</span>
          </h2>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Goal Title</label>
            <input
              type="text"
              placeholder="e.g. Solve 10 Medium DP Problems"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Problems Count</label>
            <input
              type="number"
              value={targetSolved}
              onChange={e => setTargetSolved(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Assigned Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.batchId?.name || 'Batch'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={submittingGoal}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all"
          >
            {submittingGoal ? 'Dispatching Goal...' : 'Assign Goal to Section'}
          </button>
        </form>

        {/* Assigned Student Roster */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white">Assigned Section Students ({students.length})</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {students.map(s => (
              <div key={s._id} className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">{s.name}</div>
                  <div className="text-xs text-slate-400">Reg: {s.registerNumber} • Section: {s.sectionId?.name || 'A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-400">{s.stats?.totalSolved || 0} Solved</div>
                  <div className="text-xs text-slate-400">Streak: {s.stats?.currentStreak || 0}d</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
