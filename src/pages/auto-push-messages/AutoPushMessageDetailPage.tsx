import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Copy, Check, RefreshCw, Trash2, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useState, useEffect } from "react";
import { autoPushMessageApi } from "@/api/autoPushMessage";
import { flexMessageApi } from "@/api/flexMessage";
import type { FlexMessage } from "@/api/flexMessage";
import { segmentApi } from "@/api/segment";
import { webhookSettingApi } from "@/api/webhookSetting";
import { DeliveryLogsTable } from "./DeliveryLogsTable";
import { MessageTemplateEditor } from "./MessageTemplateEditor";
import type { AutoPushMessage, Segment } from "@/types";
import type { WebhookSetting } from "@/api/webhookSetting";
import type { DeliveryLog } from "@/api/autoPushMessage";
import { cn } from "@/lib/utils";
import { FlexCardPreview } from "@/components/FlexCardPreview";

interface FormState {
  name: string;
  description: string;
  messageType: "text" | "flex";
  messageTemplate: string;
  flexMessageId: string;
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

function getFlexContainerType(content: string): string {
  try { return (JSON.parse(content) as { type?: string })?.type ?? "bubble"; } catch { return "bubble"; }
}

function buildPayloadFields(
  messageType: "text" | "flex",
  messageTemplate: string,
  selectedFlex: FlexMessage | null,
  targetType: string
): Record<string, string> {
  const fields: Record<string, string> = {};

  // When targeting a single follower, the caller must supply who receives the message.
  // target_line_user_id overrides the pre-configured target for this webhook trigger.
  if (targetType === "follower") {
    fields["target_line_user_id"] = "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  }

  if (messageType === "flex" && selectedFlex) {
    if (selectedFlex.variables.length > 0) {
      // Use variable description as the example value when available
      selectedFlex.variables.forEach((v) => {
        fields[v.name] = v.description || `example_${v.name}`;
      });
    } else {
      // Fallback: extract {placeholders} from the raw flex JSON content
      const extracted = extractTemplateFields(selectedFlex.content);
      Object.assign(fields, extracted);
    }
  } else if (messageType === "text") {
    Object.assign(fields, extractTemplateFields(messageTemplate));
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
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);

  // Flex combobox state
  const [flexSelectorOpen, setFlexSelectorOpen] = useState(false);
  const [flexSearch, setFlexSearch] = useState("");

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
    messageType: "text",
    messageTemplate: "",
    flexMessageId: "",
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
            messageType: (apmData.message_type as any) || "text",
            messageTemplate: apmData.message_template,
            flexMessageId: apmData.flex_message_id || "",
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

          // Load flex messages for picker
          try {
            const flexRes = await flexMessageApi.list({ workspace_id: "00000000-0000-0000-0000-000000000001" });
            setFlexMessages(flexRes.data ?? []);
          } catch (err) {
            console.error("Failed to load flex messages:", err);
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
    if (form.messageType === "text" && !form.messageTemplate.trim()) {
      setSaveError("Message template is required");
      return;
    }
    if (form.messageType === "flex" && !form.flexMessageId) {
      setSaveError("Please select a Flex Message template");
      return;
    }

    setSaving(true);
    try {
      const updated = await autoPushMessageApi.update(id, {
        name: form.name.trim(),
        description: form.description || undefined,
        message_type: form.messageType,
        message_template: form.messageType === "text" ? form.messageTemplate : "",
        flex_message_id: form.messageType === "flex" ? form.flexMessageId : undefined,
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

  // ─── Derived values ────────────────────────────────────────────────────────
  const selectedFlex = flexMessages.find((fm) => fm.id === form.flexMessageId) ?? null;

  const filteredFlexMessages = flexSearch
    ? flexMessages.filter(
        (fm) =>
          fm.name.toLowerCase().includes(flexSearch.toLowerCase()) ||
          fm.description.toLowerCase().includes(flexSearch.toLowerCase())
      )
    : flexMessages;

  const payloadFields = buildPayloadFields(
    form.messageType,
    form.messageTemplate,
    selectedFlex,
    form.targetType
  );
  const payloadJson = JSON.stringify(payloadFields, null, 2);
  const hasPayloadFields = Object.keys(payloadFields).length > 0;

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

            {/* Message Type Toggle */}
            <Field label="Message Type" required>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${form.messageType === "text" ? "border-primary bg-primary/5 text-primary font-medium" : "border-input"}`}>
                  <input
                    type="radio"
                    name="messageType"
                    value="text"
                    checked={form.messageType === "text"}
                    onChange={() => setForm({ ...form, messageType: "text", flexMessageId: "" })}
                    className="accent-primary"
                    disabled={saving}
                  />
                  Text / HTML
                </label>
                <label className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${form.messageType === "flex" ? "border-primary bg-primary/5 text-primary font-medium" : "border-input"}`}>
                  <input
                    type="radio"
                    name="messageType"
                    value="flex"
                    checked={form.messageType === "flex"}
                    onChange={() => setForm({ ...form, messageType: "flex", messageTemplate: "" })}
                    className="accent-primary"
                    disabled={saving}
                  />
                  Flex Message Template
                </label>
              </div>
            </Field>

            {/* Text Message Template */}
            {form.messageType === "text" && (
              <Field label="Message Template" required hint="HTML template with {field_name} placeholders">
                <MessageTemplateEditor
                  value={form.messageTemplate}
                  onChange={(v) => setForm({ ...form, messageTemplate: v })}
                  disabled={saving}
                  webhookVariables={webhook?.variables ?? []}
                />
              </Field>
            )}

            {/* Flex Message Picker */}
            {form.messageType === "flex" && (
              <Field label="Flex Message Template" required hint="Select a pre-designed Flex Message template">
                <div className="relative">
                  {/* Trigger button */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background text-left disabled:bg-muted disabled:cursor-not-allowed"
                    onClick={() => setFlexSelectorOpen((o) => !o)}
                    disabled={saving}
                  >
                    {selectedFlex ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">{selectedFlex.name}</span>
                        <span className="font-mono text-muted-foreground text-xs flex-shrink-0">
                          #{selectedFlex.id.slice(-8)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select a Flex Message template...</span>
                    )}
                    <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground ml-2" />
                  </button>

                  {/* Dropdown panel */}
                  {flexSelectorOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setFlexSelectorOpen(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-72 overflow-y-auto">
                        {/* Search */}
                        <div className="p-2 border-b sticky top-0 bg-background">
                          <input
                            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Search by name or description..."
                            value={flexSearch}
                            onChange={(e) => setFlexSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                        {/* Template items */}
                        {filteredFlexMessages.map((fm) => (
                          <button
                            key={fm.id}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-start gap-2 border-b last:border-b-0",
                              form.flexMessageId === fm.id && "bg-muted"
                            )}
                            onClick={() => {
                              setForm({ ...form, flexMessageId: fm.id });
                              setFlexSelectorOpen(false);
                              setFlexSearch("");
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium">{fm.name}</span>
                                <span className="font-mono text-muted-foreground text-xs">
                                  #{fm.id.slice(-8)}
                                </span>
                              </div>
                              {fm.description && (
                                <p className="text-xs text-muted-foreground truncate">{fm.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-0.5">
                              <Badge variant="outline" className="text-xs capitalize">
                                {getFlexContainerType(fm.content)}
                              </Badge>
                              {fm.variables.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {fm.variables.length} var{fm.variables.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                        {filteredFlexMessages.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {flexSearch ? "No templates match your search." : "No Flex Message templates found."}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {flexMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No Flex Message templates found.{" "}
                    <a href="/flex-messages" className="underline text-primary" target="_blank" rel="noopener noreferrer">
                      Create one first
                    </a>
                    .
                  </p>
                )}
              </Field>
            )}

            {/* Flex Message Preview */}
            {form.messageType === "flex" && selectedFlex && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Preview</p>
                <FlexCardPreview content={selectedFlex.content} height={280} />
              </div>
            )}

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
        <Card>
          <CardHeader>
            <CardTitle>Example Payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              POST this JSON to the webhook URL to trigger the message.{" "}
              {form.targetType === "follower"
                ? <>
                    <code className="bg-muted px-1 rounded text-xs">target_line_user_id</code> specifies the LINE User ID who receives the message.
                    Alternatively, use <code className="bg-muted px-1 rounded text-xs">target_by</code> to target by a custom field, e.g.{" "}
                    <code className="bg-muted px-1 rounded text-xs">{"{"}"field": "oc2plus_id", "value": "MEM-123"{"}"}</code>.{" "}
                  </>
                : null}
              {form.messageType === "flex"
                ? "Other fields are from the selected Flex Message template."
                : "Fields are extracted live from your template above."}
            </p>
            {hasPayloadFields ? (
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
                {form.messageType === "flex"
                  ? "Select a Flex Message template to see required fields."
                  : "No {field} placeholders found in your template yet."}
              </p>
            )}
            {/* Required variables indicator */}
            {selectedFlex && selectedFlex.variables.some((v) => v.required) && (
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-xs text-muted-foreground">Required:</span>
                {selectedFlex.variables
                  .filter((v) => v.required)
                  .map((v) => (
                    <Badge key={v.name} variant="destructive" className="text-xs font-mono">
                      {v.name}
                    </Badge>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

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
