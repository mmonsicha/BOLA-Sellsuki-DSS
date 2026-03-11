import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Zap,
  MessageSquare,
  BookOpen,
  RefreshCw,
  BarChart2,
  Inbox,
  Trophy,
  Users,
} from "lucide-react";
import {
  adminPerformanceApi,
  type AdminPerformanceSummary,
  type AdminPerformanceLog,
  type AdminLeaderboardEntry,
  type AdminTeamStats,
} from "@/api/adminPerformance";

// ---- Period selector ----

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            value === p.value
              ? "bg-line text-white border-line"
              : "bg-background hover:bg-muted border-border"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ---- Helpers ----

/** Convert milliseconds to a human-readable string: "X.X min" or "Xs" */
function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "—";
  if (ms < 60_000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

function truncateId(id: string): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

// ---- Metric card ----

interface MetricCardProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  value: string | number;
  sub?: string;
  status?: "good" | "bad" | "neutral";
}

function MetricCard({ icon: Icon, iconColor, title, value, sub, status }: MetricCardProps) {
  const valueColor =
    status === "good"
      ? "text-green-600"
      : status === "bad"
      ? "text-destructive"
      : "";

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`rounded-xl p-3 ${iconColor}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className={`text-2xl font-bold mt-0.5 ${valueColor}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Empty state ----

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-3">
        <Inbox size={48} className="mx-auto text-muted-foreground opacity-30" />
        <p className="font-medium text-muted-foreground">ยังไม่มีข้อมูล</p>
        <p className="text-sm text-muted-foreground">
          เริ่มรับ Chat จาก AI Chatbot เพื่อดูสถิติ
        </p>
      </CardContent>
    </Card>
  );
}

// ---- Skeleton loader ----

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4 animate-pulse">
        <div className="rounded-xl p-3 bg-muted w-11 h-11" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-6 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Recent Sessions table ----

function SessionsTable({
  sessions,
  loading,
}: {
  sessions: AdminPerformanceLog[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
        <RefreshCw size={14} className="animate-spin" />
        Loading sessions…
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No sessions in this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2 font-medium text-muted-foreground text-xs">Session</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">First Response</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Avg Response</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Messages</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Duration</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Closed</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="py-2 font-mono text-xs text-muted-foreground">
                {truncateId(s.session_id)}
              </td>
              <td className="py-2">
                <span
                  className={
                    s.first_response_time_ms > 0 && s.first_response_time_ms <= 300_000
                      ? "text-green-600 font-medium"
                      : s.first_response_time_ms > 300_000
                      ? "text-destructive font-medium"
                      : ""
                  }
                >
                  {formatMs(s.first_response_time_ms)}
                </span>
              </td>
              <td className="py-2">{formatMs(s.avg_response_time_ms)}</td>
              <td className="py-2">
                {s.total_admin_messages + s.total_user_messages}
                <span className="text-xs text-muted-foreground ml-1">
                  ({s.total_admin_messages}↑)
                </span>
              </td>
              <td className="py-2 text-muted-foreground">{formatMs(s.session_duration_ms)}</td>
              <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                {s.closed_at ? new Date(s.closed_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Leaderboard table ----

function LeaderboardTable({ entries }: { entries: AdminLeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No leaderboard data for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2 font-medium text-muted-foreground text-xs w-10">Rank</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Admin</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs text-right">Sessions</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs text-right">
              Avg First Response
            </th>
            <th className="pb-2 font-medium text-muted-foreground text-xs text-right">
              Knowledge Saved
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.admin_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-2">
                {e.rank <= 3 ? (
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                      e.rank === 1
                        ? "bg-yellow-400"
                        : e.rank === 2
                        ? "bg-gray-400"
                        : "bg-amber-600"
                    }`}
                  >
                    {e.rank}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs pl-1">{e.rank}</span>
                )}
              </td>
              <td className="py-2 font-medium">{e.admin_name || truncateId(e.admin_id)}</td>
              <td className="py-2 text-right">{e.total_sessions}</td>
              <td className="py-2 text-right">
                <span
                  className={
                    e.avg_first_response_ms > 0 && e.avg_first_response_ms <= 300_000
                      ? "text-green-600 font-medium"
                      : e.avg_first_response_ms > 300_000
                      ? "text-destructive font-medium"
                      : ""
                  }
                >
                  {formatMs(e.avg_first_response_ms)}
                </span>
              </td>
              <td className="py-2 text-right">
                <Badge variant="secondary" className="text-xs">
                  {e.knowledge_saved}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- My Stats tab ----

const MY_ADMIN_ID = "me"; // placeholder until auth context is wired

function MyStatsTab() {
  const [period, setPeriod] = useState("7d");
  const [summary, setSummary] = useState<AdminPerformanceSummary | null>(null);
  const [sessions, setSessions] = useState<AdminPerformanceLog[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback((p: string) => {
    setLoadingSummary(true);
    setError(null);
    adminPerformanceApi
      .getSummary(p, MY_ADMIN_ID)
      .then((res) => setSummary(res))
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));

    setLoadingSessions(true);
    adminPerformanceApi
      .listSessions(MY_ADMIN_ID)
      .then((res) => setSessions(res.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const hasAnyData = summary && summary.total_sessions > 0;

  // Determine response-time status against targets
  function firstResponseStatus(ms: number): "good" | "bad" | "neutral" {
    if (!ms || ms <= 0) return "neutral";
    return ms <= 300_000 ? "good" : "bad"; // < 5 min
  }
  function avgResponseStatus(ms: number): "good" | "bad" | "neutral" {
    if (!ms || ms <= 0) return "neutral";
    return ms <= 180_000 ? "good" : "bad"; // < 3 min
  }

  return (
    <div className="space-y-6">
      {/* Period selector + spinner */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodSelector value={period} onChange={setPeriod} />
        {(loadingSummary || loadingSessions) && (
          <RefreshCw size={15} className="animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Metric cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !hasAnyData && !error ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Clock}
            iconColor="bg-blue-500"
            title="Avg First Response"
            value={formatMs(summary?.avg_first_response_ms ?? 0)}
            sub="Target: < 5 min"
            status={firstResponseStatus(summary?.avg_first_response_ms ?? 0)}
          />
          <MetricCard
            icon={Zap}
            iconColor="bg-purple-500"
            title="Avg Response Time"
            value={formatMs(summary?.avg_response_ms ?? 0)}
            sub="Target: < 3 min"
            status={avgResponseStatus(summary?.avg_response_ms ?? 0)}
          />
          <MetricCard
            icon={MessageSquare}
            iconColor="bg-green-500"
            title="Sessions Handled"
            value={summary?.total_sessions ?? 0}
            sub={`${summary?.total_messages ?? 0} total messages`}
          />
          <MetricCard
            icon={BookOpen}
            iconColor="bg-amber-500"
            title="Knowledge Saved"
            value={summary?.knowledge_saved ?? 0}
            sub="Replies promoted to AI KB"
          />
        </div>
      )}

      {/* Recent sessions */}
      {hasAnyData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionsTable sessions={sessions} loading={loadingSessions} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Team Overview tab ----

function TeamOverviewTab() {
  const [period, setPeriod] = useState("30d");
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([]);
  const [teamStats, setTeamStats] = useState<AdminTeamStats | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const loadData = useCallback((p: string) => {
    setLoadingLeaderboard(true);
    adminPerformanceApi
      .getLeaderboard(p)
      .then((res) => setLeaderboard(Array.isArray(res) ? res : []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLeaderboard(false));

    setLoadingTeam(true);
    adminPerformanceApi
      .getTeamStats(p)
      .then((res) => setTeamStats(res))
      .catch(() => setTeamStats(null))
      .finally(() => setLoadingTeam(false));
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const loading = loadingLeaderboard || loadingTeam;

  return (
    <div className="space-y-6">
      {/* Header note + period + spinner */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Super Admin
          </Badge>
        </div>
        {loading && <RefreshCw size={15} className="animate-spin text-muted-foreground" />}
      </div>

      {/* Team summary cards */}
      {loadingTeam ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !teamStats ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            iconColor="bg-blue-500"
            title="Total Sessions"
            value={teamStats.total_sessions}
            sub="Team-wide"
          />
          <MetricCard
            icon={Clock}
            iconColor="bg-purple-500"
            title="Avg First Response"
            value={formatMs(teamStats.avg_first_response_ms)}
            sub="Team average"
          />
          <MetricCard
            icon={Zap}
            iconColor="bg-orange-500"
            title="Busiest Hour"
            value={
              teamStats.busiest_hour >= 0
                ? `${String(teamStats.busiest_hour).padStart(2, "0")}:00`
                : "—"
            }
            sub="Peak activity hour"
          />
          <MetricCard
            icon={MessageSquare}
            iconColor="bg-red-500"
            title="Unassigned Wait"
            value={formatMs(teamStats.unassigned_wait_ms)}
            sub="Avg wait before pickup"
            status={
              teamStats.unassigned_wait_ms > 0
                ? teamStats.unassigned_wait_ms <= 120_000
                  ? "good"
                  : "bad"
                : "neutral"
            }
          />
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          <CardTitle className="text-base">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <RefreshCw size={14} className="animate-spin" />
              Loading…
            </div>
          ) : (
            <LeaderboardTable entries={leaderboard} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main page ----

export function AdminPerformancePage() {
  return (
    <AppLayout title="Admin Performance">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-line p-2">
            <BarChart2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Performance</h1>
            <p className="text-sm text-muted-foreground">
              Response times, session volume, and knowledge contributions
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-stats">
          <TabsList>
            <TabsTrigger value="my-stats">My Stats</TabsTrigger>
            <TabsTrigger value="team">Team Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="my-stats" className="mt-6">
            <MyStatsTab />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamOverviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
