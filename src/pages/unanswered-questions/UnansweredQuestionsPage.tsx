import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { unansweredQuestionApi } from "@/api/aiChatbot";
import type { UnansweredQuestion, QuestionStatus } from "@/types";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const statusBadge: Record<QuestionStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700 border-0" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-700 border-0" },
  dismissed: { label: "Dismissed", cls: "bg-gray-100 text-gray-600 border-0" },
};

export function UnansweredQuestionsPage() {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("pending");
  const [error, setError] = useState<string | null>(null);

  // Resolve dialog
  const [resolveDialogId, setResolveDialogId] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState({ title: "", answer: "" });
  const [resolving, setResolving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    const status = statusFilter === "all" ? undefined : statusFilter;
    unansweredQuestionApi.list(WORKSPACE_ID, status)
      .then((res) => setQuestions(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleDismiss = async (id: string) => {
    if (!confirm("Dismiss this question?")) return;
    try {
      await unansweredQuestionApi.dismiss(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to dismiss");
    }
  };

  const openResolve = (q: UnansweredQuestion) => {
    setResolveDialogId(q.id);
    setResolveForm({ title: q.original_message.slice(0, 80), answer: "" });
  };

  const handleResolve = async () => {
    if (!resolveDialogId) return;
    setResolving(true);
    try {
      await unansweredQuestionApi.resolve(resolveDialogId, {
        title: resolveForm.title,
        answer: resolveForm.answer,
        workspace_id: WORKSPACE_ID,
      });
      setResolveDialogId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  return (
    <AppLayout title="Unanswered Questions">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{questions.length} questions</p>
          <div className="flex items-center gap-2">
            {/* Status tabs */}
            <div className="flex gap-1 border rounded-md overflow-hidden text-xs">
              {(["pending", "all", "resolved", "dismissed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 capitalize ${statusFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading} className="p-2 rounded-md hover:bg-muted" title="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No {statusFilter !== "all" ? statusFilter : ""} questions found
              </div>
            ) : (
              <div className="divide-y">
                {questions.map((q) => {
                  const sb = statusBadge[q.status] ?? statusBadge.pending;
                  return (
                    <div key={q.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${sb.cls}`}>{sb.label}</Badge>
                            <span className="text-xs text-muted-foreground">{relativeTime(q.triggered_at)}</span>
                          </div>
                          <p className="text-sm font-medium">{q.original_message}</p>
                          {q.context_messages.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {q.context_messages.length} context message(s)
                            </p>
                          )}
                        </div>
                        {q.status === "pending" && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openResolve(q)}
                              className="text-xs"
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Write Answer
                            </Button>
                            <button
                              onClick={() => handleDismiss(q.id)}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Dismiss"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        {resolveDialogId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Write Answer</h2>
              <p className="text-sm text-muted-foreground">
                Your answer will be added to the knowledge base so the AI can use it for future questions.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">Title (for knowledge base)</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={resolveForm.title}
                  onChange={(e) => setResolveForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  rows={5}
                  value={resolveForm.answer}
                  onChange={(e) => setResolveForm((f) => ({ ...f, answer: e.target.value }))}
                  placeholder="Type the correct answer here..."
                />
              </div>

              {error && <div className="p-2 bg-red-50 rounded text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResolveDialogId(null)}>Cancel</Button>
                <Button onClick={handleResolve} disabled={resolving || !resolveForm.title || !resolveForm.answer}>
                  {resolving ? "Saving..." : "Save Answer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
