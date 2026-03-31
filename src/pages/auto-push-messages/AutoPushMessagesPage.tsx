import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, MessageCircle, Trash2, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { autoPushMessageApi } from "@/api/autoPushMessage";
import type { AutoPushMessage } from "@/api/autoPushMessage";
import { CreateAutoPushDialog } from "./CreateAutoPushDialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";

const targetTypeMeta = {
  "follower": { label: "Single Follower", cls: "bg-blue-100 text-blue-700 border-0" },
  "segment": { label: "Segment", cls: "bg-purple-100 text-purple-700 border-0" },
  "all_followers": { label: "All Followers", cls: "bg-green-100 text-green-700 border-0" },
  "line_group": { label: "LINE Group (Soon)", cls: "bg-gray-100 text-gray-700 border-0" },
  "lon_subscribers": { label: "LON Subscribers", cls: "bg-orange-100 text-orange-700 border-0" },
} as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy Webhook URL"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function DeliveryStats({ apm }: { apm: AutoPushMessage }) {
  const successRate =
    apm.total_deliveries > 0
      ? Math.round((apm.success_count / apm.total_deliveries) * 100)
      : 0;

  return (
    <div className="flex items-center gap-4 text-xs">
      <div>
        <span className="font-semibold">{apm.total_deliveries}</span>
        <span className="text-muted-foreground ml-1">total</span>
      </div>
      <div>
        <span className="font-semibold text-green-600">{apm.success_count}</span>
        <span className="text-muted-foreground ml-1">success</span>
      </div>
      {apm.failure_count > 0 && (
        <div>
          <span className="font-semibold text-red-600">{apm.failure_count}</span>
          <span className="text-muted-foreground ml-1">failed</span>
        </div>
      )}
      {apm.total_deliveries > 0 && (
        <div className="ml-auto">
          <span className="font-semibold">{successRate}%</span>
          <span className="text-muted-foreground ml-1">success rate</span>
        </div>
      )}
    </div>
  );
}

export function AutoPushMessagesPage() {
  const toast = useToast();
  const [apms, setApms] = useState<AutoPushMessage[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");

  // Load LINE OAs on mount
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

  const loadAutoPushMessages = () => {
    if (!selectedLineOAId) return;

    setLoading(true);
    autoPushMessageApi
      .list({ line_oa_id: selectedLineOAId })
      .then((res) => setApms(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAutoPushMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLineOAId]);

  const handleToggle = async (apm: AutoPushMessage) => {
    setTogglingId(apm.id);
    try {
      const updated = await autoPushMessageApi.toggle(apm.id, apm.is_enabled);
      setApms((prev) => prev.map((s) => (s.id === apm.id ? updated.data! : s)));
    } catch {
      toast.error("Failed to toggle auto push message");
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmedDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await autoPushMessageApi.delete(id);
      setApms((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete auto push message");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAutoPushCreated = (apm: AutoPushMessage) => {
    setApms((prev) => [apm, ...prev]);
  };

  return (
    <AppLayout title="Auto Push Messages">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Create reusable message templates triggered by webhook events. Each APM gets a unique webhook endpoint that external systems can POST to.
          </p>
          <Button className="gap-2 self-start sm:self-auto flex-shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create Auto Push
          </Button>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={setSelectedLineOAId}
          showAll={false}
        />

        {/* Loading */}
        {selectedLineOAId && loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty State */}
        {selectedLineOAId && !loading && apms.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">📨</div>
              <p className="font-medium">No auto push messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first auto push message to start sending triggered messages via webhooks.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Create Auto Push Message
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {selectedLineOAId && !loading && apms.length > 0 && (
          <div className="grid gap-3">
            {apms.map((apm) => {
              const typeMeta = targetTypeMeta[apm.target_type as keyof typeof targetTypeMeta] ?? targetTypeMeta["all_followers"];
              const isActive = apm.is_enabled;
              return (
                <Card
                  key={apm.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow${!isActive ? " opacity-60" : ""}`}
                  onClick={() => { window.location.href = `/auto-push-messages/${apm.id}`; }}
                >
                  <CardContent className="flex flex-col gap-4 p-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={18} className="text-blue-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{apm.name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeMeta.cls}`}>
                            {typeMeta.label}
                          </span>
                          {!isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>

                        {/* Description */}
                        {apm.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {apm.description}
                          </p>
                        )}

                        {/* Webhook URL */}
                        <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-sm bg-muted px-2 py-1 rounded">
                            {apm.webhook_url}
                          </span>
                          <CopyButton text={apm.webhook_url} />
                        </div>

                        {/* Template Preview */}
                        <div className="text-xs text-muted-foreground mt-2 bg-muted px-2 py-1 rounded line-clamp-1">
                          {apm.message_type === "flex"
                            ? "📋 Flex Message Template"
                            : `Template: ${apm.message_template}`}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">
                        {new Date(apm.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Stats */}
                    {apm.total_deliveries > 0 && (
                      <div className="border-t pt-3">
                        <DeliveryStats apm={apm} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { void handleToggle(apm); }}
                        disabled={togglingId === apm.id}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={isActive ? "Deactivate" : "Activate"}
                      >
                        {isActive
                          ? <ToggleRight size={22} className="text-green-600" />
                          : <ToggleLeft size={22} />}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        disabled={deletingId === apm.id}
                        onClick={() => setDeleteTarget({ id: apm.id, name: apm.name })}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateAutoPushDialog
        open={createOpen}
        lineOAId={selectedLineOAId}
        onClose={() => setCreateOpen(false)}
        onCreated={handleAutoPushCreated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ "{deleteTarget?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { void handleConfirmedDelete(deleteTarget!.id); setDeleteTarget(null); }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
