import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Users, Zap, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { segmentApi } from "@/api/segment";
import type { Segment } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    segmentApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setSegments(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this segment?")) return;
    setDeletingId(id);
    try {
      await segmentApi.delete(id);
      setSegments((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert("Failed to delete segment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Segments">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Group your followers into segments for targeted broadcasts.
          </p>
          <Button className="gap-2" onClick={() => { window.location.href = "/segments/new"; }}>
            <Plus size={16} />
            New Segment
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && segments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="font-medium">No segments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a segment to group followers by behaviour or attributes.
              </p>
              <Button className="mt-4 gap-2" onClick={() => { window.location.href = "/segments/new"; }}>
                <Plus size={16} />
                New Segment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && segments.length > 0 && (
          <div className="grid gap-3">
            {segments.map((seg) => (
              <Card
                key={seg.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => { window.location.href = `/segments/${seg.id}/edit`; }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-orange-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{seg.name}</span>
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
                        {seg.customer_count ?? 0} followers
                      </span>
                      {seg.rule?.conditions?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {seg.rule.conditions.length} condition{seg.rule.conditions.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(seg.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/segments/${seg.id}/edit`;
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      disabled={deletingId === seg.id}
                      onClick={(e) => { e.stopPropagation(); handleDelete(seg.id); }}
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
    </AppLayout>
  );
}
