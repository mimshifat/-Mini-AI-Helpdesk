import React from 'react';
import { Menu, Plus, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { RoleBadge } from '../common/Badge';

export function Header({ setMobileOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/tickets') return 'Tickets Central';
    if (pathname === '/tickets/new') return 'Create Support Ticket';
    if (pathname.startsWith('/tickets/')) return 'Ticket Details';
    return 'Mini AI Helpdesk';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {location.pathname !== '/tickets/new' && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
            <Sparkles className="w-3.5 h-3.5 text-brand-200" />
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800">{user?.username}</p>
            <p className="text-[11px] text-slate-400 capitalize">{user?.role} Access</p>
          </div>
          <RoleBadge role={user?.role || 'user'} />
        </div>
      </div>
    </header>
  );
}
