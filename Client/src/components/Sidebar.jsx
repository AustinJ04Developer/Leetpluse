import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Trophy, 
  Target, 
  Users, 
  Building2, 
  Terminal, 
  Sliders, 
  Activity, 
  FileText, 
  Flag,
  Settings,
  Bell,
  Calendar,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;
  const roleLevel = user.roleLevel || 1;

  const userNav = [
    { name: 'My Analytics', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leaderboards', path: '/leaderboard', icon: Trophy },
    { name: 'Goals & Targets', path: '/goals', icon: Target },
    { name: 'Notifications', path: '/notifications', icon: Bell }
  ];

  const adminNav = [
    { name: 'Cohort Management', path: '/admin/overview', icon: Users },
    { name: 'Daily Progress', path: '/user-progress', icon: Calendar },
    { name: 'Group Challenges', path: '/admin/challenges', icon: Flag },
    { name: 'Group Reports', path: '/admin/reports', icon: FileText }
  ];

  const superAdminNav = [
    { name: 'Org Analytics', path: '/superadmin/analytics', icon: Building2 },
    { name: 'Admin Manager', path: '/superadmin/admins', icon: Users },
    { name: 'Daily Progress', path: '/user-progress', icon: Calendar },
    { name: 'Branding & Billing', path: '/superadmin/branding', icon: Sliders },
    { name: 'Global Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Notifications', path: '/notifications', icon: Bell }
  ];

  const devAdminNav = [
    { name: 'System Health', path: '/devadmin/health', icon: Activity },
    { name: 'Feature Flags', path: '/devadmin/feature-flags', icon: Sliders },
    { name: 'System Logs', path: '/devadmin/logs', icon: FileText },
    { name: 'DB Read Console', path: '/devadmin/db-console', icon: Terminal },
    { name: 'User Impersonation', path: '/devadmin/impersonate', icon: Users }
  ];

  const renderNavSection = (title, items) => (
    <div className="mb-6">
      <h3 className="text-[11px] font-bold uppercase tracking-wider px-3 mb-2 text-slate-500">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-64 bg-[#0b0f19] border-r border-slate-800/80 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between select-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between md:hidden mb-4 pb-2 border-b border-slate-800">
            <span className="font-extrabold text-sm text-white">Menu Navigation</span>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SuperAdmin is management-only */}
          {role === 'superadmin' ? (
            renderNavSection('Executive Management (L3)', superAdminNav)
          ) : (
            renderNavSection('Personal Workspace', userNav)
          )}
          
          {roleLevel === 2 && renderNavSection('Admin Tools (L2)', adminNav)}
          {roleLevel === 4 && renderNavSection('DevAdmin Console (L4)', devAdminNav)}
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <NavLink
            to="/settings"
            onClick={() => {
              if (onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
