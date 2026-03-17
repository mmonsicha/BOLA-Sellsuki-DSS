import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, Trash2, Edit, AlertCircle, ArrowLeft, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { flexMessageApi, type FlexMessage } from "@/api/flexMessage";
import { workspaceApi } from "@/api/workspace";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import { flexMessageTemplates, type FlexTemplate } from "@/utils/flexMessageTemplates";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import { useToast } from "@/components/ui/toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getContainerType(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return parsed.type === "carousel" ? "carousel" : "bubble";
  } catch {
    return "bubble";
  }
}

// ─── Step 1: Template Picker ───────────────────────────────────────────────

interface TemplatePickerProps {
  onSelect: (t: FlexTemplate) => void;
  onClose: () => void;
}

function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Choose a Starter Template</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pick one to get started — you can edit everything on the next page.
          </p>
        </div>

        {/* Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto flex-1">
          {flexMessageTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-center cursor-pointer"
            >
              <span className="text-3xl">{t.icon}</span>
              <span className="text-sm font-medium group-hover:text-primary">{t.name}</span>
              <span className="text-xs text-muted-foreground leading-tight">{t.description}</span>
              <Badge variant="outline" className="text-xs capitalize mt-auto">
                {t.containerType}
              </Badge>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Name & Description Form ──────────────────────────────────────

interface CreateFormProps {
  template: FlexTemplate;
  workspaceId: string;
  onBack: () => void;
  onClose: () => void;
}

function CreateForm({ template, workspaceId, onBack, onClose }: CreateFormProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await flexMessageApi.create({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim(),
        content: template.content,
      });
      window.location.href = `/flex-messages/${res.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Name Your Template</h2>
            <p className="text-xs text-muted-foreground">
              {template.icon} Starting from: <strong>{template.name}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Template Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Welcome Message, Product Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            autoFocus
            disabled={saving}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="What is this template used for?"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => { void handleCreate(); }} disabled={saving || !name.trim()}>
            {saving ? "Creating..." : "Create & Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

type DialogStep = "picker" | "form";

export function FlexMessagesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<FlexMessage[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  // Dialog state
  const [dialogStep, setDialogStep] = useState<DialogStep | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FlexTemplate | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlexMessage | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const wsRes = await workspaceApi.list({ page: 1, page_size: 1 });
        const id = wsRes?.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";
        setWorkspaceId(id);
        const [tplRes, oaRes] = await Promise.all([
          flexMessageApi.list({ workspace_id: id }),
          lineOAApi.list({ workspace_id: id }),
        ]);
        setTemplates(tplRes.data ?? []);
        setLineOAs(oaRes.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const openCreate = () => setDialogStep("picker");
  const closeDialog = () => { setDialogStep(null); setSelectedTemplate(null); };

  const handleTemplateSelect = (t: FlexTemplate) => {
    setSelectedTemplate(t);
    setDialogStep("form");
  };

  const handleDelete = (fm: FlexMessage) => {
    setDeleteTarget(fm);
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;
    const fm = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(fm.id);
    try {
      await flexMessageApi.delete(fm.id);
      setTemplates((prev) => prev.filter((t) => t.id !== fm.id));
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Flex Messages">
      {/* Template picker (step 1) */}
      {dialogStep === "picker" && (
        <TemplatePicker onSelect={handleTemplateSelect} onClose={closeDialog} />
      )}

      {/* Name form (step 2) */}
      {dialogStep === "form" && selectedTemplate && (
        <CreateForm
          template={selectedTemplate}
          workspaceId={workspaceId}
          onBack={() => setDialogStep("picker")}
          onClose={closeDialog}
        />
      )}

      <div className="space-y-6">
        {/* Workspace-scope notice */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
          <p>
            <span className="font-semibold">Workspace-wide templates:</span> Flex Message templates are shared across{" "}
            <span className="font-semibold">all LINE OAs</span> in this workspace. Any template you create here can be used
            in broadcasts or auto-push messages for any OA.
          </p>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground sm:max-w-lg">
            Create reusable LINE Flex Message templates. These JSON-based rich layouts can be attached to Broadcasts and Auto Push Messages.
          </p>
          <Button className="self-start sm:self-auto flex-shrink-0" onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            Create Flex Message
          </Button>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading templates...</p>}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Layers size={40} className="mx-auto text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No Flex Message templates yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first template to send beautiful rich messages via LINE.
              </p>
              <Button onClick={openCreate} className="mt-2">
                <Plus size={14} className="mr-1" />
                Create from Template
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((fm) => {
              const type = getContainerType(fm.content);
              return (
                <Card key={fm.id} className="group relative hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{fm.name}</h3>
                        {fm.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{fm.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">
                          {type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Info size={9} />
                          Shared
                        </Badge>
                        {fm.variables.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {fm.variables.length} var{fm.variables.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <FlexCardPreview content={fm.content} />

                    {lineOAs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lineOAs.slice(0, 3).map((oa) => (
                          <span
                            key={oa.id}
                            className="inline-flex items-center gap-1 text-xs bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30 rounded px-1.5 py-0.5 font-medium"
                          >
                            <span>{oa.basic_id}</span>
                            <span className="opacity-60">·</span>
                            <span className="truncate max-w-[80px] opacity-80">{oa.name}</span>
                          </span>
                        ))}
                        {lineOAs.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{lineOAs.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {new Date(fm.created_at).toLocaleDateString()}
                      <span>·</span>
                      <span className="font-mono">#{fm.id.slice(-8)}</span>
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { window.location.href = `/flex-messages/${fm.id}`; }}
                      >
                        <Edit size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(fm)}
                        disabled={deletingId === fm.id}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
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
