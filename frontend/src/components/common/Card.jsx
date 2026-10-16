import React from 'react';

export function Card({ children, className = '', hover = false, glass = false, ...props }) {
  const bgClass = glass ? 'glass-panel' : 'bg-white';
  const hoverClass = hover
    ? 'hover:shadow-glass-hover hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-300'
    : '';

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 shadow-card ${bgClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div
      className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`px-6 py-4 bg-slate-50/70 rounded-b-2xl border-t border-slate-100 flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}
