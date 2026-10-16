import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function TicketDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  deleting,
  ticketId,
  ticketTitle,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Support Ticket"
      description="Are you sure you want to permanently delete this ticket? This action cannot be undone."
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>
            Ticket #{ticketId} "<strong>{ticketTitle}</strong>" will be permanently removed.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={deleting}
            icon={Trash2}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
