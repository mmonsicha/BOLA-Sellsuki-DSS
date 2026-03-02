import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Copy, Check, RefreshCw, Trash2, CheckCircle, XCircle } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useState, useEffect } from "react";
import { autoPushMessageApi } from "@/api/autoPushMessage";
import { segmentApi } from "@/api/segment";
import { webhookSettingApi } from "@/api/webhookSetting";
import { DeliveryLogsTable } from "./DeliveryLogsTable";
import { MessageTemplateEditor } from "./MessageTemplateEditor";
import type { AutoPushMessage, Segment } from "@/types";
import type { WebhookSetting } from "@/api/webhookSetting";
import type { DeliveryLog } from "@/api/autoPushMessage";

interface FormState {
  name: string;
  description: string;
  messageTemplate: string;
  targetType: "follower" | "segment" | "all_followers";
  targetSegmentId: string;
  isEnabled: boolean;
}

function extractTemplateFields(template: string): Record<string, string> {
  const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const fields: Record<string, string> = {};
  let match;
  while ((match = regex.exec(template)) !== null) {
    fields[match[1]] = `example_${match[1]}`;
  }
  return fields;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadonlyInput({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={value}
        className="flex-1 border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-default focus:outline-none font-mono"
      />
      <button
        onClick={handleCopy}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export function AutoPushMessageDetailPage() {
  const id = window.location.pathname.split("/")[2];
  const [apm, setApm] = useState<AutoPushMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [webhook, setWebhook] = useState<WebhookSetting | null>(null);

  // Delivery Logs
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const logsPageSize = 10;
  const [hasNextLogs, setHasNextLogs] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    messageTemplate: "",
    targetType: "all_followers",
    targetSegmentId: "",
    isEnabled: true,
  });

  const loadDeliveryLogs = async (page: number = 1) => {
    setLogsLoading(true);
    try {
      const res = await autoPushMessageApi.listDeliveries(id, {
        page,
        page_size: logsPageSize,
      });
      const data = res.data ?? [];
      setDeliveryLogs(data);
      // If we got a full page worth of results, there may be more pages
      setHasNextLogs(data.length === logsPageSize);
    } catch (err) {
      console.error("Failed to load delivery logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load auto push message details
  useEffect(() => {
    const loadData = async () => {
      try {
        let apmData = null;

        // First, try to get from sessionStorage (for newly created messages)
        const cachedData = sessionStorage.getItem(`apm_${id}`);
        if (cachedData) {
          try {
            apmData = JSON.parse(cachedData);
            sessionStorage.removeItem(`apm_${id}`); // Clear cache after use
          } catch (e) {
            console.error("Failed to parse cached message data:", e);
          }
        }

        // If not in cache, fetch from API
        if (!apmData) {
          const data = await autoPushMessageApi.get(id);
          apmData = data.data ?? null;
        }

        setApm(apmData);
        if (apmData) {
          setForm({
            name: apmData.name,
            description: apmData.description || "",
            messageTemplate: apmData.message_template,
            targetType: apmData.target_type as any,
            targetSegmentId: apmData.target_segment_id || "",
            isEnabled: apmData.is_enabled,
          });

          // Load webhook settings
          try {
            const webhookRes = await webhookSettingApi.get(apmData.webhook_setting_id);
            setWebhook(webhookRes);
          } catch (err) {
            console.error("Failed to load webhook:", err);
          }

          // Load segments
          try {
            const segmentsRes = await segmentApi.list({
              line_oa_id: apmData.line_oa_id,
              page: 1,
              page_size: 100,
            });
            setSegments(segmentsRes.data ?? []);
          } catch (err) {
            console.error("Failed to load segments:", err);
          }

          // Load delivery logs
          await loadDeliveryLogs(1);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load auto push message");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!form.name.trim()) {
      setSaveError("Auto push message name is required");
      return;
    }
    if (!form.messageTemplate.trim()) {
      setSaveError("Message template is required");
      return;
    }

    setSaving(true);
    try {
      const updated = await autoPushMessageApi.update(id, {
        name: form.name.trim(),
        description: form.description || undefined,
        message_template: form.messageTemplate,
        target_type: form.targetType,
        target_segment_id: form.targetSegmentId || undefined,
        is_enabled: form.isEnabled,
      });
      setApm(updated.data ?? null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save auto push message";
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this auto push message? This cannot be undone.")) return;

    setDeleting(true);
    try {
      await autoPushMessageApi.delete(id);
      window.location.href = "/auto-push-messages";
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    if (!apm) return;
    try {
      const updated = await autoPushMessageApi.update(id, { is_enabled: !apm.is_enabled });
      if (updated.data) {
        setApm(updated.data);
        setForm((prev) => ({ ...prev, isEnabled: updated.data!.is_enabled }));
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Auto Push Message Details">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading auto push message...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !apm) {
    return (
      <AppLayout title="Auto Push Message Details">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 text-destructive" size={32} />
            <p className="text-destructive font-medium">{error || "Auto push message not found"}</p>
            <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Auto Push Message Details">
      {/* Floating Toast */}
      {(saveSuccess || saveError) && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={16} />
              Save successful
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 pointer-events-auto">
              <XCircle size={16} />
              Save fail: {saveError}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { window.location.href = "/auto-push-messages"; }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{apm.name}</h1>
              <p className="text-sm text-muted-foreground">Created {new Date(apm.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={apm.is_enabled ? "default" : "secondary"}>
              {apm.is_enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Button
              variant={apm.is_enabled ? "outline" : "default"}
              size="sm"
              onClick={handleToggle}
            >
              {apm.is_enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <RefreshCw size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Edit Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <Field label="Message Name" required>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., CRM Lead Alert"
                disabled={saving}
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Internal notes about this message"
                rows={2}
                disabled={saving}
              />
            </Field>

            {/* Message Template */}
            <Field label="Message Template" required hint="HTML template with {field_name} placeholders">
              <MessageTemplateEditor
                value={form.messageTemplate}
                onChange={(v) => setForm({ ...form, messageTemplate: v })}
                disabled={saving}
                webhookVariables={webhook?.variables ?? []}
              />
            </Field>

            {/* Target Type */}
            <Field label="Send To" required>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.targetType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetType: e.target.value as any,
                    targetSegmentId: "",
                  })
                }
                disabled={saving}
              >
                <option value="all_followers">All Followers</option>
                <option value="segment">Specific Segment</option>
                <option value="follower">Single Follower</option>
              </select>
            </Field>

            {/* Conditional: Target Segment */}
            {form.targetType === "segment" && (
              <Field label="Select Segment" required>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.targetSegmentId}
                  onChange={(e) => setForm({ ...form, targetSegmentId: e.target.value })}
                  disabled={saving}
                >
                  <option value="">Choose segment...</option>
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable this message</label>
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                disabled={saving}
              />
            </div>

            {/* Save Button */}
            <div className="border-t pt-4 flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <RefreshCw size={14} className="mr-2 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Example Payload */}
        {(() => {
          const fields = extractTemplateFields(form.messageTemplate);
          const hasFields = Object.keys(fields).length > 0;
          const payloadJson = JSON.stringify(fields, null, 2);
          return (
            <Card>
              <CardHeader>
                <CardTitle>Example Payload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  POST this JSON to the webhook URL to trigger the message. Fields are extracted live from your template above.
                </p>
                {hasFields ? (
                  <div className="relative">
                    <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto pr-8">
                      {payloadJson}
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton value={payloadJson} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No {"{field}"} placeholders found in your template yet.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Webhook Configuration Section */}
        {webhook && (
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook Setting Name */}
              <Field label="Webhook Setting">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{webhook.webhook_type}</Badge>
                  <span className="text-sm">{webhook.name}</span>
                </div>
              </Field>

              {/* Webhook URL — derive base URL from webhook setting's URL so it uses the same host (e.g. ngrok) */}
              <Field label="Webhook URL" hint="POST to this URL when triggered">
                <ReadonlyInput value={(() => {
                  try {
                    const u = new URL(webhook.webhook_url);
                    return `${u.protocol}//${u.host}/webhook/apm/${apm.id}`;
                  } catch {
                    return apm.webhook_url;
                  }
                })()} />
              </Field>

              {/* Event Type */}
              {webhook.webhook_event && (
                <Field label="Event Type">
                  <input
                    type="text"
                    readOnly
                    value={webhook.webhook_event}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-default focus:outline-none"
                  />
                </Field>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery Stats */}
        {apm.total_deliveries > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Triggered</p>
                  <p className="text-xl font-semibold">{apm.total_deliveries}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-green-600">Successful</p>
                  <p className="text-xl font-semibold text-green-600">{apm.success_count}</p>
                </div>
                {apm.failure_count > 0 && (
                  <div>
                    <p className="text-muted-foreground text-red-600">Failed</p>
                    <p className="text-xl font-semibold text-red-600">{apm.failure_count}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Logs */}
        <DeliveryLogsTable
          logs={deliveryLogs}
          loading={logsLoading}
          hasNextPage={hasNextLogs}
          page={logsPage}
          pageSize={logsPageSize}
          onPageChange={(newPage) => {
            setLogsPage(newPage);
            loadDeliveryLogs(newPage);
          }}
          onRefresh={() => loadDeliveryLogs(logsPage)}
        />

      </div>
    </AppLayout>
  );
}
