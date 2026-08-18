import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Target, Plus, CheckCircle, Clock } from 'lucide-react';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [targetSolved, setTargetSolved] = useState(10);
  const [period, setPeriod] = useState('weekly');
  const [modalOpen, setModalOpen] = useState(false);

  const loadGoals = async () => {
    try {
      const res = await api.get('/goals');
      if (res.data.success) {
        setGoals(res.data.goals || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/goals', {
        title,
        targetSolved,
        period,
        endDate: new Date(Date.now() + (period === 'daily' ? 1 : 7) * 86400000)
      });
      if (res.data.success) {
        setTitle('');
        setModalOpen(false);
        loadGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Goals & Milestones</h1>
          <p className="text-xs text-slate-400">Set problem solving targets and track progress</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentSolved / g.targetSolved) * 100));
          return (
            <div key={g._id} className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {g.period} Goal
                  </span>
                  {g.completed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base mt-1">{g.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Target: {g.targetSolved} problems &bull; Progress: {g.currentSolved} ({pct}%)
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${g.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Set New Target</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="Solve 10 Medium DP problems"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Problems Count</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetSolved}
                  onChange={(e) => setTargetSolved(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Goal</option>
                  <option value="monthly">Monthly Milestone</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
