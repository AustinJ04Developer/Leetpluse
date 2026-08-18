import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Radio } from 'lucide-react';
import api from '../services/api';

const SyncStatusBadge = ({ user, onSynced }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/leetcode/sync-now', { userId: user.id });
      if (res.data.success && onSynced) {
        onSynced(res.data.stats);
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const isSyncing = syncing || user?.syncStatus === 'syncing';
  const isError = user?.syncStatus === 'error';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
        {isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span className="text-indigo-400 font-medium">Syncing LeetCode...</span>
          </>
        ) : isError ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-400 font-medium">Sync Warning</span>
          </>
        ) : (
          <>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Live • Auto 5m</span>
          </>
        )}
      </div>

      <button
        onClick={handleSyncNow}
        disabled={isSyncing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        Sync Now
      </button>
    </div>
  );
};

export default SyncStatusBadge;
