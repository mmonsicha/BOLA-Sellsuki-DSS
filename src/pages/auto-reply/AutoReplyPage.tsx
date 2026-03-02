import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Bot, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, useEffect } from "react";
import { autoReplyApi } from "@/api/autoReply";
import { lineOAApi } from "@/api/lineOA";
import type { AutoReply, LineOA, TriggerType } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const triggerLabel: Record<TriggerType, string> = {
  follow:   "Follow",
  keyword:  "Keyword",
  postback: "Postback",
  message:  "Any Message",
  image:    "Image",
};

const triggerVariant: Record<TriggerType, "default" | "secondary" | "success" | "warning" | "outline"> = {
  follow:   "success",
  keyword:  "default",
  postback: "warning",
  message:  "secondary",
  image:    "outline",
};

export function AutoReplyPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState("");
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      .then((res) => setAutoReplies(res.data ?? []))
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

  return (
    <AppLayout title="Auto Reply">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Automatically reply to messages based on triggers.
            </p>
            {lineOAs.length > 0 && (
              <select
                className="border rounded-md px-3 py-1.5 text-sm bg-background"
                value={selectedOA}
                onChange={(e) => setSelectedOA(e.target.value)}
              >
                {lineOAs.map((oa) => (
                  <option key={oa.id} value={oa.id}>{oa.name}</option>
                ))}
              </select>
            )}
          </div>
          <Button className="gap-2" onClick={() => alert("Create auto reply — coming soon")}>
            <Plus size={16} />
            New Auto Reply
          </Button>
        </div>

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
              <Button className="mt-4 gap-2" onClick={() => alert("Create auto reply — coming soon")}>
                <Plus size={16} />
                New Auto Reply
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && autoReplies.length > 0 && (
          <div className="grid gap-3">
            {autoReplies.map((ar) => (
              <Card key={ar.id} className={!ar.is_enabled ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-blue-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{ar.name}</span>
                      <Badge variant={triggerVariant[ar.trigger]}>
                        {triggerLabel[ar.trigger] ?? ar.trigger}
                      </Badge>
                      {!ar.is_enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {ar.keywords?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Keywords: {ar.keywords.slice(0, 3).join(", ")}
                          {ar.keywords.length > 3 && ` +${ar.keywords.length - 3}`}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {ar.messages?.length ?? 0} message{ar.messages?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">Priority: {ar.priority}</span>
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
                    <Button variant="outline" size="sm" onClick={() => alert("Edit — coming soon")}>
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
    </AppLayout>
  );
}
