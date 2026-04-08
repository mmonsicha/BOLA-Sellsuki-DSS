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
  ScrollText,
  PhoneCall,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Timer,
  Users,
  X,
  MessageSquareHeart,
} from "lucide-react";
import type { LONDeliveryLog, PNPDeliveryLog, LIFFUIDCaptureLog, LineOA } from "@/types";
import { lonApi } from "@/api/lon";
import { liffAdminApi } from "@/api/liff";
import type { DeliveryLogStatsResponse } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";
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

const lonStatusVariant = {
  success: "success" as const,
  failed: "destructive" as const,
  pending: "secondary" as const,
};

const pnpStatusVariant = {
  success: "success" as const,
  failed: "destructive" as const,
};

// ─── Scorecards ───────────────────────────────────────────────────────────────

interface ScorecardsProps {
  stats: DeliveryLogStatsResponse | null;
  loading: boolean;
  variant: "lon" | "pnp";
}

function Scorecards({ stats, loading, variant }: ScorecardsProps) {
  const cards =
    variant === "lon"
      ? [
          { label: "Total", value: stats?.total ?? 0, icon: ScrollText, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Unique Users", value: stats?.unique_users ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Success", value: stats?.success ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Revoked", value: stats?.revoked ?? 0, icon: Ban, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Expired", value: stats?.expired ?? 0, icon: Timer, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/30" },
        ]
      : [
          { label: "Total", value: stats?.total ?? 0, icon: PhoneCall, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Unique Phones", value: stats?.unique_users ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Success", value: stats?.success ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
        ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${variant === "lon" ? "lg:grid-cols-6" : "lg:grid-cols-4"} gap-3`}>
      {cards.map((c) => (
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

// ─── Message Detail Dialog ────────────────────────────────────────────────────

function MessageDetailDialog({
  log,
  onClose,
}: {
  log: LONDeliveryLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={!!log} onClose={onClose} title="Message Detail" className="sm:max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Line User ID</span>
            <p className="font-mono text-xs mt-0.5 break-all">{log.line_user_id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-0.5">
              <Badge variant={lonStatusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
              {log.http_status_code && (
                <span className="text-xs font-mono ml-2">HTTP {log.http_status_code}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Sent At</span>
            <p className="text-xs mt-0.5">{formatDate(log.sent_at)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Triggered By</span>
            <p className="text-xs font-medium mt-0.5">{log.triggered_by}</p>
          </div>
          {log.error_message && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Error</span>
              <p className="text-xs text-red-500 mt-0.5">{log.error_message}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">
            Messages ({log.messages?.length ?? 0})
          </h3>
          {log.messages && log.messages.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {log.messages.map((msg, i) => (
                <pre
                  key={i}
                  className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto border"
                >
                  {JSON.stringify(msg, null, 2)}
                </pre>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No message payload recorded.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function PNPDetailDialog({
  log,
  onClose,
}: {
  log: PNPDeliveryLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={!!log} onClose={onClose} title="PNP Delivery Detail" className="sm:max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p className="font-mono text-xs mt-0.5">
              {log.masked_phone ?? log.phone_hash.slice(0, 12) + "..."}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-0.5">
              <Badge variant={pnpStatusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
              {log.http_status_code && (
                <span className="text-xs font-mono ml-2">HTTP {log.http_status_code}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Template Key</span>
            <p className="text-xs font-mono mt-0.5">{log.template_key}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Triggered By</span>
            <p className="text-xs font-medium mt-0.5">{log.triggered_by}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sent At</span>
            <p className="text-xs mt-0.5">{formatDate(log.sent_at)}</p>
          </div>
          {log.error_message && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Error</span>
              <p className="text-xs text-red-500 mt-0.5">{log.error_message}</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

function FilterBar({
  lineOAs,
  selectedLineOAId,
  onOAChange,
  search,
  onSearchChange,
  from,
  to,
  onFromChange,
  onToChange,
  onRefresh,
  loading,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={onOAChange}
          showAll={false}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto flex-shrink-0"
        >
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search user ID, trigger, error..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <Input
            type="datetime-local"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-9 text-sm w-auto"
          />
          <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
          <Input
            type="datetime-local"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="h-9 text-sm w-auto"
          />
        </div>
      </div>
    </div>
  );
}

// ─── LON Subscribers Tab (hidden — feature disabled) ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface LONLogsTabProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LONLogsTab({ lineOAs, selectedLineOAId, onOAChange }: LONLogsTabProps) {
  const [logs, setLogs] = useState<LONDeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<DeliveryLogStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LONDeliveryLog | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, from, to]);

  const buildDateParams = useCallback(() => {
    const params: { from?: string; to?: string } = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    return params;
  }, [from, to]);

  // Fetch stats
  useEffect(() => {
    if (!selectedLineOAId) return;
    setStatsLoading(true);
    lonApi
      .getDeliveryLogStats({ line_oa_id: selectedLineOAId, ...buildDateParams() })
      .then((res) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [selectedLineOAId, from, to, buildDateParams]);

  // Fetch logs
  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    lonApi
      .listDeliveryLogs({
        line_oa_id: selectedLineOAId,
        page,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        ...buildDateParams(),
      })
      .then((res) => {
        setLogs(res.data ?? []);
        setTotal(res.total ?? 0);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load delivery logs");
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page, debouncedSearch, from, to, buildDateParams]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleOAChange(id: string) {
    onOAChange(id);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  }

  function handleRefresh() {
    // Trigger re-fetch by toggling a dummy state
    setLogs((v) => [...v]);
    setStats(null);
    setStatsLoading(true);
    lonApi
      .getDeliveryLogStats({ line_oa_id: selectedLineOAId, ...buildDateParams() })
      .then((res) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }

  return (
    <div className="space-y-4">
      <Scorecards stats={stats} loading={statsLoading} variant="lon" />

      <FilterBar
        lineOAs={lineOAs}
        selectedLineOAId={selectedLineOAId}
        onOAChange={handleOAChange}
        search={search}
        onSearchChange={setSearch}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" />
          Loading...
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ScrollText size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No delivery logs found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card
              key={log.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setSelectedLog(log)}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono truncate max-w-[200px]">
                        {log.line_user_id}
                      </span>
                      <Badge variant={lonStatusVariant[log.status] ?? "secondary"}>
                        {log.status}
                      </Badge>
                      {log.http_status_code != null && (
                        <span
                          className={`text-xs font-mono ${log.http_status_code >= 200 && log.http_status_code < 300 ? "text-green-600" : "text-red-500"}`}
                        >
                          HTTP {log.http_status_code}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {log.messages?.length ?? 0} msg
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                      <Clock size={10} />
                      {formatDate(log.sent_at)}
                      <span className="mx-1">&middot;</span>
                      <span className="font-medium">{log.triggered_by}</span>
                      {log.error_message && (
                        <span className="text-red-500 ml-1 truncate max-w-[300px]">
                          — {log.error_message}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total.toLocaleString()} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <MessageDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

// ─── LON by Phone (PNP) Tab ──────────────────────────────────────────────────

interface PNPLogsTabProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
}

function PNPLogsTab({ lineOAs, selectedLineOAId, onOAChange }: PNPLogsTabProps) {
  const [logs, setLogs] = useState<PNPDeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<DeliveryLogStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PNPDeliveryLog | null>(null);

  const localPhoneMap = (() => {
    try {
      return JSON.parse(localStorage.getItem("bola_lon_phone_map") ?? "{}") as Record<
        string,
        string
      >;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, from, to]);

  const buildDateParams = useCallback(() => {
    const params: { from?: string; to?: string } = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    return params;
  }, [from, to]);

  // Fetch stats
  useEffect(() => {
    if (!selectedLineOAId) return;
    setStatsLoading(true);
    lonApi
      .getPNPLogStats({ line_oa_id: selectedLineOAId, ...buildDateParams() })
      .then((res) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [selectedLineOAId, from, to, buildDateParams]);

  // Fetch logs
  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    lonApi
      .listLONByPhoneLogs({
        line_oa_id: selectedLineOAId,
        page,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        ...buildDateParams(),
      })
      .then((res) => {
        setLogs(res.data ?? []);
        setTotal(res.total ?? 0);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load PNP logs");
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page, debouncedSearch, from, to, buildDateParams]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleOAChange(id: string) {
    onOAChange(id);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  }

  function handleRefresh() {
    setLogs((v) => [...v]);
    setStats(null);
    setStatsLoading(true);
    lonApi
      .getPNPLogStats({ line_oa_id: selectedLineOAId, ...buildDateParams() })
      .then((res) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }

  return (
    <div className="space-y-4">
      <Scorecards stats={stats} loading={statsLoading} variant="pnp" />

      <FilterBar
        lineOAs={lineOAs}
        selectedLineOAId={selectedLineOAId}
        onOAChange={handleOAChange}
        search={search}
        onSearchChange={setSearch}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" />
          Loading...
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PhoneCall size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No LON by Phone delivery logs found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const maskedPhone = log.masked_phone ?? localPhoneMap[log.phone_hash];
            return (
              <Card
                key={log.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {maskedPhone ? (
                          <span className="text-sm font-mono font-medium">{maskedPhone}</span>
                        ) : (
                          <span
                            className="text-sm font-mono text-muted-foreground truncate max-w-[200px]"
                            title={log.phone_hash}
                          >
                            {log.phone_hash.slice(0, 8)}...
                          </span>
                        )}
                        <Badge variant={pnpStatusVariant[log.status] ?? "secondary"}>
                          {log.status}
                        </Badge>
                        {log.http_status_code != null && (
                          <span className="text-xs font-mono text-muted-foreground">
                            HTTP {log.http_status_code}
                          </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.template_key}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                        <Clock size={10} />
                        {formatDate(log.sent_at)}
                        {log.error_message && (
                          <span className="text-destructive ml-2 truncate max-w-[300px]">
                            — {log.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total.toLocaleString()} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <PNPDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

// ─── On Greeting Sent Tab (LIFF UID Capture Logs) ───────────────────────────

interface OnGreetingTabProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
}

function OnGreetingTab({ lineOAs, selectedLineOAId, onOAChange }: OnGreetingTabProps) {
  const [records, setRecords] = useState<LIFFUIDCaptureLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    liffAdminApi
      .listUIDCaptureLogs({ line_oa_id: selectedLineOAId, page, page_size: PAGE_SIZE })
      .then((res) => {
        setRecords(res.data ?? []);
        setTotal(res.total ?? 0);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load UID capture logs");
        setRecords([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleOAChange(id: string) {
    onOAChange(id);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <Card className="bg-muted/50">
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquareHeart size={16} className="text-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Captured</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "..." : total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={handleOAChange}
          showAll={false}
        />
        <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading} className="flex-shrink-0">
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" />
          Loading...
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareHeart size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No UID capture logs found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {rec.picture_url ? (
                    <img
                      src={rec.picture_url}
                      alt={rec.display_name || rec.line_user_id}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground font-medium">
                        {(rec.display_name || rec.line_user_id).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {rec.display_name || <span className="font-mono text-muted-foreground">{rec.line_user_id}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(rec.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total.toLocaleString()} total)
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LONDeliveryLogsPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");

  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedLineOAId(oas[0].id);
      })
      .catch(console.error);
  }, []);

  return (
    <AppLayout title="LON Delivery Logs">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          History of LINE Notification Messaging delivery attempts.
        </p>

        <Tabs defaultValue="pnp">
          <TabsList>
            {/* <TabsTrigger value="subscribers">
              <ScrollText size={14} className="mr-1.5" />
              LON Subscribers
            </TabsTrigger> */}
            <TabsTrigger value="pnp">
              <PhoneCall size={14} className="mr-1.5" />
              LON by Phone
            </TabsTrigger>
            <TabsTrigger value="on-greeting">
              <MessageSquareHeart size={14} className="mr-1.5" />
              On Greeting
            </TabsTrigger>
          </TabsList>

          {/* <TabsContent value="subscribers">
            <LONLogsTab
              lineOAs={lineOAs}
              selectedLineOAId={selectedLineOAId}
              onOAChange={setSelectedLineOAId}
            />
          </TabsContent> */}

          <TabsContent value="pnp">
            <PNPLogsTab
              lineOAs={lineOAs}
              selectedLineOAId={selectedLineOAId}
              onOAChange={setSelectedLineOAId}
            />
          </TabsContent>

          <TabsContent value="on-greeting">
            <OnGreetingTab
              lineOAs={lineOAs}
              selectedLineOAId={selectedLineOAId}
              onOAChange={setSelectedLineOAId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
