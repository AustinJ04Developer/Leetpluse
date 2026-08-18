import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badgeText }) => {
  const colorStyles = {
    indigo: {
      border: 'border-indigo-500/20',
      bgIcon: 'bg-indigo-500/10 text-indigo-400',
      glow: 'shadow-indigo-500/5'
    },
    emerald: {
      border: 'border-emerald-500/20',
      bgIcon: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      border: 'border-amber-500/20',
      bgIcon: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    rose: {
      border: 'border-rose-500/20',
      bgIcon: 'bg-rose-500/10 text-rose-400',
      glow: 'shadow-rose-500/5'
    },
    purple: {
      border: 'border-purple-500/20',
      bgIcon: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-purple-500/5'
    }
  };

  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-5 border ${style.border} relative overflow-hidden group shadow-lg ${style.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.bgIcon} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {badgeText && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{badgeText}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
