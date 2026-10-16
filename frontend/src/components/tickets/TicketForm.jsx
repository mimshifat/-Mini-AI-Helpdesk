import React from "react";
import { Sparkles } from "lucide-react";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Select } from "../common/Select";
import { Button } from "../common/Button";

export function TicketForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  onAiTriage,
  aiLoading,
  submitting,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Input
          label="Ticket Subject / Title"
          required
          maxLength={150}
          placeholder="e.g. Cannot connect to staging database after credentials rotation"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          helperText={`${title.length}/150 characters`}
        />
      </div>

      <div>
        <Textarea
          label="Detailed Description"
          required
          rows={6}
          maxLength={2000}
          placeholder="Please describe the steps to reproduce, error codes, and what you've already tried..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          helperText={`${description.length}/2000 characters`}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-xs text-purple-900 font-medium">
            Let AI analyze your subject & description to suggest the optimal
            Category and Priority.
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAiTriage}
          loading={aiLoading}
          icon={Sparkles}
          className="text-xs shrink-0 font-bold text-purple-700 bg-white hover:bg-purple-50 border-purple-200"
        >
          {aiLoading ? "Analyzing..." : "AI Auto-Triage"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        <Select
          label="Category"
          required
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          helperText="Determines ticket routing queue"
        >
          <option value="General">General Inquiry</option>
          <option value="Technical">Technical Support</option>
          <option value="Billing">Billing & Accounting</option>
        </Select>

        <Select
          label="Priority"
          required
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          helperText="Expected urgency & SLA tier"
        >
          <option value="Low">Low (General question / Minor)</option>
          <option value="Medium">Medium (Affecting workflow)</option>
          <option value="High">High (Service blocking outage)</option>
        </Select>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          className="px-8 shadow-md shadow-brand-500/20 font-bold"
        >
          Submit Support Ticket
        </Button>
      </div>
    </form>
  );
}
