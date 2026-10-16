import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button';

export function TicketPagination({ currentPage, totalPages, count, onPageChange, loading }) {
  if (count <= 10 && currentPage === 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
      <div className="text-xs text-slate-500 font-medium">
        Showing <span className="text-slate-800 font-semibold">{count === 0 ? 0 : (currentPage - 1) * 10 + 1}</span> to{' '}
        <span className="text-slate-800 font-semibold">{Math.min(currentPage * 10, count)}</span> of{' '}
        <span className="text-slate-800 font-semibold">{count}</span> tickets
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(currentPage - 1)}
          icon={ChevronLeft}
          className="text-xs"
        >
          Previous
        </Button>

        <span className="text-xs font-semibold text-slate-600 px-2">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => onPageChange(currentPage + 1)}
          icon={ChevronRight}
          className="text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
