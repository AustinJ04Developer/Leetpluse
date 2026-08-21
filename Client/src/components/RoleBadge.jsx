import React from 'react';
import { ShieldCheck, Building2, GraduationCap, UserCheck, Star, Code2 } from 'lucide-react';

const RoleBadge = ({ role, roleLevel, className = '' }) => {
  const level = roleLevel || (
    role === 'superadmin' || role === 'devadmin' ? 6 :
    role === 'institution_admin' ? 5 :
    role === 'hod' ? 4 :
    role === 'faculty' ? 3 :
    role === 'student_rep' ? 2 : 1
  );

  switch (level) {
    case 6:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold shadow-sm shadow-purple-500/20 ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Developer & Super Administrator</span>
        </span>
      );
    case 5:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold shadow-sm shadow-cyan-500/20 ${className}`}>
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Institutional Administrator</span>
        </span>
      );
    case 4:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm shadow-emerald-500/20 ${className}`}>
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Head of Department (HOD)</span>
        </span>
      );
    case 3:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-sm shadow-amber-500/20 ${className}`}>
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Faculty Mentor</span>
        </span>
      );
    case 2:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-600/30 text-amber-200 border border-amber-400/50 text-xs font-extrabold shadow-md shadow-amber-500/20 animate-pulse ${className}`}>
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Student Representative (CR)</span>
        </span>
      );
    case 1:
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-sky-600/30 to-slate-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold shadow-sm ${className}`}>
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Student Developer</span>
        </span>
      );
  }
};

export default RoleBadge;
