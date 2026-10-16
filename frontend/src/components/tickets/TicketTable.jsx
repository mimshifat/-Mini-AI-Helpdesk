import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, User as UserIcon, Inbox } from 'lucide-react';
import { Card } from '../common/Card';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { TableRowSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

export function TicketTable({ tickets, loading, isAdmin, hasActiveFilters, onResetFilters }) {
  const navigate = useNavigate();
  return (
    <Card className="border border-slate-200/80 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">Ticket</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              {isAdmin && <th className="py-3.5 px-4">Creator</th>}
              <th className="py-3.5 px-6 text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <>
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
              </>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-16 text-center">
                  <EmptyState
                    icon={Inbox}
                    title={hasActiveFilters ? 'No matching tickets' : 'No tickets submitted yet'}
                    description={
                      hasActiveFilters
                        ? 'Try loosening your search terms or clearing your filter criteria.'
                        : 'Create a new support ticket using the button above to begin.'
                    }
                    actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                    onAction={hasActiveFilters ? onResetFilters : undefined}
                  />
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6 font-medium text-slate-900 max-w-xs sm:max-w-md">
                    <Link
                      to={`/tickets/${t.id}`}
                      className="group-hover:text-brand-600 transition-colors block"
                    >
                      <div className="font-semibold text-slate-900 group-hover:text-brand-600 truncate">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Ticket ID #{t.id}
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge status={t.status} />
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {t.creator_name || t.creator?.username || t.creator_username || 'Unknown'}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-6 text-right text-xs text-slate-500 whitespace-nowrap">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(t.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
