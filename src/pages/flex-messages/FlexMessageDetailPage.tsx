import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import {
  AlertCircle, ArrowLeft, RefreshCw,
  Trash2, CheckCircle, XCircle, Eye,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { flexMessageApi, type FlexMessage } from "@/api/flexMessage";
import { flexMessageSnippets, insertSnippetIntoContent } from "@/utils/flexMessageSnippets";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { FlexPreview } from "flex-render-react";
import "flex-render-react/css";

function getContainerType(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return parsed.type === "carousel" ? "carousel" : "bubble";
  } catch {
    return "bubble";
  }
}

function LivePreviewPanel({ content }: { content: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    // invalid JSON — show placeholder
  }

  return (
    <div className="sticky top-4 space-y-2">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* LINE chat background mockup */}
          <div
            className="min-h-48 p-4 rounded-b-lg flex flex-col items-start gap-2 overflow-auto"
            style={{ backgroundColor: "#C6D0D9" }}
          >
            {parsed ? (
              <div className="w-full max-w-xs">
                <FlexPreview json={parsed} />
              </div>
            ) : (
              <div className="w-full text-center py-8 text-sm italic" style={{ color: "#888" }}>
                Enter valid JSON to see preview
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">
        Updates as you type
      </p>
    </div>
  );
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

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    if (jsonError) setJsonError(null);
  }, [jsonError]);

  const handleInsertSnippet = (key: string) => {
    const snippet = flexMessageSnippets[key];
    if (!snippet) return;
    const updated = insertSnippetIntoContent(content, snippet.json);
    setContent(updated);
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
      {/* Toast */}
      {(saveSuccess || saveError) && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
              <CheckCircle size={16} />
              Saved successfully
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto">
              <XCircle size={16} />
              {saveError}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Header — full width */}
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
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? <RefreshCw size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Two-column layout: editor (left) + preview (right) */}
        <div className="flex gap-6 items-start">

          {/* Left: editor pane */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader><CardTitle>Template Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Flex Message JSON</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleFormatJson} disabled={saving}>
                      Format JSON
                    </Button>
                    <CopyButton value={content} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Quick-Insert Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md border">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Insert:</span>
                  {Object.entries(flexMessageSnippets).map(([key, snippet]) => (
                    <button
                      key={key}
                      onClick={() => handleInsertSnippet(key)}
                      title={snippet.description}
                      disabled={saving}
                      className="px-2.5 py-1 text-xs rounded border border-border bg-background hover:bg-accent hover:border-primary transition-colors font-mono disabled:opacity-50"
                    >
                      + {snippet.label}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                    Adds to body.contents
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Valid LINE Flex Message container JSON (<code className="bg-muted px-1 rounded">type: "bubble"</code> or{" "}
                  <code className="bg-muted px-1 rounded">type: "carousel"</code>).
                  <span className="hidden lg:inline"> Preview updates live on the right →</span>
                  <span className="lg:hidden"> Scroll down to see the live preview.</span>
                </p>

                {/* CodeMirror Editor */}
                <div className="rounded-md overflow-hidden border">
                  <CodeMirror
                    value={content}
                    height="480px"
                    extensions={[json()]}
                    theme={oneDark}
                    onChange={handleContentChange}
                    editable={!saving}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: true,
                    }}
                  />
                </div>

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

            {/* Mobile preview (shown below editor on small screens) */}
            <div className="lg:hidden">
              <LivePreviewPanel content={content} />
            </div>
          </div>

          {/* Right: live preview (desktop only, sticky) */}
          <div className="hidden lg:block w-80 shrink-0">
            <LivePreviewPanel content={content} />
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
