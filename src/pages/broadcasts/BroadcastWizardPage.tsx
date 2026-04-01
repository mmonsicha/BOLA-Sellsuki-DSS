import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, AlertCircle, RefreshCw, Check, CheckCircle, LayoutTemplate } from "lucide-react";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId } from "@/lib/auth";
import { segmentApi } from "@/api/segment";
import { flexMessageApi, type FlexMessage } from "@/api/flexMessage";
import { broadcastApi, type BroadcastMessageInput } from "@/api/broadcast";
import { pnpTemplateApi } from "@/api/lon";
import { FlexCardPreview } from "@/components/FlexCardPreview";
import { FlexMessagePicker } from "@/components/common/FlexMessagePicker";
import { useToast } from "@/components/ui/toast";
import { applyTemplateVariables } from "@/utils/pnpTemplateUtils";
import type { LineOA, Segment, PNPTemplate } from "@/types";

// ─── Step indicator ────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Audience" },
  { number: 3, label: "Message" },
  { number: 4, label: "Schedule" },
];

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                step.number < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.number === currentStep
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number < currentStep ? <Check size={12} /> : step.number}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                step.number === currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`h-px w-8 sm:w-12 mx-2 flex-shrink-0 ${
                step.number < currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Message builder types ─────────────────────────────────────────────────

type MessageType = "text" | "flex";

interface MessageEntry {
  id: string;
  type: MessageType;
  text: string;
  flexMessageId: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Phone mockup preview ──────────────────────────────────────────────────

interface PhonePreviewProps {
  messages: MessageEntry[];
  flexMessages: FlexMessage[];
}

function PhonePreview({ messages, flexMessages }: PhonePreviewProps) {
  return (
    <div className="sticky top-4">
      <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Preview</p>
      {/* Phone frame */}
      <div className="mx-auto w-56 rounded-3xl border-4 border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-gray-800 px-4 py-1.5 flex items-center justify-between">
          <span className="text-white text-[10px]">9:41</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-white opacity-80" />
            <div className="w-1 h-1 rounded-full bg-white opacity-80" />
            <div className="w-1 h-1 rounded-full bg-white opacity-80" />
          </div>
        </div>
        {/* Chat header */}
        <div className="bg-white px-3 py-2 flex items-center gap-2 border-b">
          <div className="w-6 h-6 rounded-full bg-[#06C755] flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">OA</span>
          </div>
          <span className="text-xs font-medium text-gray-800">LINE OA</span>
        </div>
        {/* Chat area */}
        <div
          className="flex flex-col gap-2 p-3 overflow-y-auto"
          style={{ backgroundColor: "#C6D0D9", minHeight: "320px", maxHeight: "480px" }}
        >
          {messages.length === 0 && (
            <p className="text-center text-xs text-gray-500 italic pt-4">No messages yet</p>
          )}
          {messages.map((msg) => {
            if (msg.type === "text") {
              return (
                <div key={msg.id} className="flex items-end gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#06C755] flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">OA</span>
                  </div>
                  <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2 text-[11px] shadow-sm max-w-[80%] break-words">
                    {msg.text || <span className="italic text-gray-400">Empty message</span>}
                  </div>
                </div>
              );
            }
            // flex
            const fm = flexMessages.find((f) => f.id === msg.flexMessageId);
            if (!fm) {
              return (
                <div key={msg.id} className="flex items-end gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#06C755] flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">OA</span>
                  </div>
                  <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2 text-[11px] shadow-sm max-w-[80%] italic text-gray-400">
                    Select a Flex Message
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="flex items-end gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#06C755] flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-[7px] font-bold">OA</span>
                </div>
                <div className="flex-1 min-w-0">
                  <FlexCardPreview content={fm.content} height={160} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main wizard ───────────────────────────────────────────────────────────

export function BroadcastWizardPage() {
  const toast = useToast();
  const [step, setStep] = useState(1);

  // Data loaded on mount
  const [workspaceId, setWorkspaceId] = useState("");
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);
  const [pnpTemplates, setPnpTemplates] = useState<PNPTemplate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1 fields
  const [campaignName, setCampaignName] = useState("");
  const [selectedOAIds, setSelectedOAIds] = useState<Set<string>>(new Set());

  // Step 2 fields
  const [targetType, setTargetType] = useState<"all" | "segment" | "manual" | "lon_subscribers" | "phone_contacts">("all");
  const [targetSegmentId, setTargetSegmentId] = useState("");
  const [manualUserIds, setManualUserIds] = useState("");
  // phone_contacts: audience scope (all contacts vs segment)
  const [pncScope, setPncScope] = useState<"all_contacts" | "segment">("all_contacts");

  // Step 3 — PNP template (used when targetType === "phone_contacts")
  const [showPNPTemplatePicker, setShowPNPTemplatePicker] = useState(false);
  const [selectedPNPTemplate, setSelectedPNPTemplate] = useState<PNPTemplate | null>(null);
  const [pnpTemplateVariables, setPnpTemplateVariables] = useState<Record<string, string>>({});

  // Step 3 fields
  const [messages, setMessages] = useState<MessageEntry[]>([
    { id: genId(), type: "text", text: "", flexMessageId: "" },
  ]);

  // Step 4 fields
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation errors per step
  const [validationError, setValidationError] = useState<string | null>(null);

  const pnpPreviewContent = useMemo(() => {
    if (!selectedPNPTemplate) return null;
    try {
      const patched = applyTemplateVariables(
        selectedPNPTemplate.json_body,
        selectedPNPTemplate.editable_schema,
        pnpTemplateVariables
      );
      return JSON.stringify(patched);
    } catch {
      return JSON.stringify(selectedPNPTemplate.json_body);
    }
  }, [selectedPNPTemplate, pnpTemplateVariables]);

  useEffect(() => {
    const load = async () => {
      try {
        const id = getWorkspaceId() ?? "";
        setWorkspaceId(id);

        const [oaRes, segRes, fmRes, pnpRes] = await Promise.all([
          lineOAApi.list({ workspace_id: id }),
          segmentApi.list({ workspace_id: id }),
          flexMessageApi.list({ workspace_id: id }),
          pnpTemplateApi.list({}),
        ]);

        const oas = oaRes.data ?? [];
        setLineOAs(oas);
        setSegments(segRes.data ?? []);
        setFlexMessages(fmRes.data ?? []);
        setPnpTemplates(pnpRes?.data ?? []);

        // Pre-select first OA
        if (oas.length > 0) {
          setSelectedOAIds(new Set([oas[0].id]));
        }
      } catch (err) {
        console.error("Failed to load wizard data", err);
      } finally {
        setLoadingData(false);
      }
    };
    void load();
  }, []);

  // ── Step validation ────────────────────────────────────────────────────

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!campaignName.trim()) return "Campaign name is required.";
      if (selectedOAIds.size === 0) return "Select at least one LINE OA.";
    }
    if (s === 2) {
      if (targetType === "segment" && !targetSegmentId) return "Select a segment.";
      if (targetType === "phone_contacts" && pncScope === "segment" && !targetSegmentId) return "Select a segment.";
    }
    if (s === 3) {
      if (targetType === "phone_contacts") {
        if (!selectedPNPTemplate) return "Select a PNP template for the phone contacts broadcast.";
      } else {
        for (const msg of messages) {
          if (msg.type === "text" && !msg.text.trim()) return "All text messages must have content.";
          if (msg.type === "flex" && !msg.flexMessageId) return "All flex message slots must have a selected template.";
        }
      }
    }
    if (s === 4) {
      if (sendMode === "scheduled" && !scheduledAt) return "Please select a date and time to schedule.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setValidationError(null);
    setStep((s) => s - 1);
  };

  // ── OA toggle ──────────────────────────────────────────────────────────

  const toggleOA = (id: string) => {
    setSelectedOAIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Message handlers ───────────────────────────────────────────────────

  const addMessage = () => {
    if (messages.length >= 5) return;
    setMessages((prev) => [...prev, { id: genId(), type: "text", text: "", flexMessageId: "" }]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMessage = (id: string, patch: Partial<MessageEntry>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  // ── Derived values ─────────────────────────────────────────────────────

  const manualIds = manualUserIds
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedSegment = segments.find((s) => s.id === targetSegmentId);

  const audienceSummary = () => {
    if (targetType === "all") return "All followers";
    if (targetType === "segment") return selectedSegment ? `Segment: ${selectedSegment.name}` : "Segment (not selected)";
    if (targetType === "lon_subscribers") return "All LON subscribers";
    if (targetType === "phone_contacts") {
      if (pncScope === "segment") return selectedSegment ? `Phone contacts — segment: ${selectedSegment.name}` : "Phone contacts — segment (not selected)";
      return "All phone contacts";
    }
    return `${manualIds.length} custom user${manualIds.length !== 1 ? "s" : ""}`;
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    setSubmitError(null);

    // Build message payloads (empty for phone_contacts — PNP template is used instead)
    const messagePayloads: BroadcastMessageInput[] = targetType === "phone_contacts" ? [] : messages.map((m) => {
      if (m.type === "text") {
        return { type: "text", payload: { text: m.text } };
      }
      const fm = flexMessages.find((f) => f.id === m.flexMessageId);
      return {
        type: "flex",
        payload: fm ? (JSON.parse(fm.content) as Record<string, unknown>) : {},
      };
    });

    const oaIdList = Array.from(selectedOAIds);

    try {
      if (oaIdList.length === 1) {
        const res = await broadcastApi.create({
          workspace_id: workspaceId,
          line_oa_id: oaIdList[0],
          name: campaignName.trim(),
          messages: messagePayloads,
          target_type: targetType,
          target_segment_id: targetType === "segment" ? targetSegmentId : (targetType === "phone_contacts" && pncScope === "segment" ? targetSegmentId : undefined),
          target_user_ids: targetType === "manual" ? manualIds : undefined,
          target_template_id: targetType === "phone_contacts" ? (selectedPNPTemplate?.id ?? "") : undefined,
          target_template_variables: targetType === "phone_contacts" ? pnpTemplateVariables : undefined,
          scheduled_at: sendMode === "scheduled" ? scheduledAt : null,
        });
        // The API may return { data: Broadcast } or the Broadcast directly
        const broadcast = res?.data ?? (res as unknown as import("@/types").Broadcast);
        const broadcastId = broadcast?.id;
        if (!broadcastId) {
          throw new Error("Server returned an invalid response (missing broadcast ID).");
        }
        // If "Send Now" was selected, trigger delivery immediately after creation
        if (sendMode === "now") {
          try {
            await broadcastApi.send(broadcastId);
          } catch (sendErr) {
            // Broadcast was created but send failed — navigate to detail page so user can retry
            console.error("Failed to trigger send:", sendErr);
          }
        }
        setSubmitSuccess(true);
        // Toast: next-step suggestion
        if (sendMode === "now") {
          toast.toast({
            variant: "success",
            title: "Broadcast sent!",
            description: "Track opens & clicks in Analytics",
            duration: 6000,
          });
        } else {
          toast.toast({
            variant: "success",
            title: "Campaign scheduled",
            description: "Preview what recipients will see",
            duration: 6000,
          });
        }
        setTimeout(() => { window.location.href = `/broadcasts/${broadcastId}`; }, 800);
      } else {
        const campaignRes = await broadcastApi.createCampaign({
          workspace_id: workspaceId,
          campaign_name: campaignName.trim(),
          line_oa_ids: oaIdList,
          messages: messagePayloads,
          target_type: targetType,
          target_segment_id: targetType === "segment" ? targetSegmentId : (targetType === "phone_contacts" && pncScope === "segment" ? targetSegmentId : undefined),
          target_template_id: targetType === "phone_contacts" ? (selectedPNPTemplate?.id ?? "") : undefined,
          target_template_variables: targetType === "phone_contacts" ? pnpTemplateVariables : undefined,
          scheduled_at: sendMode === "scheduled" ? scheduledAt : null,
        });
        // If "Send Now" was selected, trigger delivery for each created broadcast
        if (sendMode === "now") {
          const createdBroadcasts = campaignRes?.data ?? [];
          await Promise.allSettled(
            createdBroadcasts.map((bc) => broadcastApi.send(bc.id))
          );
        }
        setSubmitSuccess(true);
        // Toast: next-step suggestion
        if (sendMode === "now") {
          toast.toast({
            variant: "success",
            title: "Broadcasts sent!",
            description: "Track opens & clicks in Analytics",
            duration: 6000,
          });
        } else {
          toast.toast({
            variant: "success",
            title: "Campaigns scheduled",
            description: "Preview what recipients will see",
            duration: 6000,
          });
        }
        setTimeout(() => { window.location.href = "/broadcasts"; }, 800);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create broadcast.");
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <AppLayout title="New Broadcast">
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="New Broadcast">
      <div className="max-w-4xl space-y-6">
        {/* Back link */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { window.location.href = "/broadcasts"; }}
        >
          <ArrowLeft size={14} />
          Back to Broadcasts
        </button>

        <h1 className="text-xl font-semibold">New Broadcast</h1>

        <StepIndicator currentStep={step} />

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Campaign name */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Campaign Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., March Promotion, New Product Launch"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              {/* LINE OA selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  LINE OA(s) <span className="text-destructive">*</span>
                </label>
                {lineOAs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No LINE OAs available. Please connect one first.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {lineOAs.map((oa) => {
                      const selected = selectedOAIds.has(oa.id);
                      return (
                        <button
                          key={oa.id}
                          type="button"
                          onClick={() => toggleOA(oa.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          {/* Checkbox indicator */}
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected ? "bg-primary border-primary" : "border-input"
                            }`}
                          >
                            {selected && <Check size={10} className="text-primary-foreground" />}
                          </div>
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-[#06C755]/10 flex items-center justify-center flex-shrink-0">
                            {oa.picture_url ? (
                              <img src={oa.picture_url} alt={oa.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-[#06C755] font-bold text-xs">OA</span>
                            )}
                          </div>
                          {/* Name + basic_id */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{oa.name}</p>
                            {oa.basic_id && (
                              <p className="text-xs text-muted-foreground">{oa.basic_id}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedOAIds.size > 1 && (
                  <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    Selecting multiple OAs creates a separate broadcast per OA, grouped together as a campaign.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Audience ── */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-medium">Target Audience</label>
                <div className="space-y-2">
                  {(
                    [
                      { value: "all", label: "All Followers", description: "Send to everyone following your OA" },
                      { value: "segment", label: "Segment", description: "Target followers matching a saved segment" },
                      { value: "manual", label: "Custom List", description: "Paste specific LINE user IDs" },
                      { value: "lon_subscribers", label: "LINE Notification Subscribers (LON)", description: "Send to users who enrolled via LINE Notification Messaging (LON) — requires LON service to be active on this OA" },
                      { value: "phone_contacts", label: "Phone Contacts (LON by Phone)", description: "Send PNP notifications via phone number to contacts in your workspace — recipients must have LINE linked to their phone number" },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        targetType === option.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetType"
                        value={option.value}
                        checked={targetType === option.value}
                        onChange={() => setTargetType(option.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Segment picker */}
              {targetType === "segment" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Segment</label>
                  {segments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No segments available.</p>
                  ) : (
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={targetSegmentId}
                      onChange={(e) => setTargetSegmentId(e.target.value)}
                    >
                      <option value="">-- Select a segment --</option>
                      {segments.map((seg) => (
                        <option key={seg.id} value={seg.id}>
                          {seg.name} ({seg.customer_count} members)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Manual user IDs */}
              {targetType === "manual" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">LINE User IDs</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                    rows={6}
                    placeholder={"U1234567890abcdef\nUabcdef1234567890\n..."}
                    value={manualUserIds}
                    onChange={(e) => setManualUserIds(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {manualIds.length} user ID{manualIds.length !== 1 ? "s" : ""} entered. One per line.
                  </p>
                </div>
              )}

              {/* Phone contacts scope */}
              {targetType === "phone_contacts" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Audience Scope</label>
                  <div className="space-y-2">
                    {(
                      [
                        { value: "all_contacts", label: "All Phone Contacts", description: "Send to every phone contact in your workspace" },
                        { value: "segment", label: "By Segment", description: "Filter to phone contacts matched to a specific follower segment" },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          pncScope === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pncScope"
                          value={opt.value}
                          checked={pncScope === opt.value}
                          onChange={() => setPncScope(opt.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {pncScope === "segment" && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Select Segment</label>
                      {segments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No segments available.</p>
                      ) : (
                        <select
                          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          value={targetSegmentId}
                          onChange={(e) => setTargetSegmentId(e.target.value)}
                        >
                          <option value="">-- Select a segment --</option>
                          {segments.map((seg) => (
                            <option key={seg.id} value={seg.id}>
                              {seg.name} ({seg.customer_count} members)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Audience preview summary */}
              <div className="bg-muted px-4 py-3 rounded-md text-sm">
                <span className="font-medium">Est. audience: </span>
                {targetType === "all" && <span>All followers per selected OA</span>}
                {targetType === "segment" && selectedSegment && (
                  <span>{selectedSegment.customer_count} followers (segment: {selectedSegment.name})</span>
                )}
                {targetType === "segment" && !selectedSegment && <span>Select a segment above</span>}
                {targetType === "manual" && (
                  <span>{manualIds.length} user{manualIds.length !== 1 ? "s" : ""} per selected OA</span>
                )}
                {targetType === "lon_subscribers" && <span>All active LON subscribers for selected OA</span>}
                {targetType === "phone_contacts" && pncScope === "all_contacts" && <span>All phone contacts in workspace</span>}
                {targetType === "phone_contacts" && pncScope === "segment" && selectedSegment && (
                  <span>Phone contacts matched to segment: {selectedSegment.name}</span>
                )}
                {targetType === "phone_contacts" && pncScope === "segment" && !selectedSegment && <span>Select a segment above</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Compose Message ── */}
        {step === 3 && targetType === "phone_contacts" && (
          <div className="flex gap-6 items-start">
            {/* Left: template picker */}
            <div className="flex-1 min-w-0 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      PNP Message Template <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Select the PNP template to send to phone contacts. Recipients must have LINE linked to their phone number.
                    </p>
                  </div>

                  {/* Selected template display */}
                  {selectedPNPTemplate ? (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <LayoutTemplate size={16} className="text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{selectedPNPTemplate.name}</p>
                          {selectedPNPTemplate.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{selectedPNPTemplate.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPNPTemplatePicker(true)}
                          className="flex-shrink-0 text-xs"
                        >
                          Change
                        </Button>
                      </div>

                      {/* Variable inputs */}
                      {selectedPNPTemplate.editable_schema.length > 0 && (
                        <div className="space-y-3 border-t pt-3">
                          <p className="text-xs font-medium text-muted-foreground">Template Variables</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedPNPTemplate.editable_schema.map((field) => (
                              <div key={field.path} className="space-y-1">
                                <label className="text-xs font-medium">
                                  {field.label}
                                  {field.max_len && <span className="text-muted-foreground ml-1">(max {field.max_len})</span>}
                                </label>
                                <input
                                  type={field.type === "url" ? "url" : "text"}
                                  value={pnpTemplateVariables[field.path] ?? ""}
                                  onChange={(e) =>
                                    setPnpTemplateVariables((prev) => ({ ...prev, [field.path]: e.target.value }))
                                  }
                                  maxLength={field.max_len ?? undefined}
                                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                  placeholder={field.label}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPNPTemplatePicker(true)}
                      className="w-full gap-2 justify-start text-muted-foreground"
                    >
                      <LayoutTemplate size={14} />
                      Pick a PNP template...
                    </Button>
                  )}

                  {/* Template picker panel */}
                  {showPNPTemplatePicker && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
                        <span className="text-sm font-medium">Select Template</span>
                        <button
                          type="button"
                          onClick={() => setShowPNPTemplatePicker(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y">
                        {pnpTemplates.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4 py-6 text-center">
                            No PNP templates available.{" "}
                            <a href="/lon-templates" className="underline text-primary">Create one first.</a>
                          </p>
                        ) : (
                          pnpTemplates.map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => {
                                setSelectedPNPTemplate(tpl);
                                const initialVars: Record<string, string> = {};
                                for (const field of tpl.editable_schema) {
                                  initialVars[field.path] = "";
                                }
                                setPnpTemplateVariables(initialVars);
                                setShowPNPTemplatePicker(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                            >
                              <LayoutTemplate size={14} className="text-blue-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{tpl.name}</p>
                                {tpl.description && (
                                  <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: flex card preview */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Preview</p>
                {pnpPreviewContent ? (
                  <FlexCardPreview content={pnpPreviewContent} height={520} scrollable />
                ) : (
                  <div className="border rounded-xl bg-muted/30 flex items-center justify-center" style={{ height: 320 }}>
                    <p className="text-xs text-muted-foreground text-center px-4">Select a template to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && targetType !== "phone_contacts" && (
          <div className="flex gap-6 items-start">
            {/* Left: compose */}
            <div className="flex-1 min-w-0 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={msg.id} className="border rounded-lg p-4 space-y-3">
                      {/* Message header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Message {idx + 1}</span>
                        {messages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMessage(msg.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Remove message"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Type toggle */}
                      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => updateMessage(msg.id, { type: "text" })}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            msg.type === "text"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMessage(msg.id, { type: "flex" })}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            msg.type === "flex"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Flex Message
                        </button>
                      </div>

                      {/* Text area */}
                      {msg.type === "text" && (
                        <div className="space-y-1">
                          <textarea
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={3}
                            maxLength={5000}
                            placeholder="Type your message here..."
                            value={msg.text}
                            onChange={(e) => updateMessage(msg.id, { text: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {msg.text.length} / 5000
                          </p>
                        </div>
                      )}

                      {/* Flex message picker */}
                      {msg.type === "flex" && (
                        <div className="space-y-3">
                          <FlexMessagePicker
                            value={msg.flexMessageId}
                            onChange={(id) => updateMessage(msg.id, { flexMessageId: id })}
                            flexMessages={flexMessages}
                          />
                          {flexMessages.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No Flex Message templates available.{" "}
                              <a href="/flex-messages" className="underline text-primary">
                                Create one first.
                              </a>
                            </p>
                          )}

                          {/* Show preview when flex message is selected */}
                          {msg.flexMessageId && (() => {
                            const fm = flexMessages.find((f) => f.id === msg.flexMessageId);
                            return fm ? <FlexCardPreview content={fm.content} height={200} /> : null;
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add message button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full"
                    onClick={addMessage}
                    disabled={messages.length >= 5}
                  >
                    <Plus size={14} />
                    {messages.length >= 5 ? "Max 5 messages reached" : "Add Message"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: phone preview */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <PhonePreview messages={messages} flexMessages={flexMessages} />
            </div>
          </div>
        )}

        {/* ── Step 4: Schedule & Confirm ── */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-5">
                {/* Send mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Send Time</label>
                  <div className="space-y-2">
                    {(
                      [
                        { value: "now", label: "Send Now", description: "Broadcast will be sent immediately after creation" },
                        { value: "scheduled", label: "Schedule for Later", description: "Choose a specific date and time" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          sendMode === option.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sendMode"
                          value={option.value}
                          checked={sendMode === option.value}
                          onChange={() => setSendMode(option.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {sendMode === "scheduled" && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Date & Time</label>
                      <input
                        type="datetime-local"
                        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Time is in your browser's local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Schedule at least 10 minutes ahead for reliable delivery.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary box */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="text-sm font-semibold">Broadcast Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign Name</span>
                    <span className="font-medium">{campaignName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target OAs</span>
                    <span className="font-medium">
                      {selectedOAIds.size} OA{selectedOAIds.size !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audience</span>
                    <span className="font-medium">{audienceSummary()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium">
                      {targetType === "phone_contacts"
                        ? selectedPNPTemplate ? `PNP: ${selectedPNPTemplate.name}` : "No template selected"
                        : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Send Time</span>
                    <span className="font-medium">
                      {sendMode === "now"
                        ? "Immediately"
                        : scheduledAt
                        ? new Date(scheduledAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Selected OAs list */}
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Selected LINE OAs:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lineOAs
                      .filter((oa) => selectedOAIds.has(oa.id))
                      .map((oa) => (
                        <Badge key={oa.id} variant="secondary" className="text-xs">
                          {oa.basic_id || oa.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Validation error ── */}
        {validationError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={14} />
            {validationError}
          </div>
        )}

        {/* ── Submit success ── */}
        {submitSuccess && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm">
            <CheckCircle size={14} />
            Broadcast created successfully. Redirecting...
          </div>
        )}

        {/* ── Submit error ── */}
        {submitError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 text-sm">
            <AlertCircle size={14} />
            Failed to create broadcast: {submitError}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => { window.location.href = "/broadcasts"; } : handleBack}
            disabled={submitting}
          >
            <ArrowLeft size={14} className="mr-1.5" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <span className="ml-1.5">→</span>
            </Button>
          ) : (
            <Button type="button" onClick={() => { void handleSubmit(); }} disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  {sendMode === "now" ? "Creating & Sending..." : "Creating..."}
                </>
              ) : (
                sendMode === "now" ? "Create & Send Now" : "Schedule Broadcast"
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
