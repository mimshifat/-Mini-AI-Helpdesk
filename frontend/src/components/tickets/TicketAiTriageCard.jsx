import React from "react";
import { Sparkles, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "../common/Button";
import { CategoryBadge, PriorityBadge } from "../common/Badge";

export function TicketAiTriageCard({
  suggestion,
  error,
  applied,
  onApply,
  onDismiss,
}) {
  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            AI Assistant Unavailable
          </p>
          <p className="text-amber-800 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/40 border border-purple-200 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
            AI Triage Recommendations
          </span>
        </div>

        <div className="flex items-center gap-2">
          {applied ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Applied to Form
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={onApply}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
            >
              Apply Suggestions
            </Button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-100 transition-colors"
              title="Dismiss suggestions"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-white/90 rounded-xl border border-purple-100/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Recommended Category
          </span>
          <div className="flex items-center gap-2">
            <CategoryBadge category={suggestion.category} />
          </div>
        </div>

        <div className="p-3 bg-white/90 rounded-xl border border-purple-100/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Recommended Priority
          </span>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={suggestion.priority} />
          </div>
        </div>
      </div>

      {suggestion.summary && (
        <div className="p-3.5 bg-white/90 rounded-xl border border-purple-100/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Quick Summary
          </span>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            "{suggestion.summary}"
          </p>
        </div>
      )}
    </div>
  );
}
