import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import {
  RefreshCw,
  Megaphone,
  MessageSquareReply,
  Zap,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  AlertTriangle,
  X,
} from "lucide-react";
import { messageLogsApi } from "@/api/messageLogs";
import type {
  BroadcastDeliveryLog,
  BroadcastDeliveryLogStats,
  AutoReplyLogEntry,
  AutoReplyLogStats,
  AutoPushDeliveryLog,
  AutoPushDeliveryLogStats,
  LogFilterParams,
} from "@/api/messageLogs";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { getWorkspaceId } from "@/lib/auth";
import type { LineOA } from "@/types";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return toLocalDatetimeValue(d);
}

const statusVariant: Record<string, "success" | "destructive" | "secondary"> = {
  success: "success",
  failed: "destructive",
  pending: "secondary",
  partial_failure: "destructive",
};

// ─── Shared Components ────────────────────────────────────────────────────────

interface ScorecardsProps {
  items: { label: string; value: number; icon: React.ElementType; color: string; bg: string }[];
  loading: boolean;
}

function Scorecards({ items, loading }: ScorecardsProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(items.length, 6)} gap-3`}>
      {items.map((c) => (
        <Card key={c.label} className={c.bg}>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon size={16} className={c.color} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${c.color}`}>
              {loading ? "..." : c.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRefresh: () => void;
  loading: boolean;
  lineOAs?: LineOA[];
  selectedLineOAId?: string;
  onOAChange?: (id: string) => void;
}

function FilterBar({ search, onSearchChange, from, to, onFromChange, onToChange, onRefresh, loading, lineOAs, selectedLineOAId, onOAChange }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {lineOAs && selectedLineOAId !== undefined && onOAChange ? (
          <LineOAFilter lineOAs={lineOAs} selectedId={selectedLineOAId} onChange={onOAChange} showAll={false} />
        ) : (
          <div />
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="self-start sm:self-auto flex-shrink-0">
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 h-9 text-sm" />
          {search && (
            <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <Input type="datetime-local" value={from} onChange={(e) => onFromChange(e.target.value)} className="h-9 text-sm w-auto" />
          <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
          <Input type="datetime-local" value={to} onChange={(e) => onToChange(e.target.value)} className="h-9 text-sm w-auto" />
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, loading, onPrev, onNext }: {
  page: number; totalPages: number; total: number; loading: boolean;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={onPrev}>Previous</Button>
      <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total.toLocaleString()} total)</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={onNext}>Next</Button>
    </div>
  );
}

// ─── Broadcast Tab ────────────────────────────────────────────────────────────

function BroadcastTab({ lineOAs }: { lineOAs: LineOA[] }) {
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [logs, setLogs] = useState<BroadcastDeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<BroadcastDeliveryLogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selected, setSelected] = useState<BroadcastDeliveryLog | null>(null);

  useEffect(() => { if (lineOAs.length > 0 && !selectedLineOAId) setSelectedLineOAId(lineOAs[0].id); }, [lineOAs, selectedLineOAId]);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, from, to, selectedLineOAId]);

  const dateParams = useCallback(() => {
    const p: { from?: string; to?: string } = {};
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [from, to]);

  useEffect(() => {
    if (!selectedLineOAId) return;
    setStatsLoading(true);
    messageLogsApi.getBroadcastStats({ line_oa_id: selectedLineOAId, ...dateParams() })
      .then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false));
  }, [selectedLineOAId, from, to, dateParams]);

  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    const params: LogFilterParams = { line_oa_id: selectedLineOAId, page, page_size: PAGE_SIZE, search: debouncedSearch || undefined, ...dateParams() };
    messageLogsApi.listBroadcastLogs(params)
      .then((res) => { setLogs(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page, debouncedSearch, from, to, dateParams]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scoreItems = [
    { label: "Total", value: stats?.total ?? 0, icon: Megaphone, color: "text-foreground", bg: "bg-muted/50" },
    { label: "Success", value: stats?.success ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Hourglass, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/30" },
  ];

  return (
    <div className="space-y-4">
      <Scorecards items={scoreItems} loading={statsLoading} />
      <FilterBar search={search} onSearchChange={setSearch} from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onRefresh={() => setPage(1)} loading={loading} lineOAs={lineOAs} selectedLineOAId={selectedLineOAId}
        onOAChange={(id) => { setSelectedLineOAId(id); setSearch(""); setDebouncedSearch(""); }} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><RefreshCw size={14} className="animate-spin" />Loading...</div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Megaphone size={32} className="mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground text-sm">No broadcast delivery logs found.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(log)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono truncate max-w-[200px]">{log.line_user_id}</span>
                      <Badge variant={statusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock size={10} />{log.sent_at ? formatDate(log.sent_at) : formatDate(log.created_at)}
                      {log.error_message && <span className="text-red-500 ml-1 truncate max-w-[300px]">— {log.error_message}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </div>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Broadcast Delivery Detail">
        {selected && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Line User ID</span><p className="font-mono text-xs mt-0.5 break-all">{selected.line_user_id}</p></div>
            <div><span className="text-muted-foreground">Status</span><div className="mt-0.5"><Badge variant={statusVariant[selected.status] ?? "secondary"}>{selected.status}</Badge></div></div>
            <div><span className="text-muted-foreground">Broadcast ID</span><p className="text-xs font-mono mt-0.5 break-all">{selected.broadcast_id}</p></div>
            <div><span className="text-muted-foreground">Sent At</span><p className="text-xs mt-0.5">{selected.sent_at ? formatDate(selected.sent_at) : "—"}</p></div>
            {selected.error_message && <div className="col-span-2"><span className="text-muted-foreground">Error</span><p className="text-xs text-red-500 mt-0.5">{selected.error_message}</p></div>}
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ─── Auto-Reply Tab ───────────────────────────────────────────────────────────

function AutoReplyTab({ lineOAs }: { lineOAs: LineOA[] }) {
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [logs, setLogs] = useState<AutoReplyLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<AutoReplyLogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selected, setSelected] = useState<AutoReplyLogEntry | null>(null);

  useEffect(() => { if (lineOAs.length > 0 && !selectedLineOAId) setSelectedLineOAId(lineOAs[0].id); }, [lineOAs, selectedLineOAId]);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, from, to, selectedLineOAId]);

  const dateParams = useCallback(() => {
    const p: { from?: string; to?: string } = {};
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [from, to]);

  useEffect(() => {
    if (!selectedLineOAId) return;
    setStatsLoading(true);
    messageLogsApi.getAutoReplyStats({ line_oa_id: selectedLineOAId, ...dateParams() })
      .then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false));
  }, [selectedLineOAId, from, to, dateParams]);

  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    messageLogsApi.listAutoReplyLogs({ line_oa_id: selectedLineOAId, page, page_size: PAGE_SIZE, search: debouncedSearch || undefined, ...dateParams() })
      .then((res) => { setLogs(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page, debouncedSearch, from, to, dateParams]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scoreItems = [
    { label: "Total Sent", value: stats?.total ?? 0, icon: MessageSquareReply, color: "text-foreground", bg: "bg-muted/50" },
  ];

  return (
    <div className="space-y-4">
      <Scorecards items={scoreItems} loading={statsLoading} />
      <FilterBar search={search} onSearchChange={setSearch} from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onRefresh={() => setPage(1)} loading={loading} lineOAs={lineOAs} selectedLineOAId={selectedLineOAId}
        onOAChange={(id) => { setSelectedLineOAId(id); setSearch(""); setDebouncedSearch(""); }} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><RefreshCw size={14} className="animate-spin" />Loading...</div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><MessageSquareReply size={32} className="mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground text-sm">No auto-reply logs found.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(log)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.follower_display_name && (
                        <span className="text-sm font-medium">{log.follower_display_name}</span>
                      )}
                      <Badge variant="secondary">{log.message_type}</Badge>
                      <span className="text-sm text-muted-foreground truncate max-w-[300px]">{log.content.length > 60 ? log.content.slice(0, 60) + "..." : log.content}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock size={10} />{formatDate(log.created_at)}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </div>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Auto-Reply Message Detail">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Sent To</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {selected.follower_picture_url && (
                    <img src={selected.follower_picture_url} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <p className="text-xs font-medium">{selected.follower_display_name || "Unknown"}</p>
                </div>
              </div>
              <div><span className="text-muted-foreground">Type</span><p className="text-xs mt-0.5"><Badge variant="secondary">{selected.message_type}</Badge></p></div>
              <div><span className="text-muted-foreground">Sent At</span><p className="text-xs mt-0.5">{formatDate(selected.created_at)}</p></div>
              <div><span className="text-muted-foreground">Session ID</span><p className="text-xs font-mono mt-0.5 break-all">{selected.session_id}</p></div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Content</span>
              <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto border mt-1 whitespace-pre-wrap">{selected.content}</pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ─── Auto Push Message Tab ────────────────────────────────────────────────────

function AutoPushTab() {
  const [logs, setLogs] = useState<AutoPushDeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<AutoPushDeliveryLogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selected, setSelected] = useState<AutoPushDeliveryLog | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, from, to]);

  const dateParams = useCallback(() => {
    const p: { from?: string; to?: string } = {};
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [from, to]);

  useEffect(() => {
    setStatsLoading(true);
    messageLogsApi.getAutoPushStats(dateParams())
      .then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false));
  }, [from, to, dateParams]);

  useEffect(() => {
    setLoading(true);
    messageLogsApi.listAutoPushLogs({ page, page_size: PAGE_SIZE, search: debouncedSearch || undefined, ...dateParams() })
      .then((res) => { setLogs(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, from, to, dateParams]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scoreItems = [
    { label: "Total", value: stats?.total ?? 0, icon: Zap, color: "text-foreground", bg: "bg-muted/50" },
    { label: "Success", value: stats?.success ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Partial", value: stats?.partial_failure ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Hourglass, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/30" },
  ];

  return (
    <div className="space-y-4">
      <Scorecards items={scoreItems} loading={statsLoading} />
      <FilterBar search={search} onSearchChange={setSearch} from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onRefresh={() => setPage(1)} loading={loading} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><RefreshCw size={14} className="animate-spin" />Loading...</div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Zap size={32} className="mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground text-sm">No auto push delivery logs found.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(log)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={statusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
                      <span className="text-xs text-muted-foreground">{log.success_count} ok / {log.failure_count} fail / {log.target_follower_count} target</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock size={10} />{formatDate(log.triggered_at)}
                      {log.error_message && <span className="text-red-500 ml-1 truncate max-w-[300px]">— {log.error_message}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </div>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Auto Push Delivery Detail">
        {selected && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Status</span><div className="mt-0.5"><Badge variant={statusVariant[selected.status] ?? "secondary"}>{selected.status}</Badge></div></div>
            <div><span className="text-muted-foreground">Triggered At</span><p className="text-xs mt-0.5">{formatDate(selected.triggered_at)}</p></div>
            <div><span className="text-muted-foreground">Target</span><p className="text-xs mt-0.5">{selected.target_follower_count} followers</p></div>
            <div><span className="text-muted-foreground">Success / Fail</span><p className="text-xs mt-0.5">{selected.success_count} / {selected.failure_count}</p></div>
            {selected.completed_at && <div><span className="text-muted-foreground">Completed</span><p className="text-xs mt-0.5">{formatDate(selected.completed_at)}</p></div>}
            {selected.error_message && <div className="col-span-2"><span className="text-muted-foreground">Error</span><p className="text-xs text-red-500 mt-0.5">{selected.error_message}</p></div>}
            <div><span className="text-muted-foreground">APM ID</span><p className="text-xs font-mono mt-0.5 break-all">{selected.auto_push_message_id}</p></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MessageLogsPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);

  useEffect(() => {
    const wsId = getWorkspaceId() ?? "";
    lineOAApi.list({ workspace_id: wsId })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(console.error);
  }, []);

  return (
    <AppLayout title="Message Logs">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Delivery history for Broadcasts, Auto-Replies, and Auto Push Messages.
        </p>

        <Tabs defaultValue="broadcast">
          <TabsList>
            <TabsTrigger value="broadcast"><Megaphone size={14} className="mr-1.5" />Broadcast</TabsTrigger>
            <TabsTrigger value="auto-reply"><MessageSquareReply size={14} className="mr-1.5" />Auto-Reply</TabsTrigger>
            <TabsTrigger value="auto-push"><Zap size={14} className="mr-1.5" />Auto Push</TabsTrigger>
          </TabsList>

          <TabsContent value="broadcast"><BroadcastTab lineOAs={lineOAs} /></TabsContent>
          <TabsContent value="auto-reply"><AutoReplyTab lineOAs={lineOAs} /></TabsContent>
          <TabsContent value="auto-push"><AutoPushTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
