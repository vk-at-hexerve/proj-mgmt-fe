'use client';

import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

export interface UserAvatarProps {
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
    avatarUrl?: string;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// A beautiful, modern, visually balanced pastel palette (accessible, high-contrast, beautiful light & dark mode)
const AVATAR_COLORS = [
  { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/30' },
  { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/30' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/30' },
  { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/30' },
  { bg: 'bg-pink-100 dark:bg-pink-950/60', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800/30' },
  { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/30' },
  { bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/30' },
  { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/30' },
  { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/30' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800/30' },
];

export function getDeterministicColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_MAP = {
  xs: {
    container: 'size-5',
    text: 'text-[9px] font-bold tracking-wider',
  },
  sm: {
    container: 'size-6',
    text: 'text-[10px] font-bold tracking-wider',
  },
  md: {
    container: 'size-8',
    text: 'text-xs font-bold tracking-wider',
  },
  lg: {
    container: 'size-10',
    text: 'text-sm font-bold tracking-wide',
  },
  xl: {
    container: 'size-14',
    text: 'text-lg font-bold tracking-wide',
  },
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const name = user?.name || 'Unassigned';
  const identifier = user?.id || user?.name || '?';
  const initials = getInitials(user?.name);
  const colorScheme = getDeterministicColor(identifier);
  const sizeConfig = SIZE_MAP[size];

  // Robustly determine if the user has an uploaded image avatar vs a generic /placeholder.svg
  const avatarUrl = user?.avatar || user?.avatarUrl;
  const hasImage = avatarUrl && avatarUrl !== '/placeholder.svg' && !avatarUrl.includes('placeholder') && avatarUrl !== '';

  return (
    <AvatarPrimitive.Root
      data-slot="user-avatar"
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border transition-all align-middle select-none',
        sizeConfig.container,
        hasImage ? 'border-border' : cn(colorScheme.border, colorScheme.bg),
        className
      )}
      title={name}
      aria-label={`Avatar of ${name}`}
    >
      {hasImage ? (
        <AvatarPrimitive.Image
          src={avatarUrl}
          alt={name}
          className="aspect-square size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={hasImage ? 600 : 0}
        className={cn(
          'flex size-full items-center justify-center rounded-full font-semibold',
          sizeConfig.text,
          hasImage ? 'bg-muted text-muted-foreground' : colorScheme.text
        )}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
