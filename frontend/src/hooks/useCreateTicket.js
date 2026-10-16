import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi } from "../api/tickets";
import { useAICopilot } from "./useAICopilot";

/**
 * useCreateTicket
 * Manages ticket creation form state, validation, AI triage application, and submission.
 */
export function useCreateTicket() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);

  const {
    triageLoading,
    triageError,
    triageResult,
    getTriageSuggestion,
    clearTriage,
  } = useAICopilot();

  const triggerAiTriage = useCallback(async () => {
    setAiApplied(false);
    await getTriageSuggestion(title, description);
  }, [title, description, getTriageSuggestion]);

  const applyAiSuggestion = useCallback(() => {
    if (!triageResult) return;
    if (triageResult.category) setCategory(triageResult.category);
    if (triageResult.priority) setPriority(triageResult.priority);
    setAiApplied(true);
  }, [triageResult]);

  const submitTicket = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      setFormError("");

      if (!title.trim() || !description.trim()) {
        setFormError("Both title and description are required.");
        return;
      }

      setSubmitting(true);
      try {
        const newTicket = await ticketsApi.createTicket({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        });
        navigate(`/tickets/${newTicket.id}`);
      } catch (err) {
        console.error("Failed to create ticket:", err);
        setFormError(
          err.message || "Failed to submit ticket. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [title, description, category, priority, navigate],
  );

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    priority,
    setPriority,
    submitting,
    formError,
    aiApplied,

    triageLoading,
    triageError,
    triageResult,
    triggerAiTriage,
    applyAiSuggestion,
    clearTriage,

    submitTicket,
  };
}
