import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  Send,
} from "lucide-react";
import { broadcastApi } from "@/api/broadcast";
import { lineOAApi } from "@/api/lineOA";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import type { Broadcast, BroadcastStatus, BroadcastDeliveryLog, LineOA } from "@/types";

// ─── Status config ──────────────────────────────────────────────────────────

const statusConfig: Record<
  BroadcastStatus,
  {
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
    icon: React.ElementType;
    label: string;
    pulse?: boolean;
  }
> = {
  draft: { variant: "secondary", icon: Clock, label: "Draft" },
  scheduled: { variant: "default", icon: Clock, label: "Scheduled" },
  sending: { variant: "warning", icon: Send, label: "Sending", pulse: true },
  sent: { variant: "success", icon: CheckCircle, label: "Sent" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
  cancelled: { variant: "outline", icon: Ban, label: "Cancelled" },
};

// ─── Phone chat bubble preview ──────────────────────────────────────────────

interface MessagePreviewProps {
  messages: Array<{ type: string; payload: unknown }>;
}

function MessagePreview({ messages }: MessagePreviewProps) {
  if (!messages || messages.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-lg"
      style={{ backgroundColor: "#C6D0D9" }}
    >
      {messages.map((msg, idx) => {
        if (msg.type === "text") {
          const payload = msg.payload as { text?: string };
          return (
            <div key={idx} className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#06C755] flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">OA</span>
              </div>
              <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2 text-sm shadow-sm max-w-[75%] break-words">
                {payload?.text || "(empty)"}
              </div>
            </div>
          );
        }

        if (msg.type === "flex") {
          let contentStr: string | null = null;
          try {
            contentStr = JSON.stringify(msg.payload);
          } catch {
            contentStr = null;
          }
          return (
            <div key={idx} className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#06C755] flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">OA</span>
              </div>
              <div className="flex-1 min-w-0">
                {contentStr ? (
                  <FlexCardPreview content={contentStr} height={200} />
                ) : (
                  <div className="bg-white rounded-xl px-3 py-2 text-sm italic text-muted-foreground">
                    Flex message
                  </div>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── Delivery logs table ────────────────────────────────────────────────────

const PAGE_SIZE = 50;

interface DeliveryLogsProps {
  broadcastId: string;
}

function DeliveryLogs({ broadcastId }: DeliveryLogsProps) {
  const [logs, setLogs] = useState<BroadcastDeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "failed">("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await broadcastApi.listDeliveryLogs(broadcastId, {
        page,
        page_size: PAGE_SIZE,
        status: filter === "failed" ? "failed" : undefined,
      });
      setLogs(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error("Failed to load delivery logs", err);
    } finally {
      setLoading(false);
    }
  }, [broadcastId, page, filter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm">Delivery Logs</CardTitle>
          <div className="flex gap-1 p-1 bg-muted rounded-md text-xs">
            <button
              onClick={() => { setFilter("all"); setPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${filter === "all" ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter("failed"); setPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${filter === "failed" ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Failed only
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{total} total entries</p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
            <RefreshCw size={14} className="animate-spin" />
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {filter === "failed" ? "No failed deliveries." : "No delivery logs yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Line User ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Error Reason</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{log.line_user_id}</td>
                    <td className="px-4 py-2.5">
                      {log.status === "success" ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle size={12} />
                          Success
                        </span>
                      ) : log.status === "failed" ? (
                        <span className="flex items-center gap-1 text-destructive text-xs">
                          <XCircle size={12} />
                          Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">
                      {log.error_message || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {log.sent_at ? new Date(log.sent_at).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Confirm dialog ─────────────────────────────────────────────────────────

interface CancelDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function CancelDialog({ onConfirm, onCancel, loading }: CancelDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Cancel Broadcast?</h2>
        <p className="text-sm text-muted-foreground">
          This will cancel the broadcast. Messages that have already been sent will not be recalled.
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <RefreshCw size={14} className="mr-2 animate-spin" /> : null}
            Cancel Broadcast
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main detail page ───────────────────────────────────────────────────────

export function BroadcastDetailPage() {
  const id = window.location.pathname.split("/")[2];

  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBroadcast = useCallback(async () => {
    try {
      const res = await broadcastApi.get(id);
      // The API may return { data: Broadcast } or the Broadcast directly
      const bc = res?.data ?? (res as unknown as Broadcast);
      if (!bc?.id) {
        setLoadError("Broadcast not found");
        return null;
      }
      setBroadcast(bc);
      return bc;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load broadcast");
      return null;
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const bc = await fetchBroadcast();
      if (bc?.workspace_id) {
        try {
          const oaRes = await lineOAApi.list({ workspace_id: bc.workspace_id });
          setLineOAs(oaRes.data ?? []);
        } catch (err) {
          console.error("Failed to load LINE OAs", err);
        }
      }
      setLoading(false);
    };
    load();
  }, [fetchBroadcast]);

  // Live polling when status is "sending"
  useEffect(() => {
    if (broadcast?.status === "sending") {
      pollingRef.current = setInterval(async () => {
        const updated = await fetchBroadcast();
        if (updated && updated.status !== "sending") {
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [broadcast?.status, fetchBroadcast]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await broadcastApi.cancel(id);
      // The API may return { data: Broadcast } or the Broadcast directly
      const bc = res?.data ?? (res as unknown as Broadcast);
      setBroadcast(bc);
      setShowCancelDialog(false);
    } catch (err) {
      console.error("Failed to cancel broadcast", err);
    } finally {
      setCancelling(false);
    }
  };

  const handleSend = async () => {
    setSendError(null);
    setSending(true);
    try {
      await broadcastApi.send(id);
      await fetchBroadcast();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Broadcast">
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (loadError || !broadcast) {
    return (
      <AppLayout title="Broadcast">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-3">
            <AlertCircle className="mx-auto text-destructive" size={32} />
            <p className="text-destructive font-medium">{loadError ?? "Broadcast not found"}</p>
            <Button variant="ghost" onClick={() => { window.location.href = "/broadcasts"; }}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Broadcasts
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const cfg = statusConfig[broadcast.status];
  const StatusIcon = cfg.icon;
  const canCancel = broadcast.status === "draft" || broadcast.status === "scheduled";
  const canSend = broadcast.status === "draft";
  const lineOA = lineOAs.find((oa) => oa.id === broadcast.line_oa_id);

  // Delivery stats
  const totalRecipients = broadcast.total_recipients ?? 0;
  const successCount = broadcast.success_count ?? 0;
  const failCount = broadcast.fail_count ?? 0;
  const successPct = totalRecipients > 0 ? Math.round((successCount / totalRecipients) * 100) : 0;
  const failPct = totalRecipients > 0 ? Math.round((failCount / totalRecipients) * 100) : 0;

  return (
    <AppLayout title="Broadcast">
      {showCancelDialog && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setShowCancelDialog(false)}
          loading={cancelling}
        />
      )}

      <div className="max-w-3xl space-y-6">
        {/* Back */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { window.location.href = "/broadcasts"; }}
        >
          <ArrowLeft size={14} />
          Back to Broadcasts
        </button>

        {/* Send error banner */}
        {sendError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 text-sm">
            <AlertCircle size={14} />
            Failed to send broadcast: {sendError}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{broadcast.name}</h1>
              {broadcast.campaign_id && (
                <Badge variant="outline" className="text-xs">
                  Campaign
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={cfg.variant}
                className={`gap-1 ${cfg.pulse ? "animate-pulse" : ""}`}
              >
                <StatusIcon size={10} />
                {cfg.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSend && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSend}
                disabled={sending || cancelling}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {sending ? (
                  <RefreshCw size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Send size={14} className="mr-1.5" />
                )}
                {sending ? "Sending..." : "Send Now"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelling || sending}
              >
                <Ban size={14} className="mr-1.5" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Info card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">LINE OA</span>
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>{lineOA?.name ?? broadcast.line_oa_id}</span>
                {lineOA?.basic_id && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
                    @{lineOA.basic_id}
                  </span>
                )}
              </span>

              <span className="text-muted-foreground">Target</span>
              <span>
                {broadcast.target_type === "all" && "All followers"}
                {broadcast.target_type === "segment" && (
                  <>Segment {broadcast.target_segment_id ? `(${broadcast.target_segment_id.slice(-8)})` : ""}</>
                )}
                {broadcast.target_type === "manual" && (
                  <>{(broadcast.target_user_ids?.length ?? 0)} custom users</>
                )}
              </span>

              <span className="text-muted-foreground">Scheduled</span>
              <span>
                {broadcast.scheduled_at
                  ? new Date(broadcast.scheduled_at).toLocaleString()
                  : "—"}
              </span>

              <span className="text-muted-foreground">Sent</span>
              <span>
                {broadcast.sent_at
                  ? new Date(broadcast.sent_at).toLocaleString()
                  : "—"}
              </span>

              <span className="text-muted-foreground">Created</span>
              <span>{new Date(broadcast.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Messages preview */}
        {broadcast.messages && broadcast.messages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <MessagePreview messages={broadcast.messages} />
            </CardContent>
          </Card>
        )}

        {/* Delivery stats */}
        {(broadcast.status === "sending" || broadcast.status === "sent" || broadcast.status === "failed") && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Delivery Stats</CardTitle>
                {broadcast.status === "sending" && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw size={11} className="animate-spin" />
                    Live
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{totalRecipients}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{successCount}</p>
                  <p className="text-xs text-muted-foreground">Success</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{failCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {/* Progress bar */}
              {totalRecipients > 0 && (
                <div className="space-y-1">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${successPct}%` }}
                    />
                    <div
                      className="bg-destructive transition-all duration-500"
                      style={{ width: `${failPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {successPct}% delivered successfully
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery logs */}
        {(broadcast.status === "sending" || broadcast.status === "sent" || broadcast.status === "failed") && (
          <DeliveryLogs broadcastId={broadcast.id} />
        )}
      </div>
    </AppLayout>
  );
}
