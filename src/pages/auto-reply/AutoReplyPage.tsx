import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Bot, Trash2, ToggleLeft, ToggleRight, GripVertical, Edit3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { autoReplyApi } from "@/api/autoReply";
import { lineOAApi } from "@/api/lineOA";
import type { AutoReply, LineOA, TriggerType } from "@/types";
import { AutoReplyDialog } from "./AutoReplyDialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const triggerLabel: Record<TriggerType, string> = {
  follow:   "Follow",
  unfollow: "Unfollow",
  keyword:  "Keyword",
  postback: "Postback",
  default:  "Default",
};

const triggerVariant: Record<TriggerType, "default" | "secondary" | "success" | "warning" | "outline" | "destructive"> = {
  follow:   "success",
  unfollow: "destructive",
  keyword:  "default",
  postback: "warning",
  default:  "secondary",
};

export function AutoReplyPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState("");
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AutoReply | null>(null);

  // Drag-to-reorder state
  const dragIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Load LINE OAs for filter
  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedOA(oas[0].id);
      })
      .catch(console.error);
  }, []);

  // Load auto replies when OA changes
  useEffect(() => {
    if (!selectedOA) return;
    setLoading(true);
    autoReplyApi
      .list({ line_oa_id: selectedOA })
      .then((res) => {
        const sorted = (res.data ?? []).slice().sort((a, b) => a.priority - b.priority);
        setAutoReplies(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedOA]);

  const handleToggle = async (ar: AutoReply) => {
    setTogglingId(ar.id);
    try {
      const updated = await autoReplyApi.update(ar.id, { is_enabled: !ar.is_enabled });
      setAutoReplies((prev) => prev.map((r) => (r.id === ar.id ? updated : r)));
    } catch {
      alert("Failed to toggle auto reply");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this auto reply?")) return;
    setDeletingId(id);
    try {
      await autoReplyApi.delete(id);
      setAutoReplies((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete auto reply");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEdit = (ar: AutoReply) => {
    setEditingItem(ar);
    setDialogOpen(true);
  };

  const handleSaved = (saved: AutoReply) => {
    setAutoReplies((prev) => {
      const exists = prev.find((r) => r.id === saved.id);
      const updated = exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [...prev, saved];
      return updated.slice().sort((a, b) => a.priority - b.priority);
    });
    setDialogOpen(false);
  };

  // ---- drag-to-reorder handlers ----

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    setDraggingId(autoReplies[index].id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const from = dragIndex.current;
    if (from === null || from === index) return;

    setAutoReplies((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(index, 0, item);
      dragIndex.current = index;
      return next;
    });
  };

  const handleDragEnd = async () => {
    setDraggingId(null);
    // Persist new priorities: each item gets priority = index * 10 + 10
    const updates = autoReplies.map((ar, i) => ({
      id: ar.id,
      priority: (i + 1) * 10,
    }));
    try {
      await Promise.all(updates.map(({ id, priority }) => autoReplyApi.update(id, { priority })));
      setAutoReplies((prev) =>
        prev.map((ar, i) => ({ ...ar, priority: (i + 1) * 10 }))
      );
    } catch {
      // Non-critical — UI already reflects the order
    }
  };

  return (
    <AppLayout title="Auto Reply">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Automatically reply to messages based on triggers.
          </p>
          <Button className="gap-2 self-start sm:self-auto flex-shrink-0" onClick={openCreate} disabled={!selectedOA}>
            <Plus size={16} />
            New Auto Reply
          </Button>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedOA}
          onChange={setSelectedOA}
          showAll={false}
        />

        {/* No OA state */}
        {lineOAs.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Connect a LINE OA first to manage auto replies.</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && selectedOA && autoReplies.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">🤖</div>
              <p className="font-medium">No auto replies yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set up automated replies for follows, keywords, and more.
              </p>
              <Button className="mt-4 gap-2" onClick={openCreate}>
                <Plus size={16} />
                New Auto Reply
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Drag-hint */}
        {!loading && autoReplies.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Drag <GripVertical size={12} className="inline -mt-0.5" /> to reorder priority.
            Lower position = evaluated first.
          </p>
        )}

        {/* List */}
        {!loading && autoReplies.length > 0 && (
          <div className="grid gap-2">
            {autoReplies.map((ar, index) => (
              <Card
                key={ar.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={[
                  "cursor-default select-none transition-opacity",
                  !ar.is_enabled ? "opacity-60" : "",
                  draggingId === ar.id ? "opacity-40 ring-2 ring-blue-400" : "",
                ].join(" ")}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
                    <GripVertical size={16} />
                  </div>

                  {/* Priority badge */}
                  <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">
                    #{index + 1}
                  </span>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-blue-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{ar.name}</span>
                      <Badge variant={triggerVariant[ar.trigger]}>
                        {triggerLabel[ar.trigger] ?? ar.trigger}
                      </Badge>
                      {!ar.is_enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {ar.keywords?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Keywords: {ar.keywords.slice(0, 3).join(", ")}
                          {ar.keywords.length > 3 && ` +${ar.keywords.length - 3}`}
                        </span>
                      )}
                      {ar.postback_data && (
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                          {ar.postback_data}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {ar.messages?.length ?? 0} message{ar.messages?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(ar)}
                      disabled={togglingId === ar.id}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={ar.is_enabled ? "Disable" : "Enable"}
                    >
                      {ar.is_enabled
                        ? <ToggleRight size={22} className="text-line" />
                        : <ToggleLeft size={22} />}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(ar)}>
                      <Edit3 size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      disabled={deletingId === ar.id}
                      onClick={() => handleDelete(ar.id)}
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

      {/* Create / Edit dialog */}
      <AutoReplyDialog
        open={dialogOpen}
        lineOAId={selectedOA}
        existing={editingItem}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
    </AppLayout>
  );
}
