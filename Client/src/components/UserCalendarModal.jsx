import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import DailyProgressCalendar from './DailyProgressCalendar';

const UserCalendarModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto relative animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>{user.name || 'User Progress Calendar'}</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                  @{user.leetcodeUsername || 'unlinked'}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Oversight Inspection — Daily problem submission calendar & activity heatmap
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded DailyProgressCalendar for target userId */}
        <DailyProgressCalendar userId={user._id || user.id} />
      </div>
    </div>

  );
};

export default UserCalendarModal;
