import React from 'react';
import { Building2, Layers } from 'lucide-react';

const RepresentativeScopeSwitcher = ({ scopeType, onScopeChange, hasBatch = true }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
      <button
        onClick={() => onScopeChange('section')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
          scopeType === 'section'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Department & Class Section Scope"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span>My Class Section</span>
      </button>

      {hasBatch && (
        <button
          onClick={() => onScopeChange('batch')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            scopeType === 'batch'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Multi-Department Cohort Batch Scope"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My Cohort Batch</span>
        </button>
      )}
    </div>
  );
};

export default RepresentativeScopeSwitcher;
