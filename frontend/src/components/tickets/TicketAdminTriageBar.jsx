import React from "react";
import { Shield } from "lucide-react";

export function TicketAdminTriageBar({
  currentStatus,
  updating,
  onStatusChange,
}) {
  return (
    <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-900">
        <Shield className="w-4 h-4 text-purple-600 shrink-0" />
        <span>Admin Lifecycle Triage:</span>
      </div>

      <div className="flex items-center gap-2">
        {["Open", "In Progress", "Resolved"].map((st) => (
          <button
            key={st}
            type="button"
            disabled={updating || currentStatus === st}
            onClick={() => onStatusChange(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStatus === st
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-100/70 hover:border-purple-300"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}
