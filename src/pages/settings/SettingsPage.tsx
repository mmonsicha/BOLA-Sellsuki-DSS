import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Building2, Globe, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { workspaceApi } from "@/api/workspace";
import type { Workspace } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    workspaceApi.get(WORKSPACE_ID)
      .then((ws) => {
        setWorkspace(ws);
        setName(ws.name);
        setLogoURL(ws.logo_url ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await workspaceApi.update(workspace.id, { name, logo_url: logoURL });
      setWorkspace(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-2xl">

        {/* Workspace Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={16} />
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
                  value={workspace?.slug ?? ""}
                  disabled
                />
                <Badge variant="outline" className="flex-shrink-0 text-xs">Read-only</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed after creation.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <input
                type="url"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://example.com/logo.png"
                value={logoURL}
                onChange={(e) => setLogoURL(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={workspace?.is_active ? "success" : "secondary"}>
                  {workspace?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Save size={14} />}
                {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe size={16} />
              Workspace Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Workspace ID</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{workspace?.id}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span>{workspace?.plan_id || "Default"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Shield size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Deactivate Workspace</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deactivating will disable all LINE OA connections.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => alert("Deactivate workspace — coming soon")}
              >
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
