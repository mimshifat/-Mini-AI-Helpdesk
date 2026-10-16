import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export function AiFeatureBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-purple-800/60">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Copilot Triage & Resolution</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Smart Two-Sided Intelligence
          </h3>
          <p className="text-purple-200/80 text-xs sm:text-sm leading-relaxed">
            Auto-categorize customer inquiries with priority suggestions upon creation, and assist support agents with 3-step action plans and draft replies.
          </p>
        </div>

        <Link to="/tickets/new" className="shrink-0">
          <Button
            variant="secondary"
            icon={ArrowRight}
            className="bg-white text-slate-900 hover:bg-purple-50 border-0 font-bold shadow-lg"
          >
            Create AI Ticket
          </Button>
        </Link>
      </div>
    </div>
  );
}
