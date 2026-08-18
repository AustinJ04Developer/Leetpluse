import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, CheckCircle2, AlertTriangle, Trophy, Flag, ShieldAlert } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'badge_earned':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'challenge':
        return <Flag className="w-5 h-5 text-indigo-400" />;
      case 'inactive_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Notifications & Alerts</h1>
          <p className="text-xs text-slate-400">In-app notifications, streak warnings, and announcements</p>
        </div>

        <button
          onClick={handleMarkAll}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          Mark All as Read
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800">
        <div className="divide-y divide-slate-800/80">
          {notifications.map((n) => (
            <div key={n._id} className="py-4 flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{n.title}</h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
