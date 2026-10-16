import React from 'react';

const STATUS_CONFIG = {
  Open: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    pulse: true,
  },
  'In Progress': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    pulse: true,
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    pulse: false,
  },
};

const PRIORITY_CONFIG = {
  High: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  Medium: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  Low: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

const CATEGORY_CONFIG = {
  Technical: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  Billing: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ROLE_CONFIG = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
  user: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Open;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
}

export function CategoryBadge({ category, size = 'sm' }) {
  const style = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.General;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${style} ${sizeClasses}`}>
      {category}
    </span>
  );
}

export function RoleBadge({ role }) {
  const style = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase tracking-wide border ${style}`}>
      {role}
    </span>
  );
}
