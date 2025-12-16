'use client';

import { cn } from '@/lib/utils';
import { Flame, Palette, PenTool } from 'lucide-react';
import type { User } from '@/lib/types/auth';

type Role = 'creator' | 'reviewer';

interface SpaceHeaderProps {
  user: User | null;
  role: Role;
  onRoleChange: (role: Role) => void;
  streak?: number;
}

export function SpaceHeader({ user, role, onRoleChange, streak }: SpaceHeaderProps) {
  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'Creative';
  const initials = getInitials(user?.full_name, user?.email);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-white/5 transition-all duration-300">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* User greeting */}
          <div className="flex items-center gap-3 md:gap-4 group cursor-default">
            <UserAvatar
              avatarUrl={user?.avatar_url}
              name={user?.full_name}
              initials={initials}
            />
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">{greeting},</p>
              <h1 className="text-lg md:text-xl font-semibold text-foreground transition-transform duration-200 group-hover:translate-x-0.5">
                {firstName}
              </h1>
            </div>
          </div>

          {/* Role switcher - creative design */}
          <RoleSwitcher role={role} onRoleChange={onRoleChange} />

          {/* Streak indicator */}
          {streak && streak > 0 && <StreakBadge streak={streak} />}
        </div>
      </div>
    </header>
  );
}

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  initials: string;
}

function UserAvatar({ avatarUrl, name, initials }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className="w-11 h-11 md:w-12 md:h-12 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg transition-all duration-300 group-hover:ring-4 group-hover:ring-cyan-400/40 group-hover:shadow-xl group-hover:shadow-cyan-500/20 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg ring-2 ring-white/30 transition-all duration-300 group-hover:ring-4 group-hover:ring-cyan-400/40 group-hover:shadow-xl group-hover:shadow-cyan-500/20 group-hover:scale-105">
      {initials}
    </div>
  );
}

interface RoleSwitcherProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="relative flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <button
        onClick={() => onRoleChange('creator')}
        className={cn(
          'group/btn relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
          role === 'creator'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10'
        )}
      >
        <Palette className={cn(
          "w-4 h-4 transition-transform duration-300",
          role !== 'creator' && 'group-hover/btn:rotate-12 group-hover/btn:scale-110'
        )} />
        <span className="hidden md:inline">My Studio</span>
      </button>
      <button
        onClick={() => onRoleChange('reviewer')}
        className={cn(
          'group/btn relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
          role === 'reviewer'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10'
        )}
      >
        <PenTool className={cn(
          "w-4 h-4 transition-transform duration-300",
          role !== 'reviewer' && 'group-hover/btn:-rotate-12 group-hover/btn:scale-110'
        )} />
        <span className="hidden md:inline">Review Desk</span>
      </button>
    </div>
  );
}

interface StreakBadgeProps {
  streak: number;
}

function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 hover:scale-105 cursor-default group">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform duration-300 group-hover:scale-110">
        <Flame className="w-4 h-4 text-white animate-[flicker_1s_ease-in-out_infinite]" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground leading-none transition-colors duration-200 group-hover:text-orange-600/70">Streak</p>
        <p className="text-sm font-bold text-orange-600 dark:text-orange-400 transition-transform duration-200 group-hover:translate-x-0.5">
          {streak} days
        </p>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() || '?';
}

export default SpaceHeader;
