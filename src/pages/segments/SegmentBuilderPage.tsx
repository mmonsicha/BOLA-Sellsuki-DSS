import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  ChoiceCard,
  DSButton,
  DSCheckbox,
  DSInput,
  DSTextarea,
  Dropdown,
  EmptyState,
  FormField,
  Spinner,
  StatCard,
  Tabs,
  toast,
} from "@uxuissk/design-system";
import { ChoiceCard, FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { segmentApi } from "@/api/segment";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId } from "@/lib/auth";
import type { LineOA, PreviewSegmentListItem, Segment } from "@/types";

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

interface FieldConfig {
  label: string;
  operators: Array<{ value: string; label: string }>;
  valueType: "select_follow_status" | "text" | "date" | "custom_field" | "boolean" | "select_oa" | "pnp_count";
}

const FIELD_CONFIG: Record<FieldType, FieldConfig> = {
  follow_status: { label: "Follow Status", operators: [{ value: "eq", label: "Is" }, { value: "neq", label: "Is Not" }], valueType: "select_follow_status" },
  tag: { label: "Tag", operators: [{ value: "contains", label: "Contains" }, { value: "eq", label: "Equals" }, { value: "neq", label: "Not Equals" }], valueType: "text" },
  follow_date: { label: "Follow Date", operators: [{ value: "gte", label: "After" }, { value: "lte", label: "Before" }, { value: "eq", label: "On Date" }], valueType: "date" },
  custom_field: { label: "Custom Field", operators: [{ value: "eq", label: "Equals" }, { value: "neq", label: "Not Equals" }, { value: "contains", label: "Contains" }], valueType: "custom_field" },
  has_phone: { label: "Has Phone", operators: [{ value: "eq", label: "Is" }], valueType: "boolean" },
  has_email: { label: "Has Email", operators: [{ value: "eq", label: "Is" }], valueType: "boolean" },
  follows_oa: { label: "Follows LINE OA", operators: [{ value: "eq", label: "Is Following" }, { value: "neq", label: "Not Following" }], valueType: "select_oa" },
  pnp_count: { label: "PNP Sent Count", operators: [{ value: "lte", label: "<=" }, { value: "gte", label: ">=" }, { value: "eq", label: "=" }], valueType: "pnp_count" },
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

function toDropdownValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function PreviewListItemCard({ item }: { item: PreviewSegmentListItem }) {
  const title = item.display_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || item.phone || item.id;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-white p-4">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-700">
        {item.picture_url ? <img src={item.picture_url} alt={title} className="h-full w-full object-cover" /> : <Users size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[var(--text-primary)]">{title}</div>
        <div className="truncate text-sm text-[var(--text-secondary)]">{item.email || item.phone || item.id}</div>
      </div>
      {item.follow_status ? (
        <Badge variant={item.follow_status === "following" ? "success" : item.follow_status === "blocked" ? "destructive" : "secondary"} size="sm">
          {item.follow_status}
        </Badge>
      ) : null}
    </div>
  );
}

function ConditionRow({
  condition,
  sourceType,
  lineOAs,
  onChange,
  onRemove,
}: {
  condition: ConditionState;
  sourceType: SourceType;
  lineOAs: LineOA[];
  onChange: (id: string, partial: Partial<ConditionState>) => void;
  onRemove: (id: string) => void;
}) {
  const config = FIELD_CONFIG[condition.field];
  const fieldOptions = (sourceType === "contact" ? CONTACT_FIELD_OPTIONS : FOLLOWER_FIELD_OPTIONS).map((option) => ({ value: option.value, label: option.label }));
  const operatorOptions = config.operators.map((option) => ({ value: option.value, label: option.label }));
  const oaOptions = lineOAs.map((oa) => ({ value: oa.id, label: oa.name }));

  const valueNode = (() => {
    if (config.valueType === "select_follow_status") {
      return <Dropdown options={FOLLOW_STATUS_OPTIONS.map((status) => ({ value: status, label: status }))} value={condition.value} onChange={(value) => onChange(condition.id, { value: toDropdownValue(value) })} />;
    }
    if (config.valueType === "date") {
      return <DSInput type="date" value={condition.value} onChange={(event) => onChange(condition.id, { value: event.target.value })} fullWidth />;
    }
    if (config.valueType === "boolean") {
      return <Dropdown options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} value={condition.value} onChange={(value) => onChange(condition.id, { value: toDropdownValue(value) })} />;
    }
    if (config.valueType === "select_oa") {
      return <Dropdown options={oaOptions} value={condition.value} onChange={(value) => onChange(condition.id, { value: toDropdownValue(value) })} searchable placeholder="Select LINE OA" />;
    }
    if (config.valueType === "custom_field") {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <DSInput placeholder="Field key" value={condition.key ?? ""} onChange={(event) => onChange(condition.id, { key: event.target.value })} fullWidth />
          <DSInput placeholder="Field value" value={condition.value} onChange={(event) => onChange(condition.id, { value: event.target.value })} fullWidth />
        </div>
      );
    }
    if (config.valueType === "pnp_count") {
      return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
          <Dropdown options={[{ value: "", label: "All OAs" }, ...oaOptions]} value={condition.key ?? ""} onChange={(value) => onChange(condition.id, { key: toDropdownValue(value) || undefined })} searchable />
          <DSInput type="number" min="0" value={condition.value} onChange={(event) => onChange(condition.id, { value: event.target.value })} fullWidth />
        </div>
      );
    }
    return <DSInput placeholder="Value" value={condition.value} onChange={(event) => onChange(condition.id, { value: event.target.value })} fullWidth />;
  })();

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[220px_180px_minmax(0,1fr)_auto] md:items-start">
        <Dropdown
          options={fieldOptions}
          value={condition.field}
          onChange={(value) => {
            const field = toDropdownValue(value) as FieldType;
            onChange(condition.id, { field, operator: defaultOperatorForField(field), value: defaultValueForField(field), key: undefined });
          }}
        />
        <Dropdown options={operatorOptions} value={condition.operator} onChange={(value) => onChange(condition.id, { operator: toDropdownValue(value) })} />
        <div>{valueNode}</div>
        <DSButton variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={() => onRemove(condition.id)}>
          Remove
        </DSButton>
      </div>
    </div>
  );
}

interface SegmentBuilderPageProps {
  mode: "create" | "edit";
  segmentId?: string;
}

export function SegmentBuilderPage({ mode, segmentId }: SegmentBuilderPageProps) {
  const [workspaceId, setWorkspaceId] = useState("");
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("follower");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);
  const [matchOperator, setMatchOperator] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<ConditionState[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewSegmentListItem[]>([]);
  const [previewListPage, setPreviewListPage] = useState(1);
  const [previewListTotal, setPreviewListTotal] = useState(0);
  const [previewListLoading, setPreviewListLoading] = useState(false);
  const [previewListHasMore, setPreviewListHasMore] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewListSentinelRef = useRef<HTMLDivElement>(null);

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
          if (segSource === "follower") setSelectedLineOAId(seg.line_oa_id ?? (oas[0]?.id ?? ""));
          setConditions((seg.rule?.conditions ?? []).map((condition) => ({ id: generateId(), field: condition.field as FieldType, operator: condition.operator, value: condition.value, key: condition.key })));
        } else if (oas.length > 0) {
          setSelectedLineOAId(oas[0].id);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to load segment builder");
      } finally {
        setLoadingPage(false);
      }
    };
    void load();
  }, [mode, segmentId]);

  const fetchPreview = useCallback(() => {
    const isContactMode = sourceType === "contact";
    if (!workspaceId || conditions.length === 0 || (!isContactMode && !selectedLineOAId)) {
      setPreviewCount(null);
      return;
    }
    setPreviewLoading(true);
    segmentApi.previewCount({
      workspace_id: workspaceId,
      line_oa_id: isContactMode ? "" : selectedLineOAId,
      source_type: sourceType,
      rule: { operator: matchOperator, conditions: conditions.map((condition) => ({ field: condition.field, operator: condition.operator, value: condition.value, ...(condition.key ? { key: condition.key } : {}) })) },
    }).then((res) => setPreviewCount(res.count)).catch(() => setPreviewCount(null)).finally(() => setPreviewLoading(false));
  }, [conditions, matchOperator, selectedLineOAId, sourceType, workspaceId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPreview, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchPreview]);

  useEffect(() => {
    setPreviewItems([]);
    setPreviewListPage(1);
    setPreviewListTotal(0);
    setPreviewListHasMore(true);
  }, [conditions, matchOperator, selectedLineOAId, sourceType]);

  const fetchPreviewList = useCallback((page: number) => {
    const isContactMode = sourceType === "contact";
    if (!workspaceId || conditions.length === 0 || (!isContactMode && !selectedLineOAId)) return;
    setPreviewListLoading(true);
    segmentApi.previewList({
      workspace_id: workspaceId,
      line_oa_id: isContactMode ? "" : selectedLineOAId,
      source_type: sourceType,
      rule: { operator: matchOperator, conditions: conditions.map((condition) => ({ field: condition.field, operator: condition.operator, value: condition.value, ...(condition.key ? { key: condition.key } : {}) })) },
      page,
      page_size: 20,
    }).then((res) => {
      setPreviewItems((prev) => page === 1 ? res.data : [...prev, ...res.data]);
      setPreviewListTotal(res.total);
      setPreviewListHasMore(page * 20 < res.total);
    }).catch(() => {
      if (page === 1) setPreviewItems([]);
    }).finally(() => setPreviewListLoading(false));
  }, [conditions, matchOperator, selectedLineOAId, sourceType, workspaceId]);

  useEffect(() => {
    if (showPreviewList && previewItems.length === 0 && conditions.length > 0) fetchPreviewList(1);
  }, [conditions.length, fetchPreviewList, previewItems.length, showPreviewList]);

  useEffect(() => {
    if (!showPreviewList) return;
    const sentinel = previewListSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && previewListHasMore && !previewListLoading) {
        const nextPage = previewListPage + 1;
        setPreviewListPage(nextPage);
        fetchPreviewList(nextPage);
      }
    }, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPreviewList, previewListHasMore, previewListLoading, previewListPage, showPreviewList]);

  const oaOptions = useMemo(() => lineOAs.map((oa) => ({ value: oa.id, label: oa.name })), [lineOAs]);
  const canSave = !!name.trim() && (sourceType === "contact" || !!selectedLineOAId);

  const handleSourceTypeChange = (newSource: SourceType) => {
    setSourceType(newSource);
    setConditions([]);
    setPreviewCount(null);
    if (newSource === "contact") setSelectedLineOAId("");
    else if (lineOAs.length > 0) setSelectedLineOAId(lineOAs[0].id);
  };

  const handleAddCondition = () => {
    const field = defaultFieldForSource(sourceType);
    setConditions((prev) => [...prev, { id: generateId(), field, operator: defaultOperatorForField(field), value: defaultValueForField(field) }]);
  };

  const handleSave = async () => {
    if (!name.trim()) return setSaveError("Name is required.");
    if (sourceType === "follower" && !selectedLineOAId) return setSaveError("Please select a LINE OA.");
    setSaving(true);
    setSaveError(null);
    const rule = { operator: matchOperator, conditions: conditions.map((condition) => ({ field: condition.field, operator: condition.operator, value: condition.value, ...(condition.key ? { key: condition.key } : {}) })) };
    try {
      if (mode === "create") {
        await segmentApi.create({ workspace_id: workspaceId, line_oa_id: sourceType === "contact" ? "" : selectedLineOAId, source_type: sourceType, name: name.trim(), description: description.trim() || undefined, rule, is_dynamic: isDynamic });
        toast.success("Segment ready", "Your new audience has been created.");
      } else if (segmentId) {
        await segmentApi.update(segmentId, { name: name.trim(), description: description.trim() || undefined, rule, is_dynamic: isDynamic });
        toast.success("Segment updated", "Your audience changes were saved.");
      }
      setTimeout(() => { window.location.href = "/segments"; }, 700);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save segment.");
      setSaving(false);
    }
  };

  if (loadingPage) {
    return (
      <AppLayout title={mode === "create" ? "New Segment" : "Edit Segment"}>
        <div className="flex justify-center py-16"><Spinner label="Loading segment builder" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={mode === "create" ? "New Segment" : "Edit Segment"}>
      <FeaturePageScaffold
        layout="detail"
        header={(
          <PageHeader
            title={mode === "create" ? "New Segment" : "Edit Segment"}
            subtitle="Build reusable audiences from follower or contact data with DS-based rules and previews."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Segments", href: "/segments" }, { label: mode === "create" ? "New Segment" : "Edit Segment" }]} />}
            actions={(
              <div className="flex items-center gap-3">
                <DSButton variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => { window.location.href = "/segments"; }}>Back</DSButton>
                <DSButton variant="primary" leftIcon={saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />} loading={saving} disabled={!canSave} onClick={() => { void handleSave(); }}>
                  {mode === "create" ? "Create segment" : "Save changes"}
                </DSButton>
              </div>
            )}
          />
        )}
        banner={saveError ? <Alert variant="danger" title="Unable to save segment">{saveError}</Alert> : undefined}
        main={(
          <div className="space-y-6">
            <Card elevation="none">
              <CardHeader title="Audience source" subtitle="Choose where this segment should read its audience from." />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <ChoiceCard value="follower" title="Follower segment" description="Target LINE followers linked to a specific official account." icon={<Users size={20} />} selected={sourceType === "follower"} showCheck onClick={() => handleSourceTypeChange("follower")} />
                <ChoiceCard value="contact" title="Contact segment" description="Target imported phone contacts and phone-based notification audiences." icon={<Users size={20} />} selected={sourceType === "contact"} showCheck onClick={() => handleSourceTypeChange("contact")} />
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Segment setup" subtitle="Name the segment and define which records should match." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="segment-name" label="Segment name" required>
                    <DSInput id="segment-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="High-intent followers" fullWidth />
                  </FormField>
                  {sourceType === "follower" && (
                    <FormField name="segment-line-oa" label="LINE OA" required helperText="Follower segments must belong to one official account.">
                      <Dropdown options={oaOptions} value={selectedLineOAId} onChange={(value) => setSelectedLineOAId(toDropdownValue(value))} placeholder="Select LINE OA" searchable />
                    </FormField>
                  )}
                </div>
                <FormField name="segment-description" label="Description">
                  <DSTextarea id="segment-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
                </FormField>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Match logic</div>
                    <Tabs tabs={[{ id: "AND", label: "Match all rules" }, { id: "OR", label: "Match any rule" }]} variant="pills" activeTab={matchOperator} onChange={(id) => setMatchOperator(id as "AND" | "OR")} />
                  </div>
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4">
                    <DSCheckbox checked={isDynamic} onChange={setIsDynamic} label="Dynamic segment" description="Recalculate this audience from the rules instead of treating it as a one-time snapshot." />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Rules" subtitle="Add conditions that qualify contacts or followers into this audience." action={<DSButton variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddCondition}>Add condition</DSButton>} />
              <CardBody>
                {conditions.length === 0 ? (
                  <EmptyState icon={<AlertCircle size={36} />} title="No conditions yet" description="Start with at least one rule to preview and save this segment." action={<DSButton variant="primary" leftIcon={<Plus size={16} />} onClick={handleAddCondition}>Add first condition</DSButton>} />
                ) : (
                  <div className="space-y-4">
                    {conditions.map((condition, index) => (
                      <div key={condition.id} className="space-y-3">
                        {index > 0 && <Badge variant="outline" size="sm">{matchOperator}</Badge>}
                        <ConditionRow condition={condition} sourceType={sourceType} lineOAs={lineOAs} onChange={(id, partial) => setConditions((prev) => prev.map((item) => item.id === id ? { ...item, ...partial } : item))} onRemove={(id) => setConditions((prev) => prev.filter((item) => item.id !== id))} />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader title="Audience preview" subtitle="Quickly validate the size of this segment and inspect sample records that match." action={previewLoading ? <Spinner size="sm" /> : undefined} />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <StatCard title="Matching audience" value={previewCount === null ? "-" : previewCount.toLocaleString()} icon={<Users size={18} />} />
                  <StatCard title="Configured rules" value={conditions.length} icon={<AlertCircle size={18} />} />
                </div>
                <div className="flex items-center gap-3">
                  <DSButton variant="secondary" leftIcon={showPreviewList ? <ChevronUp size={16} /> : <ChevronDown size={16} />} disabled={conditions.length === 0} onClick={() => setShowPreviewList((current) => !current)}>
                    {showPreviewList ? "Hide matching records" : "Show matching records"}
                  </DSButton>
                  {previewListTotal > 0 && <span className="text-sm text-[var(--text-secondary)]">{previewListTotal.toLocaleString()} records available</span>}
                </div>
                {showPreviewList && (
                  <div className="space-y-3">
                    {previewItems.length === 0 && !previewListLoading ? <EmptyState title="No matching records" description="Try broadening the rules or switching the source type." /> : previewItems.map((item) => <PreviewListItemCard key={item.id} item={item} />)}
                    {previewListLoading && <div className="flex justify-center py-6"><Spinner label="Loading matching records" /></div>}
                    <div ref={previewListSentinelRef} className="h-2" />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
        aside={(
          <div className="space-y-4">
            <StatCard title="Source" value={sourceType === "follower" ? "Followers" : "Contacts"} icon={<Users size={18} />} />
            <StatCard title="Rules" value={conditions.length} icon={<AlertCircle size={18} />} />
            <Card elevation="none">
              <CardHeader title="Save checklist" />
              <CardBody className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">1. Add a segment name</div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">2. Choose at least one matching rule</div>
                <div className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3">3. Review the preview count before saving</div>
              </CardBody>
            </Card>
          </div>
        )}
      />
    </AppLayout>
  );
}
