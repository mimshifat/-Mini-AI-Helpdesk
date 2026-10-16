import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth, useTickets } from '../hooks';
import { Button } from '../components/common/Button';
import { TicketFilters, TicketTable, TicketPagination } from '../components/tickets';

export function TicketListPage() {
  const { isAdmin } = useAuth();
  const {
    tickets,
    count,
    totalPages,
    currentPage,
    setCurrentPage,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    priority,
    setPriority,
    category,
    setCategory,
    hasActiveFilters,
    resetFilters,
  } = useTickets();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{isAdmin ? 'All Support Tickets' : 'My Support Tickets'}</span>
            {!loading && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {count ?? 0}
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isAdmin
              ? 'Triage, search, and manage customer tickets across the helpdesk.'
              : 'Review your submitted inquiries, check progress, and track status.'}
          </p>
        </div>

        <Link to="/tickets/new">
          <Button
            variant="primary"
            icon={Plus}
            className="shadow-sm font-semibold"
          >
            Create Ticket
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        category={category}
        onCategoryChange={setCategory}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      <TicketTable
        tickets={tickets}
        loading={loading}
        isAdmin={isAdmin}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      <TicketPagination
        currentPage={currentPage}
        totalPages={totalPages}
        count={count}
        onPageChange={setCurrentPage}
        loading={loading}
      />
    </div>
  );
}
