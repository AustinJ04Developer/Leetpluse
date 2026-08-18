import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, LogOut } from 'lucide-react';

const ImpersonationBar = () => {
  const { isImpersonating, user, realUser, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-sm flex items-center justify-between z-50">
      <div className="flex items-center gap-2 font-medium">
        <UserCheck className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>
          Currently impersonating: <strong>{user.name}</strong> ({user.email}) &bull; Role: <span className="uppercase text-xs tracking-wider bg-amber-500/20 px-2 py-0.5 rounded font-bold">{user.role}</span>
        </span>
        {realUser && (
          <span className="text-amber-400/70 text-xs font-normal">
            (Authenticated as: {realUser.name})
          </span>
        )}
      </div>
      <button
        onClick={stopImpersonating}
        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-1 rounded-md text-xs transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Exit Impersonation
      </button>
    </div>
  );
};

export default ImpersonationBar;
