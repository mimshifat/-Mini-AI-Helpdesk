import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Calendar, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge, RoleBadge } from '../common/Badge';

export function TicketHeader({
  ticket,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  const { user, isAdmin } = useAuth();
  const creatorFullName = [ticket.creator?.first_name, ticket.creator?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const creatorDisplayName =
    creatorFullName ||
    ticket.creator_name ||
    ticket.creator?.username ||
    ticket.creator_username ||
    'Unknown';
  const creatorUsername = ticket.creator?.username || ticket.creator_username || 'Unknown';
  const isSelf = Boolean(
    (user?.id && ticket.creator?.id && user.id === ticket.creator.id) ||
    (user?.username && creatorUsername && user.username === creatorUsername)
  );
  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ticket Directory</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={onEdit}
                className="text-xs font-semibold"
              >
                Edit
              </Button>
            )}

            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={onDelete}
                className="text-xs font-semibold"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {ticket.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            Submitted by{' '}
            <strong className="text-slate-800">
              {isSelf ? `You (${creatorDisplayName})` : creatorDisplayName}
            </strong>
            {ticket.creator?.role && <RoleBadge role={ticket.creator.role} />}
          </span>

          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Created {new Date(ticket.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>

          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Admin Triage Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
