import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Users, Phone, Zap, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { segmentApi } from "@/api/segment";
import { broadcastApi } from "@/api/broadcast";
import type { Segment, Broadcast } from "@/types";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
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

export function SegmentsPage() {
  const toast = useToast();
  const { isEditorOrAbove } = useCurrentAdmin();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<"all" | "follower" | "contact">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [affectedBroadcasts, setAffectedBroadcasts] = useState<Broadcast[]>([]);
  const [checkingUsage, setCheckingUsage] = useState(false);

  const load = () => {
    setLoading(true);
    segmentApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setSegments(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredSegments = useMemo(() => {
    if (sourceFilter === "all") return segments;
    return segments.filter((s) => s.source_type === sourceFilter);
  }, [segments, sourceFilter]);

  const handleConfirmedDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await segmentApi.delete(id);
      setSegments((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error("Failed to delete segment", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Segments">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Group your followers into segments for targeted broadcasts.
          </p>
          {isEditorOrAbove && (
            <Button className="gap-2 self-start sm:self-auto flex-shrink-0" onClick={() => { window.location.href = "/segments/new"; }}>
              <Plus size={16} />
              New Segment
            </Button>
          )}
        </div>

        {/* Source type filter */}
        <div className="flex gap-2">
          {(["all", "follower", "contact"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                sourceFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {f === "follower" && <Users size={13} />}
              {f === "contact" && <Phone size={13} />}
              {f === "all" ? "ทั้งหมด" : f === "follower" ? "By Follower" : "By Contact"}
              <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                sourceFilter === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {f === "all" ? segments.length : segments.filter((s) => s.source_type === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredSegments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="font-medium">No segments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a segment to group followers by behaviour or attributes.
              </p>
              {isEditorOrAbove && (
                <Button className="mt-4 gap-2" onClick={() => { window.location.href = "/segments/new"; }}>
                  <Plus size={16} />
                  New Segment
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && filteredSegments.length > 0 && (
          <div className="grid gap-3">
            {filteredSegments.map((seg) => (
              <Card
                key={seg.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => { window.location.href = `/segments/${seg.id}/edit`; }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    seg.source_type === "contact" ? "bg-blue-100" : "bg-orange-100"
                  }`}>
                    {seg.source_type === "contact"
                      ? <Phone size={18} className="text-blue-600" />
                      : <Users size={18} className="text-orange-600" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{seg.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${seg.source_type === "contact" ? "border-blue-300 text-blue-600" : "border-orange-300 text-orange-600"}`}
                      >
                        {seg.source_type === "contact" ? <Phone size={9} /> : <Users size={9} />}
                        {seg.source_type === "contact" ? "Contact" : "Follower"}
                      </Badge>
                      {seg.is_dynamic && (
                        <Badge variant="default" className="gap-1 text-xs">
                          <Zap size={10} />
                          Dynamic
                        </Badge>
                      )}
                    </div>
                    {seg.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{seg.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {seg.customer_count ?? 0} {seg.source_type === "contact" ? "contacts" : "followers"}
                      </span>
                      {seg.rule?.conditions?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {seg.rule.conditions.length} condition{seg.rule.conditions.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">
                    {new Date(seg.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      disabled={deletingId === seg.id || checkingUsage}
                      onClick={(e) => {
                        e.stopPropagation();
                        void (async () => {
                          setCheckingUsage(true);
                          setAffectedBroadcasts([]);
                          try {
                            const res = await broadcastApi.list({ workspace_id: WORKSPACE_ID, page_size: 100 });
                            const active = (res.data ?? []).filter(
                              (b) => b.target_segment_id === seg.id &&
                                (b.status === "scheduled" || b.status === "sending" || b.status === "draft")
                            );
                            setAffectedBroadcasts(active);
                          } catch { /* ignore — show generic warning */ }
                          finally { setCheckingUsage(false); }
                          setDeleteTarget({ id: seg.id, name: seg.name });
                        })();
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setAffectedBroadcasts([]); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Segment</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>คุณต้องการลบ <strong>"{deleteTarget?.name}"</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                {affectedBroadcasts.length > 0 ? (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Segment นี้ถูกใช้ใน {affectedBroadcasts.length} broadcast ที่ยังไม่ส่ง:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {affectedBroadcasts.slice(0, 5).map((b) => (
                          <li key={b.id} className="text-xs">
                            {b.name || b.campaign_name || `#${b.id.slice(-8)}`}{" "}
                            <span className="opacity-70">({b.status})</span>
                          </li>
                        ))}
                        {affectedBroadcasts.length > 5 && (
                          <li className="text-xs opacity-70">และอีก {affectedBroadcasts.length - 5} รายการ</li>
                        )}
                      </ul>
                      <p className="text-xs">การลบ segment นี้จะทำให้ broadcast เหล่านี้ส่งไม่ได้</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <p>การกระทำนี้ไม่สามารถย้อนกลับได้ หาก segment นี้ถูกใช้ใน broadcast ที่ scheduled ไว้จะได้รับผลกระทบ</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { void handleConfirmedDelete(deleteTarget!.id); setDeleteTarget(null); setAffectedBroadcasts([]); }}
            >
              {affectedBroadcasts.length > 0 ? "ลบแม้มี broadcast ที่ใช้อยู่" : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
