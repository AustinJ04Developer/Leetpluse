import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  Activity, 
  Menu,
  Settings,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  Terminal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SyncStatusBadge from './SyncStatusBadge';
import api from '../services/api';
import RoleBadge from './RoleBadge';
import UserAvatar from './UserAvatar';

const Navbar = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  // Outside click handler to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <nav className="h-16 bg-[#0b0f19]/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">LEETPULSE</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">Pro</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">LeetCode Monitoring Platform</p>
          </div>
        </Link>
      </div>

      {/* Center - Live Sync Status Badge */}
      {user && user.role !== 'superadmin' && (
        <div className="hidden sm:block">
          <SyncStatusBadge user={user} />
        </div>
      )}

      {/* Right User Control & Profile Options */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-800 transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md shadow-indigo-600/40">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Highlight Profile Icon & Options View */}
          <div 
            className="relative" 
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl transition-all duration-200 border ${
                dropdownOpen 
                  ? 'bg-slate-900 border-indigo-500/60 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
              title="Click to view profile options & settings"
            >
              <div className="relative">
                <UserAvatar user={user} className="w-9 h-9 rounded-xl text-xs font-bold" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </div>

              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white max-w-[110px] truncate">{user.name}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <RoleBadge role={user.role} roleLevel={user.roleLevel} />
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {/* Profile Highlight Options View Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0f1422] rounded-3xl shadow-2xl p-4 z-50 border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                {/* User Summary Header */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
                  <UserAvatar user={user} className="w-11 h-11 rounded-xl text-sm font-bold flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-extrabold text-white truncate">{user.name}</h4>
                    <p className="text-xs text-indigo-400 font-mono truncate">@{user.leetcodeUsername || 'unlinked'}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Profile Options List */}
                <div className="space-y-1">
                  {(user.roleLevel === 1 || user.roleLevel >= 6 || user.role === 'student' || user.role === 'user' || user.role === 'superadmin') && (
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-xl transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      <span>My Student Analytics</span>
                    </Link>
                  )}

                  {(user.roleLevel >= 4 || user.role === 'institution_admin') && (
                    <Link
                      to="/institution/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-xl transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      <span>Institution Dashboard</span>
                    </Link>
                  )}

                  {(user.roleLevel >= 6 || user.role === 'superadmin' || user.role === 'devadmin') && (
                    <Link
                      to="/devadmin/health"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-600/10 rounded-xl transition-all"
                    >
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <span>Developer & System Health</span>
                    </Link>
                  )}



                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Profile Settings & LeetCode</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Security & Account Settings</span>
                  </Link>

                  {user.leetcodeUsername && (
                    <a
                      href={`https://leetcode.com/u/${user.leetcodeUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-400" />
                      <span>View LeetCode Profile</span>
                    </a>
                  )}
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
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
