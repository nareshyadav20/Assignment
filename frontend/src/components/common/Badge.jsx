import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-sm font-semibold'
  };

  const variantMap = {
    // Roles
    ADMIN: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    MANAGER: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    USER: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',

    // Severities
    CRITICAL: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse',
    HIGH: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    LOW: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',

    // Statuses
    ACTIVE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    INACTIVE: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    DRAFT: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    COMPLETED: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    CANCELLED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',

    OPEN: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    RESOLVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    CLOSED: 'bg-slate-600/20 text-slate-400 border border-slate-600/30',

    // Generic
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  };

  const key = typeof children === 'string' ? children.toUpperCase() : variant.toUpperCase();
  const styles = variantMap[key] || variantMap[variant] || variantMap.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full tracking-wide transition-colors ${sizeClasses[size] || sizeClasses.sm} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
};
