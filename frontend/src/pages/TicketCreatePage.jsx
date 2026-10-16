import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useCreateTicket } from '../hooks';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { TicketForm, TicketAiTriageCard } from '../components/tickets';

export function TicketCreatePage() {
  const {
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
  } = useCreateTicket();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ticket Roster</span>
        </Link>
      </div>

      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Open a Support Ticket</CardTitle>
              <CardDescription>
                Submit your inquiry and let our AI Copilot triage category & priority.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {formError}
            </div>
          )}

          <TicketAiTriageCard
            suggestion={triageResult}
            error={triageError}
            applied={aiApplied}
            onApply={applyAiSuggestion}
            onDismiss={clearTriage}
          />

          <TicketForm
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            category={category}
            onCategoryChange={setCategory}
            priority={priority}
            onPriorityChange={setPriority}
            onAiTriage={triggerAiTriage}
            aiLoading={triageLoading}
            submitting={submitting}
            onSubmit={submitTicket}
          />
        </div>
      </Card>
    </div>
  );
}
