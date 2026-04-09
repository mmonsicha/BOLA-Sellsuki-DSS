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
  Bell,
  Phone,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  ChevronRight,
  Eye,
  Users,
} from "lucide-react";
import { lonApi, pnpTemplateApi } from "@/api/lon";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { segmentApi } from "@/api/segment";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import { applyTemplateVariables } from "@/utils/pnpTemplateUtils";
import type { LineOA, PNPTemplate, UnifiedContact, BulkSendPNPResult, Segment } from "@/types";
import { maskPhone } from "@/lib/phone";
import { getWorkspaceId } from "@/lib/auth";
import { cn } from "@/lib/utils";

const WORKSPACE_ID = getWorkspaceId() ?? "";

// ─── Infographic Component ─────────────────────────────────────────────────────

function HowItWorksInfographic() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Card className="overflow-hidden border-2">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b hover:bg-gray-100 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="font-bold text-sm">วิธีส่ง LINE Notification</span>
          <span className="text-xs text-muted-foreground ml-1">
            — How Each System Works
          </span>
        </div>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <CardContent className="p-0">
          {/* Two-column comparison */}
          <div className="grid grid-cols-2 divide-x">
            {/* LEFT: LON Subscribers */}
            <div className="p-5 space-y-4">
              {/* Column Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30 rounded-full px-3 py-1 text-sm font-bold mb-1">
                  <Bell size={13} />
                  LON Subscribers
                </div>
                <p className="text-xs text-muted-foreground">
                  Consent-based messaging
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  {
                    n: "1",
                    icon: "📱",
                    text: "User scans QR code or opens LIFF link",
                  },
                  { n: "2", icon: "✅", text: "User consents in LINE app" },
                  {
                    n: "3",
                    icon: "💾",
                    text: "Consent token stored in BOLA",
                  },
                  {
                    n: "4",
                    icon: "📨",
                    text: "Send any time using stored token",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#06C755] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.n}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="mr-1">{step.icon}</span>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  "Standard channel",
                  "Any message type",
                  "Subscriber list",
                  "Re-send anytime",
                ].map((f) => (
                  <span
                    key={f}
                    className="text-[10px] bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20 rounded px-1.5 py-0.5"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: LON by Phone */}
            <div className="p-5 space-y-4 bg-blue-50/40">
              {/* Column Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm font-bold mb-1">
                  <Phone size={13} />
                  LON by Phone
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct phone-based messaging
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  {
                    n: "1",
                    icon: "📋",
                    text: "You have customer's phone number",
                  },
                  { n: "2", icon: "🔒", text: "BOLA hashes phone (SHA256)" },
                  {
                    n: "3",
                    icon: "🚀",
                    text: "Message sent directly via LINE API",
                  },
                  {
                    n: "4",
                    icon: "💬",
                    text: "LINE shows consent prompt to user automatically",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.n}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="mr-1">{step.icon}</span>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  { label: "Partner approval needed", warn: true },
                  { label: "Templates only", warn: false },
                  { label: "No pre-consent needed", warn: false },
                  { label: "TH / JP / TW only", warn: true },
                ].map((f) => (
                  <span
                    key={f.label}
                    className={`text-[10px] rounded px-1.5 py-0.5 border ${
                      f.warn
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    }`}
                  >
                    {f.warn ? "⚠" : "✓"} {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom comparison row */}
          <div className="grid grid-cols-2 divide-x border-t bg-gray-50">
            <div className="px-5 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Best for:{" "}
                <span className="font-medium text-gray-700">
                  Loyal subscribers, re-engagement
                </span>
              </p>
            </div>
            <div className="px-5 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Best for:{" "}
                <span className="font-medium text-gray-700">
                  Transactional alerts, order updates
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Contact Picker Modal ─────────────────────────────────────────────────────

interface ContactPickerModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  lineOAId: string;
  onConfirm: (contacts: UnifiedContact[]) => void;
}

function ContactPickerModal({ open, onClose, workspaceId, lineOAId, onConfirm }: ContactPickerModalProps) {
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !workspaceId) return;
    setLoading(true);
    setSelected(new Set());
    setSearch("");
    followerApi
      .listUnified({ workspace_id: workspaceId, contact_status: "phone", page_size: 200 })
      .then((res) => {
        const all = (res.data ?? []).filter((c) => c.phone && c.phone.trim() !== "");
        setContacts(all);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, workspaceId, lineOAId]);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = [c.first_name, c.last_name, c.display_name].filter(Boolean).join(" ").toLowerCase();
    return name.includes(q) || (c.phone ?? "").includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = contacts.filter((c) => selected.has(c.id));
    onConfirm(chosen);
  }

  const displayName = (c: UnifiedContact) => {
    const n = [c.first_name, c.last_name].filter(Boolean).join(" ");
    return n || c.display_name || "—";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} />
            Choose Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <RefreshCw size={14} className="animate-spin" /> Loading contacts…
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No phone contacts found for this workspace.
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center gap-3 px-6 py-2 border-b bg-muted/30">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
              <span className="text-xs font-medium text-muted-foreground">
                {selected.size > 0 ? `${selected.size} selected` : `Select all (${filtered.length})`}
              </span>
            </div>

            {/* Contact list */}
            <div className="overflow-y-auto max-h-72 divide-y">
              {filtered.map((c) => (
                <label key={c.id} className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName(c)}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{c.contact_status === "phone_only" ? "phone" : c.contact_status}</Badge>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between items-center px-6 py-3 border-t">
          <span className="text-sm text-muted-foreground">{selected.size} contact{selected.size !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleConfirm} disabled={selected.size === 0}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Segment Picker Modal ─────────────────────────────────────────────────────

interface SegmentPickerModalProps {
  open: boolean;
  onClose: () => void;
  segments: Segment[];
  loading: boolean;
  onSelect: (segment: Segment) => void;
}

function SegmentPickerModal({ open, onClose, segments, loading, onSelect }: SegmentPickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = segments.filter((s) =>
    s.source_type === "contact" &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} />
            Choose Segment
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search segments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <RefreshCw size={14} className="animate-spin" /> Loading segments…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {search ? "No segments match your search." : "No contact segments found."}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-72 divide-y">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s); onClose(); }}
                className="w-full flex items-start gap-3 px-6 py-3 hover:bg-muted/40 text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0 mt-0.5">
                  {s.source_type}
                </Badge>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end px-6 py-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Results Modal ────────────────────────────────────────────────────────

interface BulkResultsModalProps {
  open: boolean;
  onClose: () => void;
  results: BulkSendPNPResult[];
  suppressedCount?: number;
}

function BulkResultsModal({ open, onClose, results, suppressedCount = 0 }: BulkResultsModalProps) {
  const successCount = results.filter((r) => !r.error).length;
  const failCount = results.filter((r) => r.error).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Send Results</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-3 flex gap-4 border-b">
          <span className="text-sm text-green-700 font-medium">✓ {successCount} sent</span>
          {failCount > 0 && <span className="text-sm text-destructive font-medium">✗ {failCount} failed</span>}
        </div>
        {suppressedCount > 0 && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs text-orange-800 bg-orange-50 border-b border-orange-100">
            <AlertTriangle size={12} className="flex-shrink-0" />
            {suppressedCount} เบอร์ไม่พบในระบบ LINE ถูก suppress แล้ว จะไม่ส่งในครั้งต่อไปโดยอัตโนมัติ
          </div>
        )}
        <div className="overflow-y-auto max-h-80 divide-y">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-2.5">
              <span className={`text-sm flex-shrink-0 ${r.error ? "text-destructive" : "text-green-700"}`}>
                {r.error ? "✗" : "✓"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono">{r.phone_number}</p>
                {r.error && <p className="text-xs text-destructive mt-0.5 truncate">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-6 py-3 border-t">
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Picker Modal ─────────────────────────────────────────────────────

const MESSAGE_TYPE_COLORS: Record<PNPTemplate["message_type"], string> = {
  basic: "border-transparent bg-blue-100 text-blue-800",
  emphasis: "border-transparent bg-purple-100 text-purple-800",
  list: "border-transparent bg-amber-100 text-amber-800",
  mix: "border-transparent bg-teal-100 text-teal-800",
};

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  templates: PNPTemplate[];
  loading: boolean;
  onSelect: (template: PNPTemplate) => void;
}

function TemplatePickerModal({
  open,
  onClose,
  templates,
  loading,
  onSelect,
}: TemplatePickerModalProps) {
  const custom = templates.filter((t) => !t.is_preset);

  const [hoveredTemplate, setHoveredTemplate] = useState<PNPTemplate | null>(
    () => custom[0] ?? null
  );

  useEffect(() => {
    setHoveredTemplate(custom[0] ?? null);
  }, [templates]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSplit = !loading && custom.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate size={18} />
            Pick a Template
          </DialogTitle>
        </DialogHeader>

        {showSplit ? (
          <div className="flex" style={{ minHeight: "420px" }}>
            {/* Left column — saved templates only */}
            <div className="w-64 flex-shrink-0 border-r overflow-y-auto max-h-[60vh] py-4 px-3 space-y-2">
              {custom.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  onMouseEnter={() => setHoveredTemplate(t)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group",
                    hoveredTemplate?.id === t.id && "bg-muted/60"
                  )}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{t.name}</span>
                      <Badge className={cn("capitalize text-xs", MESSAGE_TYPE_COLORS[t.message_type])}>
                        {t.message_type}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors" />
                </button>
              ))}
            </div>

            {/* Right column — preview */}
            <div className="flex-1 flex flex-col gap-3 p-4 justify-start overflow-y-auto max-h-[60vh]">
              {hoveredTemplate ? (
                <>
                  <FlexCardPreview content={JSON.stringify(hoveredTemplate.json_body)} height={380} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{hoveredTemplate.name}</span>
                      <Badge className={cn("capitalize text-xs", MESSAGE_TYPE_COLORS[hoveredTemplate.message_type])}>
                        {hoveredTemplate.message_type}
                      </Badge>
                    </div>
                    {hoveredTemplate.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{hoveredTemplate.description}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                  Hover a template to preview
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight: "420px" }}>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-6">Loading templates…</div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-6">
                No templates available for this LINE OA.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LONByPhonePage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");

  // Template state
  const [templates, setTemplates] = useState<PNPTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PNPTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const previewContent = useMemo(() => {
    if (!selectedTemplate) return null;
    try {
      const patched = applyTemplateVariables(
        selectedTemplate.json_body,
        selectedTemplate.editable_schema,
        templateVariables
      );
      return JSON.stringify(patched);
    } catch {
      return JSON.stringify(selectedTemplate.json_body);
    }
  }, [selectedTemplate, templateVariables]);

  // Bulk send state
  const [sendMode, setSendMode] = useState<"single" | "bulk" | "segment">("single");
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<UnifiedContact[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkSendPNPResult[]>([]);
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [bulkSuppressedCount, setBulkSuppressedCount] = useState(0);

  // Segment state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segmentCount, setSegmentCount] = useState<number | null>(null);
  const [segmentCountLoading, setSegmentCountLoading] = useState(false);
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);

  // Send form state
  const [phone, setPhone] = useState("");
  const [phoneValidationError, setPhoneValidationError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

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

  // Load templates when OA changes
  useEffect(() => {
    if (!selectedLineOAId) return;
    setTemplatesLoading(true);
    pnpTemplateApi
      .list({ line_oa_id: selectedLineOAId })
      .then((res) => setTemplates(res.data ?? []))
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
    // Reset selected template when OA changes
    setSelectedTemplate(null);
    setTemplateVariables({});
  }, [selectedLineOAId]);

  // Load segments when OA changes
  useEffect(() => {
    if (!WORKSPACE_ID) return;
    setSegmentsLoading(true);
    segmentApi
      .list({ workspace_id: WORKSPACE_ID, page_size: 200 })
      .then((res) => {
        setSegments(res.data ?? []);
      })
      .catch(console.error)
      .finally(() => setSegmentsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch count when segment changes
  useEffect(() => {
    if (!selectedSegment || !selectedLineOAId) { setSegmentCount(null); return; }
    setSegmentCountLoading(true);
    segmentApi
      .previewCount({
        workspace_id: WORKSPACE_ID,
        line_oa_id: selectedLineOAId,
        source_type: selectedSegment.source_type,
        rule: selectedSegment.rule,
      })
      .then((res) => setSegmentCount(res.count))
      .catch(() => setSegmentCount(null))
      .finally(() => setSegmentCountLoading(false));
  }, [selectedSegment, selectedLineOAId]);

  function handleSelectTemplate(template: PNPTemplate) {
    setSelectedTemplate(template);
    // Initialize all editable fields to empty strings
    const initialVars: Record<string, string> = {};
    for (const field of template.editable_schema) {
      initialVars[field.path] = "";
    }
    setTemplateVariables(initialVars);
    setShowTemplatePicker(false);
    setSendError("");
  }

  async function handleBulkSend() {
    if (!selectedLineOAId) { setSendError("Please select a LINE OA."); return; }
    if (!selectedTemplate) { setSendError("Please pick a template."); return; }
    if (selectedContacts.length === 0) { setSendError("Please choose at least one contact."); return; }
    setSendError("");
    setBulkSending(true);
    try {
      const phoneNumbers = selectedContacts.map((c) => c.phone!).filter(Boolean);
      const res = await lonApi.bulkSendLONByPhone({
        line_oa_id: selectedLineOAId,
        phone_numbers: phoneNumbers,
        template_id: selectedTemplate.id,
        template_variables: templateVariables,
        triggered_by: "manual_bulk",
      });
      setBulkResults(res.results ?? []);
      setBulkSuppressedCount(res.suppressed_count ?? 0);
      setShowBulkResults(true);
      setSelectedContacts([]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Bulk send failed.");
    } finally {
      setBulkSending(false);
    }
  }

  async function handleSegmentSend() {
    if (!selectedLineOAId) { setSendError("Please select a LINE OA."); return; }
    if (!selectedTemplate) { setSendError("Please pick a template."); return; }
    if (!selectedSegment) { setSendError("Please select a segment."); return; }
    setSendError("");
    setBulkSending(true);
    try {
      // Paginate through all contacts in the segment
      const allPhones: string[] = [];
      let page = 1;
      const pageSize = 500;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await segmentApi.previewList({
          workspace_id: WORKSPACE_ID,
          line_oa_id: selectedLineOAId,
          source_type: selectedSegment.source_type,
          rule: selectedSegment.rule,
          page,
          page_size: pageSize,
        });
        const phones = (res.data ?? []).map((c) => c.phone).filter(Boolean) as string[];
        allPhones.push(...phones);
        if (res.data.length < pageSize) break;
        page++;
      }
      if (allPhones.length === 0) {
        setSendError("No contacts with phone numbers found in this segment.");
        return;
      }
      const res = await lonApi.bulkSendLONByPhone({
        line_oa_id: selectedLineOAId,
        phone_numbers: allPhones,
        template_id: selectedTemplate.id,
        template_variables: templateVariables,
        triggered_by: "manual_segment",
      });
      setBulkResults(res.results ?? []);
      setShowBulkResults(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Segment send failed.");
    } finally {
      setBulkSending(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    setSendSuccess(false);
    setPhoneValidationError("");

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setPhoneValidationError("Phone number is required.");
      return;
    }
    if (!trimmedPhone.startsWith("+") || trimmedPhone.length < 8) {
      setPhoneValidationError("Phone number must be in E.164 format (e.g. +66812345678).");
      return;
    }
    if (!selectedTemplate) {
      setSendError("Please pick a template.");
      return;
    }
    if (!selectedLineOAId) {
      setSendError("Please select a LINE OA.");
      return;
    }

    setSending(true);
    try {
      const result = await lonApi.sendLONByPhone({
        line_oa_id: selectedLineOAId,
        phone_number: trimmedPhone,
        template_id: selectedTemplate.id,
        template_variables: templateVariables,
      });
      setSendSuccess(true);
      setPhone("");
      // Store masked phone → hash mapping for the Delivery Logs page
      try {
        const map = JSON.parse(localStorage.getItem("bola_lon_phone_map") ?? "{}") as Record<string, string>;
        map[result.phone_hash] = maskPhone(trimmedPhone);
        localStorage.setItem("bola_lon_phone_map", JSON.stringify(map));
      } catch { /* ignore */ }
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send notification. Please check your inputs and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout title="LON by Phone">
      <div className="space-y-5">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Send LINE notification messages directly to customers by phone number
          using LINE's partner API (PNP). No prior consent required — LINE
          handles the consent prompt automatically.
        </p>

        {/* Infographic */}
        <HowItWorksInfographic />

        {/* Requirements Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">LINE Partner Approval Required</p>
            <p className="text-xs">
              LON by Phone uses LINE's corporate/partner API. You must apply for
              approval via your LINE sales representative. Available in{" "}
              <strong>Thailand, Japan, and Taiwan</strong> only. Messages must
              use <strong>pre-approved templates</strong>.
            </p>
            <a
              href="https://developers.line.biz/en/docs/partner-docs/line-notification-messages/overview/"
              target="_blank"
              rel="noreferrer"
              className="text-xs underline text-amber-700 hover:text-amber-900"
            >
              LINE Notification Messages documentation →
            </a>
          </div>
        </div>

        {/* OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={(id) => {
            setSelectedLineOAId(id);
          }}
          showAll={false}
        />

        {/* Send Form */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <PhoneCall size={15} className="text-blue-600" />
              <span className="font-semibold text-sm">
                Send Notification by Phone
              </span>
            </div>
            <form onSubmit={(e) => void handleSend(e)} className="space-y-4">
              {/* Send mode toggle */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                {(["single", "bulk", "segment"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setSendMode(mode); setSendError(""); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      sendMode === mode
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "single" ? "Single" : mode === "bulk" ? "Bulk from Contacts" : "By Segment"}
                  </button>
                ))}
              </div>

              {sendMode === "single" ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneValidationError("");
                  }}
                  placeholder="+66812345678"
                  disabled={sending}
                  className={`w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${phoneValidationError ? "border-destructive focus:ring-destructive/50" : ""}`}
                />
                {phoneValidationError ? (
                  <p className="text-[11px] text-destructive font-medium">{phoneValidationError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    E.164 format (e.g. +66812345678). Will be SHA256-hashed before sending.
                  </p>
                )}
              </div>
              ) : sendMode === "bulk" ? (
                /* Bulk mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">
                      Contacts ({selectedContacts.length} selected)
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowContactPicker(true)}
                      disabled={!selectedLineOAId}
                      className="gap-1.5 text-xs"
                    >
                      <Users size={13} />
                      Choose Contacts
                    </Button>
                  </div>
                  {selectedContacts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedContacts.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs gap-1">
                          {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.display_name || c.phone}
                          <button
                            type="button"
                            onClick={() => setSelectedContacts((prev) => prev.filter((x) => x.id !== c.id))}
                            className="hover:text-destructive ml-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : sendMode === "segment" ? (
                /* Segment mode */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      Segment
                    </label>
                    <div className="flex items-center justify-between">
                      {selectedSegment ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0 rounded-lg border p-3 bg-muted/30 mr-2">
                          <Users size={15} className="text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedSegment.name}</p>
                            {selectedSegment.description && (
                              <p className="text-xs text-muted-foreground truncate">{selectedSegment.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">{selectedSegment.source_type}</Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No segment selected</span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSegmentPicker(true)}
                        disabled={!selectedLineOAId}
                        className="gap-1.5 text-xs flex-shrink-0"
                      >
                        <Users size={13} />
                        {selectedSegment ? "Change" : "Choose Segment"}
                      </Button>
                    </div>
                  </div>
                  {selectedSegment && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {segmentCountLoading ? (
                        <><RefreshCw size={11} className="animate-spin" /> Counting contacts…</>
                      ) : segmentCount !== null ? (
                        <><Users size={12} /><span><strong>{segmentCount}</strong> contact{segmentCount !== 1 ? "s" : ""} will be targeted</span></>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Template Picker */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Message Template *
                </label>
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
                      {selectedTemplate.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{selectedTemplate.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTemplatePicker(true)}
                      className="flex-shrink-0 text-xs"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTemplatePicker(true)}
                    disabled={!selectedLineOAId}
                    className="gap-2 w-full justify-start text-muted-foreground"
                  >
                    <LayoutTemplate size={15} />
                    Pick Template…
                  </Button>
                )}
              </div>

              {/* Dynamic fields from editable_schema */}
              {selectedTemplate && selectedTemplate.editable_schema.length > 0 && (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-gray-700">Template Variables</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTemplate.editable_schema.map((field) => (
                      <div key={field.path} className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          {field.label}
                          {field.max_len && (
                            <span className="text-muted-foreground font-normal ml-1">
                              (max {field.max_len})
                            </span>
                          )}
                        </label>
                        <input
                          type={field.type === "url" ? "url" : "text"}
                          value={templateVariables[field.path] ?? ""}
                          onChange={(e) =>
                            setTemplateVariables((prev) => ({
                              ...prev,
                              [field.path]: e.target.value,
                            }))
                          }
                          maxLength={field.max_len}
                          disabled={sending}
                          placeholder={field.type === "url" ? "https://…" : field.label}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Preview */}
              {previewContent && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <Eye size={13} />
                    Message Preview
                  </div>
                  <FlexCardPreview content={previewContent} height={360} />
                </div>
              )}

              {sendError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <XCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
              {sendSuccess && (
                <div className="flex flex-col gap-1.5 text-sm rounded-md border border-green-200 bg-green-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle2 size={14} />
                    Message sent successfully!
                  </div>
                  <p className="text-xs text-green-600 pl-5">
                    LON subscriber is being registered in the background — you can send notifications directly next time.
                  </p>
                </div>
              )}

              {sendMode === "single" ? (
                <Button
                  type="submit"
                  disabled={
                    sending ||
                    !phone.trim() ||
                    !selectedTemplate ||
                    !selectedLineOAId
                  }
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Notification
                    </>
                  )}
                </Button>
              ) : sendMode === "bulk" ? (
                <Button
                  type="button"
                  onClick={() => void handleBulkSend()}
                  disabled={
                    bulkSending ||
                    selectedContacts.length === 0 ||
                    !selectedTemplate ||
                    !selectedLineOAId
                  }
                  className="gap-2"
                >
                  {bulkSending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Sending {selectedContacts.length}…
                    </>
                  ) : (
                    <>
                      <Users size={14} />
                      Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleSegmentSend()}
                  disabled={
                    bulkSending ||
                    !selectedSegment ||
                    !selectedTemplate ||
                    !selectedLineOAId
                  }
                  className="gap-2"
                >
                  {bulkSending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Users size={14} />
                      Send to Segment{segmentCount !== null ? ` (${segmentCount})` : ""}
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

      </div>

      {/* Template Picker Modal */}
      <TemplatePickerModal
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templates={templates}
        loading={templatesLoading}
        onSelect={handleSelectTemplate}
      />
      <ContactPickerModal
        open={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        workspaceId={WORKSPACE_ID}
        lineOAId={selectedLineOAId}
        onConfirm={(contacts) => {
          setSelectedContacts(contacts);
          setShowContactPicker(false);
        }}
      />
      <SegmentPickerModal
        open={showSegmentPicker}
        onClose={() => setShowSegmentPicker(false)}
        segments={segments}
        loading={segmentsLoading}
        onSelect={(seg) => {
          setSelectedSegment(seg);
          setSegmentCount(null);
        }}
      />
      <BulkResultsModal
        open={showBulkResults}
        onClose={() => setShowBulkResults(false)}
        results={bulkResults}
        suppressedCount={bulkSuppressedCount}
      />
    </AppLayout>
  );
}
