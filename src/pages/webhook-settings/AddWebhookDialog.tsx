import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { webhookSettingApi } from "@/api/webhookSetting";
import { lineOAApi } from "@/api/lineOA";
import type { WebhookSetting, LineOA } from "@/types";

interface AddWebhookDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (webhook: WebhookSetting) => void;
}

interface Form {
  line_oa_id: string;
  name: string;
  webhook_type: "LINE-HOOK" | "HOOK";
  webhook_event: string;
  description: string;
  category: string;
  security_token: string;
  allowed_ips: string;
  http_status_code: string;
  response_msg: string;
}

const initialForm: Form = {
  line_oa_id: "",
  name: "",
  webhook_type: "HOOK",
  webhook_event: "",
  description: "",
  category: "",
  security_token: "",
  allowed_ips: "",
  http_status_code: "200",
  response_msg: "",
};

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

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
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function SecretInput({
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
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="relative">
      <input
        type={showSecret ? "text" : "password"}
        className="w-full border rounded-md px-3 py-2 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowSecret(!showSecret)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        disabled={disabled}
      >
        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
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

export function AddWebhookDialog({
  open,
  onClose,
  onCreated,
}: AddWebhookDialogProps) {
  const [form, setForm] = useState<Form>(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loadingLineOAs, setLoadingLineOAs] = useState(false);

  // Load LINE OAs when dialog opens
  useEffect(() => {
    if (open) {
      loadLineOAs();
    }
  }, [open]);

  const loadLineOAs = async () => {
    setLoadingLineOAs(true);
    try {
      const res = await lineOAApi.list({ workspace_id: WORKSPACE_ID });
      setLineOAs(res.data ?? []);
      // Auto-select first OA if available
      if (res.data && res.data.length > 0 && !form.line_oa_id) {
        setForm((prev) => ({ ...prev, line_oa_id: res.data![0].id }));
      }
    } catch (err) {
      console.error("Failed to load LINE OAs:", err);
    } finally {
      setLoadingLineOAs(false);
    }
  };

  const set = (key: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(initialForm);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Webhook name is required.");
      return;
    }

    if (!form.line_oa_id.trim()) {
      setError("Please select a LINE OA.");
      return;
    }

    setSaving(true);
    try {
      const created = await webhookSettingApi.create({
        workspace_id: WORKSPACE_ID,
        line_oa_id: form.line_oa_id,
        webhook_type: form.webhook_type,
        name: form.name.trim(),
        webhook_event: form.webhook_event || "",
        description: form.description || "",
        category: form.category || "",
        security_token: form.security_token || "",
        allowed_ips: form.allowed_ips
          ? form.allowed_ips.split("\n").filter((ip) => ip.trim())
          : [],
        http_status_code: form.http_status_code
          ? parseInt(form.http_status_code)
          : 200,
        response_msg: form.response_msg || "",
      });
      onCreated(created);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create webhook"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add Webhook"
      description="Create a new webhook to receive events from external systems"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* LINE OA Selection */}
        <Field label="LINE Official Account" required hint="Which LINE OA this webhook belongs to">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={form.line_oa_id}
            onChange={(e) => set("line_oa_id")(e.target.value)}
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
        <Field label="Webhook Name" required>
          <TextInput
            value={form.name}
            onChange={set("name")}
            placeholder="e.g., CRM Webhook, Analytics Hook"
            disabled={saving}
          />
        </Field>

        {/* Webhook Type */}
        <Field label="Webhook Type">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={form.webhook_type}
            onChange={(e) => set("webhook_type")(e.target.value)}
            disabled={saving}
          >
            <option value="HOOK">External Hook (HOOK)</option>
            <option value="LINE-HOOK" disabled>
              LINE Platform (LINE-HOOK) - Auto-created per OA
            </option>
          </select>
        </Field>

        {/* Webhook Event */}
        <Field
          label="Event Type"
          hint="Which events to listen for (optional)"
        >
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
            value={form.webhook_event}
            onChange={(e) => set("webhook_event")(e.target.value)}
            disabled={saving}
          >
            <option value="">All events</option>
            <option value="follow">Follow</option>
            <option value="unfollow">Unfollow</option>
            <option value="message">Message</option>
            <option value="postback">Postback</option>
          </select>
        </Field>

        {/* Category */}
        <Field
          label="Category"
          hint="e.g., crm-integration, analytics, support (optional)"
        >
          <TextInput
            value={form.category}
            onChange={set("category")}
            placeholder="Category name"
            disabled={saving}
          />
        </Field>

        {/* Description */}
        <Field label="Description" hint="Internal notes about this webhook">
          <TextArea
            value={form.description}
            onChange={set("description")}
            placeholder="What is this webhook for? Who manages it?"
            disabled={saving}
            rows={2}
          />
        </Field>

        {/* Allowed IPs */}
        <Field
          label="Allowed IP Addresses"
          hint="One per line; empty = allow all (optional)"
        >
          <TextArea
            value={form.allowed_ips}
            onChange={set("allowed_ips")}
            placeholder="192.168.1.1&#10;10.0.0.0/8"
            disabled={saving}
            rows={3}
          />
        </Field>

        {/* HTTP Status Code */}
        <Field
          label="Response Status Code"
          hint="HTTP status to return (default: 200)"
        >
          <TextInput
            value={form.http_status_code}
            onChange={set("http_status_code")}
            placeholder="200"
            disabled={saving}
            type="number"
          />
        </Field>

        {/* Response Message */}
        <Field label="Response Body" hint="Response body to send back (optional)">
          <TextArea
            value={form.response_msg}
            onChange={set("response_msg")}
            placeholder="Success or custom response message"
            disabled={saving}
            rows={2}
          />
        </Field>

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
            {saving ? "Creating..." : "Create Webhook"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
