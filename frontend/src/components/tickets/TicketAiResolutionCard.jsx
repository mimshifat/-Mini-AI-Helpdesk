import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  CheckCheck, 
  ListChecks, 
  Frown, 
  Smile, 
  Meh, 
  AlertTriangle,
  Send,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export function TicketAiResolutionCard({
  resolution,
  loading,
  error,
  onGenerate,
  onSendResponse,
  sendingResponse,
  hasExistingResponse = false,
}) {
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [markResolved, setMarkResolved] = useState(true);

  // Sync draft reply whenever resolution updates
  useEffect(() => {
    if (resolution?.draft_customer_reply) {
      setReplyText(resolution.draft_customer_reply);
      setIsEditingReply(false);
    }
  }, [resolution]);

  function handleCopy() {
    const textToCopy = replyText || resolution?.draft_customer_reply;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleSend() {
    const textToSend = replyText.trim() || resolution?.draft_customer_reply;
    if (!textToSend || !onSendResponse) return;
    onSendResponse(textToSend, markResolved ? 'Resolved' : 'In Progress');
  }

  return (
    <Card className="border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  AI Resolution Copilot & Agent Assist
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-purple-100 text-purple-700 border border-purple-200">
                  Agent Assist
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Detect customer sentiment, generate internal troubleshooting steps, and draft a response.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={onGenerate}
            loading={loading}
            icon={Sparkles}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shrink-0 shadow-sm"
          >
            {resolution ? 'Regenerate Solution' : 'Generate Solution'}
          </Button>
        </div>

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">AI Assistant Notice:</span> {error}
            </div>
          </div>
        )}

        {resolution && (
          <div className="mt-6 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/80 border border-purple-100 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Detected Customer Sentiment:</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                {resolution.sentiment === 'Frustrated' ? (
                  <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <Frown className="w-3.5 h-3.5" /> Frustrated
                  </span>
                ) : resolution.sentiment === 'Positive' ? (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <Smile className="w-3.5 h-3.5" /> Positive / Cooperative
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    <Meh className="w-3.5 h-3.5" /> Neutral
                  </span>
                )}
              </div>
            </div>

            {resolution.internal_action_steps && resolution.internal_action_steps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900">
                  <ListChecks className="w-4 h-4 text-purple-600" />
                  <span>Recommended Internal Action Plan</span>
                </div>

                <div className="space-y-2">
                  {resolution.internal_action_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-700 shadow-2xs"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Draft Customer Response</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingReply(!isEditingReply)}
                    icon={Edit3}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    {isEditingReply ? 'Preview' : 'Edit Text'}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                    icon={copied ? CheckCheck : Copy}
                    className={`text-xs transition-all ${
                      copied ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : ''
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>

                  {onSendResponse && (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleSend}
                      loading={sendingResponse}
                      icon={Send}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    >
                      {hasExistingResponse ? 'Update Response' : 'Send to Customer'}
                    </Button>
                  )}
                </div>
              </div>

              {isEditingReply ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-4 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 text-xs sm:text-sm font-sans bg-white leading-relaxed resize-y"
                    placeholder="Refine response before sending..."
                  />
                  <span className="text-[11px] text-slate-400">
                    You can refine the AI response before sending it to the customer.
                  </span>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-purple-100/90 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs font-sans">
                  {replyText || resolution.draft_customer_reply}
                </div>
              )}

              {onSendResponse && (
                <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={(e) => setMarkResolved(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300"
                    />
                    <span>Automatically mark ticket status as <strong>Resolved</strong> upon sending</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
