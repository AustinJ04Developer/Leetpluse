import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Flag, Plus, Calendar, Trophy } from 'lucide-react';

const GroupChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [rewardXp, setRewardXp] = useState(250);

  const loadData = async () => {
    try {
      const gRes = await api.get('/admin/group-overview');
      if (gRes.data.success) {
        setGroups(gRes.data.groups || []);
        if (gRes.data.groups.length > 0) {
          setGroupId(gRes.data.groups[0]._id);
          loadChallenges(gRes.data.groups[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadChallenges = async (gId) => {
    try {
      const res = await api.get(`/admin/challenges/${gId}`);
      if (res.data.success) {
        setChallenges(res.data.challenges || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/challenges', {
        title,
        description,
        groupId,
        targetCount,
        difficulty,
        deadline: new Date(Date.now() + 5 * 86400000),
        rewardXp
      });
      if (res.data.success) {
        setTitle('');
        setDescription('');
        setModalOpen(false);
        loadChallenges(groupId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Cohort Challenges</h1>
          <p className="text-xs text-slate-400">Assign competitive problem solving sprints to cohort members</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Assign Challenge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((c) => (
          <div key={c._id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {c.difficulty} Difficulty
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> +{c.rewardXp} XP Reward
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{c.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{c.description}</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span>Target: {c.targetCount} problems</span>
              <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Assign Group Challenge</h3>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="e.g. Graph Traversal Sprint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="Solve 5 BFS/DFS problems..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="All">All Tiers</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={rewardXp}
                    onChange={(e) => setRewardXp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                  />
                </div>
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
                  Assign Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChallengesPage;
