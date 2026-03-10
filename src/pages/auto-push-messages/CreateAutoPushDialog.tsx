import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { autoPushMessageApi } from "@/api/autoPushMessage";
import type { AutoPushMessage } from "@/api/autoPushMessage";
import { webhookSettingApi } from "@/api/webhookSetting";
import { segmentApi } from "@/api/segment";
import { lineOAApi } from "@/api/lineOA";
import { flexMessageApi } from "@/api/flexMessage";
import type { FlexMessage } from "@/api/flexMessage";
import type { Segment, LineOA } from "@/types";
import { MessageTemplateEditor } from "./MessageTemplateEditor";

interface WebhookSetting {
  id: string;
  name: string;
  webhook_type: string;
  webhook_event?: string;
  variables?: Array<{ name: string; description: string; required?: boolean }>;
}

interface CreateAutoPushDialogProps {
  open: boolean;
  lineOAId: string;
  onClose: () => void;
  onCreated: (apm: AutoPushMessage) => void;
}

interface Form {
  webhook_setting_id: string;
  name: string;
  description: string;
  message_type: "text" | "flex";
  message_template: string;
  flex_message_id: string;
  target_type: "follower" | "segment" | "all_followers" | "line_group" | "lon_subscribers";
  target_segment_id: string;
  target_follower_ids: string[];
}

const initialForm: Form = {
  webhook_setting_id: "",
  name: "",
  description: "",
  message_type: "text",
  message_template: "",
  flex_message_id: "",
  target_type: "all_followers",
  target_segment_id: "",
  target_follower_ids: [],
};

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
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed font-mono"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
    />
  );
}

export function CreateAutoPushDialog({
  open,
  lineOAId: propLineOAId,
  onClose,
  onCreated,
}: CreateAutoPushDialogProps) {
  const [form, setForm] = useState<Form>(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [lineOAId, setLineOAId] = useState<string>(propLineOAId);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingLineOAs, setLoadingLineOAs] = useState(false);
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);
  const [flexSelectorOpen, setFlexSelectorOpen] = useState(false);
  const [flexSearch, setFlexSearch] = useState("");

  // Load LINE OAs on mount
  useEffect(() => {
    if (open) {
      loadLineOAs();
    }
  }, [open]);

  // Load webhooks and segments when dialog opens or lineOAId changes
  useEffect(() => {
    if (open && lineOAId) {
      loadSelectOptions();
    }
  }, [open, lineOAId]);

  const loadLineOAs = async () => {
    setLoadingLineOAs(true);
    try {
      const res = await lineOAApi.list({ workspace_id: "00000000-0000-0000-0000-000000000001" });
      setLineOAs(res.data ?? []);
    } catch (err) {
      console.error("Failed to load LINE OAs:", err);
    } finally {
      setLoadingLineOAs(false);
    }
  };

  const loadSelectOptions = async () => {
    setLoadingData(true);
    try {
      // Load webhook settings
      const webhookRes = await webhookSettingApi.list({ workspace_id: "00000000-0000-0000-0000-000000000001" });
      setWebhooks(webhookRes.data ?? []);

      // Load segments
      const segmentRes = await segmentApi.list({
        line_oa_id: lineOAId,
        page: 1,
        page_size: 100,
      });
      setSegments(segmentRes.data ?? []);

      // Load flex messages for picker
      const flexRes = await flexMessageApi.list({ workspace_id: "00000000-0000-0000-0000-000000000001" });
      setFlexMessages(flexRes.data ?? []);
    } catch (err) {
      console.error("Failed to load options:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLineOAChange = (newLineOAId: string) => {
    setLineOAId(newLineOAId);
    // Reset webhook and segment selections when LINE OA changes
    setForm((prev) => ({ ...prev, webhook_setting_id: "", target_segment_id: "" }));
  };

  const handleWebhookChange = (webhookId: string) => {
    set("webhook_setting_id")(webhookId);
  };

  const set = (key: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(initialForm);
    setError("");
    setLineOAId(propLineOAId);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Auto push message name is required.");
      return;
    }
    if (!form.webhook_setting_id.trim()) {
      setError("Please select a webhook setting.");
      return;
    }
    if (form.message_type === "text" && !form.message_template.trim()) {
      setError("Message template is required.");
      return;
    }
    if (form.message_type === "flex" && !form.flex_message_id) {
      setError("Please select a Flex Message template.");
      return;
    }
    if (form.target_type === "segment" && !form.target_segment_id.trim()) {
      setError("Please select a target segment.");
      return;
    }

    setSaving(true);
    try {
      const created = await autoPushMessageApi.create({
        line_oa_id: lineOAId,
        webhook_setting_id: form.webhook_setting_id,
        name: form.name.trim(),
        description: form.description || "",
        message_type: form.message_type,
        message_template: form.message_type === "text" ? form.message_template : "",
        flex_message_id: form.message_type === "flex" ? form.flex_message_id : undefined,
        target_type: form.target_type,
        target_segment_id: form.target_segment_id || undefined,
        target_follower_ids: form.target_follower_ids,
      });
      onCreated(created.data!);
      handleClose();
      // Store created message in sessionStorage so detail page can use it immediately
      if (created.data) {
        sessionStorage.setItem(
          `apm_${created.data.id}`,
          JSON.stringify(created.data)
        );
      }
      // Redirect to detail page after creation (with slight delay to ensure DB commit)
      setTimeout(() => {
        window.location.href = `/auto-push-messages/${created.data!.id}`;
      }, 300);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create auto push message"
      );
    } finally {
      setSaving(false);
    }
  };

  // Derived: selected flex message template
  const selectedFlex = flexMessages.find((fm) => fm.id === form.flex_message_id);

  // Helper: parse bubble/carousel type from Flex Message JSON content
  const getFlexType = (content: string) => {
    try { return (JSON.parse(content) as { type?: string })?.type ?? "bubble"; } catch { return "bubble"; }
  };

  // Filtered list for the flex selector search
  const filteredFlexMessages = flexMessages.filter(
    (fm) =>
      fm.name.toLowerCase().includes(flexSearch.toLowerCase()) ||
      fm.description.toLowerCase().includes(flexSearch.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create Auto Push Message"
      description="Create a new message template triggered by webhook events"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* LINE OA Selection */}
        <Field label="LINE Official Account" required hint="Which LINE OA will send this message">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={lineOAId}
            onChange={(e) => handleLineOAChange(e.target.value)}
            disabled={saving || loadingLineOAs}
          >
            <option value="">
              {loadingLineOAs ? "Loading..." : "Select LINE OA..."}
            </option>
            {lineOAs.map((oa) => (
              <option key={oa.id} value={oa.id}>
                {oa.name} {oa.basic_id && `(@${oa.basic_id})`}
              </option>
            ))}
          </select>
        </Field>

        {/* Name */}
        <Field label="Message Name" required>
          <TextInput
            value={form.name}
            onChange={set("name")}
            placeholder="e.g., CRM Lead Alert, Order Confirmation"
            disabled={saving}
          />
        </Field>

        {/* Webhook Setting */}
        <Field label="Webhook Setting" required hint="Which webhook configuration to use for field definitions">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={form.webhook_setting_id}
            onChange={(e) => handleWebhookChange(e.target.value)}
            disabled={saving || loadingData}
          >
            <option value="">
              {loadingData ? "Loading..." : "Select webhook setting..."}
            </option>
            {webhooks.map((webhook) => (
              <option key={webhook.id} value={webhook.id}>
                {webhook.name} ({webhook.webhook_type})
              </option>
            ))}
          </select>
        </Field>

        {/* Message Type Toggle */}
        <Field label="Message Type" required hint="Choose between a plain text/HTML template or a pre-designed Flex Message">
          <div className="flex gap-2">
            <label className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${form.message_type === "text" ? "border-primary bg-primary/5 text-primary font-medium" : "border-input"}`}>
              <input
                type="radio"
                name="message_type"
                value="text"
                checked={form.message_type === "text"}
                onChange={() => setForm((prev) => ({ ...prev, message_type: "text", flex_message_id: "" }))}
                className="accent-primary"
                disabled={saving}
              />
              Text / HTML
            </label>
            <label className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${form.message_type === "flex" ? "border-primary bg-primary/5 text-primary font-medium" : "border-input"}`}>
              <input
                type="radio"
                name="message_type"
                value="flex"
                checked={form.message_type === "flex"}
                onChange={() => setForm((prev) => ({ ...prev, message_type: "flex", message_template: "" }))}
                className="accent-primary"
                disabled={saving}
              />
              Flex Message Template
            </label>
          </div>
        </Field>

        {/* Text Message Template */}
        {form.message_type === "text" && (
          <Field label="Message Template" required hint="HTML with {field_name} placeholders that will be substituted from webhook payload">
            <MessageTemplateEditor
              value={form.message_template}
              onChange={set("message_template")}
              disabled={saving}
              webhookVariables={
                webhooks.find((w) => w.id === form.webhook_setting_id)?.variables || []
              }
            />
          </Field>
        )}

        {/* Flex Message Picker */}
        {form.message_type === "flex" && (
          <Field label="Flex Message Template" required hint="Select a pre-designed Flex Message template to use">
            <div className="relative">
              {/* Trigger button */}
              <button
                type="button"
                className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background text-left disabled:bg-muted disabled:cursor-not-allowed"
                onClick={() => setFlexSelectorOpen((o) => !o)}
                disabled={saving || loadingData}
              >
                {selectedFlex ? (
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium">{selectedFlex.name}</span>
                    <span className="font-mono text-muted-foreground text-xs flex-shrink-0">
                      #{selectedFlex.id.slice(-8)}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {loadingData ? "Loading templates..." : "Select a Flex Message template..."}
                  </span>
                )}
                <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground ml-2" />
              </button>

              {/* Dropdown panel */}
              {flexSelectorOpen && (
                <>
                  {/* Click-outside overlay */}
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
                          form.flex_message_id === fm.id && "bg-muted"
                        )}
                        onClick={() => {
                          set("flex_message_id")(fm.id);
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
                            {getFlexType(fm.content)}
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

            {flexMessages.length === 0 && !loadingData && (
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

        {/* Description */}
        <Field label="Description" hint="Internal notes about this auto push message">
          <TextArea
            value={form.description}
            onChange={set("description")}
            placeholder="What is this message for? Who manages it? Any special instructions?"
            disabled={saving}
            rows={2}
          />
        </Field>

        {/* Target Type */}
        <Field label="Send To" required hint="Who should receive this message">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={form.target_type}
            onChange={(e) => set("target_type")(e.target.value as any)}
            disabled={saving}
          >
            <option value="all_followers">All Followers</option>
            <option value="lon_subscribers">LON Subscribers (LINE Notification)</option>
            <option value="segment">Specific Segment</option>
            <option value="follower">Single Follower</option>
            <option value="line_group" disabled>LINE Group Chat (Coming Soon)</option>
          </select>
        </Field>

        {/* Target Segment */}
        {form.target_type === "segment" && (
          <Field label="Select Segment" required>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
              value={form.target_segment_id}
              onChange={(e) => set("target_segment_id")(e.target.value)}
              disabled={saving || loadingData}
            >
              <option value="">
                {loadingData ? "Loading..." : "Choose segment..."}
              </option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="ml-auto gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {saving ? "Creating..." : "Create Auto Push Message"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
