import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, CheckCircle2, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { useAuth, useDashboard } from '../hooks';
import { Button } from '../components/common/Button';
import { StatCardSkeleton } from '../components/common/Skeleton';
import { StatCard, AiFeatureBanner, RecentTicketsTable } from '../components/dashboard';

/**
 * DashboardPage
 * Clean page container orchestrating stats, AI banners, and recent tickets.
 */
export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { stats, recentTickets, loading, error, refresh } = useDashboard();

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats?.total ?? 0,
      icon: Ticket,
      color: 'from-brand-500 to-indigo-600',
      bgColor: 'bg-brand-50 text-brand-700 border-brand-200/80',
      badge: isAdmin ? 'All Users' : 'Your Tickets',
    },
    {
      title: 'Open Status',
      value: stats?.open ?? 0,
      icon: AlertCircle,
      color: 'from-blue-500 to-sky-600',
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      badge: 'Needs Attention',
    },
    {
      title: 'In Progress',
      value: stats?.in_progress ?? 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      badge: 'Active Work',
    },
    {
      title: 'Resolved',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badge: 'Completed',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isAdmin ? 'System Administrator Portal' : 'Standard User Workspace'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.username}!
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              {isAdmin
                ? 'Manage system-wide support tickets, triage urgent customer issues, and monitor resolutions.'
                : 'Track the status of your inquiries, receive live triage, and submit new support tickets.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={refresh}
              className="text-white hover:bg-white/10"
            >
              Refresh
            </Button>
            <Link to="/tickets/new">
              <Button
                variant="primary"
                icon={Plus}
                className="bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/25 border-0 font-bold"
              >
                New Ticket
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={refresh} className="text-xs text-rose-700">
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          statCards.map((c) => <StatCard key={c.title} {...c} />)
        )}
      </div>

      <AiFeatureBanner />

      <RecentTicketsTable
        tickets={recentTickets}
        loading={loading}
        isAdmin={isAdmin}
      />
    </div>
  );
}
