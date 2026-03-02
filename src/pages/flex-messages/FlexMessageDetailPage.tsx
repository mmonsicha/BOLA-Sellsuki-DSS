import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { flexMessageApi, type FlexMessage } from "@/api/flexMessage";

function getContainerType(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return parsed.type === "carousel" ? "carousel" : "bubble";
  } catch {
    return "bubble";
  }
}

export function FlexMessageDetailPage() {
  const id = window.location.pathname.split("/")[2];

  const [fm, setFm] = useState<FlexMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Action states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load flex message
  useEffect(() => {
    const load = async () => {
      try {
        const res = await flexMessageApi.get(id);
        const data = res.data;
        setFm(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setContent(data.content);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError("Cannot format: content is not valid JSON");
    }
  };

  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      setSaveError("Name is required");
      return;
    }
    try {
      JSON.parse(content);
    } catch {
      setJsonError("Content must be valid JSON before saving");
      return;
    }

    setSaveError(null);
    setJsonError(null);
    setSaving(true);
    try {
      const res = await flexMessageApi.update(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        content,
      });
      setFm(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${fm?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await flexMessageApi.delete(id);
      window.location.href = "/flex-messages";
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  const handlePreview = () => {
    window.open("https://developers.line.biz/flex-simulator/", "_blank", "noopener,noreferrer");
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Clear JSON error when user edits
    if (jsonError) setJsonError(null);
  };

  if (loading) {
    return (
      <AppLayout title="Flex Message">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground text-sm">Loading template...</p>
        </div>
      </AppLayout>
    );
  }

  if (loadError || !fm) {
    return (
      <AppLayout title="Flex Message">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-3">
            <AlertCircle className="mx-auto text-destructive" size={32} />
            <p className="text-destructive font-medium">{loadError ?? "Template not found"}</p>
            <Button variant="ghost" onClick={() => { window.location.href = "/flex-messages"; }}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Flex Messages
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const containerType = getContainerType(content);

  return (
    <AppLayout title="Flex Message">
      {/* Toast notifications */}
      {(saveSuccess || saveError) && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={16} />
              Saved successfully
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 pointer-events-auto">
              <XCircle size={16} />
              {saveError}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { window.location.href = "/flex-messages"; }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{fm.name}</h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(fm.created_at).toLocaleDateString()}
                {fm.updated_at !== fm.created_at && (
                  <> · Updated {new Date(fm.updated_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{containerType}</Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting
                ? <RefreshCw size={14} className="animate-spin mr-1" />
                : <Trash2 size={14} className="mr-1" />}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Template Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Bubble, Product Carousel"
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this template used for?"
                rows={2}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* JSON Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Flex Message JSON</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatJson}
                  disabled={saving}
                >
                  Format JSON
                </Button>
                <CopyButton value={content} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Preview in Simulator
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Paste a valid LINE Flex Message container JSON (type: "bubble" or "carousel").
              Use the <strong>Preview in Simulator</strong> button to open LINE's Flex Message Simulator — paste the JSON there to preview it.
            </p>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-xs font-mono bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={20}
              disabled={saving}
              spellCheck={false}
              placeholder='{"type": "bubble", "body": {"type": "box", "layout": "vertical", "contents": []}}'
            />
            {jsonError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={14} />
                {jsonError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || deleting} size="lg">
            {saving && <RefreshCw size={14} className="mr-2 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
