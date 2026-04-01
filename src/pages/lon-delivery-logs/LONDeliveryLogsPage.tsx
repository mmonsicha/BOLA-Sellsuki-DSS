import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, ScrollText, PhoneCall } from "lucide-react";
import type { LONDeliveryLog, PNPDeliveryLog, LineOA } from "@/types";
import { lonApi } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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

// ─── LON Subscribers Tab ───────────────────────────────────────────────────────

interface LONLogsTabProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
}

function LONLogsTab({ lineOAs, selectedLineOAId, onOAChange }: LONLogsTabProps) {
  const [logs, setLogs] = useState<LONDeliveryLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    lonApi
      .listDeliveryLogs({ line_oa_id: selectedLineOAId, page, page_size: PAGE_SIZE })
      .then((res) => {
        const data = res.data ?? [];
        setLogs(data);
        setHasMore(data.length === PAGE_SIZE);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load delivery logs");
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page]);

  function handleRefresh() {
    if (page === 1) setLogs((v) => [...v]);
    else setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LineOAFilter lineOAs={lineOAs} selectedId={selectedLineOAId} onChange={(id) => { onOAChange(id); setPage(1); }} showAll={false} />
        <Button variant="outline" size="sm" onClick={handleRefresh} className="self-start sm:self-auto flex-shrink-0">
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
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
            <Card key={log.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono truncate">{log.line_user_id}</span>
                      <Badge variant={lonStatusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
                      {log.http_status_code && (
                        <span className={`text-xs font-mono ${log.http_status_code >= 200 && log.http_status_code < 300 ? "text-green-600" : "text-red-500"}`}>
                          HTTP {log.http_status_code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                      <div>
                        Sent: {formatDate(log.sent_at)} &middot; Triggered by:{" "}
                        <span className="font-medium">{log.triggered_by}</span>
                      </div>
                      {log.error_message && (
                        <div className="text-red-500">Error: {log.error_message}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <span>{log.messages?.length ?? 0} message{log.messages?.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LON by Phone (PNP) Tab ────────────────────────────────────────────────────

interface PNPLogsTabProps {
  lineOAs: LineOA[];
  selectedLineOAId: string;
  onOAChange: (id: string) => void;
}

function PNPLogsTab({ lineOAs, selectedLineOAId, onOAChange }: PNPLogsTabProps) {
  const [logs, setLogs] = useState<PNPDeliveryLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read phone_hash → masked_phone mapping written by LON by Phone page on successful send
  const phoneMap = (() => {
    try { return JSON.parse(localStorage.getItem("bola_lon_phone_map") ?? "{}") as Record<string, string>; }
    catch { return {} as Record<string, string>; }
  })();

  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);
    lonApi
      .listLONByPhoneLogs({ line_oa_id: selectedLineOAId, page, page_size: PAGE_SIZE })
      .then((res) => {
        setLogs(res.data ?? []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load PNP logs");
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, page]);

  function handleRefresh() {
    if (page === 1) setLogs((v) => [...v]);
    else setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LineOAFilter lineOAs={lineOAs} selectedId={selectedLineOAId} onChange={(id) => { onOAChange(id); setPage(1); }} showAll={false} />
        <Button variant="outline" size="sm" onClick={handleRefresh} className="self-start sm:self-auto flex-shrink-0">
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
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
            const maskedPhone = phoneMap[log.phone_hash];
            return (
              <Card key={log.id}>
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {maskedPhone ? (
                        <span className="text-sm font-mono text-foreground font-medium">{maskedPhone}</span>
                      ) : (
                        <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]" title={log.phone_hash}>
                          {log.phone_hash.slice(0, 8)}…
                        </span>
                      )}
                      <Badge variant={pnpStatusVariant[log.status] ?? "secondary"}>{log.status}</Badge>
                      {log.http_status_code && (
                        <span className="text-xs text-muted-foreground">HTTP {log.http_status_code}</span>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">{log.template_key}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(log.sent_at)}
                      {log.error_message && (
                        <span className="text-destructive ml-2">— {log.error_message}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

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

        <Tabs defaultValue="subscribers">
          <TabsList>
            <TabsTrigger value="subscribers">
              <ScrollText size={14} className="mr-1.5" />
              LON Subscribers
            </TabsTrigger>
            <TabsTrigger value="pnp">
              <PhoneCall size={14} className="mr-1.5" />
              LON by Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers">
            <LONLogsTab
              lineOAs={lineOAs}
              selectedLineOAId={selectedLineOAId}
              onOAChange={setSelectedLineOAId}
            />
          </TabsContent>

          <TabsContent value="pnp">
            <PNPLogsTab
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
