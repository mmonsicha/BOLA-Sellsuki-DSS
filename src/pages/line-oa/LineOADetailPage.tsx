import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DSButton,
  DSCheckbox,
  DSInput,
  DSTextarea,
  EmptyState,
  FeaturePageScaffold,
  FormField,
  PageHeader,
  Spinner,
  StatCard,
  Switch,
  toast,
} from "@uxuissk/design-system";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Users,
  Webhook,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { lineOAApi, type MessageQuota } from "@/api/lineOA";
import { followerApi, type FollowerSyncStatus } from "@/api/follower";
import type { LineOA } from "@/types";

const statusVariant = {
  active: "success" as const,
  inactive: "secondary" as const,
  error: "destructive" as const,
};

const OUTBOUND_EVENT_OPTIONS = [
  "message.sent",
  "message.failed",
  "broadcast.completed",
  "follower.linked",
];

function CopyInlineButton({ text }: { text: string }) {
  return (
    <DSButton
      variant="ghost"
      size="sm"
      leftIcon={<Copy size={14} />}
      onClick={() => {
        void navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      Copy
    </DSButton>
  );
}

export function LineOADetailPage() {
  const id = window.location.pathname.split("/")[2];
  const [oa, setOa] = useState<LineOA | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [channelSecret, setChannelSecret] = useState("");
  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState("");
  const [liffId, setLiffId] = useState("");
  const [savingLiff, setSavingLiff] = useState(false);
  const [liffError, setLiffError] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [quota, setQuota] = useState<MessageQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState("");
  const [syncStatus, setSyncStatus] = useState<FollowerSyncStatus | null>(null);
  const [startingSync, setStartingSync] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollSyncStatus = useCallback((oaId: string) => {
    stopPolling();
    const poll = () => {
      followerApi.getSyncStatus(oaId).then((status) => {
        setSyncStatus(status);
        if (status.status === "completed" || status.status === "failed" || status.status === "idle") {
          stopPolling();
        }
      }).catch(() => stopPolling());
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
  }, [stopPolling]);

  useEffect(() => {
    if (!id) return;
    followerApi.getSyncStatus(id).then(setSyncStatus).catch(() => {});
  }, [id]);

  useEffect(() => {
    const statusValue = syncStatus?.status;
    if ((statusValue === "fetching_ids" || statusValue === "syncing_profiles") && id && !pollRef.current) {
      pollSyncStatus(id);
    }
    return () => { stopPolling(); };
  }, [id, pollSyncStatus, stopPolling, syncStatus?.status]);

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
        setWebhookUrl(data.outbound_webhook_url ?? "");
        setWebhookSecret(data.outbound_webhook_secret ?? "");
        setWebhookEvents(data.outbound_webhook_events ? data.outbound_webhook_events.split(",").filter(Boolean) : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleDefault = async (checked: boolean) => {
    if (!oa) return;
    setIsDefault(checked);
    try {
      const updated = await lineOAApi.update(oa.id, { is_default: checked });
      setOa(updated);
      setIsDefault(updated.is_default);
      toast.success(checked ? "Default OA enabled" : "Default OA unset");
    } catch (err) {
      setIsDefault(!checked);
      toast.error("Unable to update default OA", err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const handleSaveGeneral = async () => {
    if (!oa) return;
    setSavingGeneral(true);
    try {
      const updated = await lineOAApi.update(oa.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setOa(updated);
      setName(updated.name);
      setDescription(updated.description ?? "");
      toast.success("General settings saved");
    } catch (err) {
      toast.error("Failed to save settings", err instanceof Error ? err.message : "Unexpected error");
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
      toast.success("LINE credentials updated", "You can sync followers now.");
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
      toast.success("LIFF settings saved");
    } catch (err) {
      setLiffError(err instanceof Error ? err.message : "Failed to save LIFF ID.");
    } finally {
      setSavingLiff(false);
    }
  };

  const handleSaveOutboundWebhook = async () => {
    if (!oa) return;
    setSavingWebhook(true);
    try {
      await lineOAApi.updateOutboundWebhook(oa.id, {
        webhook_url: webhookUrl.trim(),
        secret: webhookSecret.trim(),
        events: webhookEvents.join(","),
      });
      toast.success("Outbound webhook saved");
    } catch (err) {
      toast.error("Failed to save outbound webhook", err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleFetchQuota = async () => {
    if (!oa) return;
    setQuotaLoading(true);
    setQuotaError("");
    try {
      setQuota(await lineOAApi.getMessageQuota(oa.id));
    } catch (err) {
      setQuotaError(err instanceof Error ? err.message : "Failed to fetch quota");
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleStartSync = async () => {
    if (!oa) return;
    setStartingSync(true);
    try {
      const status = await followerApi.startSync(oa.id);
      setSyncStatus(status);
      pollSyncStatus(oa.id);
      toast.success("Follower sync started");
    } catch (err) {
      toast.error("Failed to start follower sync", err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setStartingSync(false);
    }
  };

  const handleDisconnect = async () => {
    if (!oa) return;
    setDeleting(true);
    try {
      await lineOAApi.delete(oa.id);
      window.location.pathname = "/line-oa";
    } catch (err) {
      toast.error("Failed to disconnect LINE OA", err instanceof Error ? err.message : "Unexpected error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="LINE OA Settings">
        <div className="flex justify-center py-16">
          <Spinner label="Loading LINE OA" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !oa) {
    return (
      <AppLayout title="LINE OA Settings">
        <EmptyState
          title="LINE OA not found"
          description="This official account is not available in the current workspace."
          action={<DSButton variant="secondary" onClick={() => { window.location.pathname = "/line-oa"; }}>Back to LINE OAs</DSButton>}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="LINE OA Settings">
      <FeaturePageScaffold
        layout="detail"
        header={(
          <PageHeader
            title={oa.name}
            subtitle="Official account configuration, sync status, credentials, and integration settings."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "LINE OA", href: "/line-oa" }, { label: oa.name }]} />}
            actions={(
              <div className="flex items-center gap-3">
                <DSButton variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => { window.location.pathname = "/line-oa"; }}>
                  Back
                </DSButton>
                <Badge variant={statusVariant[oa.status]} size="sm">{oa.status}</Badge>
              </div>
            )}
          />
        )}
        banner={
          credsError ? <Alert variant="danger" title="Credential update failed">{credsError}</Alert>
            : liffError ? <Alert variant="danger" title="LIFF update failed">{liffError}</Alert>
            : quotaError ? <Alert variant="warning" title="Unable to load message quota">{quotaError}</Alert>
            : undefined
        }
        main={(
          <div className="space-y-6">
            <Card elevation="none">
              <CardHeader title="General settings" subtitle="Display metadata and sender defaults for this OA." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="oa-name" label="Display name" required>
                    <DSInput id="oa-name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
                  </FormField>
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4">
                    <Switch
                      checked={isDefault}
                      onChange={(checked) => { void handleToggleDefault(checked); }}
                      label="Default LINE OA"
                      description="Use this account as the default sender when a flow does not explicitly pick an OA."
                    />
                  </div>
                </div>
                <FormField name="oa-description" label="Description">
                  <DSTextarea id="oa-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
                </FormField>
                <div className="flex justify-end">
                  <DSButton variant="primary" leftIcon={savingGeneral ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} loading={savingGeneral} onClick={() => { void handleSaveGeneral(); }}>
                    Save general settings
                  </DSButton>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Webhook integration" subtitle="Use these values when configuring Messaging API callbacks in LINE Developers Console." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4">
                    <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">Webhook URL</div>
                    <div className="break-all text-sm text-[var(--text-secondary)]">{oa.webhook_url || "Not available"}</div>
                  </div>
                  {oa.webhook_url ? (
                    <div className="flex items-end">
                      <CopyInlineButton text={oa.webhook_url} />
                    </div>
                  ) : null}
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="LINE credentials" subtitle="Rotate secrets here when you update credentials in LINE Developers Console." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="oa-channel-id" label="Channel ID">
                    <DSInput id="oa-channel-id" value={oa.channel_id} disabled fullWidth />
                  </FormField>
                  <FormField name="oa-basic-id" label="Basic ID">
                    <DSInput id="oa-basic-id" value={oa.basic_id || "-"} disabled fullWidth />
                  </FormField>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="oa-channel-secret" label="Channel Secret" helperText="Leave empty if you do not want to rotate it now.">
                    <DSInput id="oa-channel-secret" value={channelSecret} onChange={(event) => setChannelSecret(event.target.value)} showPasswordToggle fullWidth />
                  </FormField>
                  <FormField name="oa-channel-token" label="Channel Access Token" helperText="Leave empty if you do not want to rotate it now.">
                    <DSInput id="oa-channel-token" value={channelAccessToken} onChange={(event) => setChannelAccessToken(event.target.value)} showPasswordToggle fullWidth />
                  </FormField>
                </div>
                <div className="flex justify-end">
                  <DSButton variant="primary" leftIcon={savingCreds ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />} loading={savingCreds} onClick={() => { void handleSaveCredentials(); }}>
                    Update credentials
                  </DSButton>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Follower sync" subtitle="Pull latest follower IDs and profile metadata from LINE into BOLA." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <StatCard title="Status" value={syncStatus?.status ?? "idle"} icon={<Users size={18} />} />
                  <StatCard title="Fetched IDs" value={syncStatus?.total_ids ?? 0} icon={<Users size={18} />} />
                  <StatCard title="Synced" value={syncStatus?.synced_count ?? 0} icon={<Users size={18} />} />
                  <StatCard title="Failed" value={syncStatus?.failed_count ?? 0} icon={<Users size={18} />} />
                </div>
                {syncStatus?.error_message ? (
                  <Alert variant="danger" title="Last sync error">{syncStatus.error_message}</Alert>
                ) : null}
                <div className="flex justify-end">
                  <DSButton variant="primary" leftIcon={startingSync ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />} loading={startingSync} onClick={() => { void handleStartSync(); }}>
                    Start sync
                  </DSButton>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="LIFF and outbound webhook" subtitle="Configure BOLA's LIFF bridge and outbound event delivery." />
              <CardBody className="space-y-6">
                <div className="space-y-4">
                  <FormField name="oa-liff-id" label="LIFF ID" helperText="Used by greeting and consent flows embedded in LINE.">
                    <DSInput id="oa-liff-id" value={liffId} onChange={(event) => setLiffId(event.target.value)} fullWidth />
                  </FormField>
                  <div className="flex justify-end">
                    <DSButton variant="secondary" leftIcon={savingLiff ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} loading={savingLiff} onClick={() => { void handleSaveLiff(); }}>
                      Save LIFF ID
                    </DSButton>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/20 p-4">
                  <FormField name="oa-outbound-url" label="Outbound webhook URL">
                    <DSInput id="oa-outbound-url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} fullWidth />
                  </FormField>
                  <FormField name="oa-outbound-secret" label="Outbound webhook secret">
                    <DSInput id="oa-outbound-secret" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} showPasswordToggle fullWidth />
                  </FormField>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Events</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {OUTBOUND_EVENT_OPTIONS.map((eventName) => (
                        <div key={eventName} className="rounded-2xl border border-[var(--border-default)] bg-white p-4">
                          <DSCheckbox
                            checked={webhookEvents.includes(eventName)}
                            onChange={(checked) => setWebhookEvents((current) => checked ? [...new Set([...current, eventName])] : current.filter((item) => item !== eventName))}
                            label={eventName}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <DSButton variant="primary" leftIcon={savingWebhook ? <RefreshCw size={16} className="animate-spin" /> : <Webhook size={16} />} loading={savingWebhook} onClick={() => { void handleSaveOutboundWebhook(); }}>
                      Save outbound webhook
                    </DSButton>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Danger zone" subtitle="Disconnecting removes the OA configuration from this workspace." />
              <CardBody>
                <DSButton variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setShowDisconnectDialog(true)}>
                  Disconnect LINE OA
                </DSButton>
              </CardBody>
            </Card>
          </div>
        )}
        aside={(
          <div className="space-y-4">
            <Card elevation="none">
              <CardBody className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-xl font-semibold text-sky-700">
                  {oa.picture_url ? <img src={oa.picture_url} alt={oa.name} className="h-full w-full object-cover" /> : oa.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{oa.name}</h3>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Badge variant={statusVariant[oa.status]} size="sm">{oa.status}</Badge>
                    {oa.is_default ? <Badge variant="outline" size="sm">Default</Badge> : null}
                  </div>
                </div>
              </CardBody>
            </Card>
            <StatCard title="Followers" value={(oa.follower_count ?? 0).toLocaleString()} icon={<Users size={18} />} />
            <Card elevation="none">
              <CardHeader title="Message quota" action={<DSButton variant="ghost" size="sm" onClick={() => { void handleFetchQuota(); }}>{quotaLoading ? "Loading..." : "Refresh"}</DSButton>} />
              <CardBody className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">Plan: <span className="font-medium text-[var(--text-primary)]">{quota?.quota_type ?? "-"}</span></div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">Limit: <span className="font-medium text-[var(--text-primary)]">{quota ? quota.limit.toLocaleString() : "-"}</span></div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">Usage: <span className="font-medium text-[var(--text-primary)]">{quota ? quota.total_usage.toLocaleString() : "-"}</span></div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">Remaining: <span className="font-medium text-[var(--text-primary)]">{quota ? quota.remaining.toLocaleString() : "-"}</span></div>
              </CardBody>
            </Card>
            <Card elevation="none">
              <CardHeader title="Quick reference" />
              <CardBody className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">
                  Basic ID: <span className="font-medium text-[var(--text-primary)]">{oa.basic_id || "-"}</span>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">
                  Channel ID: <span className="font-medium text-[var(--text-primary)]">{oa.channel_id}</span>
                </div>
                {oa.webhook_url ? (
                  <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">
                    <div className="mb-2 text-xs uppercase tracking-wide">Webhook URL</div>
                    <div className="break-all text-[var(--text-primary)]">{oa.webhook_url}</div>
                    <div className="mt-3">
                      <CopyInlineButton text={oa.webhook_url} />
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        )}
      />

      <ConfirmDialog
        open={showDisconnectDialog}
        onClose={() => setShowDisconnectDialog(false)}
        onConfirm={() => { void handleDisconnect(); }}
        title="Disconnect this LINE OA?"
        description={`"${oa.name}" will be removed from this workspace. This action cannot be undone from the UI.`}
        confirmLabel={deleting ? "Disconnecting..." : "Disconnect LINE OA"}
        cancelLabel="Cancel"
        variant="destructive"
      />
    </AppLayout>
  );
}
