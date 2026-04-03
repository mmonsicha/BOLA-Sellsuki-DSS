import { useState, useEffect, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Zap,
  CalendarDays,
  LayoutTemplate,
  ChevronRight,
  Eye,
  Pencil,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Phone,
} from "lucide-react";
import { lonJobApi } from "@/api/lonJob";
import type { CreateLONJobRequest, UpdateLONJobRequest } from "@/api/lonJob";
import { pnpTemplateApi } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import { segmentApi } from "@/api/segment";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import { applyTemplateVariables } from "@/utils/pnpTemplateUtils";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { useToast } from "@/components/ui/toast";
import type { LONJob, LONJobRun, LineOA, PNPTemplate, Segment } from "@/types";
import { getWorkspaceId } from "@/lib/auth";
import { cn } from "@/lib/utils";

const WORKSPACE_ID = getWorkspaceId() ?? "";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MESSAGE_TYPE_COLORS: Record<PNPTemplate["message_type"], string> = {
  basic: "border-transparent bg-blue-100 text-blue-800",
  emphasis: "border-transparent bg-purple-100 text-purple-800",
  list: "border-transparent bg-amber-100 text-amber-800",
  mix: "border-transparent bg-teal-100 text-teal-800",
};

function formatSchedule(job: LONJob): string {
  const hh = String(job.schedule_hour).padStart(2, "0");
  const mm = String(job.schedule_minute).padStart(2, "0");
  if (job.schedule_type === "weekly" && job.schedule_weekdays?.length > 0) {
    const days = job.schedule_weekdays.map((d) => WEEKDAYS[d]).join(", ");
    return `Every ${days} at ${hh}:${mm}`;
  }
  if (job.schedule_type === "monthly" && job.schedule_days_of_month?.length > 0) {
    const days = job.schedule_days_of_month.join(", ");
    return `Monthly on day ${days} at ${hh}:${mm}`;
  }
  return `${job.schedule_type} at ${hh}:${mm}`;
}

function formatNextRun(dt: string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

// ─── Template Picker ──────────────────────────────────────────────────────────

interface TemplatePickerProps {
  templates: PNPTemplate[];
  loading: boolean;
  onSelect: (t: PNPTemplate) => void;
  onClose: () => void;
  open: boolean;
}

function TemplatePicker({ open, onClose, templates, loading, onSelect }: TemplatePickerProps) {
  const custom = templates.filter((t) => !t.is_preset);
  const [hovered, setHovered] = useState<PNPTemplate | null>(() => custom[0] ?? null);

  useEffect(() => {
    setHovered(custom[0] ?? null);
  }, [templates]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate size={18} />
            Pick a Template
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading templates…</div>
        ) : custom.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No saved templates for this LINE OA.{" "}
            <a href="/lon-templates" className="underline text-primary ml-1">Create one first.</a>
          </div>
        ) : (
          <div className="flex" style={{ minHeight: "420px" }}>
            {/* Left: list */}
            <div className="w-64 flex-shrink-0 border-r overflow-y-auto max-h-[60vh] py-4 px-3 space-y-2">
              {custom.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        onMouseEnter={() => setHovered(t)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group",
                          hovered?.id === t.id && "bg-muted/60"
                        )}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{t.name}</span>
                            <Badge className={cn("capitalize text-xs", MESSAGE_TYPE_COLORS[t.message_type])}>{t.message_type}</Badge>
                          </div>
                          {t.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground mt-0.5" />
                      </button>
              ))}
            </div>
            {/* Right: preview */}
            <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto max-h-[60vh]">
              {hovered ? (
                <>
                  <FlexCardPreview content={JSON.stringify(hovered.json_body)} height={360} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{hovered.name}</span>
                      <Badge className={cn("capitalize text-xs", MESSAGE_TYPE_COLORS[hovered.message_type])}>{hovered.message_type}</Badge>
                    </div>
                    {hovered.description && <p className="text-xs text-muted-foreground">{hovered.description}</p>}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">Hover a template to preview</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Run History Modal ────────────────────────────────────────────────────────

interface RunHistoryModalProps {
  job: LONJob | null;
  onClose: () => void;
}

function RunHistoryModal({ job, onClose }: RunHistoryModalProps) {
  const [runs, setRuns] = useState<LONJobRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!job) return;
    setLoading(true);
    lonJobApi.runs(job.id, { page_size: 50 })
      .then((res) => {
        setRuns(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [job]);

  function runStatusBadge(status: LONJobRun["status"]) {
    if (status === "success")
      return (
        <span className="flex items-center gap-1 text-green-700">
          <CheckCircle2 size={13} /> Success
        </span>
      );
    if (status === "partial")
      return (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle size={13} /> Partial
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-destructive">
        <XCircle size={13} /> Failed
      </span>
    );
  }

  return (
    <Dialog open={job !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={16} />
            Run History — {job?.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <RefreshCw size={18} className="animate-spin mx-auto mb-2" />
            Loading…
          </div>
        ) : runs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No runs yet. Trigger the job or wait for the scheduled time.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{total} run{total !== 1 ? "s" : ""} total</p>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Executed At</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-right py-2 pr-4 font-medium">Sent</th>
                    <th className="text-right py-2 font-medium">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(run.executed_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium">
                        {runStatusBadge(run.status)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-xs font-semibold text-green-700">
                        {run.sent_count}
                      </td>
                      <td className="py-2.5 text-right text-xs font-semibold text-destructive">
                        {run.failed_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Job Form (Create / Edit) ─────────────────────────────────────────────────

type JobFormData = {
  name: string;
  description: string;
  line_oa_id: string;
  schedule_type: "weekly" | "monthly";
  schedule_weekdays: number[];
  schedule_days_of_month: number[];
  schedule_hour: number;
  schedule_minute: number;
  timezone: string;
  target_type: "all_contacts" | "segment";
  target_segment_id: string;
  template_id: string;
  template_variables: Record<string, string>;
};

const DEFAULT_FORM: JobFormData = {
  name: "",
  description: "",
  line_oa_id: "",
  schedule_type: "weekly",
  schedule_weekdays: [1], // Monday
  schedule_days_of_month: [1],
  schedule_hour: 9,
  schedule_minute: 0,
  timezone: "Asia/Bangkok",
  target_type: "all_contacts",
  target_segment_id: "",
  template_id: "",
  template_variables: {},
};

/** Toggle a value in an int array (add if absent, remove if present). Min 1 item. */
function toggleDay(arr: number[], day: number): number[] {
  if (arr.includes(day)) {
    const next = arr.filter((d) => d !== day);
    return next.length === 0 ? arr : next; // prevent empty selection
  }
  return [...arr, day].sort((a, b) => a - b);
}

interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: JobFormData) => Promise<void>;
  initialData?: Partial<JobFormData>;
  lineOAs: LineOA[];
  segments: Segment[];
  title: string;
}

function JobFormDialog({ open, onClose, onSave, initialData, lineOAs, segments, title }: JobFormDialogProps) {
  const [step, setStep] = useState(0); // 0: schedule, 1: target, 2: template
  const [form, setForm] = useState<JobFormData>({ ...DEFAULT_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<PNPTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PNPTemplate | null>(null);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep(0);
      setError("");
      setForm({ ...DEFAULT_FORM, ...initialData });
      setSelectedTemplate(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load templates when OA is selected
  useEffect(() => {
    if (!form.line_oa_id) return;
    setTemplatesLoading(true);
    pnpTemplateApi
      .list({ line_oa_id: form.line_oa_id })
      .then((res) => setTemplates(res.data ?? []))
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
  }, [form.line_oa_id]);

  const previewContent = useMemo(() => {
    if (!selectedTemplate) return null;
    try {
      const patched = applyTemplateVariables(
        selectedTemplate.json_body,
        selectedTemplate.editable_schema,
        form.template_variables
      );
      return JSON.stringify(patched);
    } catch {
      return JSON.stringify(selectedTemplate.json_body);
    }
  }, [selectedTemplate, form.template_variables]);

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectTemplate(t: PNPTemplate) {
    setSelectedTemplate(t);
    const vars: Record<string, string> = {};
    for (const f of t.editable_schema) vars[f.path] = "";
    set("template_id", t.id);
    set("template_variables", vars);
    setShowTemplatePicker(false);
  }

  async function handleSubmit() {
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.line_oa_id) { setError("Please select a LINE OA."); return; }
    if (!form.template_id) { setError("Please pick a template."); return; }
    if (form.target_type === "segment" && !form.target_segment_id) {
      setError("Please select a segment."); return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job.");
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ["Schedule", "Target", "Template"];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays size={18} />
              {title}
            </DialogTitle>
          </DialogHeader>

          {/* Step tabs */}
          <div className="flex border-b px-6">
            {stepLabels.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  step === i
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {i + 1}. {label}
              </button>
            ))}
          </div>

          <div className="space-y-4 px-6 py-4">

            {/* ── Step 0: Schedule ── */}
            {step === 0 && (
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Job Name *</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Weekly Monday Reminder"
                  />
                </div>
                {/* LINE OA */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">LINE OA *</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    value={form.line_oa_id}
                    onChange={(e) => set("line_oa_id", e.target.value)}
                  >
                    <option value="">Select LINE OA…</option>
                    {lineOAs.map((oa) => (
                      <option key={oa.id} value={oa.id}>{oa.name}</option>
                    ))}
                  </select>
                </div>
                {/* Schedule type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Repeat</label>
                  <div className="flex gap-2">
                    {(["weekly", "monthly"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => set("schedule_type", t)}
                        className={cn(
                          "flex-1 py-2 rounded-md border text-sm font-medium transition-colors",
                          form.schedule_type === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {t === "weekly" ? "Weekly" : "Monthly"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekday multi-select */}
                {form.schedule_type === "weekly" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Days of Week
                      <span className="text-muted-foreground font-normal ml-1">(select multiple)</span>
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {WEEKDAYS.map((day, i) => {
                        const selected = form.schedule_weekdays.includes(i);
                        return (
                          <button
                            key={day}
                            onClick={() => set("schedule_weekdays", toggleDay(form.schedule_weekdays, i))}
                            className={cn(
                              "w-10 h-10 rounded-full border text-xs font-medium transition-colors",
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-muted/40"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Monthly multi-select grid */
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Days of Month
                      <span className="text-muted-foreground font-normal ml-1">(select multiple, max 28)</span>
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
                        const selected = form.schedule_days_of_month.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => set("schedule_days_of_month", toggleDay(form.schedule_days_of_month, d))}
                            className={cn(
                              "h-8 rounded border text-xs font-medium transition-colors",
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-muted/40"
                            )}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Hour (0–23)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.schedule_hour}
                      onChange={(e) => set("schedule_hour", Math.min(23, Math.max(0, Number(e.target.value))))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Minute (0–59)</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.schedule_minute}
                      onChange={(e) => set("schedule_minute", Math.min(59, Math.max(0, Number(e.target.value))))}
                    />
                  </div>
                </div>
                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            )}

            {/* ── Step 1: Target ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Send to</label>
                  <div className="flex gap-2">
                    {(["all_contacts", "segment"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => set("target_type", t)}
                        className={cn(
                          "flex-1 py-2 rounded-md border text-sm font-medium transition-colors",
                          form.target_type === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {t === "all_contacts" ? "All Contacts" : "Segment"}
                      </button>
                    ))}
                  </div>
                </div>
                {form.target_type === "segment" && (() => {
                  const selectedSeg = segments.find((s) => s.id === form.target_segment_id);
                  return (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Segment *</label>
                        <select
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                          value={form.target_segment_id}
                          onChange={(e) => set("target_segment_id", e.target.value)}
                        >
                          <option value="">Select a segment…</option>
                          {segments.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      {selectedSeg && (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                          {selectedSeg.source_type === "follower" ? (
                            <Users size={13} className="text-violet-500 flex-shrink-0" />
                          ) : (
                            <Phone size={13} className="text-blue-500 flex-shrink-0" />
                          )}
                          <span className="text-muted-foreground">
                            {selectedSeg.source_type === "follower" ? "Followers" : "Phone Contacts"}
                          </span>
                          <span className="ml-auto font-semibold tabular-nums">
                            {selectedSeg.customer_count.toLocaleString()} คน
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Step 2: Template ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Message Template *</label>
                  {selectedTemplate ? (
                    <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                      <LayoutTemplate size={16} className="text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{selectedTemplate.name}</span>
                          <Badge className={cn("capitalize text-xs", MESSAGE_TYPE_COLORS[selectedTemplate.message_type])}>
                            {selectedTemplate.message_type}
                          </Badge>
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowTemplatePicker(true)} className="text-xs">
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTemplatePicker(true)}
                      disabled={!form.line_oa_id}
                      className="gap-2 w-full justify-start text-muted-foreground"
                    >
                      <LayoutTemplate size={15} />
                      {form.line_oa_id ? "Pick Template…" : "Select a LINE OA first"}
                    </Button>
                  )}
                </div>

                {/* Template Variables */}
                {selectedTemplate && selectedTemplate.editable_schema.length > 0 && (
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-medium text-gray-700">Template Variables</p>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedTemplate.editable_schema.map((field) => (
                        <div key={field.path} className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">
                            {field.label}
                            {field.max_len && <span className="text-muted-foreground font-normal ml-1">(max {field.max_len})</span>}
                          </label>
                          <input
                            type={field.type === "url" ? "url" : "text"}
                            value={form.template_variables[field.path] ?? ""}
                            onChange={(e) =>
                              set("template_variables", { ...form.template_variables, [field.path]: e.target.value })
                            }
                            maxLength={field.max_len}
                            placeholder={field.type === "url" ? "https://…" : field.label}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                {previewContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Eye size={13} />
                      Preview
                    </div>
                    <FlexCardPreview content={previewContent} height={300} />
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer nav */}
          <div className="flex justify-between px-6 pt-3 pb-4 border-t">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              {step < 2 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (step === 0) {
                      if (!form.name.trim()) { setError("Job name is required."); return; }
                      if (!form.line_oa_id) { setError("Please select a LINE OA."); return; }
                    }
                    if (step === 1 && form.target_type === "segment" && !form.target_segment_id) {
                      setError("Please select a segment."); return;
                    }
                    setError("");
                    setStep((s) => s + 1);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button size="sm" onClick={() => void handleSubmit()} disabled={saving}>
                  {saving ? <RefreshCw size={14} className="animate-spin mr-1" /> : null}
                  {saving ? "Saving…" : "Save Job"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplatePicker
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templates={templates}
        loading={templatesLoading}
        onSelect={handleSelectTemplate}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LONJobsPage() {
  const toast = useToast();
  const { isEditorOrAbove } = useCurrentAdmin();

  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");

  const [jobs, setJobs] = useState<LONJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<LONJob | null>(null);
  const [runsTarget, setRunsTarget] = useState<LONJob | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<LONJob | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [refreshingSegId, setRefreshingSegId] = useState<string | null>(null);

  // Lookup map for quick access by id
  const segmentMap = useMemo(
    () => Object.fromEntries(segments.map((s) => [s.id, s])),
    [segments]
  );

  // Load LINE OAs
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(console.error);
  }, []);

  // Load segments (page-level, used in both form and job cards)
  useEffect(() => {
    segmentApi
      .list({ workspace_id: WORKSPACE_ID, page_size: 200 })
      .then((res) => setSegments(res.data ?? []))
      .catch(console.error);
  }, []);

  async function refreshSegmentCount(segId: string) {
    setRefreshingSegId(segId);
    try {
      const fresh = await segmentApi.get(segId);
      setSegments((prev) => prev.map((s) => (s.id === segId ? fresh : s)));
    } catch {
      /* ignore */
    } finally {
      setRefreshingSegId(null);
    }
  }

  const load = () => {
    setLoading(true);
    lonJobApi
      .list({ line_oa_id: selectedLineOAId || undefined })
      .then((res) => {
        setJobs(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedLineOAId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(form: JobFormData) {
    const req: CreateLONJobRequest = {
      line_oa_id: form.line_oa_id,
      name: form.name,
      description: form.description,
      schedule_type: form.schedule_type,
      schedule_weekdays: form.schedule_type === "weekly" ? form.schedule_weekdays : [],
      schedule_days_of_month: form.schedule_type === "monthly" ? form.schedule_days_of_month : [],
      schedule_hour: form.schedule_hour,
      schedule_minute: form.schedule_minute,
      timezone: form.timezone,
      target_type: form.target_type,
      target_segment_id: form.target_type === "segment" ? form.target_segment_id : undefined,
      template_id: form.template_id,
      template_variables: form.template_variables,
    };
    await lonJobApi.create(req);
    toast.success("LON Job created");
    setShowCreate(false);
    load();
  }

  async function handleUpdate(form: JobFormData) {
    if (!editTarget) return;
    const req: UpdateLONJobRequest = {
      name: form.name,
      description: form.description,
      schedule_type: form.schedule_type,
      schedule_weekdays: form.schedule_type === "weekly" ? form.schedule_weekdays : [],
      schedule_days_of_month: form.schedule_type === "monthly" ? form.schedule_days_of_month : [],
      schedule_hour: form.schedule_hour,
      schedule_minute: form.schedule_minute,
      timezone: form.timezone,
      target_type: form.target_type,
      target_segment_id: form.target_type === "segment" ? form.target_segment_id : undefined,
      template_id: form.template_id,
      template_variables: form.template_variables,
    };
    await lonJobApi.update(editTarget.id, req);
    toast.success("LON Job updated");
    setEditTarget(null);
    load();
  }

  async function handleTogglePause(job: LONJob) {
    setTogglingId(job.id);
    try {
      if (job.status === "active") {
        await lonJobApi.pause(job.id);
        toast.success("Job paused");
      } else {
        await lonJobApi.resume(job.id);
        toast.success("Job resumed");
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job status");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleTrigger(job: LONJob) {
    setTriggeringId(job.id);
    try {
      await lonJobApi.trigger(job.id);
      toast.success("Job triggered manually");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger job");
    } finally {
      setTriggeringId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await lonJobApi.delete(deleteTarget.id);
      toast.success("LON Job deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  }

  const editInitialData = useMemo(() => {
    if (!editTarget) return undefined;
    return {
      name: editTarget.name,
      description: editTarget.description,
      line_oa_id: editTarget.line_oa_id,
      schedule_type: editTarget.schedule_type,
      schedule_weekdays: editTarget.schedule_weekdays?.length ? editTarget.schedule_weekdays : [1],
      schedule_days_of_month: editTarget.schedule_days_of_month?.length ? editTarget.schedule_days_of_month : [1],
      schedule_hour: editTarget.schedule_hour,
      schedule_minute: editTarget.schedule_minute,
      timezone: editTarget.timezone,
      target_type: editTarget.target_type,
      target_segment_id: editTarget.target_segment_id ?? "",
      template_id: editTarget.template_id,
      template_variables: editTarget.template_variables ?? {},
    } satisfies Partial<JobFormData>;
  }, [editTarget]);

  function lastRunStatusBadge(status: string) {
    if (status === "success")
      return <Badge variant="success" className="text-xs">Last run OK</Badge>;
    if (status === "partial")
      return <Badge className="text-xs border-transparent bg-amber-100 text-amber-800">Last run partial</Badge>;
    if (status === "failed")
      return <Badge variant="destructive" className="text-xs">Last run failed</Badge>;
    return null;
  }

  return (
    <AppLayout title="LON Jobs">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Recurring scheduled LON-by-Phone sends. Each job sends PNP messages to phone contacts on a weekly or monthly schedule.
        </p>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <LineOAFilter
            lineOAs={lineOAs}
            selectedId={selectedLineOAId}
            onChange={setSelectedLineOAId}
            showAll
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            </Button>
            {isEditorOrAbove && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
                <Plus size={14} />
                New Job
              </Button>
            )}
          </div>
        </div>

        {/* Jobs list */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No LON jobs yet.</p>
              {isEditorOrAbove && (
                <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowCreate(true)}>
                  <Plus size={14} />
                  Create First Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{total} job{total !== 1 ? "s" : ""}</p>
            {jobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{job.name}</span>
                        <Badge
                          variant={job.status === "active" ? "success" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {job.status}
                        </Badge>
                        {lastRunStatusBadge(job.last_run_status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatSchedule(job)}
                        </span>
                        {job.target_type === "all_contacts" ? (
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            All Contacts
                          </span>
                        ) : (() => {
                          const seg = job.target_segment_id ? segmentMap[job.target_segment_id] : undefined;
                          if (!seg) return <span>Segment</span>;
                          return (
                            <span className="flex items-center gap-1.5">
                              {seg.source_type === "follower" ? (
                                <Users size={11} className="text-violet-500" />
                              ) : (
                                <Phone size={11} className="text-blue-500" />
                              )}
                              <span>{seg.name}</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {seg.customer_count.toLocaleString()} คน
                              </span>
                              <button
                                title="Refresh audience count"
                                onClick={(e) => { e.stopPropagation(); void refreshSegmentCount(seg.id); }}
                                className="rounded p-0.5 hover:bg-muted/60 transition-colors"
                                disabled={refreshingSegId === seg.id}
                              >
                                <RefreshCw
                                  size={10}
                                  className={cn(
                                    "text-muted-foreground",
                                    refreshingSegId === seg.id && "animate-spin"
                                  )}
                                />
                              </button>
                            </span>
                          );
                        })()}
                        {job.total_runs > 0 && (
                          <span>Runs: {job.total_runs}</span>
                        )}
                        <span>Next: {formatNextRun(job.next_run_at)}</span>
                      </div>
                      {job.description && (
                        <p className="text-xs text-muted-foreground truncate">{job.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {isEditorOrAbove && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => void handleTrigger(job)}
                          disabled={triggeringId === job.id}
                          title="Trigger now"
                        >
                          {triggeringId === job.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Zap size={13} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => void handleTogglePause(job)}
                          disabled={togglingId === job.id}
                          title={job.status === "active" ? "Pause" : "Resume"}
                        >
                          {togglingId === job.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : job.status === "active" ? (
                            <Pause size={13} />
                          ) : (
                            <Play size={13} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => setRunsTarget(job)}
                          title="Run history"
                        >
                          <History size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => setEditTarget(job)}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(job)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <JobFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
        lineOAs={lineOAs}
        segments={segments}
        title="New LON Job"
      />

      {/* Edit Dialog */}
      <JobFormDialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdate}
        initialData={editInitialData}
        lineOAs={lineOAs}
        segments={segments}
        title="Edit LON Job"
      />

      {/* Run History Modal */}
      <RunHistoryModal
        job={runsTarget}
        onClose={() => setRunsTarget(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LON Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
