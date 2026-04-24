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
  DSTextarea,
  EmptyState,
  FormField,
  Spinner,
  StatCard,
  TagInput,
  toast,
} from "@uxuissk/design-system";
import { FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { Follower, FollowerBehaviorSummary } from "@/types";
import { followerApi } from "@/api/follower";
import type { FollowerActivity } from "@/api/follower";
import { analyticsApi } from "@/api/analytics";
import { getWorkspaceId } from "@/lib/auth";

const followStatusVariant = {
  following: "success" as const,
  unfollowed: "secondary" as const,
  blocked: "destructive" as const,
};

interface FormState {
  email: string;
  phone: string;
  note: string;
  tags: string[];
  custom_fields: Record<string, string>;
}

function engagementVariant(score: number): "success" | "warning" | "secondary" {
  if (score >= 61) return "success";
  if (score >= 31) return "warning";
  return "secondary";
}

function FollowerActivityCard({ followerId }: { followerId: string }) {
  const [activity, setActivity] = useState<FollowerActivity | null>(null);

  useEffect(() => {
    followerApi.getFollowerActivity(followerId).then(setActivity).catch(() => {});
  }, [followerId]);

  if (!activity) return null;

  return (
    <Card elevation="none">
      <CardHeader title="Messaging activity" subtitle="Recent delivery performance and message footprint." />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Broadcasts received" value={activity.total_broadcasts.toLocaleString()} icon={<Send size={18} />} />
          <StatCard title="LON messages" value={activity.lon_count.toLocaleString()} icon={<Send size={18} />} />
          <StatCard title="PNP total" value={activity.pnp_total.toLocaleString()} icon={<Send size={18} />} />
          <StatCard title="PNP success" value={activity.pnp_success.toLocaleString()} icon={<Send size={18} />} />
        </div>
        {activity.recent_broadcasts.length > 0 && (
          <div className="space-y-3">
            {activity.recent_broadcasts.map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : "-"}
                </span>
                <Badge variant={delivery.status === "success" ? "success" : delivery.status === "failed" ? "destructive" : "secondary"} size="sm">
                  {delivery.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function BehaviorCard({ followerId, workspaceId }: { followerId: string; workspaceId: string }) {
  const [behavior, setBehavior] = useState<FollowerBehaviorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    analyticsApi
      .getFollowerBehavior(followerId, workspaceId)
      .then(setBehavior)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [followerId, workspaceId]);

  if (loading) {
    return (
      <Card elevation="none">
        <CardBody className="flex justify-center py-8">
          <Spinner label="Loading engagement behavior" />
        </CardBody>
      </Card>
    );
  }

  if (!behavior) return null;

  return (
    <Card elevation="none">
      <CardHeader title="Engagement behavior" subtitle="Behavior summary derived from analytics activity." />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Engagement score</span>
          <Badge variant={engagementVariant(behavior.engagement_score)} size="sm">
            {behavior.engagement_score.toFixed(1)}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Clicks" value={behavior.total_clicks.toLocaleString()} icon={<Activity size={18} />} />
          <StatCard title="Impressions" value={behavior.total_impressions.toLocaleString()} icon={<Activity size={18} />} />
          <StatCard title="Messages sent" value={behavior.total_messages_sent.toLocaleString()} icon={<Activity size={18} />} />
          <StatCard title="Chat sessions" value={behavior.chat_sessions_count.toLocaleString()} icon={<Activity size={18} />} />
        </div>
        {behavior.last_active_at && (
          <div className="text-sm text-[var(--text-secondary)]">
            Last active: <span className="text-[var(--text-primary)]">{new Date(behavior.last_active_at).toLocaleString()}</span>
          </div>
        )}
        {behavior.most_clicked_label && (
          <div className="text-sm text-[var(--text-secondary)]">
            Most clicked: <span className="font-medium text-[var(--text-primary)]">{behavior.most_clicked_label}</span>
          </div>
        )}
        {behavior.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {behavior.interest_tags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: Record<string, string>;
  onChange: (fields: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const add = () => {
    const key = newKey.trim();
    if (!key) return;
    onChange({ ...fields, [key]: newVal.trim() });
    setNewKey("");
    setNewVal("");
  };

  const remove = (key: string) => {
    const next = { ...fields };
    delete next[key];
    onChange(next);
  };

  const update = (key: string, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="space-y-3">
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} className="grid gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
          <DSInput value={key} disabled fullWidth />
          <DSInput value={value} onChange={(event) => update(key, event.target.value)} fullWidth />
          <DSButton variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => remove(key)}>
            Remove
          </DSButton>
        </div>
      ))}
      <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
        <DSInput placeholder="key" value={newKey} onChange={(event) => setNewKey(event.target.value)} fullWidth />
        <DSInput placeholder="value" value={newVal} onChange={(event) => setNewVal(event.target.value)} fullWidth />
        <DSButton variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={add}>
          Add field
        </DSButton>
      </div>
    </div>
  );
}

export function FollowerDetailPage() {
  const id = window.location.pathname.split("/")[2];
  const workspaceId = getWorkspaceId() ?? "";

  const [follower, setFollower] = useState<Follower | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    email: "",
    phone: "",
    note: "",
    tags: [],
    custom_fields: {},
  });

  useEffect(() => {
    followerApi
      .get(id)
      .then((res) => {
        setFollower(res);
        setForm({
          email: res.email || "",
          phone: res.phone || "",
          note: res.note || "",
          tags: res.tags || [],
          custom_fields: res.custom_fields || {},
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load follower"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const updated = await followerApi.update(id, {
        email: form.email || undefined,
        phone: form.phone || undefined,
        note: form.note || undefined,
        tags: form.tags,
        custom_fields: form.custom_fields,
      });
      setFollower(updated);
      toast.success("Follower profile updated", "Saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save follower";
      setSaveError(message);
      toast.error("Unable to save follower", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Follower">
        <div className="flex justify-center py-16">
          <Spinner label="Loading follower" />
        </div>
      </AppLayout>
    );
  }

  if (!follower) {
    return (
      <AppLayout title="Follower">
        <EmptyState
          title="Follower not found"
          description={error ?? "This follower is not available in the current workspace."}
          action={<DSButton variant="secondary" onClick={() => window.history.back()}>Go back</DSButton>}
        />
      </AppLayout>
    );
  }

  const externalLinks = Object.entries(follower.custom_fields || {}).filter(([key]) => key.endsWith("_id"));

  return (
    <AppLayout title="Follower">
      <FeaturePageScaffold
        layout="detail"
        header={(
          <PageHeader
            title={follower.display_name || follower.line_user_id}
            subtitle="Follower detail, enrichment fields, and engagement context."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contacts", href: "/contacts" }, { label: follower.display_name || follower.line_user_id }]} />}
            actions={(
              <div className="flex items-center gap-3">
                <DSButton variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => { window.location.href = "/contacts"; }}>
                  Back
                </DSButton>
                <DSButton variant="primary" leftIcon={saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />} loading={saving} onClick={() => { void handleSave(); }}>
                  Save changes
                </DSButton>
              </div>
            )}
          />
        )}
        banner={
          saveError ? <Alert variant="danger" title="Unable to save changes">{saveError}</Alert>
            : error ? <Alert variant="danger" title="Unable to load complete follower data">{error}</Alert> : undefined
        }
        main={(
          <div className="space-y-6">
            <Card elevation="none">
              <CardHeader title="LINE identity" subtitle="Read-only LINE profile and follow relationship details." />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-[var(--text-secondary)]">LINE User ID</div>
                  <div className="break-all rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 px-4 py-3 font-mono text-sm text-[var(--text-primary)]">
                    {follower.line_user_id}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-[var(--text-secondary)]">Followed at</div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 px-4 py-3 text-sm text-[var(--text-primary)]">
                    {follower.followed_at ? new Date(follower.followed_at).toLocaleString() : "-"}
                  </div>
                </div>
                {follower.status_message && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-[var(--text-secondary)]">Status message</div>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 px-4 py-3 text-sm text-[var(--text-primary)]">
                      {follower.status_message}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {externalLinks.length > 0 && (
              <Card elevation="none">
                <CardHeader title="External links" subtitle="Cross-system identity keys attached to this follower." />
                <CardBody className="space-y-3">
                  {externalLinks.map(([key, value]) => (
                    <div key={key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm">
                      <Badge variant="outline" size="sm">{key}</Badge>
                      <span className="font-medium text-[var(--text-primary)]">{value}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            <Card elevation="none">
              <CardHeader title="Contact and notes" subtitle="Editable CRM fields used by campaigns, support, and analytics." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="follower-email" label="Email">
                    <DSInput
                      id="follower-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="follower@example.com"
                      fullWidth
                    />
                  </FormField>
                  <FormField name="follower-phone" label="Phone">
                    <DSInput
                      id="follower-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="0812345678"
                      fullWidth
                    />
                  </FormField>
                </div>
                <FormField name="follower-note" label="Note">
                  <DSTextarea
                    id="follower-note"
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    rows={5}
                  />
                </FormField>
                <FormField name="follower-tags" label="Tags" helperText="Press Enter to add a tag.">
                  <TagInput
                    tags={form.tags}
                    onChange={(tags) => setForm((current) => ({ ...current, tags }))}
                    placeholder="Add tag and press Enter"
                  />
                </FormField>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Custom fields" subtitle="Additional key-value attributes synced from external systems or added by your team." />
              <CardBody>
                <CustomFieldsEditor
                  fields={form.custom_fields}
                  onChange={(custom_fields) => setForm((current) => ({ ...current, custom_fields }))}
                />
              </CardBody>
            </Card>

            <FollowerActivityCard followerId={follower.id} />
            <BehaviorCard followerId={follower.id} workspaceId={workspaceId} />
          </div>
        )}
        aside={(
          <div className="space-y-4">
            <Card elevation="none">
              <CardBody className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-700">
                  {follower.picture_url ? (
                    <img src={follower.picture_url} alt={follower.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={28} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{follower.display_name || "Unknown follower"}</h3>
                  <div className="mt-2 flex justify-center gap-2">
                    <Badge variant={followStatusVariant[follower.follow_status]} size="sm">{follower.follow_status}</Badge>
                    {follower.language ? <Badge variant="outline" size="sm">{follower.language}</Badge> : null}
                  </div>
                </div>
              </CardBody>
            </Card>
            <StatCard title="Tags" value={form.tags.length} icon={<Plus size={18} />} />
            <StatCard title="Custom fields" value={Object.keys(form.custom_fields).length} icon={<Activity size={18} />} />
            <Card elevation="none">
              <CardHeader title="Quick actions" />
              <CardBody className="space-y-3">
                <DSButton variant="primary" fullWidth leftIcon={<CheckCircle size={16} />} loading={saving} onClick={() => { void handleSave(); }}>
                  Save profile
                </DSButton>
                <DSButton variant="ghost" fullWidth leftIcon={<X size={16} />} onClick={() => { window.location.href = "/contacts"; }}>
                  Close detail
                </DSButton>
              </CardBody>
            </Card>
          </div>
        )}
      />
    </AppLayout>
  );
}
