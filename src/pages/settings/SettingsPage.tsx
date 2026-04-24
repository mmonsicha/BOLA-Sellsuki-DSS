import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  DSButton,
  DSInput,
  EmptyState,
  Notification,
  Switch,
  toast,
} from "@uxuissk/design-system";
import { FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import {
  Building2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  RefreshCw,
  Shield,
  Webhook,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { authApi } from "@/api/auth";
import { outboundEventApi } from "@/api/outboundEvent";
import { workspaceApi } from "@/api/workspace";
import { getWorkspaceId } from "@/lib/auth";
import type { OutboundDeliveryLog, OutboundWebhookConfig, Workspace } from "@/types";

export function SettingsPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  const [webhookConfig, setWebhookConfig] = useState<OutboundWebhookConfig | null>(null);
  const [webhookURL, setWebhookURL] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [logs, setLogs] = useState<OutboundDeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    void Promise.allSettled([
      workspaceApi.get(workspaceId),
      workspaceApi.getOutboundWebhook(workspaceId),
    ])
      .then(([workspaceResult, webhookResult]) => {
        if (workspaceResult.status === "fulfilled") {
          setWorkspace(workspaceResult.value);
          setName(workspaceResult.value.name);
          setLogoURL(workspaceResult.value.logo_url ?? "");
          setIsActive(workspaceResult.value.is_active);
        }

        if (webhookResult.status === "fulfilled") {
          setWebhookConfig(webhookResult.value);
          setWebhookURL(webhookResult.value.webhook_url ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const loadLogs = (page = 1) => {
    if (!workspaceId) return;
    setLogsLoading(true);
    setLogsPage(page);
    outboundEventApi
      .listLogs({ workspace_id: workspaceId, page, page_size: 10 })
      .then((res) => setLogs(res.data ?? []))
      .catch(() => {
        setLogs([]);
        toast.error("Failed to load webhook delivery logs");
      })
      .finally(() => setLogsLoading(false));
  };

  const handleSaveWorkspace = async () => {
    if (!workspace) return;
    setSavingWorkspace(true);
    try {
      const updated = await workspaceApi.update(workspace.id, {
        name,
        logo_url: logoURL,
        is_active: isActive,
      });
      setWorkspace(updated);
      toast.success("Workspace settings updated");
    } catch {
      toast.error("Failed to save workspace settings");
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!workspaceId || !webhookURL) return;
    setSavingWebhook(true);
    try {
      const config = await workspaceApi.updateOutboundWebhook(workspaceId, {
        webhook_url: webhookURL,
        secret: webhookSecret || undefined,
      });
      setWebhookConfig(config);
      setWebhookSecret("");
      toast.success("Outbound webhook settings updated");
    } catch {
      toast.error("Failed to save outbound webhook settings");
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleChangePassword = async () => {
    if (!workspaceId) return;
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(workspaceId, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
          <RefreshCw size={16} className="mr-2 animate-spin" />
          Loading settings...
        </div>
      </AppLayout>
    );
  }

  if (!workspace) {
    return (
      <AppLayout title="Settings">
        <EmptyState
          icon={<Building2 size={48} />}
          title="Workspace not found"
          description="The current session does not have a valid workspace. Sign in again and retry."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <FeaturePageScaffold
        layout="settings"
        header={(
          <PageHeader
            title="Settings"
            subtitle="Manage workspace identity, outbound webhook delivery, and local password access with the latest DS pattern."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />}
          />
        )}
        content={(
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <Card elevation="none">
              <CardHeader
                title="Workspace profile"
                subtitle="Core branding and account state used across the BOLA admin workspace."
              />
              <CardBody className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DSInput label="Workspace name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
                  <DSInput
                    label="Slug"
                    value={workspace.slug}
                    disabled
                    helperText="Slug is generated at creation time and cannot be changed."
                    fullWidth
                  />
                </div>

                <DSInput
                  label="Logo URL"
                  value={logoURL}
                  onChange={(event) => setLogoURL(event.target.value)}
                  placeholder="https://example.com/logo.png"
                  fullWidth
                />

                <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4">
                    <Switch
                      checked={isActive}
                      onChange={setIsActive}
                      label="Workspace active"
                      description="Inactive workspaces stop serving connected LINE OA operations until re-enabled."
                    />
                  </div>
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Globe size={16} className="text-[var(--muted-foreground)]" />
                      <span className="text-sm font-medium text-[var(--foreground)]">Workspace summary</span>
                    </div>
                    <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                      <div className="flex items-center justify-between gap-3">
                        <span>ID</span>
                        <code className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs">{workspace.id}</code>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Plan</span>
                        <span>{workspace.plan_id || "Default"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Status</span>
                        <Badge variant={workspace.is_active ? "success" : "secondary"} size="sm">
                          {workspace.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <DSButton
                    variant="primary"
                    leftIcon={savingWorkspace ? <RefreshCw size={16} className="animate-spin" /> : <Building2 size={16} />}
                    loading={savingWorkspace}
                    onClick={() => { void handleSaveWorkspace(); }}
                  >
                    Save workspace
                  </DSButton>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader
                title="Outbound webhook"
                subtitle="Send follow and unfollow events to your external system with optional request signing."
              />
              <CardBody className="space-y-5">
                <Notification
                  type={webhookConfig?.webhook_url ? "success" : "info"}
                  title={webhookConfig?.webhook_url ? "Webhook is configured" : "Webhook not configured yet"}
                  message={webhookConfig?.webhook_url
                    ? `${webhookConfig.webhook_url}${webhookConfig.has_secret ? " • request signing enabled" : ""}`
                    : "Provide a target URL to start receiving outbound follow activity events."}
                  dismissible={false}
                />

                <DSInput
                  label="Webhook URL"
                  value={webhookURL}
                  onChange={(event) => setWebhookURL(event.target.value)}
                  placeholder="https://your-system.com/webhooks/bola"
                  fullWidth
                />

                <div className="relative">
                  <DSInput
                    label="Signing secret"
                    value={webhookSecret}
                    onChange={(event) => setWebhookSecret(event.target.value)}
                    type={showSecret ? "text" : "password"}
                    helperText={webhookConfig?.has_secret ? "Leave blank to keep the existing secret." : "Optional. When set, BOLA sends an HMAC signature header."}
                    fullWidth
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((value) => !value)}
                    className="absolute right-3 top-[42px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DSButton
                    variant="secondary"
                    leftIcon={<Webhook size={16} />}
                    onClick={() => {
                      const next = !showLogs;
                      setShowLogs(next);
                      if (next) loadLogs(1);
                    }}
                  >
                    {showLogs ? "Hide delivery logs" : "Show delivery logs"}
                  </DSButton>

                  <DSButton
                    variant="primary"
                    leftIcon={savingWebhook ? <RefreshCw size={16} className="animate-spin" /> : <Webhook size={16} />}
                    loading={savingWebhook}
                    disabled={!webhookURL}
                    onClick={() => { void handleSaveWebhook(); }}
                  >
                    Save webhook
                  </DSButton>
                </div>

                {showLogs && (
                  <Card elevation="none" className="border border-[var(--border-default)]">
                    <CardHeader title="Delivery logs" subtitle="Recent outbound event attempts for follow and unfollow activities." />
                    <CardBody className="space-y-3">
                      {logsLoading && (
                        <div className="flex items-center justify-center py-10 text-[var(--muted-foreground)]">
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Loading delivery logs...
                        </div>
                      )}

                      {!logsLoading && logs.length === 0 && (
                        <EmptyState
                          icon={<Webhook size={40} />}
                          title="No delivery logs yet"
                          description="Logs will appear after the first outbound webhook delivery attempt."
                        />
                      )}

                      {!logsLoading && logs.length > 0 && (
                        <div className="space-y-3">
                          {logs.map((log) => (
                            <Notification
                              key={log.id}
                              type={log.status === "success" ? "success" : log.status === "failed" ? "error" : "warning"}
                              title={`${log.event_type} • ${log.http_status_code ? `HTTP ${log.http_status_code}` : "Pending"}`}
                              message={`${log.target_url} • ${new Date(log.triggered_at).toLocaleString()}${log.error_message ? ` • ${log.error_message}` : ""}`}
                              dismissible={false}
                            />
                          ))}

                          <div className="flex items-center justify-end gap-2">
                            <DSButton variant="ghost" disabled={logsPage <= 1} onClick={() => loadLogs(logsPage - 1)}>
                              Previous
                            </DSButton>
                            <span className="text-sm text-[var(--muted-foreground)]">Page {logsPage}</span>
                            <DSButton variant="ghost" disabled={logs.length < 10} onClick={() => loadLogs(logsPage + 1)}>
                              Next
                            </DSButton>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader
                title="Local password access"
                subtitle="Change the admin password used when this workspace runs in local JWT authentication mode."
              />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <DSInput
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    showPasswordToggle
                    fullWidth
                  />
                  <DSInput
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    helperText="Minimum 8 characters"
                    showPasswordToggle
                    fullWidth
                  />
                </div>

                <DSInput
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  showPasswordToggle
                  fullWidth
                />

                <div className="flex justify-end">
                  <DSButton
                    variant="primary"
                    leftIcon={savingPassword ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    loading={savingPassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                    onClick={() => { void handleChangePassword(); }}
                  >
                    Change password
                  </DSButton>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none" className="border-[var(--destructive)]/25">
              <CardHeader title="Danger zone" subtitle="High-impact operations should be confirmed by an admin before you continue." />
              <CardBody className="space-y-4">
                <Alert variant="warning" title="Deactivate workspace carefully">
                  Disabling a workspace affects LINE OA connectivity, follower sync, and campaign execution across this admin area.
                </Alert>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 p-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-[var(--foreground)]">Deactivate workspace</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      This action is not automated yet. Coordinate with the platform team before deactivating production workspaces.
                    </div>
                  </div>
                  <DSButton variant="danger" leftIcon={<Shield size={16} />} onClick={() => toast.info("Deactivate workspace flow is not implemented yet")}>
                    Deactivate
                  </DSButton>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      />
    </AppLayout>
  );
}
