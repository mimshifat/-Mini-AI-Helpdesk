import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Inbox, Clock, User as UserIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { TableRowSkeleton } from '../common/Skeleton';

export function RecentTicketsTable({ tickets, loading, isAdmin }) {
  const navigate = useNavigate();
  return (
    <Card className="border border-slate-200/80 overflow-hidden shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
        <div>
          <CardTitle>Recent Support Inquiries</CardTitle>
          <CardDescription>
            {isAdmin ? 'Latest tickets submitted across the system' : 'Your most recent ticket submissions'}
          </CardDescription>
        </div>

        <Link to="/tickets">
          <Button variant="ghost" size="sm" icon={ArrowRight} className="text-xs">
            View All Tickets
          </Button>
        </Link>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6">Ticket</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              {isAdmin && <th className="py-3 px-4">Creator</th>}
              <th className="py-3 px-6 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <>
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
                <TableRowSkeleton cols={isAdmin ? 6 : 5} />
              </>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">No tickets found</p>
                    <p className="text-xs text-slate-400">Create your first ticket to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6 font-medium text-slate-900">
                    <Link
                      to={`/tickets/${t.id}`}
                      className="group-hover:text-brand-600 transition-colors flex flex-col"
                    >
                      <span className="font-semibold text-slate-900 group-hover:text-brand-600">
                        {t.title}
                      </span>
                      <span className="text-xs text-slate-400">ID #{t.id}</span>
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="py-4 px-4">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-4 text-xs text-slate-600">
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
