import { useEffect, useMemo, useState } from "react";
import {
  AdvancedDataTable,
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  ConfirmDialog,
  DSButton,
  EmptyState,
  FeaturePageScaffold,
  PageHeader,
  StatCard,
  toast,
  type AdvancedColumn,
} from "@uxuissk/design-system";
import { AlertTriangle, Plus, Tag, Trash2, Users, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { broadcastApi } from "@/api/broadcast";
import { segmentApi } from "@/api/segment";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { getWorkspaceId } from "@/lib/auth";
import type { Broadcast, Segment } from "@/types";

const WORKSPACE_ID = getWorkspaceId() ?? "";

export function SegmentsPage() {
  const { isEditorOrAbove } = useCurrentAdmin();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [affectedBroadcasts, setAffectedBroadcasts] = useState<Broadcast[]>([]);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    segmentApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setSegments(res.data ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load segments");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteClick = async (segment: Segment) => {
    setCheckingUsage(true);
    setAffectedBroadcasts([]);
    try {
      const res = await broadcastApi.list({ workspace_id: WORKSPACE_ID, page_size: 100 });
      const active = (res.data ?? []).filter(
        (broadcast) => broadcast.target_segment_id === segment.id
          && (broadcast.status === "scheduled" || broadcast.status === "sending" || broadcast.status === "draft"),
      );
      setAffectedBroadcasts(active);
    } catch {
      // Keep dialog generic if lookup fails.
    } finally {
      setCheckingUsage(false);
      setDeleteTarget({ id: segment.id, name: segment.name });
    }
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await segmentApi.delete(deleteTarget.id);
      setSegments((prev) => prev.filter((segment) => segment.id !== deleteTarget.id));
      toast.success(`Segment "${deleteTarget.name}" was deleted.`);
    } catch (err) {
      toast.error("Failed to delete segment", err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
      setAffectedBroadcasts([]);
    }
  };

  const stats = [
    { title: "Total segments", value: segments.length, icon: <Tag size={18} /> },
    { title: "Dynamic segments", value: segments.filter((segment) => segment.is_dynamic).length, icon: <Zap size={18} /> },
    {
      title: "Audience covered",
      value: segments.reduce((sum, segment) => sum + (segment.customer_count ?? 0), 0).toLocaleString(),
      icon: <Users size={18} />,
    },
  ];

  const columns = useMemo<AdvancedColumn<Segment>[]>(() => [
    {
      key: "name",
      header: "Segment",
      sortable: true,
      render: (_value, segment) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{segment.name}</span>
            {segment.is_dynamic && (
              <Badge variant="default" size="sm">
                Dynamic
              </Badge>
            )}
          </div>
          {segment.description && (
            <div className="text-sm text-[var(--text-secondary)]">{segment.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "customer_count",
      header: "Followers",
      align: "right",
      render: (value: number | null | undefined) => (value ?? 0).toLocaleString(),
    },
    {
      key: "rule",
      header: "Conditions",
      render: (_value, segment) => `${segment.rule?.conditions?.length ?? 0} rule${(segment.rule?.conditions?.length ?? 0) === 1 ? "" : "s"}`,
    },
    {
      key: "created_at",
      header: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (_value, segment) => (
        <DSButton
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          loading={checkingUsage && deleteTarget?.id === segment.id}
          onClick={(event) => {
            event.stopPropagation();
            void handleDeleteClick(segment);
          }}
        >
          Delete
        </DSButton>
      ),
    },
  ], [checkingUsage, deleteTarget?.id]);

  const warningDescription = affectedBroadcasts.length > 0
    ? `This segment is still used by ${affectedBroadcasts.length} scheduled, sending, or draft broadcast(s): ${affectedBroadcasts.slice(0, 3).map((broadcast) => broadcast.name || broadcast.campaign_name || broadcast.id).join(", ")}${affectedBroadcasts.length > 3 ? "..." : ""}`
    : "Deleting this segment may affect any draft or scheduled broadcast that expects this audience.";

  const tableNode = segments.length === 0 && !loading && !error ? (
    <Card elevation="none">
      <CardBody>
        <EmptyState
          icon={<Tag size={44} />}
          title="No segments yet"
          description="Create your first dynamic or manual segment to target followers more precisely."
          action={(
            isEditorOrAbove ? (
              <DSButton variant="primary" leftIcon={<Plus size={16} />} onClick={() => { window.location.href = "/segments/new"; }}>
                New Segment
              </DSButton>
            ) : undefined
          )}
        />
      </CardBody>
    </Card>
  ) : (
    <AdvancedDataTable
      rowKey="id"
      columns={columns}
      data={segments}
      loading={loading}
      error={error ?? undefined}
      emptyMessage="No segments found"
      emptyDescription="Try refreshing or adjusting your backend data."
      onRowClick={(row) => { window.location.href = `/segments/${row.id}/edit`; }}
    />
  );

  return (
    <AppLayout title="Segments">
      <FeaturePageScaffold
        layout="list"
        header={(
          <PageHeader
            title="Segments"
            subtitle="Build reusable audiences and keep campaign targeting under control with DS-first list management."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Segments" }]} />}
            actions={(
              isEditorOrAbove ? (
                <DSButton variant="primary" leftIcon={<Plus size={16} />} onClick={() => { window.location.href = "/segments/new"; }}>
                  New Segment
                </DSButton>
              ) : undefined
            )}
          />
        )}
        stats={(
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.title} title={stat.title} value={loading ? "..." : stat.value} icon={stat.icon} />
            ))}
          </div>
        )}
        table={(
          <div className="space-y-4">
            {affectedBroadcasts.length > 0 && deleteTarget && (
              <Alert variant="warning" title="This segment is currently in use" icon={<AlertTriangle size={16} />}>
                {warningDescription}
              </Alert>
            )}
            {tableNode}
          </div>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setAffectedBroadcasts([]);
        }}
        onConfirm={() => { void handleConfirmedDelete(); }}
        title={`Delete "${deleteTarget?.name ?? "segment"}"?`}
        description={warningDescription}
        confirmLabel={deletingId ? "Deleting..." : "Delete segment"}
        cancelLabel="Cancel"
        variant="destructive"
      />
    </AppLayout>
  );
}
