import React, { useState } from 'react';
import api from '../../services/api';
import { Terminal, Database } from 'lucide-react';

const DbConsolePage = () => {
  const [collection, setCollection] = useState('users');
  const [queryResult, setQueryResult] = useState(null);

  const handleQuery = async () => {
    try {
      const res = await api.post('/devadmin/db-console', { collection });
      if (res.data.success) {
        setQueryResult(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Safe DB Read Console</h1>
        <p className="text-xs text-slate-400">Permissioned read-only inspection of MongoDB collections</p>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-300">Select Collection:</label>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none font-mono"
          >
            <option value="users">users</option>
            <option value="leetcodeStats">leetcodeStats</option>
            <option value="auditLogs">auditLogs</option>
            <option value="systemLogs">systemLogs</option>
            <option value="featureFlags">featureFlags</option>
          </select>

          <button
            onClick={handleQuery}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
          >
            Run Select Query
          </button>
        </div>

        {queryResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Collection: <strong className="text-indigo-400 font-mono">{queryResult.collection}</strong></span>
              <span>Documents Returned: <strong className="text-white font-mono">{queryResult.count}</strong></span>
            </div>
            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-auto max-h-[450px]">
              {JSON.stringify(queryResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DbConsolePage;
