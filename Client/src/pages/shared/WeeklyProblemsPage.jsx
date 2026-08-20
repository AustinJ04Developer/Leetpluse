import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Tag, 
  Sparkles, 
  Trash2, 
  Edit3, 
  X,
  Target,
  Users,
  Info
} from 'lucide-react';

const WeeklyProblemsPage = () => {
  const { user } = useAuth();
  const isAdmin = (user?.roleLevel || 1) >= 2;

  const [data, setData] = useState(null);
  const [weeksList, setWeeksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    problemUrl: '',
    difficulty: 'Easy',
    category: 'Array & Hashing',
    weekNumber: '',
    year: '',
    notes: '',
    assignedToGroup: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableWeeks();
  }, []);

  useEffect(() => {
    fetchWeeklyProblems();
  }, [selectedWeek, selectedYear]);

  const fetchAvailableWeeks = async () => {
    try {
      const res = await api.get('/weekly-problems/weeks');
      if (res.data.success) {
        setWeeksList(res.data.weeks || []);
      }
    } catch (err) {
      console.error('Error fetching available weeks:', err);
    }
  };

  const fetchWeeklyProblems = async () => {
    try {
      setLoading(true);
      let query = '';
      if (selectedWeek && selectedYear) {
        query = `?weekNumber=${selectedWeek}&year=${selectedYear}`;
      }
      const res = await api.get(`/weekly-problems${query}`);
      if (res.data.success) {
        setData(res.data);
        if (!selectedWeek) {
          setSelectedWeek(res.data.weekNumber);
          setSelectedYear(res.data.year);
        }
      }
    } catch (err) {
      console.error('Error fetching weekly problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (problemId) => {
    try {
      const res = await api.post(`/weekly-problems/${problemId}/toggle-complete`);
      if (res.data.success) {
        // Optimistic UI update
        setData((prev) => {
          if (!prev) return prev;
          const updatedProblems = prev.problems.map((p) => {
            if (p._id === problemId) {
              return {
                ...p,
                isCompleted: res.data.isCompleted,
                completedCount: res.data.completedCount
              };
            }
            return p;
          });
          const newCompletedCount = updatedProblems.filter(p => p.isCompleted).length;
          return {
            ...prev,
            completedCount: newCompletedCount,
            problems: updatedProblems
          };
        });
      }
    } catch (err) {
      console.error('Error toggling problem completion:', err);
    }
  };

  const handleOpenAddModal = (problemToEdit = null) => {
    setModalError('');
    if (problemToEdit) {
      setEditingProblem(problemToEdit);
      setFormData({
        title: problemToEdit.title,
        problemUrl: problemToEdit.problemUrl,
        difficulty: problemToEdit.difficulty,
        category: problemToEdit.category,
        weekNumber: problemToEdit.weekNumber,
        year: problemToEdit.year,
        notes: problemToEdit.notes || '',
        assignedToGroup: problemToEdit.assignedToGroup || ''
      });
    } else {
      setEditingProblem(null);
      setFormData({
        title: '',
        problemUrl: '',
        difficulty: 'Easy',
        category: 'Arrays & Hashing',
        weekNumber: data?.weekNumber || selectedWeek || 1,
        year: data?.year || selectedYear || new Date().getFullYear(),
        notes: '',
        assignedToGroup: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.title.trim() || !formData.problemUrl.trim()) {
      setModalError('Title and Problem URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProblem) {
        await api.put(`/weekly-problems/${editingProblem._id}`, formData);
      } else {
        await api.post('/weekly-problems', formData);
      }
      setIsModalOpen(false);
      fetchWeeklyProblems();
      fetchAvailableWeeks();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save weekly problem');
    } finally {
      setSubmitting(false);
    }
  };

  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleUrlBlur = async (urlVal) => {
    if (!urlVal || !urlVal.includes('leetcode.com/problems/')) return;
    try {
      setFetchingDetails(true);
      const res = await api.get(`/weekly-problems/fetch-details?url=${encodeURIComponent(urlVal)}`);
      if (res.data.success) {
        setFormData(prev => ({
          ...prev,
          title: prev.title.trim() === '' ? res.data.title : prev.title,
          difficulty: res.data.difficulty || prev.difficulty,
          category: (!prev.category || prev.category === 'Arrays & Hashing') ? res.data.category : prev.category
        }));
      }
    } catch (err) {
      console.error('Failed to auto-fetch LeetCode details:', err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this weekly problem?')) return;
    try {
      await api.delete(`/weekly-problems/${problemId}`);
      fetchWeeklyProblems();
      fetchAvailableWeeks();
    } catch (err) {
      console.error('Failed to delete problem:', err);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    const s = new Date(startStr);
    const e = new Date(endStr);
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const progressPct = data?.totalProblems > 0 
    ? Math.round((data.completedCount / data.totalProblems) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/90 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Weekly LeetCode Problems
                </h1>
                {data?.weekNumber === data?.currentWeekNumber && data?.year === data?.currentYear && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Current Week
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Curated LeetCode problems set for everyone. Solve them and track your weekly completion rate.
              </p>
            </div>
          </div>

          {/* Admin Create Action */}
          {isAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Weekly Problem</span>
            </button>
          )}
        </div>

        {/* Week Selector Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Week:</span>
            <select
              value={`${selectedWeek}-${selectedYear}`}
              onChange={(e) => {
                const [w, y] = e.target.value.split('-');
                setSelectedWeek(parseInt(w));
                setSelectedYear(parseInt(y));
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {weeksList.map((item) => (
                <option key={`${item.weekNumber}-${item.year}`} value={`${item.weekNumber}-${item.year}`}>
                  Week {item.weekNumber} ({item.year}) {item.isCurrent ? '— Current' : ''} [{item.count} problems]
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Date Range: <strong>{formatDateRange(data?.startDate, data?.endDate)}</strong></span>
          </div>
        </div>
      </div>

      {/* Completion Progress Card */}
      {data && data.totalProblems > 0 && (
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Weekly Goal Completion
            </span>
            <span className="font-extrabold text-emerald-400">
              {data.completedCount} / {data.totalProblems} Completed ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading LeetCode problem board...
        </div>
      ) : data?.problems?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.problems.map((prob, index) => (
            <div
              key={prob._id}
              className={`bg-[#111625] border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
                prob.isCompleted 
                  ? 'border-emerald-500/40 bg-emerald-950/10' 
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Badges & Actions row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {prob.category || 'General'}
                    </span>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(prob)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                        title="Edit problem"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProblem(prob._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        title="Delete problem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Problem Title */}
                <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-sm">#{index + 1}</span>
                  {prob.title}
                </h3>

                {/* Notes / Hint if present */}
                {prob.notes && (
                  <p className="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <strong className="text-slate-300">Note:</strong> {prob.notes}
                  </p>
                )}
              </div>

              {/* Card Footer: LeetCode Link & Complete Checkbox */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <a
                  href={prob.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Solve on LeetCode <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleToggleCompletion(prob._id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    prob.isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {prob.isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-500" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-slate-500" />
                      <span>Mark Solved</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111625] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No LeetCode Problems Assigned For Week {data?.weekNumber}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no problems scheduled for this week. Check back soon or select a different week from the dropdown menu.
          </p>
          {isAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Weekly Problem</span>
            </button>
          )}
        </div>
      )}

      {/* Admin Add / Edit Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111625] border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                {editingProblem ? 'Edit Weekly Problem' : 'Add New Weekly Problem'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Problem Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1. Two Sum or 3Sum"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    LeetCode Problem URL *
                  </label>
                  {fetchingDetails && (
                    <span className="text-[11px] text-indigo-400 animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-detecting difficulty...
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/two-sum/"
                  value={formData.problemUrl}
                  onChange={(e) => setFormData({ ...formData, problemUrl: e.target.value })}
                  onBlur={(e) => handleUrlBlur(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category / Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Programming"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={formData.weekNumber}
                    onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Notes / Hint (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Focus on two-pointer technique or hash maps"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProblem ? 'Update Problem' : 'Create Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProblemsPage;
