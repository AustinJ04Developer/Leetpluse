import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck, User, LogOut, ChevronDown, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SyncStatusBadge from './SyncStatusBadge';
import api from '../services/api';

import UserAvatar from './UserAvatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'devadmin':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">DevAdmin L4</span>;
      case 'superadmin':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">SuperAdmin L3</span>;
      case 'admin':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Admin L2</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">User L1</span>;
    }
  };

  return (
    <nav className="h-16 bg-[#0b0f19]/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">LEETPULSE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">LeetCode Monitoring & Analytics Platform</p>
          </div>
        </Link>
      </div>

      {/* Center - Live Sync Badge (Not shown for SuperAdmin as they are management-only) */}
      {user && user.role !== 'superadmin' && <SyncStatusBadge user={user} />}

      {/* Right User Control */}
      {user && (
        <div className="flex items-center gap-4">
          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-800"
            >
              <UserAvatar user={user} className="w-9 h-9 rounded-lg text-xs" />
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-200">{user.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl py-2 z-50 border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-indigo-600/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    Profile Settings
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-indigo-600/10 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Security & Sessions
                  </Link>
                </div>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
