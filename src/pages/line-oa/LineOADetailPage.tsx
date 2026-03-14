import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Save,
  Copy,
  Check,
  ArrowLeft,
  Link2,
  Settings,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import { useToast } from "@/components/ui/toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusVariant = {
  active: "success" as const,
  inactive: "secondary" as const,
  error: "destructive" as const,
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadonlyInput({ value }: { value: string }) {
  return (
    <input
      type="text"
      readOnly
      value={value}
      className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-default focus:outline-none font-mono"
    />
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
      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
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
        className="w-full border rounded-md px-3 py-2 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border hover:border-border"
      title="Copy"
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LineOADetailPage() {
  const toast = useToast();
  const id = window.location.pathname.split("/")[2];

  const [oa, setOa] = useState<LineOA | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // General settings form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  // Credentials form
  const [channelSecret, setChannelSecret] = useState("");
  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [savedCreds, setSavedCreds] = useState(false);
  const [credsError, setCredsError] = useState("");

  // LON LIFF settings
  const [liffId, setLiffId] = useState("");
  const [savingLiff, setSavingLiff] = useState(false);
  const [savedLiff, setSavedLiff] = useState(false);
  const [liffError, setLiffError] = useState("");

  // Danger zone
  const [deleting, setDeleting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    lineOAApi
      .get(id)
      .then((data) => {
        setOa(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setIsDefault(data.is_default);
        setLiffId(data.liff_id ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveGeneral = async () => {
    if (!oa) return;
    setSavingGeneral(true);
    try {
      const updated = await lineOAApi.update(oa.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_default: isDefault,
      });
      setOa(updated);
      setName(updated.name);
      setDescription(updated.description ?? "");
      setIsDefault(updated.is_default);
      setSavedGeneral(true);
      setTimeout(() => setSavedGeneral(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!oa) return;
    setCredsError("");
    if (!channelSecret.trim() && !channelAccessToken.trim()) {
      return setCredsError("Enter at least one credential to update.");
    }
    setSavingCreds(true);
    try {
      const payload: Record<string, string> = {};
      if (channelSecret.trim()) payload.channel_secret = channelSecret.trim();
      if (channelAccessToken.trim()) payload.channel_access_token = channelAccessToken.trim();
      const updated = await lineOAApi.update(oa.id, payload);
      setOa(updated);
      setChannelSecret("");
      setChannelAccessToken("");
      setSavedCreds(true);
      setTimeout(() => setSavedCreds(false), 2000);
      // Toast: next-step suggestion
      toast.toast({
        variant: "success",
        title: "LINE OA connected!",
        description: "Import followers to start segmenting",
        duration: 6000,
      });
    } catch (err) {
      setCredsError(err instanceof Error ? err.message : "Failed to update credentials.");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSaveLiff = async () => {
    if (!oa) return;
    setLiffError("");
    setSavingLiff(true);
    try {
      const updated = await lineOAApi.update(oa.id, { liff_id: liffId.trim() });
      setOa(updated);
      setLiffId(updated.liff_id ?? "");
      setSavedLiff(true);
      setTimeout(() => setSavedLiff(false), 2000);
    } catch (err) {
      setLiffError(err instanceof Error ? err.message : "Failed to save LIFF ID.");
    } finally {
      setSavingLiff(false);
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectDialog(true);
  };

  const handleConfirmedDisconnect = async () => {
    if (!oa) return;
    setShowDisconnectDialog(false);
    setDeleting(true);
    try {
      await lineOAApi.delete(oa.id);
      window.location.pathname = "/line-oa";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect LINE OA.");
      setDeleting(false);
    }
  };

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="LINE OA Settings">
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (notFound || !oa) {
    return (
      <AppLayout title="LINE OA Settings">
        <div className="text-center py-20">
          <p className="text-muted-foreground">LINE OA not found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => (window.location.pathname = "/line-oa")}
          >
            Back to LINE OAs
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="LINE OA Settings">
      <div className="space-y-6 max-w-2xl">

        {/* Breadcrumb / back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.pathname = "/line-oa")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            LINE Official Accounts
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium truncate">{oa.name}</span>
        </div>

        {/* Hero header */}
        <div className="flex items-center gap-4 p-4 bg-muted/40 border rounded-lg">
          <div className="w-14 h-14 rounded-full bg-line/10 border-2 border-line/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {oa.picture_url ? (
              <img src={oa.picture_url} alt={oa.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-line font-bold text-xl">{oa.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-lg">{oa.name}</span>
              <Badge variant={statusVariant[oa.status]}>{oa.status}</Badge>
              {oa.is_default && (
                <Badge variant="outline" className="text-xs">Default</Badge>
              )}
            </div>
            {oa.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{oa.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Connected {new Date(oa.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* ── Card 1: Webhook Integration ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 size={16} />
              Webhook Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy the webhook URL below and paste it into your{" "}
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                LINE Developers Console
              </a>{" "}
              under <strong>Messaging API → Webhook settings</strong>.
            </p>

            {oa.webhook_url ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <div className="flex items-center gap-2">
                  <ReadonlyInput value={oa.webhook_url} />
                  <CopyButton text={oa.webhook_url} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted rounded-md px-4 py-3">
                No webhook URL assigned yet. Contact your administrator.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">
                  Channel ID
                </p>
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{oa.channel_id}</code>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">
                  OA ID
                </p>
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{oa.id}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: LON Settings ─────────────────────────────────────────── */}
        {(() => {
          const backendOrigin = oa.webhook_url
            ? new URL(oa.webhook_url).origin
            : window.location.origin;
          const consentURL = `${backendOrigin}/v1/lon/consent-callback`;
          const revokeURL = `${backendOrigin}/v1/lon/revoke-callback`;
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell size={16} />
                  LINE Notification Messaging (LON)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure these callback URLs in your{" "}
                  <a
                    href="https://developers.line.biz/console/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    LINE Developers Console
                  </a>{" "}
                  under{" "}
                  <strong>Messaging API → LINE Notification Messaging → Consent settings</strong>.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Consent Callback URL</label>
                    <div className="flex items-center gap-2">
                      <ReadonlyInput value={consentURL} />
                      <CopyButton text={consentURL} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      LINE calls this URL when a user grants LON consent.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Revoke Callback URL</label>
                    <div className="flex items-center gap-2">
                      <ReadonlyInput value={revokeURL} />
                      <CopyButton text={revokeURL} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      LINE calls this URL when a user revokes LON consent.
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted/60 border px-4 py-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Setup steps in LINE Developers Console:</p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Go to your channel → <strong>Messaging API</strong> tab</li>
                    <li>Scroll to <strong>LINE Notification Messaging</strong></li>
                    <li>Paste the Consent Callback URL above</li>
                    <li>Paste the Revoke Callback URL above</li>
                    <li>Save changes</li>
                  </ol>
                </div>

                {/* LIFF ID field */}
                <div className="pt-2 border-t space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-0.5">LIFF App ID (for consent push)</p>
                    <p className="text-xs text-muted-foreground">
                      When set, BOLA can send a Flex Message button to followers that opens
                      your LIFF app so they can grant LON consent directly in LINE.
                      Create a LIFF app in the{" "}
                      <a
                        href="https://developers.line.biz/console/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        LINE Developers Console
                      </a>{" "}
                      and set its endpoint URL to{" "}
                      <code className="bg-muted px-1 rounded">
                        {window.location.origin}/lon/subscribe/{oa.id}?liff_id=YOUR_LIFF_ID
                      </code>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <TextInput
                      value={liffId}
                      onChange={setLiffId}
                      placeholder="e.g. 1234567890-AbCdEfGh"
                      disabled={savingLiff}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: <code className="bg-muted px-1 rounded">&lt;channelId&gt;-&lt;suffix&gt;</code>
                    </p>
                  </div>
                  {liffError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                      {liffError}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => { void handleSaveLiff(); }}
                      disabled={savingLiff}
                      size="sm"
                      variant="outline"
                      className="gap-2 min-w-[120px]"
                    >
                      {savingLiff ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : savedLiff ? (
                        <CheckCircle2 size={13} className="text-green-500" />
                      ) : (
                        <Save size={13} />
                      )}
                      {savedLiff ? "Saved!" : savingLiff ? "Saving..." : "Save LIFF ID"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ── Card 3: General Settings ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings size={16} />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Display Name">
              <TextInput
                value={name}
                onChange={setName}
                placeholder="e.g. My Brand OA"
                disabled={savingGeneral}
              />
            </Field>

            <Field label="Description">
              <TextInput
                value={description}
                onChange={setDescription}
                placeholder="Optional description"
                disabled={savingGeneral}
              />
            </Field>

            <div className="flex items-center gap-2">
              <input
                id="is_default_edit"
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-ring"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={savingGeneral}
              />
              <label htmlFor="is_default_edit" className="text-sm cursor-pointer select-none">
                Set as default LINE OA
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => { void handleSaveGeneral(); }}
                disabled={savingGeneral}
                className="gap-2 min-w-[130px]"
              >
                {savingGeneral ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : savedGeneral ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Save size={14} />
                )}
                {savedGeneral ? "Saved!" : savingGeneral ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 4: Credentials ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound size={16} />
              Update Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rotate your LINE credentials here. Leave a field blank to keep the current value.
            </p>

            <Field
              label="New Channel Secret"
              hint="Found in LINE Developers Console → Basic settings"
            >
              <SecretInput
                value={channelSecret}
                onChange={setChannelSecret}
                placeholder="Leave blank to keep current"
                disabled={savingCreds}
              />
            </Field>

            <Field
              label="New Channel Access Token"
              hint="Found in LINE Developers Console → Messaging API settings"
            >
              <SecretInput
                value={channelAccessToken}
                onChange={setChannelAccessToken}
                placeholder="Leave blank to keep current"
                disabled={savingCreds}
              />
            </Field>

            {credsError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {credsError}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => { void handleSaveCredentials(); }}
                disabled={savingCreds}
                variant="outline"
                className="gap-2 min-w-[160px]"
              >
                {savingCreds ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : savedCreds ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <KeyRound size={14} />
                )}
                {savedCreds ? "Credentials Updated!" : savingCreds ? "Updating..." : "Update Credentials"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 5: Danger Zone ───────────────────────────────────────────── */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Shield size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Disconnect LINE OA</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Removes this OA and stops all auto replies, webhooks, and scheduled broadcasts
                  associated with it. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={deleting}
                className="flex-shrink-0 gap-2"
              >
                {deleting && <RefreshCw size={13} className="animate-spin" />}
                {deleting ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <AlertDialog open={showDisconnectDialog} onOpenChange={(open) => !open && setShowDisconnectDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect "{oa?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the LINE OA and stop all associated auto replies, webhooks, and broadcasts. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { void handleConfirmedDisconnect(); }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
