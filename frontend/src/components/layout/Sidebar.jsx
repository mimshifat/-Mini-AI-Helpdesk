import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  Sparkles, 
  LogOut, 
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { RoleBadge } from '../common/Badge';

export function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Tickets', to: '/tickets', icon: Ticket },
    { name: 'Create Ticket', to: '/tickets/new', icon: PlusCircle, badge: 'AI' },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-18 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">AI Helpdesk</span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-brand-500/20 text-brand-300 rounded border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart Ticket Intelligence</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen?.(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <div className="pt-6">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-purple-400/80 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin View Active</span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/40 text-xs text-purple-300">
                Full triage & system-wide ticket access enabled.
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-sm">
                {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={user?.role || 'user'} />
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
