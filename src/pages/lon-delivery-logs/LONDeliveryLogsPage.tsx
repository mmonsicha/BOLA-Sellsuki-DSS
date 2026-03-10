import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ScrollText } from "lucide-react";
import type { LONDeliveryLog, LineOA } from "@/types";
import { lonApi } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const statusVariant = {
  success: "success" as const,
  failed: "destructive" as const,
  pending: "secondary" as const,
};

const statusColor = {
  success: "text-green-600",
  failed: "text-red-500",
  pending: "text-yellow-500",
};

export function LONDeliveryLogsPage() {
  const [logs, setLogs] = useState<LONDeliveryLog[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 20;

  // Load LINE OAs once
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

  // Load delivery logs when OA or page changes
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
    setPage(1);
    // Re-trigger by bumping a refresh token if page is already 1
    if (page === 1) setSelectedLineOAId((v) => v);
  }

  function handleOAChange(id: string) {
    setSelectedLineOAId(id);
    setPage(1);
  }

  return (
    <AppLayout title="LON Delivery Logs">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            History of LINE Notification Messaging delivery attempts.
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="self-start sm:self-auto flex-shrink-0">
            <RefreshCw size={14} className="mr-1" />
            Refresh
          </Button>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={handleOAChange}
          showAll={false}
        />

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
                    {/* Left: user + status */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono truncate">{log.line_user_id}</span>
                        <Badge variant={statusVariant[log.status] ?? "secondary"}>
                          {log.status}
                        </Badge>
                        {log.http_status_code && (
                          <span
                            className={`text-xs font-mono ${
                              log.http_status_code >= 200 && log.http_status_code < 300
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            HTTP {log.http_status_code}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        <div>
                          Sent: {new Date(log.sent_at).toLocaleString()} &middot; Triggered by:{" "}
                          <span className="font-medium">{log.triggered_by}</span>
                        </div>
                        {log.error_message && (
                          <div className="text-red-500">Error: {log.error_message}</div>
                        )}
                      </div>
                    </div>

                    {/* Right: message count */}
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <span>{log.messages?.length ?? 0} message{log.messages?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
