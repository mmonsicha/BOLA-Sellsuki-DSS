import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chatSessionApi, knowledgeBaseApi, unansweredQuestionApi } from "@/api/aiChatbot";
import type { ChatSession, KnowledgeBase, UnansweredQuestion } from "@/types";
import { MessageSquare, Bot, Users, Database, HelpCircle, CheckCircle, RefreshCw, TrendingUp } from "lucide-react";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const ESCALATION_LABELS: Record<string, string> = {
  low_confidence: "Low Confidence",
  manual: "Manual Takeover",
  keyword: "Keyword Match",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

interface Stats {
  sessions: ChatSession[];
  kbEntries: KnowledgeBase[];
  questions: UnansweredQuestion[];
}

export function ChatbotAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, kbRes, questionsRes] = await Promise.all([
        chatSessionApi.list(WORKSPACE_ID, 1, 100),
        knowledgeBaseApi.list(WORKSPACE_ID, 1, 100),
        unansweredQuestionApi.list(WORKSPACE_ID, undefined, 1, 100),
      ]);
      setStats({
        sessions: sessionsRes.data ?? [],
        kbEntries: kbRes.data ?? [],
        questions: questionsRes.data ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <AppLayout title="Chatbot Analytics">
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={20} className="animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !stats) {
    return (
      <AppLayout title="Chatbot Analytics">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between">
          <span>{error ?? "Unknown error"}</span>
          <button onClick={load} className="ml-4 text-xs underline hover:no-underline">Retry</button>
        </div>
      </AppLayout>
    );
  }

  const { sessions, kbEntries, questions } = stats;

  // Session metrics
  const totalSessions = sessions.length;
  const aiSessions = sessions.filter((s) => s.mode === "ai").length;
  const humanSessions = sessions.filter((s) => s.mode === "human").length;
  const escalationRate = totalSessions > 0 ? Math.round((humanSessions / totalSessions) * 100) : 0;
  const escalatedSessions = sessions
    .filter((s) => s.mode === "human" && s.escalated_at)
    .sort((a, b) => new Date(b.escalated_at!).getTime() - new Date(a.escalated_at!).getTime())
    .slice(0, 5);

  // KB metrics
  const totalKB = kbEntries.length;
  const activeKB = kbEntries.filter((e) => e.is_active).length;
  const manualKB = kbEntries.filter((e) => e.source_type === "manual").length;
  const importedKB = kbEntries.filter((e) => e.source_type === "imported").length;
  const learnedKB = kbEntries.filter((e) => e.source_type === "learned_from_reply").length;

  // Question metrics
  const pendingQ = questions.filter((q) => q.status === "pending").length;
  const resolvedQ = questions.filter((q) => q.status === "resolved").length;
  const dismissedQ = questions.filter((q) => q.status === "dismissed").length;
  const totalClosed = resolvedQ + dismissedQ;
  const resolutionRate = totalClosed > 0 ? Math.round((resolvedQ / totalClosed) * 100) : 0;

  return (
    <AppLayout title="Chatbot Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Overview from last 100 sessions · KB entries · questions</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded hover:bg-muted"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Session Stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <MessageSquare size={14} />
            Chat Sessions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Sessions"
              value={totalSessions}
              icon={<MessageSquare size={18} className="text-blue-500" />}
              color="blue"
            />
            <StatCard
              label="AI Mode"
              value={aiSessions}
              icon={<Bot size={18} className="text-green-500" />}
              color="green"
              sub={totalSessions > 0 ? `${Math.round((aiSessions / totalSessions) * 100)}% of total` : undefined}
            />
            <StatCard
              label="Human Mode"
              value={humanSessions}
              icon={<Users size={18} className="text-orange-500" />}
              color="orange"
              sub={totalSessions > 0 ? `${Math.round((humanSessions / totalSessions) * 100)}% of total` : undefined}
            />
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escalation Rate</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-orange-600">{escalationRate}%</div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-400 transition-all"
                    style={{ width: `${escalationRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sessions escalated to human</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* KB Stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Database size={14} />
            Knowledge Base
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total Entries"
              value={totalKB}
              icon={<Database size={18} className="text-blue-500" />}
              color="blue"
              sub={`${activeKB} active`}
            />
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Entries</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{activeKB}</div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all"
                    style={{ width: totalKB > 0 ? `${Math.round((activeKB / totalKB) * 100)}%` : "0%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalKB > 0 ? `${Math.round((activeKB / totalKB) * 100)}%` : "0%"} of entries active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <SourceBar label="Manual" count={manualKB} total={totalKB} color="bg-blue-400" />
                <SourceBar label="Imported" count={importedKB} total={totalKB} color="bg-gray-400" />
                <SourceBar label="Learned" count={learnedKB} total={totalKB} color="bg-green-400" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Questions Stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <HelpCircle size={14} />
            Unanswered Questions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending"
              value={pendingQ}
              icon={<HelpCircle size={18} className="text-yellow-500" />}
              color="yellow"
              sub="Awaiting answer"
            />
            <StatCard
              label="Resolved"
              value={resolvedQ}
              icon={<CheckCircle size={18} className="text-green-500" />}
              color="green"
              sub="Added to KB"
            />
            <StatCard
              label="Dismissed"
              value={dismissedQ}
              icon={<HelpCircle size={18} className="text-gray-400" />}
              color="gray"
              sub="Skipped"
            />
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-green-600">{resolutionRate}%</div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all"
                    style={{ width: `${resolutionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Resolved of closed questions</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Escalations */}
        {escalatedSessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users size={14} />
              Recent Escalations
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {escalatedSessions.map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {s.line_chat_id.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{s.line_chat_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {ESCALATION_LABELS[s.escalation_reason ?? ""] ?? s.escalation_reason ?? "Unknown reason"}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {s.escalated_at ? relativeTime(s.escalated_at) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ---- StatCard ----

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "yellow" | "gray";
  sub?: string;
}) {
  const colorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    yellow: "text-yellow-600",
    gray: "text-gray-500",
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-2xl font-bold ${colorMap[color]}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ---- SourceBar ----

function SourceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
