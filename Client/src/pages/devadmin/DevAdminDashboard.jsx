import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UserDashboard from '../user/UserDashboard';
import StatCard from '../../components/StatCard';
import { Activity, Sliders, FileText, Terminal, Users, Cpu, Database, UserCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const DevAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('management'); // 'personal' or 'management'
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/devadmin/system-health').then(res => {
      if (res.data.success) {
        setHealth(res.data.health);
      }
    }).catch(err => console.error(err));
  }, []);

  const h = health || {};

  return (
    <div className="space-y-6">
      {/* Header & Dual Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">DevAdmin Core Console</h1>
            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Level 4 Max Privilege
            </span>
          </div>
          <p className="text-xs text-slate-400">Track your personal stats AND command full system infra & diagnostics</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('management')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'management'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            System Management Tab
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'personal'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
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

      {/* Render System Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Server Status"
              value={h.status || 'ONLINE'}
              subtitle={`Uptime: ${Math.floor((h.uptimeSeconds || 0) / 60)} mins`}
              icon={Activity}
              color="emerald"
              badgeText="Node.js Engine Active"
            />

            <StatCard
              title="Database State"
              value={h.dbState || 'Connected'}
              subtitle="MongoDB Mongoose Connection"
              icon={Database}
              color="indigo"
              badgeText="Memory Server / Primary DB"
            />

            <StatCard
              title="Memory Consumption"
              value={`${h.memoryUsageMb || 45} MB`}
              subtitle="Heap Used"
              icon={Cpu}
              color="amber"
              badgeText="Optimal memory footprint"
            />

            <StatCard
              title="System Logs Logged"
              value={h.totalLogs || 0}
              subtitle={`Errors: ${h.errorLogs || 0}`}
              icon={FileText}
              color="purple"
              badgeText="Structured Logging"
            />
          </div>

          {/* DevAdmin Module Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/devadmin/health" className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 space-y-2 group">
              <Activity className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-base">System Health & Telemetry</h3>
              <p className="text-xs text-slate-400">View real-time server health, memory footprint, and background 5-min sync queue metrics.</p>
            </Link>

            <Link to="/devadmin/feature-flags" className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 space-y-2 group">
              <Sliders className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-base">Feature Flags Matrix</h3>
              <p className="text-xs text-slate-400">Toggle live feature flags across user roles dynamically without code redeployment.</p>
            </Link>

            <Link to="/devadmin/logs" className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 space-y-2 group">
              <FileText className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-base">Logs & Audit Viewer</h3>
              <p className="text-xs text-slate-400">Filter system events (INFO, WARN, ERROR) and inspect security audit trail.</p>
            </Link>

            <Link to="/devadmin/db-console" className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 space-y-2 group">
              <Terminal className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-base">Safe DB Read Console</h3>
              <p className="text-xs text-slate-400">Perform permissioned read-only inspections on raw MongoDB document schemas.</p>
            </Link>

            <Link to="/devadmin/impersonate" className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 space-y-2 group">
              <Users className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white text-base">User Impersonation Tool</h3>
              <p className="text-xs text-slate-400">Assume any user identity for debugging while retaining an auditable trail.</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevAdminDashboard;
