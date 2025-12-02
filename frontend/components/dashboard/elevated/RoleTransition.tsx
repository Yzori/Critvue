'use client';

/**
 * RoleTransition - Animated Role Switch
 *
 * When switching between Creator and Reviewer modes, the dashboard
 * transforms rather than just swapping content. This creates continuity
 * and makes the role switch feel intentional.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Palette, Briefcase, ArrowRight, Sparkles } from 'lucide-react';

type Role = 'creator' | 'reviewer';

// =============================================================================
// ROLE TOGGLE WITH ANIMATION
// =============================================================================

interface RoleToggleProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
}

export function AnimatedRoleToggle({
  role,
  onRoleChange,
  disabled = false,
  variant = 'default',
  className,
}: RoleToggleProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    if (newRole === role || disabled) return;

    setIsTransitioning(true);
    // Small delay to show transition animation
    setTimeout(() => {
      onRoleChange(newRole);
      setIsTransitioning(false);
    }, 150);
  };

  // Prominent variant - like Notion's workspace selector
  if (variant === 'prominent') {
    return (
      <LayoutGroup>
        <motion.div
          layout
          className={cn(
            'relative flex items-center p-1.5 rounded-2xl',
            'bg-white/80 backdrop-blur-sm border border-slate-200/80',
            'shadow-sm',
            isTransitioning && 'pointer-events-none',
            className
          )}
        >
          {/* Sliding background indicator with glow */}
          <motion.div
            layout
            className={cn(
              'absolute inset-y-1.5 rounded-xl',
              role === 'creator'
                ? 'bg-gradient-to-r from-accent-blue via-blue-500 to-indigo-500 shadow-lg shadow-accent-blue/30'
                : 'bg-gradient-to-r from-accent-peach via-orange-500 to-rose-500 shadow-lg shadow-accent-peach/30'
            )}
            initial={false}
            animate={{
              left: role === 'creator' ? 6 : '50%',
              right: role === 'creator' ? '50%' : 6,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
          />

          {/* Creator button */}
          <button
            onClick={() => handleRoleChange('creator')}
            disabled={disabled}
            className={cn(
              'relative z-10 flex items-center gap-2 px-5 py-3 rounded-xl',
              'text-sm font-semibold transition-all duration-200',
              'min-w-[130px] justify-center',
              role === 'creator'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <motion.div
              animate={{
                rotate: role === 'creator' ? [0, -10, 0] : 0,
                scale: role === 'creator' ? 1 : 0.9,
              }}
              transition={{ duration: 0.3 }}
            >
              <Palette className="w-4 h-4" />
            </motion.div>
            <span>Creator</span>
          </button>

          {/* Reviewer button */}
          <button
            onClick={() => handleRoleChange('reviewer')}
            disabled={disabled}
            className={cn(
              'relative z-10 flex items-center gap-2 px-5 py-3 rounded-xl',
              'text-sm font-semibold transition-all duration-200',
              'min-w-[130px] justify-center',
              role === 'reviewer'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <motion.div
              animate={{
                rotate: role === 'reviewer' ? [0, 10, 0] : 0,
                scale: role === 'reviewer' ? 1 : 0.9,
              }}
              transition={{ duration: 0.3 }}
            >
              <Briefcase className="w-4 h-4" />
            </motion.div>
            <span>Reviewer</span>
          </button>
        </motion.div>
      </LayoutGroup>
    );
  }

  // Default and compact variants
  return (
    <LayoutGroup>
      <motion.div
        layout
        className={cn(
          'relative flex items-center p-1 rounded-xl',
          'bg-muted/50 border border-border/60',
          isTransitioning && 'pointer-events-none',
          className
        )}
      >
        {/* Sliding background indicator */}
        <motion.div
          layout
          className={cn(
            'absolute inset-y-1 rounded-lg',
            role === 'creator'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25'
              : 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-lg shadow-orange-500/25'
          )}
          initial={false}
          animate={{
            left: role === 'creator' ? 4 : '50%',
            right: role === 'creator' ? '50%' : 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />

        {/* Creator button */}
        <button
          onClick={() => handleRoleChange('creator')}
          disabled={disabled}
          className={cn(
            'relative z-10 flex items-center gap-2 rounded-lg',
            'font-medium transition-colors duration-200',
            variant === 'compact' ? 'px-3 py-2 text-xs min-w-[100px]' : 'px-4 py-2.5 text-sm min-w-[120px]',
            'justify-center',
            role === 'creator'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <motion.div
            animate={{ rotate: role === 'creator' ? [0, -10, 0] : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Palette className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </motion.div>
          <span>Creator</span>
        </button>

        {/* Reviewer button */}
        <button
          onClick={() => handleRoleChange('reviewer')}
          disabled={disabled}
          className={cn(
            'relative z-10 flex items-center gap-2 rounded-lg',
            'font-medium transition-colors duration-200',
            variant === 'compact' ? 'px-3 py-2 text-xs min-w-[100px]' : 'px-4 py-2.5 text-sm min-w-[120px]',
            'justify-center',
            role === 'reviewer'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <motion.div
            animate={{ rotate: role === 'reviewer' ? [0, 10, 0] : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Briefcase className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </motion.div>
          <span>Reviewer</span>
        </button>
      </motion.div>
    </LayoutGroup>
  );
}

// =============================================================================
// ROLE TRANSITION OVERLAY
// =============================================================================

interface RoleTransitionOverlayProps {
  isTransitioning: boolean;
  fromRole: Role;
  toRole: Role;
}

export function RoleTransitionOverlay({
  isTransitioning,
  fromRole,
  toRole,
}: RoleTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-6"
          >
            {/* From role */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: -20, opacity: 0.5 }}
              className={cn(
                'p-4 rounded-2xl',
                fromRole === 'creator' ? 'bg-blue-100' : 'bg-orange-100'
              )}
            >
              {fromRole === 'creator' ? (
                <Palette className="w-8 h-8 text-blue-600" />
              ) : (
                <Briefcase className="w-8 h-8 text-orange-600" />
              )}
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </motion.div>

            {/* To role */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'p-4 rounded-2xl',
                toRole === 'creator' ? 'bg-blue-100' : 'bg-orange-100'
              )}
            >
              {toRole === 'creator' ? (
                <Palette className="w-8 h-8 text-blue-600" />
              ) : (
                <Briefcase className="w-8 h-8 text-orange-600" />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// DASHBOARD TRANSITION WRAPPER
// =============================================================================

interface DashboardTransitionProps {
  role: Role;
  children: React.ReactNode;
  className?: string;
}

export function DashboardTransition({
  role,
  children,
  className,
}: DashboardTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{
          opacity: 0,
          rotateY: role === 'creator' ? -5 : 5,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          rotateY: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          rotateY: role === 'creator' ? 5 : -5,
          scale: 0.98,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        style={{ perspective: 1000 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// ROLE INDICATOR BADGE
// =============================================================================

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function RoleBadge({
  role,
  size = 'md',
  showLabel = true,
  className,
}: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        role === 'creator'
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'bg-orange-100 text-orange-700 border border-orange-200',
        className
      )}
    >
      {role === 'creator' ? (
        <Palette className={iconSizes[size]} />
      ) : (
        <Briefcase className={iconSizes[size]} />
      )}
      {showLabel && (
        <span className="capitalize">{role}</span>
      )}
    </motion.div>
  );
}

// =============================================================================
// ROLE SWITCH PROMPT
// =============================================================================

interface RoleSwitchPromptProps {
  currentRole: Role;
  suggestion?: string;
  onSwitch: () => void;
  className?: string;
}

export function RoleSwitchPrompt({
  currentRole,
  suggestion,
  onSwitch,
  className,
}: RoleSwitchPromptProps) {
  const otherRole = currentRole === 'creator' ? 'reviewer' : 'creator';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-gradient-to-r from-muted/50 to-muted/30',
        'border border-border/50',
        className
      )}
    >
      <div className="p-2 rounded-lg bg-muted">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">
          {suggestion || `Switch to ${otherRole} mode to ${
            otherRole === 'reviewer' ? 'start earning' : 'submit work'
          }`}
        </p>
      </div>
      <button
        onClick={onSwitch}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
          'transition-colors',
          otherRole === 'creator'
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        )}
      >
        {otherRole === 'creator' ? (
          <Palette className="w-3.5 h-3.5" />
        ) : (
          <Briefcase className="w-3.5 h-3.5" />
        )}
        Switch
      </button>
    </motion.div>
  );
}

// =============================================================================
// HOOK FOR ROLE TRANSITION STATE
// =============================================================================

export function useRoleTransition(initialRole: Role = 'creator') {
  const [role, setRole] = useState<Role>(initialRole);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousRole, setPreviousRole] = useState<Role>(initialRole);

  const switchRole = (newRole: Role) => {
    if (newRole === role) return;

    setPreviousRole(role);
    setIsTransitioning(true);

    // Transition duration
    setTimeout(() => {
      setRole(newRole);
      setIsTransitioning(false);
    }, 300);
  };

  const toggleRole = () => {
    switchRole(role === 'creator' ? 'reviewer' : 'creator');
  };

  return {
    role,
    previousRole,
    isTransitioning,
    switchRole,
    toggleRole,
  };
}

export default AnimatedRoleToggle;
