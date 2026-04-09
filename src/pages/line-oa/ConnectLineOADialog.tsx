import { useState } from "react";
import {
  Alert,
  DSButton,
  DSCheckbox,
  DSInput,
  FormField,
  Modal,
} from "@uxuissk/design-system";
import { RefreshCw } from "lucide-react";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";

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

export function ConnectLineOADialog({ open, onClose, onCreated }: ConnectLineOADialogProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleClose = () => {
    setForm(initialForm);
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.name.trim()) return setError("Display name is required.");
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
    <Modal
      open={open}
      onClose={handleClose}
      title="Connect LINE Official Account"
      description="Add your LINE Developer Console credentials to link a new official account into BOLA."
      size="lg"
      footer={(
        <div className="flex w-full items-center justify-end gap-3">
          <DSButton variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </DSButton>
          <DSButton
            variant="primary"
            onClick={() => { void handleSubmit(); }}
            loading={saving}
            leftIcon={saving ? <RefreshCw size={16} className="animate-spin" /> : undefined}
          >
            Connect LINE OA
          </DSButton>
        </div>
      )}
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="danger" title="Unable to connect LINE OA">
            {error}
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            name="line-oa-name"
            label="Display Name"
            required
            helperText="Use a name your team can easily recognize in BOLA."
          >
            <DSInput
              id="line-oa-name"
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              placeholder="e.g. My Brand OA"
              disabled={saving}
              fullWidth
            />
          </FormField>

          <FormField
            name="line-oa-basic-id"
            label="Bot Basic ID"
            helperText="Optional, e.g. @ykg2018o."
          >
            <DSInput
              id="line-oa-basic-id"
              value={form.basic_id}
              onChange={(event) => set("basic_id")(event.target.value)}
              placeholder="@mybrand"
              disabled={saving}
              fullWidth
            />
          </FormField>
        </div>

        <FormField
          name="line-oa-description"
          label="Description"
          helperText="Internal description for your team."
        >
          <DSInput
            id="line-oa-description"
            value={form.description}
            onChange={(event) => set("description")(event.target.value)}
            placeholder="Optional description"
            disabled={saving}
            fullWidth
          />
        </FormField>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 p-4">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">LINE Developer credentials</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              These values come from LINE Developers Console. Keep them private and never commit them into source control.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              name="line-oa-channel-id"
              label="Channel ID"
              required
              helperText="Found in LINE Developers Console > Basic settings."
            >
              <DSInput
                id="line-oa-channel-id"
                value={form.channel_id}
                onChange={(event) => set("channel_id")(event.target.value)}
                placeholder="1234567890"
                disabled={saving}
                fullWidth
              />
            </FormField>

            <FormField
              name="line-oa-channel-secret"
              label="Channel Secret"
              required
              helperText="Used to verify webhook signatures."
            >
              <DSInput
                id="line-oa-channel-secret"
                value={form.channel_secret}
                onChange={(event) => set("channel_secret")(event.target.value)}
                placeholder="Enter channel secret"
                disabled={saving}
                showPasswordToggle
                fullWidth
              />
            </FormField>

            <FormField
              name="line-oa-channel-token"
              label="Channel Access Token"
              required
              helperText="Use a long-lived token that allows BOLA to message on behalf of this OA."
            >
              <DSInput
                id="line-oa-channel-token"
                value={form.channel_access_token}
                onChange={(event) => set("channel_access_token")(event.target.value)}
                placeholder="Enter long-lived access token"
                disabled={saving}
                showPasswordToggle
                fullWidth
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-4">
          <DSCheckbox
            checked={form.is_default}
            onChange={(checked) => set("is_default")(checked)}
            label="Set as default LINE OA"
            description="BOLA will use this account as the default sender when a feature does not ask for an OA explicitly."
            disabled={saving}
          />
        </div>
      </div>
    </Modal>
  );
}
