import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { useToast } from "@/components/ui/toast";
import { pnpTemplateApi, lonApi } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import type { PNPTemplate, LineOA } from "@/types";
import { getWorkspaceId } from "@/lib/auth";
import {
  LayoutTemplate,
  Trash2,
  RefreshCw,
  Plus,
  Copy,
  Code2,
  ChevronRight,
  Pencil,
  Download,
  Camera,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import { applyTemplateVariables } from "@/utils/pnpTemplateUtils";
import { LONTemplateSchemaEditor } from "@/components/lon/LONTemplateSchemaEditor";
import type { SchemaDraft } from "@/components/lon/LONTemplateSchemaEditor";
import { patchFlexHtml } from "@/utils/flexPreviewUtils";

const WORKSPACE_ID = getWorkspaceId() ?? "";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESSAGE_TYPE_COLORS: Record<PNPTemplate["message_type"], string> = {
  basic: "border-transparent bg-blue-100 text-blue-800",
  emphasis: "border-transparent bg-purple-100 text-purple-800",
  list: "border-transparent bg-amber-100 text-amber-800",
  mix: "border-transparent bg-teal-100 text-teal-800",
};

const MESSAGE_TYPE_GROUPS: { label: string; type: PNPTemplate["message_type"] }[] = [
  { label: "Basic", type: "basic" },
  { label: "Emphasis", type: "emphasis" },
  { label: "List", type: "list" },
  { label: "Mix", type: "mix" },
];

function MessageTypeBadge({ type }: { type: PNPTemplate["message_type"] }) {
  return (
    <Badge className={cn("capitalize", MESSAGE_TYPE_COLORS[type])}>
      {type}
    </Badge>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: PNPTemplate;
  onDelete: (template: PNPTemplate) => Promise<void>;
  onEdit: (template: PNPTemplate) => void;
  deletingId: string | null;
}

function TemplateCard({ template, onDelete, onEdit, deletingId }: TemplateCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="pt-4 pb-4 flex flex-col gap-3 h-full">
        {/* Header row */}
        <div className="flex items-start gap-2 flex-wrap">
          <span className="font-semibold text-sm flex-1 min-w-0 leading-snug break-words">
            {template.name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <MessageTypeBadge type={template.message_type} />
            <Badge variant="secondary">Custom</Badge>
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            {template.description}
          </p>
        )}

        {/* Flex Message Preview */}
        <FlexCardPreview content={JSON.stringify(template.json_body)} height={260} />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(template)}
            className="gap-1.5 text-xs text-primary hover:bg-primary/10 border-primary/30"
          >
            <Pencil size={12} />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={deletingId === template.id}
            onClick={() => void onDelete(template)}
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            {deletingId === template.id ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── TemplateEditorModal ───────────────────────────────────────────────────────

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (updated: PNPTemplate) => void;
  template: PNPTemplate | null;
  /** All custom templates for the same OA — used for greeting template picker */
  allTemplates: PNPTemplate[];
}

function TemplateEditorModal({ open, onClose, onSaved, template, allTemplates }: TemplateEditorModalProps) {
  const toast = useToast();
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonBodyText, setJsonBodyText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Stable callback — avoids recreating the entire applyChange chain on every render
  const handleJsonBodyChange = useCallback((body: Record<string, unknown>) => {
    setJsonBodyText(JSON.stringify(body, null, 2));
  }, []);
  const [schemaFields, setSchemaFields] = useState<SchemaDraft[]>([]);
  const [exampleVars, setExampleVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exportingJpg, setExportingJpg] = useState(false);
  const [greetingTemplateId, setGreetingTemplateId] = useState("");

  // Initialization
  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setDescription(template.description || "");
      setJsonBodyText(JSON.stringify(template.json_body, null, 2));
      setJsonError("");
      setSchemaFields(
        template.editable_schema.map((f) => ({
          _id: Math.random().toString(36).slice(2),
          path: f.path,
          type: f.type,
          label: f.label,
          max_len: String(f.max_len ?? ""),
        }))
      );
      setExampleVars({});
      setGreetingTemplateId(template.greeting_template_id || "");
    }
  }, [open, template]);

  const jsonBodyParsed = useMemo(() => {
    try {
      return JSON.parse(jsonBodyText) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [jsonBodyText]);

  const previewContent = useMemo(() => {
    if (!jsonBodyParsed) return null;
    const patched = applyTemplateVariables(
      jsonBodyParsed,
      schemaFields.map((f) => ({
        path: f.path,
        type: f.type,
        label: f.label,
        max_len: parseInt(f.max_len) || 0,
      })),
      exampleVars
    );
    return JSON.stringify(patched);
  }, [jsonBodyParsed, schemaFields, exampleVars]);

  async function handleSave() {
    if (!template) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonBodyText) as Record<string, unknown>;
    } catch {
      setJsonError("Invalid JSON");
      return;
    }
    if (!parsed.type || parsed.type !== "bubble") {
      setJsonError('Must be a bubble object with "type": "bubble"');
      return;
    }
    setJsonError("");
    setSaving(true);
    try {
      const updated = await pnpTemplateApi.update(template.id, {
        name: name.trim(),
        description: description.trim(),
        json_body: parsed,
        editable_schema: schemaFields.map((f) => ({
          path: f.path,
          type: f.type,
          label: f.label,
          max_len: parseInt(f.max_len) || undefined,
        })),
        greeting_template_id: greetingTemplateId || undefined,
      });
      toast.success("Template saved", `"${name}" has been updated.`);
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error("Failed to save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleExportJson() {
    const body = jsonBodyParsed ?? (template?.json_body ?? {});
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "template"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExportJpg() {
    if (!previewContent) return;
    setExportingJpg(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { render: renderFlexMessage } = await import("flex-render") as any;

      // Get card width from the live preview container
      const flexContainer = previewWrapperRef.current?.querySelector("div") as HTMLElement | null;
      const cardWidth = flexContainer?.offsetWidth ?? 320;

      // Re-render the Flex card completely fresh — zero inherited inline heights.
      // Cloning from the constrained DOM (maxHeight:560px scroll container) would
      // carry over heights that flex-render baked in, leading to bottom clipping.
      const rawHtml = renderFlexMessage(JSON.parse(previewContent)) as string;
      const patchedHtml = patchFlexHtml(rawHtml);

      const offscreen = document.createElement("div");
      offscreen.style.cssText =
        `position:fixed;top:0;left:-${cardWidth + 100}px;` +
        `width:${cardWidth}px;` +
        "background-color:#C6D0D9;padding:8px;border-radius:6px;" +
        "overflow:visible;pointer-events:none;box-sizing:border-box;";

      offscreen.innerHTML = patchedHtml;
      document.body.appendChild(offscreen);

      // Two frames for the browser to lay out the fresh card
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Measure the natural card height BEFORE html2canvas modifies anything.
      const naturalHeight = offscreen.offsetHeight;
      const scale = 2;
      const BUFFER = 120; // generous — covers html2canvas font rendering for Thai/CJK
      const captureHeight = naturalHeight + BUFFER;

      // Capture strategy: in onclone, remove ALL overflow:hidden from every
      // descendant so no element can clip content (not just .T1 — inner .MdBx,
      // footer sections, etc. all clip). Give .T1 extra height to expand into.
      // Rounded corners are lost but content is guaranteed complete.
      const canvas = await html2canvas(offscreen, {
        scale,
        useCORS: true,
        backgroundColor: "#C6D0D9",
        height: captureHeight,
        onclone: (_doc: Document, clonedEl: HTMLElement) => {
          clonedEl.style.height = `${captureHeight}px`;
          clonedEl.style.overflow = "visible";
          clonedEl.querySelectorAll("*").forEach((el) => {
            (el as HTMLElement).style.overflow = "visible";
          });
          const clonedT1 = clonedEl.querySelector<HTMLElement>(".T1");
          if (clonedT1) clonedT1.style.height = `${captureHeight}px`;
        },
      });

      document.body.removeChild(offscreen);

      // Crop to the natural height — all content should fit since overflow
      // was removed in the clone. The BUFFER ensures room in the canvas;
      // we trim back to the measured height for a tight result.
      const cropH = naturalHeight * scale;
      let finalCanvas = canvas;
      if (cropH < canvas.height) {
        const cropped = document.createElement("canvas");
        cropped.width = canvas.width;
        cropped.height = cropH;
        const cctx = cropped.getContext("2d");
        if (cctx) {
          cctx.drawImage(canvas, 0, 0, canvas.width, cropH, 0, 0, canvas.width, cropH);
          finalCanvas = cropped;
        }
      }

      const dataUrl = finalCanvas.toDataURL("image/jpeg", 0.92);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${name || "template"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setExportingJpg(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-5xl h-[92vh] max-h-[92vh] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Pencil size={16} />
            Edit Template
          </DialogTitle>
        </DialogHeader>

        {/* Name + Description compact row */}
        <div className="px-6 py-3 border-b flex-shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className="text-xs font-medium whitespace-nowrap">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="flex-1 min-w-0 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className="text-xs font-medium whitespace-nowrap">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="flex-1 min-w-0 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Greeting Template row */}
        <div className="px-6 py-2 border-b flex-shrink-0 flex items-center gap-2">
          <label className="text-xs font-medium whitespace-nowrap">
            Greeting Template
          </label>
          <select
            value={greetingTemplateId}
            onChange={(e) => setGreetingTemplateId(e.target.value)}
            className="flex-1 min-w-0 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            <option value="">— None —</option>
            {allTemplates
              .filter((t) => t.id !== template?.id && !t.is_preset)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Sent via LINE after LIFF Track &amp; Greet link is resolved
          </p>
        </div>

        {/* CMS Schema Editor — fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <LONTemplateSchemaEditor
            jsonBody={jsonBodyParsed ?? {}}
            editableSchema={schemaFields}
            exampleVars={exampleVars}
            onJsonBodyChange={handleJsonBodyChange}
            onSchemaChange={setSchemaFields}
            onExampleVarsChange={setExampleVars}
            previewWrapperRef={previewWrapperRef}
          />
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0 bg-muted/20">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportJson}
              className="gap-1.5 text-xs"
            >
              <Download size={12} />
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleExportJpg()}
              disabled={exportingJpg}
              className="gap-1.5 text-xs"
            >
              {exportingJpg ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Camera size={12} />
              )}
              Export JPG
            </Button>
          </div>
          <div className="flex gap-2">
            {jsonError && (
              <p className="text-xs text-destructive self-center">{jsonError}</p>
            )}
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin mr-1" />
              ) : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── AddTemplateModal ──────────────────────────────────────────────────────────

interface AddTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  selectedLineOAId: string;
  presets: PNPTemplate[];
}

function AddTemplateModal({
  open,
  onClose,
  onSaved,
  selectedLineOAId,
  presets,
}: AddTemplateModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<"pick" | "preset" | "json">("pick");
  const [hoveredPreset, setHoveredPreset] = useState<PNPTemplate | null>(null);
  const [jsonName, setJsonName] = useState("");
  const [jsonBody, setJsonBody] = useState(
    '{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": []\n  }\n}'
  );
  const [jsonError, setJsonError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset step on open/close
  useEffect(() => {
    if (open) {
      setStep("pick");
      setJsonName("");
      setJsonBody(
        '{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": []\n  }\n}'
      );
      setJsonError("");
    }
  }, [open]);

  // Initialize hoveredPreset to first preset when entering preset step
  useEffect(() => {
    if (step === "preset" && presets.length > 0) {
      setHoveredPreset(presets[0]);
    }
  }, [step, presets]);

  async function handleSavePreset() {
    if (!hoveredPreset || !selectedLineOAId) return;
    setSaving(true);
    try {
      await pnpTemplateApi.saveAs({
        line_oa_id: selectedLineOAId,
        name: hoveredPreset.name,
        description: hoveredPreset.description,
        source_id: hoveredPreset.id,
      });
      toast.success("Template added", `"${hoveredPreset.name}" has been added to your templates.`);
      onSaved();
    } catch (err) {
      toast.error("Failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectPreset(t: PNPTemplate) {
    setHoveredPreset(t);
    void handleSavePreset();
  }

  async function handleSaveJson() {
    setJsonError("");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonBody) as Record<string, unknown>;
    } catch {
      setJsonError("Invalid JSON — please fix syntax errors");
      return;
    }
    if (!parsed.type || parsed.type !== "bubble") {
      setJsonError('JSON must be a bubble object with "type": "bubble"');
      return;
    }
    setSaving(true);
    try {
      await (pnpTemplateApi.saveAs as (body: Record<string, unknown>) => Promise<PNPTemplate>)({
        line_oa_id: selectedLineOAId,
        name: jsonName.trim(),
        json_body: parsed,
        message_type: "basic",
        variant: "a",
      });
      toast.success("Template created", `"${jsonName}" has been saved.`);
      onSaved();
    } catch (err) {
      toast.error("Failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Live preview for JSON step
  const previewContent = useMemo(() => {
    try {
      JSON.parse(jsonBody);
      return jsonBody;
    } catch {
      return null;
    }
  }, [jsonBody]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        {/* ── Step: pick ── */}
        {step === "pick" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus size={18} />
                Add Template
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                {/* From Preset */}
                <button
                  onClick={() => setStep("preset")}
                  className="border-2 rounded-xl p-6 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <LayoutTemplate size={28} className="text-muted-foreground" />
                  <p className="text-base font-semibold mt-3">From Preset</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose from LINE-approved preset templates
                  </p>
                </button>

                {/* Write JSON */}
                <button
                  onClick={() => setStep("json")}
                  className="border-2 rounded-xl p-6 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Code2 size={28} className="text-muted-foreground" />
                  <p className="text-base font-semibold mt-3">Write JSON</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define your own Flex Message JSON body
                  </p>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: preset ── */}
        {step === "preset" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep("pick")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-normal flex items-center gap-1 mr-1"
                >
                  ← Back
                </button>
                Choose a Preset Template
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              {presets.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No preset templates available.
                </div>
              ) : (
                <>
                  <div className="flex" style={{ minHeight: "420px" }}>
                    {/* Left: preset list grouped by message_type */}
                    <div className="w-72 flex-shrink-0 border-r overflow-y-auto max-h-[60vh] py-4 px-3 space-y-3">
                      {MESSAGE_TYPE_GROUPS.map(({ label, type }) => {
                        const group = presets.filter((t) => t.message_type === type);
                        if (group.length === 0) return null;
                        return (
                          <div key={type} className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                              {label}
                            </p>
                            {group.map((t) => (
                              <button
                                key={t.id}
                                onMouseEnter={() => setHoveredPreset(t)}
                                onClick={() => handleSelectPreset(t)}
                                className={cn(
                                  "w-full text-left flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group",
                                  hoveredPreset?.id === t.id && "bg-muted/60 border-primary/40"
                                )}
                              >
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{t.name}</span>
                                    <Badge
                                      className={cn(
                                        "capitalize text-xs",
                                        MESSAGE_TYPE_COLORS[t.message_type]
                                      )}
                                    >
                                      {t.message_type}
                                    </Badge>
                                  </div>
                                  {t.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight
                                  size={16}
                                  className="flex-shrink-0 text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors"
                                />
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: preview */}
                    <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto max-h-[60vh]">
                      {hoveredPreset ? (
                        <>
                          <FlexCardPreview
                            content={JSON.stringify(hoveredPreset.json_body)}
                            height={360}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{hoveredPreset.name}</span>
                            <MessageTypeBadge type={hoveredPreset.message_type} />
                            <Badge variant="success">Preset</Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic">
                          Hover a template to preview
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between pt-3 border-t mt-2">
                    <p className="text-sm text-muted-foreground">
                      {hoveredPreset
                        ? `Selected: ${hoveredPreset.name}`
                        : "Hover to preview, click to select"}
                    </p>
                    <Button
                      disabled={!hoveredPreset || saving}
                      onClick={() => void handleSavePreset()}
                      className="gap-2"
                    >
                      {saving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Copy size={14} />
                      )}
                      Use This Template
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Step: json ── */}
        {step === "json" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep("pick")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-normal flex items-center gap-1 mr-1"
                >
                  ← Back
                </button>
                Create from JSON
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5">
              <div className="flex flex-col md:flex-row gap-5">
                {/* Left: form */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Template Name *</label>
                    <input
                      type="text"
                      value={jsonName}
                      onChange={(e) => setJsonName(e.target.value)}
                      placeholder="My Custom Template"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Flex Message JSON (bubble)</label>
                    <textarea
                      value={jsonBody}
                      onChange={(e) => setJsonBody(e.target.value)}
                      className="w-full font-mono text-xs border rounded-md p-3 h-64 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      spellCheck={false}
                    />
                    {jsonError && (
                      <p className="text-xs text-destructive mt-1">{jsonError}</p>
                    )}
                  </div>
                </div>

                {/* Right: live preview */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                  <p className="text-sm font-medium">Preview</p>
                  {previewContent ? (
                    <FlexCardPreview content={previewContent} height={300} />
                  ) : (
                    <div className="bg-muted rounded-md flex items-center justify-center h-36 text-xs text-muted-foreground italic">
                      Invalid JSON
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex justify-end gap-2 pt-3 border-t mt-4">
                <Button variant="outline" onClick={() => setStep("pick")}>
                  Cancel
                </Button>
                <Button
                  disabled={!jsonName.trim() || saving}
                  onClick={() => void handleSaveJson()}
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin mr-1" />
                  ) : null}
                  Save Template
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LONTemplatesPage() {
  const toast = useToast();

  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [templates, setTemplates] = useState<PNPTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PNPTemplate | null>(null);
  const [sharedLiffId, setSharedLiffId] = useState<string | null>(null);

  // Load OAs
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedLineOAId(oas[0].id);
      })
      .catch(console.error);
  }, []);

  // Load PNP config (LIFF ID) once
  useEffect(() => {
    lonApi.getConfig().then((res) => setSharedLiffId(res.shared_liff_id ?? "")).catch(() => setSharedLiffId(""));
  }, []);

  // Load templates when OA changes — skip until an OA is actually selected
  useEffect(() => {
    if (!selectedLineOAId) return;
    setTemplates([]);
    setLoading(true);
    pnpTemplateApi
      .list({ line_oa_id: selectedLineOAId })
      .then((res) => setTemplates(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedLineOAId]);

  async function handleDelete(template: PNPTemplate) {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    setDeletingId(template.id);
    try {
      await pnpTemplateApi.delete(template.id);
      toast.success("Template deleted");
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      toast.error("Failed to delete template", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTemplateSaved() {
    setShowAddModal(false);
    const res = await pnpTemplateApi.list(selectedLineOAId ? { line_oa_id: selectedLineOAId } : {});
    setTemplates(res.data ?? []);
  }

  const presets = templates.filter((t) => t.is_preset);
  const custom = templates.filter((t) => !t.is_preset);

  return (
    <AppLayout title="LON Templates">
      <div className="space-y-5">
        {/* Description + Add button */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              Manage message templates for LON by Phone (PNP). Add templates from
              LINE-approved presets or write your own Flex Message JSON. Custom
              templates are OA-specific and can be deleted at any time.
            </p>
            {sharedLiffId !== null && (
              <div className="flex items-center gap-1.5 text-xs">
                <Smartphone size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground">LIFF (Track &amp; Greet):</span>
                {sharedLiffId ? (
                  <code className="bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-mono">
                    {sharedLiffId}
                  </code>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                    Not configured — LIFF Track &amp; Greet templates will fail
                  </span>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 flex-shrink-0"
          >
            <Plus size={15} />
            Add Template
          </Button>
        </div>

        {/* OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={(id) => setSelectedLineOAId(id)}
          showAll={false}
        />

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Loading templates…
          </div>
        ) : custom.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutTemplate
                size={32}
                className="mx-auto text-muted-foreground mb-2"
              />
              <p className="text-sm font-medium mb-1">No templates yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Add your first template to get started.
              </p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus size={15} />
                Add Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Custom Templates</h3>
              <Badge variant="secondary">{custom.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {custom.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onDelete={handleDelete}
                  onEdit={(tmpl) => setEditingTemplate(tmpl)}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AddTemplateModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => void handleTemplateSaved()}
        selectedLineOAId={selectedLineOAId}
        presets={presets}
      />

      <TemplateEditorModal
        open={editingTemplate !== null}
        onClose={() => setEditingTemplate(null)}
        onSaved={(updated) => {
          setTemplates((prev) => prev.map((t) => t.id === updated.id ? updated : t));
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        allTemplates={custom}
      />
    </AppLayout>
  );
}
