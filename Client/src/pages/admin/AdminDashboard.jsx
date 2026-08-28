import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserDashboard from '../user/UserDashboard';
import UserAvatar from '../../components/UserAvatar';
import UserCalendarModal from '../../components/UserCalendarModal';
import { Users, AlertTriangle, Download, Mail, CheckCircle, Search, UserCheck, UserPlus, X, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('management'); // 'personal' or 'management'
  const [data, setData] = useState({ groups: [], users: [] });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [statusAlert, setStatusAlert] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportGroupCSV = async () => {
    setExportingCsv(true);
    try {
      const response = await api.get('/admin/export-csv', { responseType: 'blob' });
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        alert(json.message || 'Failed to export cohort CSV');
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
      alert('Failed to export cohort report CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const [inspectingUser, setInspectingUser] = useState(null);

  // Add User to Batch Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('search'); // 'search' or 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchUserIds, setSelectedSearchUserIds] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addHandle, setAddHandle] = useState('');
  const [addPass, setAddPass] = useState('Password123!');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const loadOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    setSelectedSearchUserIds([]);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get(`/admin/search-users?q=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setSearchResults(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSearchUserSelect = (userId) => {
    if (selectedSearchUserIds.includes(userId)) {
      setSelectedSearchUserIds(selectedSearchUserIds.filter(id => id !== userId));
    } else {
      setSelectedSearchUserIds([...selectedSearchUserIds, userId]);
    }
  };

  const toggleSelectAllSearchUsers = () => {
    const assignableIds = searchResults
      .filter(u => !data.users.some(existing => existing._id === u._id))
      .map(u => u._id);

    const allSelected = assignableIds.length > 0 && assignableIds.every(id => selectedSearchUserIds.includes(id));
    if (allSelected) {
      setSelectedSearchUserIds([]);
    } else {
      setSelectedSearchUserIds(assignableIds);
    }
  };

  const handleBulkAssignToCohort = async (ids = selectedSearchUserIds) => {
    if (ids.length === 0) return;
    setAssignLoading(true);
    setAddError('');
    try {
      const res = await api.post('/admin/assign-user-group', { userIds: ids });
      if (res.data.success) {
        setStatusAlert(`Successfully added ${ids.length} registered student(s) to your cohort!`);
        setShowAddModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedSearchUserIds([]);
        await loadOverview();
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error adding students to cohort');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddUserToBatch = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const res = await api.post('/admin/add-user', {
        name: addName,
        email: addEmail,
        leetcodeUsername: addHandle,
        password: addPass
      });
      if (res.data.success) {
        setStatusAlert(`Successfully added ${addName} to your assigned batch!`);
        setAddName('');
        setAddEmail('');
        setAddHandle('');
        setAddError('');
        setShowAddModal(false);
        await loadOverview();
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error adding student to batch');
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(i => i !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleFlagInactive = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await api.post('/admin/flag-inactive', {
        userIds: selectedUserIds,
        customMessage: notifyMsg
      });
      if (res.data.success) {
        setStatusAlert(`Successfully sent activity warning to ${selectedUserIds.length} user(s).`);
        setSelectedUserIds([]);
        setNotifyMsg('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = data.users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.leetcodeUsername && u.leetcodeUsername.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Dual Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Cohort Admin Hub</h1>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Level 2 Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">Track your personal stats AND manage your assigned cohort</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('management')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'management'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Cohort Management Tab
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'personal'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            My Personal Stats Tab
          </button>
        </div>
      </div>

      {/* Render Personal Tab */}
      {activeTab === 'personal' && <UserDashboard />}

      {/* Render Cohort Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Add Student to Batch
            </button>

            <button
              onClick={handleExportGroupCSV}
              disabled={exportingCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Download className={`w-4 h-4 text-indigo-400 ${exportingCsv ? 'animate-bounce' : ''}`} />
              <span>{exportingCsv ? 'Exporting...' : 'Export Cohort CSV'}</span>
            </button>
          </div>

          {statusAlert && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {statusAlert}
            </div>
          )}

          {/* Cohort Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Assigned Cohort Users</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{data.users.length} Users</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Inactive Risk (&gt;3 Days)</p>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1">
                {data.users.filter(u => u.isInactive).length} Users
              </h3>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Active Groups</p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{data.groups.length} Cohorts</h3>
            </div>
          </div>

          {/* Batch Inactive Notifier Bar */}
          {selectedUserIds.length > 0 && (
            <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span><strong>{selectedUserIds.length}</strong> user(s) selected for activity notification</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={notifyMsg}
                  onChange={(e) => setNotifyMsg(e.target.value)}
                  placeholder="Custom notification message..."
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none w-64"
                />
                <button
                  onClick={handleFlagInactive}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md"
                >
                  Send Streak Risk Warning
                </button>
              </div>
            </div>
          )}

          {/* Search & Users Table */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user name or handle..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">Showing {filteredUsers.length} members</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Select</th>
                    <th className="py-3 px-3">User & Handle</th>
                    <th className="py-3 px-3">Group</th>
                    <th className="py-3 px-3">Total Solved</th>
                    <th className="py-3 px-3">Streak</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredUsers.map((u) => {
                    const s = u.stats || {};
                    const isSelected = selectedUserIds.includes(u._id);
                    return (
                      <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectUser(u._id)}
                            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={u} className="w-8 h-8 rounded-lg text-xs" />
                            <div>
                              <p className="font-bold text-white">{u.name}</p>
                              <p className="text-[11px] text-indigo-400">@{u.leetcodeUsername || 'unlinked'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium">
                          {u.groupId?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-white">{s.totalSolved || 0}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            E:{s.easySolved || 0} M:{s.mediumSolved || 0} H:{s.hardSolved || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-amber-400">
                          🔥 {s.currentStreak || 0} days
                        </td>
                        <td className="py-3 px-3">
                          {u.isInactive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Inactive ({u.daysSinceActive}d)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setInspectingUser(u)}
                              className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                              title="View Progress Calendar"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserIds([u._id]);
                                setNotifyMsg('Your streak is at risk! Submit a problem today.');
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="Notify User"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Progress Calendar Inspection Modal */}
      {inspectingUser && (
        <UserCalendarModal
          user={inspectingUser}
          onClose={() => setInspectingUser(null)}
        />
      )}


      {/* Modal: Add Student to Batch */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add Student to Cohort</h3>
            <p className="text-xs text-slate-400 mb-4">Search registered users or create a new student account</p>

            {/* Modal Mode Selector */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => { setModalMode('search'); setAddError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  modalMode === 'search'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Search Registered Users
              </button>
              <button
                type="button"
                onClick={() => { setModalMode('create'); setAddError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  modalMode === 'create'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create New Account
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
                {addError}
              </div>
            )}

            {/* Mode 1: Search Existing Registered Members */}
            {modalMode === 'search' && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    placeholder="Search by name, email, or LeetCode handle..."
                  />
                </div>

                {!searchLoading && searchResults.length > 0 && (
                  <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold hover:text-white">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllSearchUsers}
                        checked={
                          searchResults.filter(u => !data.users.some(existing => existing._id === u._id)).length > 0 &&
                          searchResults
                            .filter(u => !data.users.some(existing => existing._id === u._id))
                            .every(u => selectedSearchUserIds.includes(u._id))
                        }
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      Select All Matching ({searchResults.filter(u => !data.users.some(existing => existing._id === u._id)).length})
                    </label>

                    {selectedSearchUserIds.length > 0 && (
                      <span className="text-indigo-400 font-bold text-[11px]">
                        {selectedSearchUserIds.length} Selected
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchLoading && (
                    <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                      Searching registered users...
                    </div>
                  )}

                  {!searchLoading && searchQuery.trim() !== '' && searchResults.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                      No registered users found matching "{searchQuery}".
                    </div>
                  )}

                  {!searchLoading && searchQuery.trim() === '' && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Type name, email, or handle above to search active registered platform users.
                    </div>
                  )}

                  {searchResults.map((u) => {
                    const isAlreadyInCohort = data.users.some(existing => existing._id === u._id);
                    const isChecked = selectedSearchUserIds.includes(u._id);

                    return (
                      <div
                        key={u._id}
                        onClick={() => !isAlreadyInCohort && toggleSearchUserSelect(u._id)}
                        className={`p-3 rounded-2xl bg-slate-900/90 border transition-all flex items-center justify-between gap-3 ${
                          isAlreadyInCohort ? 'border-slate-800/60 opacity-70' :
                          isChecked ? 'border-indigo-500/80 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isAlreadyInCohort && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSearchUserSelect(u._id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                          <UserAvatar name={u.name} avatar={u.avatar} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{u.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">@{u.leetcodeUsername || 'unlinked'}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isAlreadyInCohort ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              In Cohort
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={assignLoading}
                              onClick={() => handleBulkAssignToCohort([u._id])}
                              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] transition-all active:scale-95 disabled:opacity-50"
                            >
                              Add Single
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={assignLoading || selectedSearchUserIds.length === 0}
                    onClick={() => handleBulkAssignToCohort(selectedSearchUserIds)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    {assignLoading 
                      ? 'Adding...' 
                      : selectedSearchUserIds.length > 0 
                      ? `Add Selected (${selectedSearchUserIds.length}) Members` 
                      : 'Add Selected Members'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Create New Student Account */}
            {modalMode === 'create' && (
              <form onSubmit={handleAddUserToBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="student@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Handle (Optional)</label>
                  <input
                    type="text"
                    value={addHandle}
                    onChange={(e) => setAddHandle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. john_leetcode"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={addPass}
                    onChange={(e) => setAddPass(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {addLoading ? 'Adding...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
