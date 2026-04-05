import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import { segmentApi } from "@/api/segment";
import { lineOAApi } from "@/api/lineOA";
import { useToast } from "@/components/ui/toast";
import { getWorkspaceId } from "@/lib/auth";
import type { LineOA, Segment, PreviewSegmentListItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────

type SourceType = "follower" | "contact";

type FollowerFieldType = "follow_status" | "tag" | "follow_date" | "custom_field" | "has_phone" | "has_email";
type ContactFieldType = "follows_oa" | "pnp_count";
type FieldType = FollowerFieldType | ContactFieldType;

interface ConditionState {
  id: string;
  field: FieldType;
  key?: string;
  operator: string;
  value: string;
}

// ─── Field config ─────────────────────────────────────────────────────────

interface FieldConfig {
  label: string;
  operators: Array<{ value: string; label: string }>;
  valueType: "select_follow_status" | "text" | "date" | "custom_field" | "boolean" | "select_oa" | "pnp_count";
}

const FIELD_CONFIG: Record<FieldType, FieldConfig> = {
  // ── Follower fields (existing) ──
  follow_status: {
    label: "Follow Status",
    operators: [
      { value: "eq", label: "Is" },
      { value: "neq", label: "Is Not" },
    ],
    valueType: "select_follow_status",
  },
  tag: {
    label: "Tag",
    operators: [
      { value: "contains", label: "Contains" },
      { value: "eq", label: "Equals" },
      { value: "neq", label: "Not Equals" },
    ],
    valueType: "text",
  },
  follow_date: {
    label: "Follow Date",
    operators: [
      { value: "gte", label: "After" },
      { value: "lte", label: "Before" },
      { value: "eq", label: "On Date" },
    ],
    valueType: "date",
  },
  custom_field: {
    label: "Custom Field",
    operators: [
      { value: "eq", label: "Equals" },
      { value: "neq", label: "Not Equals" },
      { value: "contains", label: "Contains" },
    ],
    valueType: "custom_field",
  },
  // ── Follower fields (new) ──
  has_phone: {
    label: "Has Phone",
    operators: [{ value: "eq", label: "Is" }],
    valueType: "boolean",
  },
  has_email: {
    label: "Has Email",
    operators: [{ value: "eq", label: "Is" }],
    valueType: "boolean",
  },
  // ── Contact fields (new) ──
  follows_oa: {
    label: "Follows LINE OA",
    operators: [
      { value: "eq", label: "Is Following" },
      { value: "neq", label: "Not Following" },
    ],
    valueType: "select_oa",
  },
  pnp_count: {
    label: "PNP Sent Count",
    operators: [
      { value: "lte", label: "≤" },
      { value: "gte", label: "≥" },
      { value: "eq", label: "=" },
    ],
    valueType: "pnp_count",
  },
};

const FOLLOWER_FIELD_OPTIONS: Array<{ value: FollowerFieldType; label: string }> = [
  { value: "follow_status", label: "Follow Status" },
  { value: "tag", label: "Tag" },
  { value: "follow_date", label: "Follow Date" },
  { value: "custom_field", label: "Custom Field" },
  { value: "has_phone", label: "Has Phone" },
  { value: "has_email", label: "Has Email" },
];

const CONTACT_FIELD_OPTIONS: Array<{ value: ContactFieldType; label: string }> = [
  { value: "follows_oa", label: "Follows LINE OA" },
  { value: "pnp_count", label: "PNP Sent Count" },
];

const FOLLOW_STATUS_OPTIONS = ["following", "unfollowed", "blocked"];

function defaultFieldForSource(sourceType: SourceType): FieldType {
  return sourceType === "contact" ? "follows_oa" : "follow_status";
}

function defaultOperatorForField(field: FieldType): string {
  return FIELD_CONFIG[field].operators[0].value;
}

function defaultValueForField(field: FieldType): string {
  if (field === "follow_status") return "following";
  if (field === "has_phone" || field === "has_email") return "true";
  return "";
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Value Input ───────────────────────────────────────────────────────────

interface ValueInputProps {
  condition: ConditionState;
  lineOAs: LineOA[];
  onChange: (partial: Partial<ConditionState>) => void;
}

function ValueInput({ condition, lineOAs, onChange }: ValueInputProps) {
  const config = FIELD_CONFIG[condition.field];

  if (config.valueType === "select_follow_status") {
    return (
      <select
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
        value={condition.value}
        onChange={(e) => onChange({ value: e.target.value })}
      >
        {FOLLOW_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    );
  }

  if (config.valueType === "date") {
    return (
      <input
        type="date"
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
        value={condition.value}
        onChange={(e) => onChange({ value: e.target.value })}
      />
    );
  }

  if (config.valueType === "custom_field") {
    return (
      <>
        <input
          type="text"
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
          placeholder="Key"
          value={condition.key ?? ""}
          onChange={(e) => onChange({ key: e.target.value })}
        />
        <input
          type="text"
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
          placeholder="Value"
          value={condition.value}
          onChange={(e) => onChange({ value: e.target.value })}
        />
      </>
    );
  }

  if (config.valueType === "boolean") {
    return (
      <select
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
        value={condition.value}
        onChange={(e) => onChange({ value: e.target.value })}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (config.valueType === "select_oa") {
    return (
      <select
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
        value={condition.value}
        onChange={(e) => onChange({ value: e.target.value })}
      >
        <option value="">Select LINE OA...</option>
        {lineOAs.map((oa) => (
          <option key={oa.id} value={oa.id}>
            {oa.name}
          </option>
        ))}
      </select>
    );
  }

  if (config.valueType === "pnp_count") {
    return (
      <>
        {/* Optional OA scope (key) */}
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
          value={condition.key ?? ""}
          onChange={(e) => onChange({ key: e.target.value || undefined })}
        >
          <option value="">All OAs</option>
          {lineOAs.map((oa) => (
            <option key={oa.id} value={oa.id}>
              {oa.name}
            </option>
          ))}
        </select>
        {/* Count threshold */}
        <input
          type="number"
          min="0"
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-24"
          placeholder="Count"
          value={condition.value}
          onChange={(e) => onChange({ value: e.target.value })}
        />
      </>
    );
  }

  // text
  return (
    <input
      type="text"
      className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
      placeholder="Value"
      value={condition.value}
      onChange={(e) => onChange({ value: e.target.value })}
    />
  );
}

// ─── Condition Row ─────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: ConditionState;
  sourceType: SourceType;
  lineOAs: LineOA[];
  onChange: (id: string, partial: Partial<ConditionState>) => void;
  onRemove: (id: string) => void;
}

function ConditionRow({ condition, sourceType, lineOAs, onChange, onRemove }: ConditionRowProps) {
  const config = FIELD_CONFIG[condition.field];
  const fieldOptions = sourceType === "contact" ? CONTACT_FIELD_OPTIONS : FOLLOWER_FIELD_OPTIONS;

  const handleFieldChange = (field: FieldType) => {
    onChange(condition.id, {
      field,
      operator: defaultOperatorForField(field),
      value: defaultValueForField(field),
      key: undefined,
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field selector */}
      <select
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as FieldType)}
      >
        {fieldOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={condition.operator}
        onChange={(e) => onChange(condition.id, { operator: e.target.value })}
      >
        {config.operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value input(s) */}
      <ValueInput
        condition={condition}
        lineOAs={lineOAs}
        onChange={(partial) => onChange(condition.id, partial)}
      />

      {/* Remove button */}
      <button
        type="button"
        className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
        onClick={() => onRemove(condition.id)}
        title="Remove condition"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

interface SegmentBuilderPageProps {
  mode: "create" | "edit";
  segmentId?: string;
}

export function SegmentBuilderPage({ mode, segmentId }: SegmentBuilderPageProps) {
  const toast = useToast();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");

  // Form fields
  const [sourceType, setSourceType] = useState<SourceType>("follower");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);
  const [matchOperator, setMatchOperator] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<ConditionState[]>([]);

  // UI state
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preview state
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview list state
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewSegmentListItem[]>([]);
  const [previewListPage, setPreviewListPage] = useState(1);
  const [previewListTotal, setPreviewListTotal] = useState(0);
  const [previewListLoading, setPreviewListLoading] = useState(false);
  const [previewListHasMore, setPreviewListHasMore] = useState(true);
  const previewListSentinelRef = useRef<HTMLDivElement>(null);

  // Load workspace + LINE OAs + (if edit mode) existing segment
  useEffect(() => {
    const load = async () => {
      try {
        const id = getWorkspaceId() ?? "";
        setWorkspaceId(id);

        const oaRes = await lineOAApi.list({ workspace_id: id });
        const oas = oaRes.data ?? [];
        setLineOAs(oas);

        if (mode === "edit" && segmentId) {
          const seg = await segmentApi.get(segmentId) as Segment;
          const segSource = (seg.source_type ?? "follower") as SourceType;
          setSourceType(segSource);
          setName(seg.name);
          setDescription(seg.description ?? "");
          setIsDynamic(seg.is_dynamic ?? false);
          setMatchOperator((seg.rule?.operator as "AND" | "OR") ?? "AND");
          if (segSource === "follower") {
            setSelectedLineOAId(seg.line_oa_id ?? (oas[0]?.id ?? ""));
          }
          setConditions(
            (seg.rule?.conditions ?? []).map((c) => ({
              id: generateId(),
              field: c.field as FieldType,
              operator: c.operator,
              value: c.value,
              key: c.key,
            }))
          );
        } else {
          if (oas.length > 0) setSelectedLineOAId(oas[0].id);
        }
      } catch (err) {
        console.error("Failed to load segment builder data", err);
      } finally {
        setLoadingPage(false);
      }
    };
    void load();
  }, [mode, segmentId]);

  // Switch source type — reset conditions to avoid invalid field mix
  const handleSourceTypeChange = (newSource: SourceType) => {
    setSourceType(newSource);
    setConditions([]);
    setPreviewCount(null);
    if (newSource === "contact") {
      setSelectedLineOAId("");
    } else if (lineOAs.length > 0) {
      setSelectedLineOAId(lineOAs[0].id);
    }
  };

  // Debounced preview count
  const fetchPreview = useCallback(() => {
    const isContactMode = sourceType === "contact";
    const hasConditions = conditions.length > 0;
    const hasOA = !!selectedLineOAId;

    // For follower mode, require an OA; for contact mode, just need conditions
    if (!workspaceId || !hasConditions || (!isContactMode && !hasOA)) {
      setPreviewCount(null);
      return;
    }

    setPreviewLoading(true);
    segmentApi
      .previewCount({
        workspace_id: workspaceId,
        line_oa_id: isContactMode ? "" : selectedLineOAId,
        source_type: sourceType,
        rule: {
          operator: matchOperator,
          conditions: conditions.map((c) => ({
            field: c.field,
            operator: c.operator,
            value: c.value,
            ...(c.key ? { key: c.key } : {}),
          })),
        },
      })
      .then((res) => setPreviewCount(res.count))
      .catch(() => setPreviewCount(null))
      .finally(() => setPreviewLoading(false));
  }, [sourceType, selectedLineOAId, workspaceId, conditions, matchOperator]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreview();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchPreview]);

  // Reset preview list when conditions change
  useEffect(() => {
    setPreviewItems([]);
    setPreviewListPage(1);
    setPreviewListTotal(0);
    setPreviewListHasMore(true);
  }, [sourceType, selectedLineOAId, conditions, matchOperator]);

  // Fetch preview list page
  const fetchPreviewList = useCallback(
    (page: number) => {
      const isContactMode = sourceType === "contact";
      const hasConditions = conditions.length > 0;
      const hasOA = !!selectedLineOAId;
      if (!workspaceId || !hasConditions || (!isContactMode && !hasOA)) return;

      setPreviewListLoading(true);
      segmentApi
        .previewList({
          workspace_id: workspaceId,
          line_oa_id: isContactMode ? "" : selectedLineOAId,
          source_type: sourceType,
          rule: {
            operator: matchOperator,
            conditions: conditions.map((c) => ({
              field: c.field,
              operator: c.operator,
              value: c.value,
              ...(c.key ? { key: c.key } : {}),
            })),
          },
          page,
          page_size: 20,
        })
        .then((res) => {
          setPreviewItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
          setPreviewListTotal(res.total);
          setPreviewListHasMore(page * 20 < res.total);
        })
        .catch(() => {
          if (page === 1) setPreviewItems([]);
        })
        .finally(() => setPreviewListLoading(false));
    },
    [sourceType, selectedLineOAId, workspaceId, conditions, matchOperator]
  );

  // Fetch first page when showPreviewList turns on
  useEffect(() => {
    if (showPreviewList && previewItems.length === 0 && conditions.length > 0) {
      fetchPreviewList(1);
    }
  }, [showPreviewList, fetchPreviewList, previewItems.length, conditions.length]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!showPreviewList) return;
    const sentinel = previewListSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && previewListHasMore && !previewListLoading) {
          const nextPage = previewListPage + 1;
          setPreviewListPage(nextPage);
          fetchPreviewList(nextPage);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showPreviewList, previewListHasMore, previewListLoading, previewListPage, fetchPreviewList]);

  // Condition handlers
  const handleAddCondition = () => {
    const field = defaultFieldForSource(sourceType);
    setConditions((prev) => [
      ...prev,
      {
        id: generateId(),
        field,
        operator: defaultOperatorForField(field),
        value: defaultValueForField(field),
      },
    ]);
  };

  const handleChangeCondition = (id: string, partial: Partial<ConditionState>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...partial } : c))
    );
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  // Save
  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    if (sourceType === "follower" && !selectedLineOAId) {
      setSaveError("Please select a LINE OA.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const rule = {
      operator: matchOperator,
      conditions: conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
        ...(c.key ? { key: c.key } : {}),
      })),
    };

    try {
      if (mode === "create") {
        await segmentApi.create({
          workspace_id: workspaceId,
          line_oa_id: sourceType === "contact" ? "" : selectedLineOAId,
          source_type: sourceType,
          name: name.trim(),
          description: description.trim() || undefined,
          rule,
          is_dynamic: isDynamic,
        });
      } else if (mode === "edit" && segmentId) {
        await segmentApi.update(segmentId, {
          name: name.trim(),
          description: description.trim() || undefined,
          rule,
          is_dynamic: isDynamic,
        });
      }
      setSaveSuccess(true);
      if (mode === "create") {
        toast.toast({
          variant: "success",
          title: "Segment ready",
          description: "Launch a campaign to this audience?",
          duration: 6000,
        });
      }
      setTimeout(() => { window.location.href = "/segments"; }, 800);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save segment.");
      setSaving(false);
    }
  };

  const canSave = !!name.trim() && (sourceType === "contact" || !!selectedLineOAId);

  if (loadingPage) {
    return (
      <AppLayout title={mode === "create" ? "New Segment" : "Edit Segment"}>
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </AppLayout>
    );
  }

  const title = mode === "create" ? "Create Segment" : "Edit Segment";

  return (
    <AppLayout title={title}>
      <div className="space-y-6 max-w-3xl">
        {/* Back link */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { window.location.href = "/segments"; }}
        >
          <ArrowLeft size={14} />
          Back to Segments
        </button>

        {/* Page heading */}
        <h1 className="text-xl font-semibold">{title}</h1>

        {/* Source type toggle */}
        {mode === "create" && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Segment Type{" "}
                  <span className="relative group inline-flex items-center">
                    <HelpCircle size={13} className="text-muted-foreground cursor-help" />
                    <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 w-80 rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white font-normal opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 leading-relaxed">
                      <strong>Follower:</strong> filters LINE followers of a specific OA. Use for broadcasts and targeted messaging.{"\n"}
                      <strong>Contact:</strong> filters phone contacts by OA follow status and PNP history. Use for LON campaigns and data enrichment.
                    </span>
                  </span>
                </label>
                <div className="flex rounded-md overflow-hidden border w-fit">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      sourceType === "follower"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => handleSourceTypeChange("follower")}
                    disabled={saving}
                  >
                    Follower
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      sourceType === "contact"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => handleSourceTypeChange("contact")}
                    disabled={saving}
                  >
                    Contact
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sourceType === "follower"
                    ? "Filters LINE followers of the selected OA."
                    : "Filters phone contacts by OA follow status or PNP history (workspace-wide)."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic info card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Active Followers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* LINE OA — only for follower segments */}
              {sourceType === "follower" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">LINE OA</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedLineOAId}
                    onChange={(e) => setSelectedLineOAId(e.target.value)}
                    disabled={saving}
                  >
                    {lineOAs.length === 0 && (
                      <option value="">No LINE OAs available</option>
                    )}
                    {lineOAs.map((oa) => (
                      <option key={oa.id} value={oa.id}>
                        {oa.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic toggle */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  Dynamic
                  <span className="relative group inline-flex items-center">
                    <HelpCircle size={13} className="text-muted-foreground cursor-help" />
                    <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 w-72 rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white font-normal opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 leading-relaxed">
                      <strong>Dynamic:</strong> audience is re-calculated at send time — always uses the freshest data. Use for recurring broadcasts.{"\n"}
                      <strong>Static:</strong> audience is a fixed snapshot taken when the segment is saved. Useful when you need a precise, unchanging list.
                    </span>
                  </span>
                </label>
                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDynamic}
                    onClick={() => setIsDynamic(!isDynamic)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      isDynamic ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isDynamic ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {isDynamic ? (
                      <Badge variant="default" className="text-xs">Dynamic — auto-updates</Badge>
                    ) : (
                      <span>Static snapshot</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Match operator */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Match</span>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    matchOperator === "AND"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMatchOperator("AND")}
                  disabled={saving}
                >
                  AND
                </button>
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    matchOperator === "OR"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMatchOperator("OR")}
                  disabled={saving}
                >
                  OR
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {matchOperator === "AND"
                  ? "All conditions must match"
                  : "Any condition must match"}
              </span>
            </div>

            {/* Condition rows */}
            {conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md border-dashed">
                {sourceType === "contact"
                  ? "No conditions yet. Add a condition to filter contacts."
                  : "No conditions yet. Add a condition to filter followers."}
              </p>
            ) : (
              <div className="space-y-3">
                {conditions.map((cond, idx) => (
                  <div key={cond.id} className="flex items-start gap-2">
                    {conditions.length > 1 && (
                      <span className="text-xs text-muted-foreground w-8 text-right pt-2.5 flex-shrink-0">
                        {idx === 0 ? "Where" : matchOperator}
                      </span>
                    )}
                    {conditions.length === 1 && (
                      <span className="text-xs text-muted-foreground w-8 text-right pt-2.5 flex-shrink-0">
                        Where
                      </span>
                    )}
                    <div className="flex-1">
                      <ConditionRow
                        condition={cond}
                        sourceType={sourceType}
                        lineOAs={lineOAs}
                        onChange={handleChangeCondition}
                        onRemove={handleRemoveCondition}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add condition */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleAddCondition}
              disabled={saving}
            >
              <Plus size={14} />
              Add Condition
            </Button>
          </CardContent>
        </Card>

        {/* Preview card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Preview</span>
                {previewLoading ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <RefreshCw size={13} className="animate-spin" />
                    Calculating...
                  </div>
                ) : previewCount !== null ? (
                  <span className="text-sm text-muted-foreground">
                    Matches{" "}
                    <span className="font-bold text-foreground">{previewCount}</span>{" "}
                    {sourceType === "contact" ? "contact" : "follower"}{previewCount !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {conditions.length === 0
                      ? "Add conditions to preview"
                      : sourceType === "follower" && !selectedLineOAId
                        ? "Select a LINE OA to preview"
                        : "—"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {previewCount !== null && previewCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => {
                      setShowPreviewList((prev) => !prev);
                    }}
                  >
                    <Users size={13} />
                    {showPreviewList ? "Hide list" : "Show list"}
                    {showPreviewList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={fetchPreview}
                  disabled={
                    previewLoading ||
                    conditions.length === 0 ||
                    (sourceType === "follower" && !selectedLineOAId)
                  }
                >
                  <RefreshCw size={13} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Preview list */}
            {showPreviewList && (
              <div className="mt-4 border-t pt-4">
                {previewListLoading && previewItems.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading...
                  </div>
                ) : previewItems.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No matching {sourceType === "contact" ? "contacts" : "followers"} found
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {previewItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        {/* Avatar */}
                        {item.picture_url ? (
                          <img
                            src={item.picture_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Users size={14} className="text-muted-foreground" />
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.display_name || item.phone || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {[item.phone, item.email].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                        {/* Status badge */}
                        {item.follow_status && (
                          <Badge
                            variant={item.follow_status === "following" ? "success" : "secondary"}
                            className="shrink-0 text-xs"
                          >
                            {item.follow_status}
                          </Badge>
                        )}
                      </div>
                    ))}
                    <div ref={previewListSentinelRef} className="h-1" />
                    {previewListLoading && (
                      <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                        <RefreshCw size={13} className="animate-spin" />
                      </div>
                    )}
                    {!previewListHasMore && previewItems.length > 0 && (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        All {previewListTotal} {sourceType === "contact" ? "contacts" : "followers"} loaded
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm">
            <CheckCircle size={14} />
            {mode === "create" ? "Segment created successfully." : "Segment updated successfully."} Redirecting...
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 text-sm">
            <AlertCircle size={14} />
            Failed to save segment: {saveError}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { window.location.href = "/segments"; }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => { void handleSave(); }}
            disabled={saving || !canSave}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Segment"
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
