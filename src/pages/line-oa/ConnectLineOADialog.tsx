import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

interface ConnectLineOADialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (oa: LineOA) => void;
}

interface FormState {
  name: string;
  description: string;
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  basic_id: string;
  is_default: boolean;
}

const initialForm: FormState = {
  name: "",
  description: "",
  channel_id: "",
  channel_secret: "",
  channel_access_token: "",
  basic_id: "",
  is_default: false,
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
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className="w-full border rounded-md px-3 py-2 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export function ConnectLineOADialog({ open, onClose, onCreated }: ConnectLineOADialogProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleClose = () => {
    setForm(initialForm);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.channel_id.trim()) return setError("Channel ID is required.");
    if (!form.channel_secret.trim()) return setError("Channel Secret is required.");
    if (!form.channel_access_token.trim()) return setError("Channel Access Token is required.");

    setSaving(true);
    try {
      const created = await lineOAApi.create({
        workspace_id: WORKSPACE_ID,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        channel_id: form.channel_id.trim(),
        channel_secret: form.channel_secret.trim(),
        channel_access_token: form.channel_access_token.trim(),
        basic_id: form.basic_id.trim() || undefined,
        is_default: form.is_default,
      });
      onCreated(created);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect LINE OA.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Connect LINE Official Account"
      description="Enter your LINE Developer Console credentials to link your OA."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Field label="Display Name" required>
          <TextInput
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. My Brand OA"
            disabled={saving}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <TextInput
            value={form.description}
            onChange={set("description")}
            placeholder="Optional description"
            disabled={saving}
          />
        </Field>

        <div className="border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            LINE Developer Credentials
          </p>

          {/* Channel ID */}
          <div className="space-y-3">
            <Field
              label="Channel ID"
              required
              hint="Found in LINE Developers Console → Basic settings"
            >
              <TextInput
                value={form.channel_id}
                onChange={set("channel_id")}
                placeholder="1234567890"
                disabled={saving}
              />
            </Field>

            {/* Channel Secret */}
            <Field
              label="Channel Secret"
              required
              hint="Found in LINE Developers Console → Basic settings"
            >
              <SecretInput
                value={form.channel_secret}
                onChange={set("channel_secret")}
                placeholder="Enter channel secret"
                disabled={saving}
              />
            </Field>

            {/* Channel Access Token */}
            <Field
              label="Channel Access Token"
              required
              hint="Found in LINE Developers Console → Messaging API settings"
            >
              <SecretInput
                value={form.channel_access_token}
                onChange={set("channel_access_token")}
                placeholder="Enter long-lived access token"
                disabled={saving}
              />
            </Field>

            {/* Bot Basic ID */}
            <Field
              label="Bot Basic ID"
              hint="Found in LINE Developers Console → Bot information (e.g. @ykg2018o)"
            >
              <TextInput
                value={form.basic_id}
                onChange={set("basic_id")}
                placeholder="e.g. @ykg2018o"
                disabled={saving}
              />
            </Field>
          </div>
        </div>

        {/* Is Default */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="is_default"
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-ring"
            checked={form.is_default}
            onChange={(e) => set("is_default")(e.target.checked)}
            disabled={saving}
          />
          <label htmlFor="is_default" className="text-sm cursor-pointer select-none">
            Set as default LINE OA
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2 min-w-[120px]">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {saving ? "Connecting..." : "Connect LINE OA"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
