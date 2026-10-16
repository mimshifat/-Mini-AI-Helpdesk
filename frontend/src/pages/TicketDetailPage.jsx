import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, X, Clock, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";
import { useAuth, useTicketDetail, useAICopilot } from "../hooks";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Textarea } from "../components/common/Textarea";
import { Select } from "../components/common/Select";
import { Skeleton } from "../components/common/Skeleton";
import {
  TicketHeader,
  TicketAdminTriageBar,
  TicketAiResolutionCard,
  TicketDeleteModal,
} from "../components/tickets";

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const {
    ticket,
    loading,
    error,
    actionError,

    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    editPriority,
    setEditPriority,
    editStatus,
    setEditStatus,
    saving,
    saveEdit,

    updatingStatus,
    quickStatusChange,

    sendingResponse,
    responseSuccessMessage,
    sendAgentResponse,

    deleteModalOpen,
    setDeleteModalOpen,
    deleting,
    deleteTicket,
  } = useTicketDetail(id, isAdmin);

  const {
    resolutionLoading,
    resolutionError,
    resolutionResult,
    getResolutionAssist,
  } = useAICopilot();

  const creatorId =
    ticket?.creator?.id ??
    (typeof ticket?.creator === "number" ? ticket?.creator : null);
  const creatorUsername = ticket?.creator?.username || ticket?.creator_username;
  const isOwner = Boolean(
    (user?.id && user?.id === creatorId) ||
    (user?.username && user?.username === creatorUsername),
  );
  const isCustomerStatementImmutable = Boolean(isAdmin && !isOwner);
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Card className="p-8 space-y-6">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="text-rose-600 font-bold text-lg">
          Unable to Display Ticket
        </div>
        <p className="text-slate-500 text-xs sm:text-sm">
          {error || "Ticket could not be located."}
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/tickets")}
          className="text-xs"
        >
          Return to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <TicketHeader
        ticket={ticket}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={() => setIsEditing(true)}
        onDelete={() => setDeleteModalOpen(true)}
      />

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {actionError}
        </div>
      )}

      {responseSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{responseSuccessMessage}</span>
        </div>
      )}

      <Card className="border border-slate-200/80 shadow-xs overflow-hidden">
        {!isEditing ? (
          <div>
            <div className="p-6 sm:p-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Ticket Description
              </h4>
              <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {ticket.description}
              </div>
            </div>

            {isAdmin && (
              <TicketAdminTriageBar
                currentStatus={ticket.status}
                updating={updatingStatus}
                onStatusChange={quickStatusChange}
              />
            )}
          </div>
        ) : (
          <form onSubmit={saveEdit}>
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Ticket Details
                </h3>
                <span className="text-xs text-slate-500">ID #{ticket.id}</span>
              </div>

              {isCustomerStatementImmutable && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">
                      Customer Statement Integrity Policy Active
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      To preserve audit records and prevent tampering with the
                      customer's reported complaint, Title and Description
                      cannot be altered by administrators. You can triage
                      Category, Priority, and Status below.
                    </p>
                  </div>
                </div>
              )}

              <Input
                label="Ticket Title"
                required
                disabled={isCustomerStatementImmutable}
                icon={isCustomerStatementImmutable ? Lock : undefined}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                helperText={
                  isCustomerStatementImmutable
                    ? "Locked: Original customer record"
                    : undefined
                }
              />

              <Textarea
                label="Description"
                required
                rows={6}
                disabled={isCustomerStatementImmutable}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                helperText={
                  isCustomerStatementImmutable
                    ? "Locked: Original customer record"
                    : undefined
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                </Select>

                <Select
                  label="Priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>

                {isAdmin && (
                  <Select
                    label="Status (Admin Only)"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </Select>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditing(false)}
                icon={X}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Card>

      {!isEditing && ticket.agent_response && (
        <Card className="border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white p-6 sm:p-7 rounded-3xl shadow-xs animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Official Support Response & Resolution
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Official Resolution
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Last updated{" "}
                  {new Date(ticket.updated_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-white/95 p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs font-sans">
                {ticket.agent_response}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!isEditing && isAdmin && (
        <TicketAiResolutionCard
          resolution={resolutionResult}
          loading={resolutionLoading}
          error={resolutionError}
          onGenerate={() =>
            getResolutionAssist(
              ticket.title,
              ticket.description,
              ticket.category,
            )
          }
          onSendResponse={sendAgentResponse}
          sendingResponse={sendingResponse}
          hasExistingResponse={Boolean(ticket.agent_response)}
        />
      )}

      {!isEditing && !isAdmin && (
        <Card className="border border-blue-100/90 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-purple-50/30 p-6 rounded-3xl shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Ticket Status & Support Progress
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-100 text-blue-700 border border-blue-200">
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {ticket.status === "Open"
                  ? "Your inquiry is currently in the queue. A support engineer has been notified and will triage it according to its SLA priority."
                  : ticket.status === "In Progress"
                    ? "A support engineer is actively investigating your request. We will update you as soon as further information is available."
                    : "This ticket has been marked as resolved. If you still have questions or need more assistance, you can edit your ticket details or submit a new inquiry."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <TicketDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={deleteTicket}
        deleting={deleting}
        ticketId={ticket.id}
        ticketTitle={ticket.title}
      />
    </div>
  );
}
