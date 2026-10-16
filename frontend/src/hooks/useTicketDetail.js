import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi } from "../api/tickets";

/**
 * useTicketDetail
 * Manages full lifecycle state for a single ticket:
 * fetching, inline editing, quick admin triage, and deletion.
 */
export function useTicketDetail(id, isAdmin) {
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketsApi.getTicket(id);
      setTicket(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
      setEditCategory(data.category);
      setEditPriority(data.priority);
      setEditStatus(data.status);
    } catch (err) {
      console.error("Failed to load ticket:", err);
      setError(err.message || "Ticket not found or permission denied.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const quickStatusChange = useCallback(
    async (newStatus) => {
      if (!isAdmin || !ticket || newStatus === ticket.status) return;

      setUpdatingStatus(true);
      setActionError("");
      try {
        const updated = await ticketsApi.updateTicket(ticket.id, {
          status: newStatus,
        });
        setTicket(updated);
        setEditStatus(updated.status);
      } catch (err) {
        setActionError(err.message || "Failed to update ticket status.");
      } finally {
        setUpdatingStatus(false);
      }
    },
    [isAdmin, ticket],
  );

  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseSuccessMessage, setResponseSuccessMessage] = useState("");

  const sendAgentResponse = useCallback(
    async (responseText, newStatus = "Resolved") => {
      if (!isAdmin || !ticket || !responseText?.trim()) return false;

      setSendingResponse(true);
      setActionError("");
      setResponseSuccessMessage("");
      try {
        const payload = {
          agent_response: responseText.trim(),
          status: newStatus,
        };
        const updated = await ticketsApi.updateTicket(ticket.id, payload);
        setTicket(updated);
        setEditStatus(updated.status);
        setResponseSuccessMessage(
          "Official response sent to customer successfully!",
        );
        setTimeout(() => setResponseSuccessMessage(""), 5000);
        return true;
      } catch (err) {
        setActionError(err.message || "Failed to dispatch agent response.");
        return false;
      } finally {
        setSendingResponse(false);
      }
    },
    [isAdmin, ticket],
  );

  const saveEdit = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      setActionError("");
      setSaving(true);

      try {
        const payload = {
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          priority: editPriority,
          ...(isAdmin ? { status: editStatus } : {}),
        };

        const updated = await ticketsApi.updateTicket(ticket.id, payload);
        setTicket(updated);
        setIsEditing(false);
      } catch (err) {
        setActionError(err.message || "Failed to save ticket changes.");
      } finally {
        setSaving(false);
      }
    },
    [
      ticket,
      editTitle,
      editDescription,
      editCategory,
      editPriority,
      editStatus,
      isAdmin,
    ],
  );

  const deleteTicket = useCallback(async () => {
    if (!ticket) return;
    setDeleting(true);
    setActionError("");
    try {
      await ticketsApi.deleteTicket(ticket.id);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setActionError(err.message || "Failed to delete ticket.");
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }, [ticket, navigate]);

  return {
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

    refresh: loadTicket,
  };
}
