import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
import { flexMessageApi } from "@/api/flexMessage";
import type { FlexMessage } from "@/api/flexMessage";
import type { PNPTemplate, LineOA } from "@/types";
import { FlexMessagePicker } from "@/components/common/FlexMessagePicker";
import { getWorkspaceId } from "@/lib/auth";
import {
  LayoutTemplate,
  Trash2,
  RefreshCw,
  Plus,
  Copy,
  Code2,
  ChevronDown,
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

// ── Greeting config helpers ───────────────────────────────────────────────────

const BOLA_PNP_LIFF_MARKER = "__BOLA_PNP_LIFF__";

/** Returns true if jsonBody contains at least one button whose action.uri is BOLA_PNP_LIFF_MARKER.
 *  Used to conditionally show the "On Greeting Complete" section. */
function hasLiffGreetingButton(jsonBody: Record<string, unknown> | null | undefined): boolean {
  if (!jsonBody) return false;
  const json = JSON.stringify(jsonBody);
  if (!json.includes(BOLA_PNP_LIFF_MARKER)) return false;
  function search(node: unknown): boolean {
    if (!node || typeof node !== "object") return false;
    if (Array.isArray(node)) return node.some(search);
    const obj = node as Record<string, unknown>;
    if (obj.type === "button") {
      const action = obj.action as Record<string, unknown> | undefined;
      if (action?.uri === BOLA_PNP_LIFF_MARKER) return true;
    }
    return Object.values(obj).some(search);
  }
  return search(jsonBody);
}

/** Deep-traverse jsonBody; find the first action with uri === BOLA_PNP_LIFF_MARKER
 *  and inject __greetingLineOAID / __greetingTemplateID so ActionEditor can display them. */
function injectGreetingConfig(
  jsonBody: Record<string, unknown>,
  greetingLineOAID: string,
  greetingTemplateID: string
): Record<string, unknown> {
  const json = JSON.stringify(jsonBody);
  if (!json.includes(BOLA_PNP_LIFF_MARKER)) return jsonBody;

  function traverse(node: unknown): unknown {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(traverse);
    const obj = node as Record<string, unknown>;
    if (obj.type === "button") {
      const action = obj.action as Record<string, unknown> | undefined;
      if (action?.uri === BOLA_PNP_LIFF_MARKER) {
        return {
          ...obj,
          action: {
            ...action,
            __greetingLineOAID: greetingLineOAID,
            __greetingTemplateID: greetingTemplateID,
          },
        };
      }
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = traverse(obj[key]);
    }
    return result;
  }

  return traverse(jsonBody) as Record<string, unknown>;
}

/** Deep-traverse jsonBody; extract __greetingLineOAID / __greetingTemplateID
 *  from the liff_greeting action and return a cleaned body (without those keys). */
function extractAndStripGreetingConfig(jsonBody: Record<string, unknown>): {
  cleanedBody: Record<string, unknown>;
  greetingLineOAID: string;
  greetingTemplateID: string;
} {
  let greetingLineOAID = "";
  let greetingTemplateID = "";

  function traverse(node: unknown): unknown {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(traverse);
    const obj = node as Record<string, unknown>;
    if (obj.type === "button") {
      const action = obj.action as Record<string, unknown> | undefined;
      if (action?.uri === BOLA_PNP_LIFF_MARKER) {
        greetingLineOAID = (action.__greetingLineOAID as string) || "";
        greetingTemplateID = (action.__greetingTemplateID as string) || "";
        const { __greetingLineOAID: _oa, __greetingTemplateID: _tmpl, ...cleanAction } = action;
        return { ...obj, action: cleanAction };
      }
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = traverse(obj[key]);
    }
    return result;
  }

  const cleanedBody = traverse(jsonBody) as Record<string, unknown>;
  return { cleanedBody, greetingLineOAID, greetingTemplateID };
}

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

// ── PNPTemplatePicker ─────────────────────────────────────────────────────────

interface PNPTemplatePickerProps {
  value: string;
  onChange: (id: string) => void;
  templates: PNPTemplate[];
  disabled?: boolean;
}

function PNPTemplatePicker({ value, onChange, templates, disabled }: PNPTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = templates.find((t) => t.id === value);
  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(288, spaceBelow - 8);
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(dropdownHeight, 120),
        zIndex: 9999,
      });
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background text-left disabled:bg-muted disabled:cursor-not-allowed"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate font-medium">{selected.name}</span>
            <span className="font-mono text-muted-foreground text-xs flex-shrink-0">
              #{selected.id.slice(-8)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Select a PNP Template...</span>
        )}
        <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground ml-2" />
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />

          {/* Dropdown — rendered via portal to escape dialog overflow:hidden */}
          <div
            className="bg-background border rounded-md shadow-lg overflow-y-auto"
            style={dropdownStyle}
          >
            <div className="p-2 border-b sticky top-0 bg-background">
              <input
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-start gap-2 border-b last:border-b-0",
                  value === t.id && "bg-muted"
                )}
                onClick={() => { onChange(t.id); setOpen(false); setSearch(""); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{t.name}</span>
                    <span className="font-mono text-muted-foreground text-xs">
                      #{t.id.slice(-8)}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs capitalize flex-shrink-0 mt-0.5">
                  {t.message_type}
                </Badge>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {search ? "No templates match your search." : "No templates available."}
              </p>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── TemplateEditorModal ───────────────────────────────────────────────────────

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (updated: PNPTemplate) => void;
  template: PNPTemplate | null;
  lineOAs: LineOA[];
  pnpTemplates: PNPTemplate[];
}

type OnGreetingMsgType = "none" | "flex" | "pnp_template";

function TemplateEditorModal({ open, onClose, onSaved, template, lineOAs, pnpTemplates }: TemplateEditorModalProps) {
  const toast = useToast();
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonBodyText, setJsonBodyText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Flex messages for the on_greeting flex picker
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);
  const [flexMessagesLoading, setFlexMessagesLoading] = useState(false);

  // Stable callback — avoids recreating the entire applyChange chain on every render
  const handleJsonBodyChange = useCallback((body: Record<string, unknown>) => {
    setJsonBodyText(JSON.stringify(body, null, 2));
  }, []);
  const [schemaFields, setSchemaFields] = useState<SchemaDraft[]>([]);
  const [exampleVars, setExampleVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exportingJpg, setExportingJpg] = useState(false);

  // On-greeting (Approach B) state
  const [onGreetingOpen, setOnGreetingOpen] = useState(false);
  const [onGreetingMsgType, setOnGreetingMsgType] = useState<OnGreetingMsgType>("none");
  const [onGreetingFlexMessageId, setOnGreetingFlexMessageId] = useState("");
  const [onGreetingTemplateId, setOnGreetingTemplateId] = useState("");
  const [onGreetingLineOAId, setOnGreetingLineOAId] = useState("");
  const [onGreetingSendOnce, setOnGreetingSendOnce] = useState(true);
  const [onGreetingRedirectURL, setOnGreetingRedirectURL] = useState("");
  const [onGreetingPickerError, setOnGreetingPickerError] = useState("");

  // Initialization
  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setDescription(template.description || "");
      // Inject __greeting* keys into the liff_greeting action so ActionEditor can read them
      const injected = injectGreetingConfig(
        template.json_body,
        template.greeting_line_oa_id || "",
        template.greeting_template_id || ""
      );
      setJsonBodyText(JSON.stringify(injected, null, 2));
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

      // Initialize on_greeting fields
      const msgType = template.on_greeting_message_type ?? "none";
      setOnGreetingMsgType(msgType);
      setOnGreetingOpen(msgType !== "none");
      if (msgType === "flex") {
        const fmId = (template.on_greeting_payload as { flex_message_id?: string })?.flex_message_id ?? "";
        setOnGreetingFlexMessageId(fmId);
        setOnGreetingTemplateId("");
      } else if (msgType === "pnp_template") {
        setOnGreetingTemplateId(
          (template.on_greeting_payload as { template_id?: string })?.template_id ?? ""
        );
        setOnGreetingFlexMessageId("");
      } else {
        setOnGreetingFlexMessageId("");
        setOnGreetingTemplateId("");
      }
      setOnGreetingLineOAId(template.on_greeting_line_oa_id ?? "");
      setOnGreetingSendOnce(template.on_greeting_send_once ?? true);
      setOnGreetingRedirectURL(template.on_greeting_redirect_url ?? "");
      setOnGreetingPickerError("");
    }
  }, [open, template]);

  // Load flex messages once when the modal opens
  useEffect(() => {
    if (!open) return;
    setFlexMessagesLoading(true);
    flexMessageApi
      .list({ workspace_id: WORKSPACE_ID, page_size: 200 })
      .then((res) => setFlexMessages(res.data ?? []))
      .catch(console.error)
      .finally(() => setFlexMessagesLoading(false));
  }, [open]);

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

    // Build on_greeting payload from picker selections
    let onGreetingPayload: Record<string, unknown> | undefined;
    if (onGreetingMsgType === "flex") {
      if (!onGreetingFlexMessageId) {
        setOnGreetingPickerError("Please select a Flex Message template");
        return;
      }
      onGreetingPayload = { flex_message_id: onGreetingFlexMessageId };
      setOnGreetingPickerError("");
    } else if (onGreetingMsgType === "pnp_template") {
      if (!onGreetingTemplateId) {
        setOnGreetingPickerError("Please select a PNP Template");
        return;
      }
      onGreetingPayload = { template_id: onGreetingTemplateId };
      setOnGreetingPickerError("");
    } else {
      setOnGreetingPickerError("");
    }

    setSaving(true);
    try {
      const { cleanedBody, greetingLineOAID, greetingTemplateID } = extractAndStripGreetingConfig(parsed);
      const updated = await pnpTemplateApi.update(template.id, {
        name: name.trim(),
        description: description.trim(),
        json_body: cleanedBody,
        editable_schema: schemaFields.map((f) => ({
          path: f.path,
          type: f.type,
          label: f.label,
          max_len: parseInt(f.max_len) || undefined,
        })),
        // Preserve existing greeting config — only send if non-empty (dropdowns removed from UI)
        ...(greetingTemplateID ? { greeting_template_id: greetingTemplateID } : {}),
        ...(greetingLineOAID ? { greeting_line_oa_id: greetingLineOAID } : {}),
        on_greeting_message_type: onGreetingMsgType,
        on_greeting_payload: onGreetingPayload,
        on_greeting_line_oa_id: onGreetingLineOAId || undefined,
        on_greeting_send_once: onGreetingSendOnce,
        on_greeting_redirect_url: onGreetingRedirectURL || undefined,
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
            showGreetingConfig={true}
          />
        </div>

        {/* On-Greeting (Approach B) — only shown when the JSON has a LIFF greeting button */}
        {hasLiffGreetingButton(jsonBodyParsed) && <div className="border-t flex-shrink-0">
          <button
            type="button"
            onClick={() => setOnGreetingOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <span className={cn("transition-transform text-[10px]", onGreetingOpen ? "rotate-90" : "rotate-0")}>▶</span>
            <span>Message 2 — On Greeting Complete</span>
            {onGreetingMsgType !== "none" && (
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                {onGreetingMsgType === "flex" ? "Flex JSON" : "PNP Template"}
              </span>
            )}
          </button>

          {onGreetingOpen && (
            <div className="px-6 py-4 space-y-4 bg-muted/10">
              {/* Message type selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-28 flex-shrink-0">Message Type</span>
                <div className="flex gap-1">
                  {(["none", "flex", "pnp_template"] as OnGreetingMsgType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setOnGreetingMsgType(t); setOnGreetingPickerError(""); }}
                      className={cn(
                        "px-3 py-1 rounded text-xs border transition-colors",
                        onGreetingMsgType === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {t === "none" ? "None" : t === "flex" ? "Flex JSON" : "PNP Template"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flex Message picker */}
              {onGreetingMsgType === "flex" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Flex Message Template
                  </label>
                  <FlexMessagePicker
                    value={onGreetingFlexMessageId}
                    onChange={(id) => { setOnGreetingFlexMessageId(id); setOnGreetingPickerError(""); }}
                    flexMessages={flexMessages}
                    loading={flexMessagesLoading}
                  />
                  {onGreetingPickerError && (
                    <p className="text-xs text-destructive">{onGreetingPickerError}</p>
                  )}
                </div>
              )}

              {/* PNP Template picker */}
              {onGreetingMsgType === "pnp_template" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    PNP Template
                  </label>
                  <PNPTemplatePicker
                    value={onGreetingTemplateId}
                    onChange={(id) => { setOnGreetingTemplateId(id); setOnGreetingPickerError(""); }}
                    templates={pnpTemplates.filter((t) => t.id !== template?.id)}
                  />
                  {onGreetingPickerError && (
                    <p className="text-xs text-destructive">{onGreetingPickerError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The selected template will be rendered without variables and pushed to the user.
                  </p>
                </div>
              )}

              {onGreetingMsgType !== "none" && (
                <>
                  {/* LINE OA selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-28 flex-shrink-0">Send from OA</span>
                    {lineOAs.length > 0 ? (
                      <select
                        value={onGreetingLineOAId}
                        onChange={(e) => setOnGreetingLineOAId(e.target.value)}
                        className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      >
                        <option value="">— Default (template OA) —</option>
                        {lineOAs.map((oa) => (
                          <option key={oa.id} value={oa.id}>
                            {oa.name} ({oa.basic_id || oa.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={onGreetingLineOAId}
                        onChange={(e) => setOnGreetingLineOAId(e.target.value)}
                        placeholder="LINE OA ID (optional)"
                        className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    )}
                  </div>

                  {/* Send once toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-28 flex-shrink-0">Send Once</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onGreetingSendOnce}
                        onChange={(e) => setOnGreetingSendOnce(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-muted-foreground">
                        Send only once per phone number (skip if already sent)
                      </span>
                    </label>
                  </div>

                  {/* Redirect URL */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-28 flex-shrink-0">Redirect URL</span>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    <input
                      type="text"
                      value={onGreetingRedirectURL}
                      onChange={(e) => setOnGreetingRedirectURL(e.target.value)}
                      placeholder="https://shop.com/order/{order_id}"
                      className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      หลังจาก user กด LIFF แล้ว redirect ไปที่ URL นี้แทนการปิด LIFF — รองรับ <code className="bg-muted px-1 rounded">{"{variable_key}"}</code> จาก template_variables ที่ส่งตอน send PNP
                    </p>
                  </div>
                </>
              )}

              {onGreetingMsgType === "none" && (
                <p className="text-xs text-muted-foreground italic">
                  No message 2 will be sent when users complete the LIFF greeting.
                </p>
              )}
            </div>
          )}
        </div>}

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
    lonApi.getConfig().then((res) => setSharedLiffId(res.shared_liff_id ?? "")).catch(() => { /* endpoint not available, keep badge hidden */ });
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
        lineOAs={lineOAs}
        pnpTemplates={custom}
      />
    </AppLayout>
  );
}
