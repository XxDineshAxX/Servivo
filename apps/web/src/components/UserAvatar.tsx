import React from 'react';

/** Deterministic color palette for avatar backgrounds */
const PALETTE = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-600',
  'bg-green-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-sky-500',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-rose-600',
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLS: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

interface UserAvatarProps {
  name: string;
  photoURL?: string;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ name, photoURL, size = 'md', className = '' }: UserAvatarProps) {
  const sizeCls = SIZE_CLS[size];
  const colorCls = nameToColor(name);

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${sizeCls} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeCls} ${colorCls} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
