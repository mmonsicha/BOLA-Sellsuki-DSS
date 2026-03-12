import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Save, Building2, Globe, Shield,
  Webhook, CheckCircle, XCircle, Clock, Eye, EyeOff, ChevronDown, ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { workspaceApi } from "@/api/workspace";
import { outboundEventApi } from "@/api/outboundEvent";
import type { Workspace, OutboundWebhookConfig, OutboundDeliveryLog } from "@/types";
import { useToast } from "@/components/ui/toast";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function SettingsPage() {
  const toast = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [saved, setSaved] = useState(false);

  // Outbound webhook state
  const [webhookConfig, setWebhookConfig] = useState<OutboundWebhookConfig | null>(null);
  const [webhookURL, setWebhookURL] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);

  // Delivery logs state
  const [logs, setLogs] = useState<OutboundDeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);

  useEffect(() => {
    workspaceApi.get(WORKSPACE_ID)
      .then((ws) => {
        setWorkspace(ws);
        setName(ws.name);
        setLogoURL(ws.logo_url ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load outbound webhook config
    workspaceApi.getOutboundWebhook(WORKSPACE_ID)
      .then((cfg) => {
        setWebhookConfig(cfg);
        setWebhookURL(cfg.webhook_url ?? "");
      })
      .catch(() => {
        // Not configured yet — ignore
      });
  }, []);

  const loadLogs = (page = 1) => {
    setLogsLoading(true);
    setLogsPage(page);
    outboundEventApi.listLogs({ workspace_id: WORKSPACE_ID, page, page_size: 20 })
      .then((res) => setLogs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  };

  const handleShowLogs = () => {
    const next = !showLogs;
    setShowLogs(next);
    if (next && logs.length === 0) {
      loadLogs(1);
    }
  };

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await workspaceApi.update(workspace.id, { name, logo_url: logoURL });
      setWorkspace(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const cfg = await workspaceApi.updateOutboundWebhook(WORKSPACE_ID, {
        webhook_url: webhookURL,
        secret: webhookSecret || undefined,
      });
      setWebhookConfig(cfg);
      setWebhookSecret(""); // clear after save
      setWebhookSaved(true);
      setTimeout(() => setWebhookSaved(false), 2500);
    } catch {
      toast.error("Failed to save outbound webhook settings");
    } finally {
      setSavingWebhook(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-2xl">

        {/* Workspace Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={16} />
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
                  value={workspace?.slug ?? ""}
                  disabled
                />
                <Badge variant="outline" className="flex-shrink-0 text-xs">Read-only</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed after creation.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <input
                type="url"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://example.com/logo.png"
                value={logoURL}
                onChange={(e) => setLogoURL(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={workspace?.is_active ? "success" : "secondary"}>
                  {workspace?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Button onClick={() => { void handleSave(); }} disabled={saving} className="gap-2">
                {saving
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Save size={14} />}
                {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe size={16} />
              Workspace Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Workspace ID</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{workspace?.id}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span>{workspace?.plan_id || "Default"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Outbound Webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook size={16} />
              Outbound Events (Webhook)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When a follower follows or unfollows your LINE OA, BOLA will POST a JSON event to this URL.
              Use this to sync LINE identity data with your external system.
            </p>

            {/* Current status badge */}
            {webhookConfig?.webhook_url ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-green-700 font-medium">Active</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-xs">
                  {webhookConfig.webhook_url}
                </code>
                {webhookConfig.has_secret && (
                  <Badge variant="outline" className="text-xs">Secret set</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                Not configured
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <input
                type="url"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://your-system.com/webhooks/bola"
                value={webhookURL}
                onChange={(e) => setWebhookURL(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Signing Secret
                <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showSecret ? "text" : "password"}
                  className="w-full border rounded-md px-3 py-2 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={webhookConfig?.has_secret ? "Leave blank to keep existing secret" : "Enter a secret to enable HMAC signing"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                When set, BOLA adds an <code className="bg-muted px-1 rounded">X-BOLA-Signature</code> header (HMAC-SHA256) so you can verify authenticity.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowLogs}
                className="gap-1.5 text-xs"
              >
                {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Delivery Logs
              </Button>
              <Button onClick={() => { void handleSaveWebhook(); }} disabled={savingWebhook || !webhookURL} className="gap-2">
                {savingWebhook
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Save size={14} />}
                {webhookSaved ? "Saved!" : savingWebhook ? "Saving..." : "Save Webhook"}
              </Button>
            </div>

            {/* Delivery Logs table */}
            {showLogs && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
                  <span className="text-xs font-medium">Recent Deliveries</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 gap-1"
                    onClick={() => loadLogs(logsPage)}
                    disabled={logsLoading}
                  >
                    <RefreshCw size={12} className={logsLoading ? "animate-spin" : ""} />
                    Refresh
                  </Button>
                </div>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-sm">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No delivery logs yet. Events will appear here after your first follower activity.
                  </div>
                ) : (
                  <div className="divide-y text-sm">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {log.status === "success"
                            ? <CheckCircle size={14} className="text-green-500" />
                            : log.status === "failed"
                              ? <XCircle size={14} className="text-red-500" />
                              : <Clock size={14} className="text-yellow-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono">{log.event_type}</Badge>
                            {log.http_status_code && (
                              <span className={`text-xs font-mono ${log.http_status_code < 400 ? "text-green-700" : "text-red-600"}`}>
                                HTTP {log.http_status_code}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(log.triggered_at).toLocaleString()}
                            </span>
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-red-600 mt-0.5 truncate">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Pagination */}
                {logs.length === 20 && (
                  <div className="flex justify-center gap-2 px-3 py-2 border-t">
                    <Button variant="outline" size="sm" className="text-xs h-7" disabled={logsPage <= 1} onClick={() => loadLogs(logsPage - 1)}>
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">Page {logsPage}</span>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => loadLogs(logsPage + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Shield size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Deactivate Workspace</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deactivating will disable all LINE OA connections.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.info("Deactivate workspace feature coming soon")}
              >
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
