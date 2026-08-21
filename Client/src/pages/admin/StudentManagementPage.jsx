import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, Search, RefreshCw, Filter, CheckCircle, AlertTriangle, ExternalLink, Edit3, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentManagementPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [secFilter, setSecFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    registerNumber: '',
    studentId: '',
    departmentId: '',
    batchId: '',
    sectionId: '',
    leetcodeUsername: '',
    role: 'student'
  });

  const isHigherRole = user?.roleLevel >= 3;

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
      console.error('Failed to fetch filters:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/students?search=${encodeURIComponent(search)}`;
      if (deptFilter) url += `&departmentId=${deptFilter}`;
      if (batchFilter) url += `&batchId=${batchFilter}`;
      if (secFilter) url += `&sectionId=${secFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, deptFilter, batchFilter, secFilter]);

  const handleSyncStudent = async (studentId) => {
    setSyncingId(studentId);
    try {
      const res = await api.post(`/students/${studentId}/sync`);
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      registerNumber: student.registerNumber || '',
      studentId: student.studentId || '',
      departmentId: student.departmentId?._id || student.departmentId || '',
      batchId: student.batchId?._id || student.batchId || '',
      sectionId: student.sectionId?._id || student.sectionId || '',
      academicBatch: student.academicBatch || '',
      academicStatus: student.academicStatus || 'Pursuing',
      cohortCustom: student.academicCohorts ? student.academicCohorts.join(', ') : '',
      yearLevel: student.yearLevel || 1,
      semester: student.semester || 1,
      leetcodeUsername: student.leetcodeUsername || '',
      role: student.role || 'student'
    });
  };

  const handleUpdateStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await api.put(`/students/${editingStudent._id}`, editForm);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating student');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently delete student account "${studentName}"?`)) return;
    try {
      await api.delete(`/students/${studentId}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting student');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Institutional Student Roster</span>
          </h1>
          <p className="text-sm text-slate-400">Manage students, edit profiles, assign roles, and sync statistics</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by student name, register number, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select
            value={secFilter}
            onChange={e => setSecFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Sections</option>
            {sections.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No students match current search/filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="p-4">Reg #</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Department & Batch</th>
                  <th className="p-4">LeetCode Handle</th>
                  <th className="p-4">Total Solved</th>
                  <th className="p-4">Streak</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map(s => {
                  const hasStats = s.stats && s.stats.totalSolved > 0;
                  return (
                    <tr key={s._id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-4 font-mono text-xs text-indigo-400 font-semibold">{s.registerNumber || 'N/A'}</td>
                      <td className="p-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.role === 'student_rep' && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">Class Rep</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="p-4 text-xs">
                        {s.institutionId?.name && (
                          <div className="text-[11px] text-indigo-400 font-medium truncate max-w-[160px]" title={s.institutionId.name}>
                            🏛️ {s.institutionId.name}
                          </div>
                        )}
                        <span className="font-semibold text-slate-200">{s.departmentId?.code || 'N/A'}</span>
                        <span className="text-slate-400"> • {s.batchId?.name || 'N/A'} ({s.sectionId?.name || 'Gen'})</span>
                      </td>
                      <td className="p-4">
                        {s.leetcodeUsername ? (
                          <a
                            href={`https://leetcode.com/u/${s.leetcodeUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline font-mono"
                          >
                            <span>@{s.leetcodeUsername}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-rose-400 italic">Not Linked</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-white">
                        {hasStats ? s.stats.totalSolved : 0}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${s.stats?.currentStreak > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          ⚡ {s.stats?.currentStreak || 0} Days
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.leetcodeUsername && (
                            <button
                              onClick={() => handleSyncStudent(s._id)}
                              disabled={syncingId === s._id}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center gap-1 transition-all"
                              title="Sync LeetCode Stats"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s._id ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline">{syncingId === s._id ? 'Syncing...' : 'Sync'}</span>
                            </button>
                          )}

                          {isHigherRole && (
                            <>
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit Student Profile & Role"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s._id, s.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Student Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1422] rounded-3xl p-6 border border-slate-800 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Student Profile</h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Register Number</label>
                  <input
                    type="text"
                    value={editForm.registerNumber}
                    onChange={e => setEditForm({ ...editForm, registerNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode Username</label>
                  <input
                    type="text"
                    value={editForm.leetcodeUsername}
                    onChange={e => setEditForm({ ...editForm, leetcodeUsername: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="student">Student (Level 1)</option>
                    <option value="student_rep">Student Representative / CR (Level 2)</option>
                    {(user?.roleLevel >= 4) && (
                      <option value="faculty">Faculty Mentor (Level 3)</option>
                    )}
                    {(user?.roleLevel >= 5) && (
                      <option value="hod">Department HOD (Level 4)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Status</label>
                  <select
                    value={editForm.academicStatus || 'Pursuing'}
                    onChange={e => setEditForm({ ...editForm, academicStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Pursuing">Pursuing</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Batch (4-Year Range)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2023 - 2027"
                    value={editForm.academicBatch || ''}
                    onChange={e => setEditForm({ ...editForm, academicBatch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Cohort (Special Teams / Groups)</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elite Training Batch, MPM Batch (Optional)"
                  value={editForm.cohortCustom || ''}
                  onChange={e => setEditForm({ ...editForm, cohortCustom: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year Level</label>
                  <select
                    value={editForm.yearLevel || 1}
                    onChange={e => {
                      const yr = Number(e.target.value);
                      const minSem = (yr * 2) - 1;
                      const maxSem = yr * 2;
                      const curSem = Number(editForm.semester || 1);
                      const nextSem = (curSem < minSem || curSem > maxSem) ? minSem : curSem;
                      setEditForm({ ...editForm, yearLevel: yr, semester: nextSem });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">1st Year (First Year)</option>
                    <option value="2">2nd Year (Second Year)</option>
                    <option value="3">3rd Year (Pre-Final Year)</option>
                    <option value="4">4th Year (Final Year)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Semester (Mapped)</label>
                  <select
                    value={editForm.semester || 1}
                    onChange={e => {
                      const sem = Number(e.target.value);
                      setEditForm({ ...editForm, semester: sem, yearLevel: Math.ceil(sem / 2) });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {[((Number(editForm.yearLevel || 1)) * 2) - 1, Number(editForm.yearLevel || 1) * 2].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={editForm.departmentId}
                    onChange={e => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Dept</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Placement Batch</label>
                  <select
                    value={editForm.batchId}
                    onChange={e => setEditForm({ ...editForm, batchId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                  <select
                    value={editForm.sectionId}
                    onChange={e => setEditForm({ ...editForm, sectionId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No Section</option>
                    {sections.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                >
                  Save Student Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementPage;
