import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Webhook, Trash2, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { webhookSettingApi } from "@/api/webhookSetting";
import type { WebhookSetting } from "@/types";
import { AddWebhookDialog } from "./AddWebhookDialog";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const webhookTypeMeta = {
  "LINE-HOOK": { label: "LINE-HOOK", cls: "bg-line/10 text-line border-0" },
  "HOOK":      { label: "HOOK",      cls: "bg-blue-100 text-blue-700 border-0" },
} as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy URL"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export function WebhookPage() {
  const [settings, setSettings] = useState<WebhookSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const loadSettings = () => {
    setLoading(true);
    webhookSettingApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setSettings(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // FR-HOOK-13: Toggle via PATCH /:id/toggle endpoint
  const handleToggle = async (ws: WebhookSetting) => {
    setTogglingId(ws.id);
    try {
      const updated = await webhookSettingApi.toggle(ws.id);
      setSettings((prev) => prev.map((s) => (s.id === ws.id ? updated : s)));
    } catch {
      alert("Failed to toggle webhook setting");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook setting?")) return;
    setDeletingId(id);
    try {
      await webhookSettingApi.delete(id);
      setSettings((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete webhook setting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleWebhookCreated = (webhook: WebhookSetting) => {
    setSettings((prev) => [webhook, ...prev]);
  };

  return (
    <AppLayout title="Webhook Settings">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage LINE and external inbound webhooks. LINE-HOOK records are auto-created when you connect a LINE OA.
          </p>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Add Webhook
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && settings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">🔗</div>
              <p className="font-medium">No webhooks configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a LINE OA to auto-create a LINE-HOOK, or add a custom HOOK webhook.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
                <Plus size={16} />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && settings.length > 0 && (
          <div className="grid gap-3">
            {settings.map((ws) => {
              const typeMeta = webhookTypeMeta[ws.webhook_type] ?? webhookTypeMeta["HOOK"];
              const isActive = ws.status === "active";
              return (
                <Card key={ws.id} className={!isActive ? "opacity-60" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Webhook size={18} className="text-purple-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{ws.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeMeta.cls}`}>
                          {typeMeta.label}
                        </span>
                        {ws.webhook_event && (
                          <Badge variant="outline" className="text-xs py-0">{ws.webhook_event}</Badge>
                        )}
                        {!isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>

                      {/* Webhook URL (inbound) */}
                      {ws.webhook_url && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                            {ws.webhook_url}
                          </span>
                          <CopyButton text={ws.webhook_url} />
                        </div>
                      )}

                      {/* Description */}
                      {ws.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ws.description}</p>
                      )}

                      {/* Category */}
                      {ws.category && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                          {ws.category}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(ws.created_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(ws)}
                        disabled={togglingId === ws.id}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={isActive ? "Deactivate" : "Activate"}
                      >
                        {isActive
                          ? <ToggleRight size={22} className="text-line" />
                          : <ToggleLeft size={22} />}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/webhook-settings/${ws.id}`}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        disabled={deletingId === ws.id}
                        onClick={() => handleDelete(ws.id)}
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

      <AddWebhookDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleWebhookCreated}
      />
    </AppLayout>
  );
}
