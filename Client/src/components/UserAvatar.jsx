import React, { useState } from 'react';

/**
 * Reusable UserAvatar component.
 * Renders explicit avatar image if set by user.
 * If no avatar is set, renders a clean initials-based badge with a dynamic HSL gradient background,
 * eliminating auto-generated external placeholder images.
 */
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getGradientClass = (name = 'User') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-amber-600 to-orange-600',
    'from-purple-600 to-pink-600',
    'from-rose-600 to-red-600'
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const UserAvatar = ({ user, name, avatar, className = "w-9 h-9 rounded-xl text-xs" }) => {
  const [imgError, setImgError] = useState(false);

  const displayName = name || user?.name || 'User';
  const avatarUrl = avatar || user?.avatar;
  const initials = getInitials(displayName);
  const gradient = getGradientClass(displayName);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        onError={() => setImgError(true)}
        className={`${className} bg-slate-800 border border-slate-700 object-cover`}
      />
    );
  }

  return (
    <div className={`${className} bg-gradient-to-tr ${gradient} border border-white/10 flex items-center justify-center font-extrabold text-white tracking-wider shrink-0 shadow-sm select-none`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
