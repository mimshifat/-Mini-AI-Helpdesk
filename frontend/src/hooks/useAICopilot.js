import { useState, useCallback } from "react";
import { aiApi } from "../api/ai";

/**
 * useAICopilot
 * Encapsulates client-side AI triage and resolution assist workflows.
 */
export function useAICopilot() {
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  const [resolutionLoading, setResolutionLoading] = useState(false);
  const [resolutionError, setResolutionError] = useState("");
  const [resolutionResult, setResolutionResult] = useState(null);

  const getTriageSuggestion = useCallback(async (title, description) => {
    if (!title.trim() || !description.trim()) {
      setTriageError(
        "Please provide both title and description before requesting AI triage.",
      );
      return null;
    }

    setTriageLoading(true);
    setTriageError("");
    try {
      const data = await aiApi.getSuggestion(title.trim(), description.trim());
      setTriageResult(data);
      return data;
    } catch (err) {
      console.warn("AI Triage error:", err.message);
      setTriageError(
        err.message ||
          "AI service is temporarily unavailable. You can select fields manually.",
      );
      return null;
    } finally {
      setTriageLoading(false);
    }
  }, []);

  const getResolutionAssist = useCallback(
    async (title, description, category) => {
      setResolutionLoading(true);
      setResolutionError("");
      try {
        const data = await aiApi.getDraftResolution(
          title,
          description,
          category,
        );
        setResolutionResult(data);
        return data;
      } catch (err) {
        console.warn("AI Resolution Assist error:", err.message);
        setResolutionError(
          err.message || "AI resolution service is temporarily unavailable.",
        );
        return null;
      } finally {
        setResolutionLoading(false);
      }
    },
    [],
  );

  const clearTriage = useCallback(() => {
    setTriageResult(null);
    setTriageError("");
  }, []);

  const clearResolution = useCallback(() => {
    setResolutionResult(null);
    setResolutionError("");
  }, []);

  return {
    triageLoading,
    triageError,
    triageResult,
    getTriageSuggestion,
    clearTriage,

    resolutionLoading,
    resolutionError,
    resolutionResult,
    getResolutionAssist,
    clearResolution,
  };
}
