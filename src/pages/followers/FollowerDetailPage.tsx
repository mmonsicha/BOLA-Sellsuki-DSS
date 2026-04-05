import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Plus, X, CheckCircle, XCircle, Activity, Send } from "lucide-react";
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

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Add tag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-muted text-sm px-2 py-0.5 rounded-full">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
                <X size={12} className="text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
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
    const k = newKey.trim();
    const v = newVal.trim();
    if (!k) return;
    onChange({ ...fields, [k]: v });
    setNewKey("");
    setNewVal("");
  };

  const remove = (key: string) => {
    const next = { ...fields };
    delete next[key];
    onChange(next);
  };

  const update = (key: string, val: string) => {
    onChange({ ...fields, [key]: val });
  };

  const handleKeyBlur = () => {
    // Auto-add when clicking away from key field if both key and value are filled
    if (newKey.trim() && newVal.trim()) {
      add();
    }
  };

  const handleValueBlur = () => {
    // Auto-add when clicking away from value field if key is filled
    if (newKey.trim()) {
      add();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing entries */}
      {Object.entries(fields).map(([k, v]) => (
        <div key={k} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={k}
            className="w-full sm:w-40 border rounded-md px-2 py-1.5 text-sm bg-muted font-mono text-muted-foreground"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="text"
            value={v}
            className="flex-1 border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            onChange={(e) => update(k, e.target.value)}
          />
          <button type="button" onClick={() => remove(k)}>
            <X size={14} className="text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {/* Add new row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <input
          type="text"
          value={newKey}
          placeholder="key"
          className="w-full sm:w-40 border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          onBlur={handleKeyBlur}
        />
        <span className="text-muted-foreground">→</span>
        <input
          type="text"
          value={newVal}
          placeholder="value"
          className="flex-1 border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          onBlur={handleValueBlur}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>

      {Object.keys(fields).length === 0 && (
        <p className="text-xs text-muted-foreground italic">No custom fields. Add key-value pairs above.</p>
      )}
    </div>
  );
}

function engagementColor(score: number): string {
  if (score >= 61) return "bg-green-100 text-green-800";
  if (score >= 31) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-600";
}

function FollowerActivitySection({ followerId }: { followerId: string }) {
  const [activity, setActivity] = useState<FollowerActivity | null>(null);

  useEffect(() => {
    followerApi.getFollowerActivity(followerId)
      .then(setActivity)
      .catch(() => {});
  }, [followerId]);

  if (!activity) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send size={16} />
          Messaging Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Broadcasts Received</div>
            <div className="font-semibold">{activity.total_broadcasts.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">LON Messages</div>
            <div className="font-semibold">{activity.lon_count.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">PNP Total</div>
            <div className="font-semibold">{activity.pnp_total.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">PNP Success</div>
            <div className="font-semibold">{activity.pnp_success.toLocaleString()}</div>
          </div>
        </div>
        {activity.recent_broadcasts.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Recent Broadcasts</div>
            <div className="space-y-2">
              {activity.recent_broadcasts.map((dl) => (
                <div key={dl.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                  <span className="text-muted-foreground">{dl.created_at ? new Date(dl.created_at).toLocaleString() : "-"}</span>
                  <Badge variant={dl.status === "success" ? "success" : dl.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                    {dl.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BehaviorSection({ followerId, workspaceId }: { followerId: string; workspaceId: string }) {
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

  if (loading) return null;
  if (!behavior) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={16} />
          Engagement Behavior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Score */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Engagement Score</span>
          <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${engagementColor(behavior.engagement_score)}`}>
            {behavior.engagement_score.toFixed(1)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Total Clicks</div>
            <div className="font-semibold">{behavior.total_clicks.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Impressions</div>
            <div className="font-semibold">{behavior.total_impressions.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Messages Sent</div>
            <div className="font-semibold">{behavior.total_messages_sent.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Chat Sessions</div>
            <div className="font-semibold">{behavior.chat_sessions_count.toLocaleString()}</div>
          </div>
        </div>

        {/* Last Active */}
        {behavior.last_active_at && (
          <div className="text-sm">
            <span className="text-muted-foreground">Last Active: </span>
            <span>{new Date(behavior.last_active_at).toLocaleString()}</span>
          </div>
        )}

        {/* Most Clicked */}
        {behavior.most_clicked_label && (
          <div className="text-sm">
            <span className="text-muted-foreground">Most Clicked: </span>
            <span className="font-medium">{behavior.most_clicked_label}</span>
            {behavior.most_clicked_element_type && (
              <Badge variant="outline" className="ml-2 text-xs capitalize">
                {behavior.most_clicked_element_type.replace("_", " ")}
              </Badge>
            )}
          </div>
        )}

        {/* Interest Tags */}
        {behavior.interest_tags && behavior.interest_tags.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Interest Tags</div>
            <div className="flex flex-wrap gap-1">
              {behavior.interest_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FollowerDetailPage() {
  const id = window.location.pathname.split("/")[2];
  const [follower, setFollower] = useState<Follower | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const workspaceId = getWorkspaceId() ?? "";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (res as any).data ?? res;
        setFollower(f);
        setForm({
          email: f.email || "",
          phone: f.phone || "",
          note: f.note || "",
          tags: f.tags || [],
          custom_fields: f.custom_fields || {},
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load follower"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const updated = await followerApi.update(id, {
        email: form.email || undefined,
        phone: form.phone || undefined,
        note: form.note || undefined,
        tags: form.tags,
        custom_fields: form.custom_fields,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (updated as any).data ?? updated;
      setFollower(f);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Follower">
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" /> Loading...
        </div>
      </AppLayout>
    );
  }

  if (error || !follower) {
    return (
      <AppLayout title="Follower">
        <div className="text-center py-16">
          <p className="text-destructive font-medium">{error || "Follower not found"}</p>
          <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
            <ArrowLeft size={16} className="mr-2" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const externalLinks = Object.entries(follower.custom_fields || {}).filter(([k]) =>
    k.endsWith("_id")
  );

  return (
    <AppLayout title="Follower">
      {/* Toast */}
      {(saveSuccess || saveError) && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none flex flex-col gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow text-sm font-medium">
              <CheckCircle size={16} /> Saved
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow text-sm font-medium pointer-events-auto">
              <XCircle size={16} /> {saveError}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => { window.location.href = "/followers"; }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
              {follower.picture_url ? (
                <img src={follower.picture_url} alt={follower.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-medium">
                  {follower.display_name?.[0] || "?"}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{follower.display_name || follower.line_user_id}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={followStatusVariant[follower.follow_status]}>{follower.follow_status}</Badge>
                {follower.language && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{follower.language}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Identity Info (read-only) */}
        <Card>
          <CardHeader><CardTitle>LINE Identity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-muted-foreground">LINE User ID</span>
              <span className="font-mono text-xs break-all">{follower.line_user_id}</span>

              <span className="text-muted-foreground">Followed</span>
              <span>{follower.followed_at ? new Date(follower.followed_at).toLocaleString() : "—"}</span>

              {follower.status_message && (
                <>
                  <span className="text-muted-foreground">Status Message</span>
                  <span className="truncate">{follower.status_message}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* External Links (identity bridge) */}
        {externalLinks.length > 0 && (
          <Card>
            <CardHeader><CardTitle>External Links</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                External system IDs linked to this follower via the identity bridge.
              </p>
              <div className="space-y-2">
                {externalLinks.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded min-w-0 flex-shrink-0">
                      {k}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editable Fields */}
        <Card>
          <CardHeader><CardTitle>Contact & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="follower@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+66812345678"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Internal notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
          <CardContent>
            <TagsInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Arbitrary key-value data. Identity bridge keys (e.g. <code className="bg-muted px-1 rounded">oc2plus_id</code>) are stored here.
            </p>
            <CustomFieldsEditor
              fields={form.custom_fields}
              onChange={(custom_fields) => setForm({ ...form, custom_fields })}
            />
          </CardContent>
        </Card>

        {/* Messaging Activity */}
        <FollowerActivitySection followerId={id} />

        {/* Behavior Summary */}
        {workspaceId && <BehaviorSection followerId={id} workspaceId={workspaceId} />}

        {/* Save */}
        <div className="flex items-center gap-3 pb-8">
          <Button onClick={() => { void handleSave(); }} disabled={saving}>
            {saving && <RefreshCw size={14} className="mr-2 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
