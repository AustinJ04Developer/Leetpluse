import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers, Plus, BookOpen, Calendar, Users, Edit3, Trash2, Check, X, Building, AlertTriangle } from 'lucide-react';

const AcademicHierarchyManager = () => {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);

  // Creation Form states
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newYear, setNewYear] = useState({ yearLabel: '', startDate: '', endDate: '' });
  const [newBatch, setNewBatch] = useState({ name: '', departmentId: '', academicYearId: '', targetDailySolved: 2 });
  const [newSec, setNewSec] = useState({ name: '', batchId: '' });

  // Edit states
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: '', code: '' });

  const [editingYearId, setEditingYearId] = useState(null);
  const [editYearForm, setEditYearForm] = useState({ yearLabel: '' });

  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({ name: '', targetDailySolved: 2 });

  const [editingSecId, setEditingSecId] = useState(null);
  const [editSecForm, setEditSecForm] = useState({ name: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, yRes, bRes, sRes] = await Promise.all([
        api.get('/institutions/departments/list'),
        api.get('/institutions/academic-years/list'),
        api.get('/institutions/batches/list'),
        api.get('/institutions/sections/list')
      ]);

      if (dRes.data.success) setDepartments(dRes.data.data);
      if (yRes.data.success) setAcademicYears(yRes.data.data);
      if (bRes.data.success) setBatches(bRes.data.data);
      if (sRes.data.success) setSections(sRes.data.data);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DEPARTMENT HANDLERS ---
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;
    try {
      await api.post('/institutions/departments/create', newDept);
      setNewDept({ name: '', code: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating department');
    }
  };

  const handleUpdateDepartment = async (id) => {
    try {
      await api.put(`/institutions/departments/${id}`, editDeptForm);
      setEditingDeptId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating department');
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      await api.delete(`/institutions/departments/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting department');
    }
  };

  // --- ACADEMIC YEAR HANDLERS ---
  const handleCreateAcademicYear = async (e) => {
    e.preventDefault();
    if (!newYear.yearLabel) return;
    try {
      await api.post('/institutions/academic-years/create', newYear);
      setNewYear({ yearLabel: '', startDate: '', endDate: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating academic year');
    }
  };

  const handleUpdateAcademicYear = async (id) => {
    try {
      await api.put(`/institutions/academic-years/${id}`, editYearForm);
      setEditingYearId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating academic year');
    }
  };

  const handleDeleteAcademicYear = async (id, yearLabel) => {
    if (!window.confirm(`Are you sure you want to delete academic year "${yearLabel}"?`)) return;
    try {
      await api.delete(`/institutions/academic-years/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting academic year');
    }
  };

  // --- BATCH HANDLERS ---
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.departmentId || !newBatch.academicYearId) return;
    try {
      await api.post('/institutions/batches/create', newBatch);
      setNewBatch({ name: '', departmentId: '', academicYearId: '', targetDailySolved: 2 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating batch');
    }
  };

  const handleUpdateBatch = async (id) => {
    try {
      await api.put(`/institutions/batches/${id}`, editBatchForm);
      setEditingBatchId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating batch');
    }
  };

  const handleDeleteBatch = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete batch "${name}"?`)) return;
    try {
      await api.delete(`/institutions/batches/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting batch');
    }
  };

  // --- SECTION HANDLERS ---
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSec.name || !newSec.batchId) return;
    try {
      await api.post('/institutions/sections/create', newSec);
      setNewSec({ name: '', batchId: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating section');
    }
  };

  const handleUpdateSection = async (id) => {
    try {
      await api.put(`/institutions/sections/${id}`, editSecForm);
      setEditingSecId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating section');
    }
  };

  const handleDeleteSection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete section "${name}"?`)) return;
    try {
      await api.delete(`/institutions/sections/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting section');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Academic Hierarchy...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Academic Hierarchy Manager</span>
          </h1>
          <p className="text-sm text-slate-400">Create, edit, and manage Departments, Academic Years, Batches, and Sections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'departments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('academicYears')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'academicYears' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Academic Years ({academicYears.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'batches' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'sections' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sections ({sections.length})
        </button>
      </div>

      {/* Department Tab */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateDepartment} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add Department</span>
            </h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Department Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Information Technology"
                value={newDept.name}
                onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Department Code</label>
              <input
                type="text"
                required
                placeholder="e.g. IT"
                value={newDept.code}
                onChange={e => setNewDept({ ...newDept, code: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
              Create Department
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {departments.map(d => (
              <div key={d._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                {editingDeptId === d._id ? (
                  <div className="flex-1 flex items-center gap-3 mr-4">
                    <input
                      type="text"
                      value={editDeptForm.name}
                      onChange={e => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editDeptForm.code}
                      onChange={e => setEditDeptForm({ ...editDeptForm, code: e.target.value })}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                    />
                    <button onClick={() => handleUpdateDepartment(d._id)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingDeptId(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-white text-sm">{d.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Code: {d.code}</p>
                  </div>
                )}

                {editingDeptId !== d._id && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono border border-indigo-500/20 mr-2">
                      Active
                    </span>
                    <button
                      onClick={() => {
                        setEditingDeptId(d._id);
                        setEditDeptForm({ name: d.name, code: d.code });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(d._id, d.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic Years Tab */}
      {activeTab === 'academicYears' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateAcademicYear} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add Academic Year</span>
            </h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Year Label</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026-2027"
                value={newYear.yearLabel}
                onChange={e => setNewYear({ ...newYear, yearLabel: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
              Create Academic Year
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {academicYears.map(y => (
              <div key={y._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                {editingYearId === y._id ? (
                  <div className="flex-1 flex items-center gap-3 mr-4">
                    <input
                      type="text"
                      value={editYearForm.yearLabel}
                      onChange={e => setEditYearForm({ yearLabel: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button onClick={() => handleUpdateAcademicYear(y._id)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingYearId(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-white text-sm">{y.yearLabel}</h3>
                    {y.isCurrent && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CURRENT SESSION</span>}
                  </div>
                )}

                {editingYearId !== y._id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingYearId(y._id);
                        setEditYearForm({ yearLabel: y.yearLabel });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Academic Year"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAcademicYear(y._id, y.yearLabel)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Academic Year"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateBatch} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add Batch</span>
            </h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Batch Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Batch 2026-A"
                value={newBatch.name}
                onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Department</label>
              <select
                required
                value={newBatch.departmentId}
                onChange={e => setNewBatch({ ...newBatch, departmentId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Academic Year</label>
              <select
                required
                value={newBatch.academicYearId}
                onChange={e => setNewBatch({ ...newBatch, academicYearId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.yearLabel}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
              Create Batch
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {batches.map(b => (
              <div key={b._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                {editingBatchId === b._id ? (
                  <div className="flex-1 flex items-center gap-3 mr-4">
                    <input
                      type="text"
                      value={editBatchForm.name}
                      onChange={e => setEditBatchForm({ ...editBatchForm, name: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button onClick={() => handleUpdateBatch(b._id)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingBatchId(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-white text-sm">{b.name}</h3>
                    <p className="text-xs text-slate-400">Department: {b.departmentId?.name || 'N/A'}</p>
                  </div>
                )}

                {editingBatchId !== b._id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400 font-medium mr-2">Daily Target: {b.targetDailySolved} Solved</span>
                    <button
                      onClick={() => {
                        setEditingBatchId(b._id);
                        setEditBatchForm({ name: b.name, targetDailySolved: b.targetDailySolved });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Batch"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(b._id, b.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateSection} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add Section</span>
            </h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Section Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Section A"
                value={newSec.name}
                onChange={e => setNewSec({ ...newSec, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Parent Batch</label>
              <select
                required
                value={newSec.batchId}
                onChange={e => setNewSec({ ...newSec, batchId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
              Create Section
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {sections.map(s => (
              <div key={s._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                {editingSecId === s._id ? (
                  <div className="flex-1 flex items-center gap-3 mr-4">
                    <input
                      type="text"
                      value={editSecForm.name}
                      onChange={e => setEditSecForm({ name: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button onClick={() => handleUpdateSection(s._id)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingSecId(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-white text-sm">{s.name}</h3>
                    <p className="text-xs text-slate-400">Batch: {s.batchId?.name || 'N/A'}</p>
                  </div>
                )}

                {editingSecId !== s._id && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs mr-2">Section</span>
                    <button
                      onClick={() => {
                        setEditingSecId(s._id);
                        setEditSecForm({ name: s.name });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Section"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(s._id, s.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicHierarchyManager;
