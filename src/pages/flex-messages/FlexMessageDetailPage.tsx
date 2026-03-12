import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import {
  AlertCircle, ArrowLeft, RefreshCw,
  Trash2, CheckCircle, XCircle, Eye,
  MousePointerClick, Code,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { flexMessageApi, type FlexMessage, type FlexMessageVariable } from "@/api/flexMessage";
import { VariablesPanel } from "./builder/VariablesPanel";
import { flexMessageSnippets, insertSnippetIntoContent } from "@/utils/flexMessageSnippets";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { render as renderFlexMessage } from "flex-render";
import { patchFlexHtml, useBrokenImageFallback } from "@/utils/flexPreviewUtils";
import "flex-render/css";
import { FlexBuilder } from "./builder/FlexBuilder";


function getContainerType(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return parsed.type === "carousel" ? "carousel" : "bubble";
  } catch {
    return "bubble";
  }
}

function LivePreviewPanel({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = renderFlexMessage(JSON.parse(content) as any);
      return patchFlexHtml(raw);
    } catch {
      // invalid JSON or unsupported format — show placeholder
      return null;
    }
  }, [content]);

  useBrokenImageFallback(containerRef, html);

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
            {html ? (
              <div
                ref={containerRef}
                className="w-full max-w-xs"
                // flex-render returns safe HTML (no user input, only LINE Flex JSON structure)
                dangerouslySetInnerHTML={{ __html: html }}
              />
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
  const [variables, setVariables] = useState<FlexMessageVariable[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Action states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Editor mode
  const [mode, setMode] = useState<"visual" | "code">("visual");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await flexMessageApi.get(id);
        const data = res.data;
        setFm(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setContent(data.content);
        setVariables(data.variables ?? []);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    void load();
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
        variables,
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

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmedDelete = async () => {
    setShowDeleteDialog(false);
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

  const switchToVisual = () => {
    try {
      JSON.parse(content);
      setMode("visual");
      setJsonError(null);
    } catch {
      setJsonError("Cannot switch to Visual mode: content is not valid JSON. Fix the JSON first.");
    }
  };

  const switchToCode = () => {
    setMode("code");
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

      <div className="space-y-4">
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

        {/* Template Settings — compact inline */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Template Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome Bubble, Product Carousel"
                  disabled={saving}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this template used for?"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variables Panel */}
        <VariablesPanel variables={variables} onChange={setVariables} disabled={saving} />

        {/* Mode Toggle + Save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={switchToVisual}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "visual"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MousePointerClick size={13} />
              Visual
            </button>
            <button
              onClick={switchToCode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "code"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code size={13} />
              Code
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mode === "code" && <CopyButton value={content} />}
            <Button onClick={() => { void handleSave(); }} disabled={saving || deleting}>
              {saving && <RefreshCw size={14} className="mr-2 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {jsonError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={14} />
            {jsonError}
          </div>
        )}

        {/* Visual Mode */}
        {mode === "visual" && (
          <FlexBuilder content={content} onContentChange={handleContentChange} variables={variables} />
        )}

        {/* Code Mode — existing CodeMirror editor + preview */}
        {mode === "code" && (
          <div className="flex gap-6 items-start">
            {/* Left: editor pane */}
            <div className="flex-1 min-w-0 space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm">Flex Message JSON</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleFormatJson} disabled={saving}>
                      Format JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Quick-Insert Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-md border">
                    <span className="text-xs font-medium text-muted-foreground mr-1">Insert:</span>
                    {Object.entries(flexMessageSnippets).map(([key, snippet]) => (
                      <button
                        key={key}
                        onClick={() => handleInsertSnippet(key)}
                        title={snippet.description}
                        disabled={saving}
                        className="px-2 py-0.5 text-xs rounded border border-border bg-background hover:bg-accent hover:border-primary transition-colors font-mono disabled:opacity-50"
                      >
                        + {snippet.label}
                      </button>
                    ))}
                  </div>

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
                </CardContent>
              </Card>

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
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{fm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { void handleConfirmedDelete(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
