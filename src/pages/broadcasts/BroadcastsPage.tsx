import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  DSButton,
  EmptyState,
  Tabs,
} from "@uxuissk/design-system";
import { FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  Radio,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { broadcastApi } from "@/api/broadcast";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { getWorkspaceId } from "@/lib/auth";
import type { Broadcast, BroadcastStatus, LineOA } from "@/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

const statusConfig: Record<
  BroadcastStatus,
  {
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
    icon: React.ElementType;
    label: string;
    pulse?: boolean;
  }
> = {
  draft: { variant: "secondary", icon: Clock, label: "Draft" },
  scheduled: { variant: "default", icon: Clock, label: "Scheduled" },
  sending: { variant: "warning", icon: Send, label: "Sending", pulse: true },
  sent: { variant: "success", icon: CheckCircle, label: "Sent" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
  cancelled: { variant: "outline", icon: Ban, label: "Cancelled" },
};

interface BroadcastRowProps {
  broadcast: Broadcast;
}

function BroadcastRow({ broadcast }: BroadcastRowProps) {
  const cfg = statusConfig[broadcast.status];
  const StatusIcon = cfg.icon;

  return (
    <Card
      hover
      elevation="none"
      className="cursor-pointer"
      onClick={() => { window.location.href = `/broadcasts/${broadcast.id}`; }}
    >
      <CardBody>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#06C755]/10 text-[#06C755]">
            <Radio size={18} />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="truncate font-semibold text-[var(--foreground)]">{broadcast.name}</span>
              <Badge
                variant={cfg.variant}
                size="sm"
                className={cfg.pulse ? "animate-pulse" : ""}
              >
                <StatusIcon size={12} />
                <span className="ml-1">{cfg.label}</span>
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
              <span>
                Target:{" "}
                {broadcast.target_type === "all" && "All followers"}
                {broadcast.target_type === "segment" && "Segment"}
                {broadcast.target_type === "manual" && "Custom list"}
              </span>
              {broadcast.scheduled_at && (
                <span>Scheduled: {new Date(broadcast.scheduled_at).toLocaleString()}</span>
              )}
              <span>Created: {new Date(broadcast.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {(broadcast.status === "sent" || broadcast.status === "sending") && (
            <div className="space-y-1 text-right text-xs text-[var(--muted-foreground)]">
              <div>{broadcast.total_recipients ?? 0} total</div>
              {broadcast.success_count > 0 && <div className="text-emerald-600">{broadcast.success_count} delivered</div>}
              {broadcast.fail_count > 0 && <div className="text-[var(--destructive)]">{broadcast.fail_count} failed</div>}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

interface CampaignGroupProps {
  campaignId: string;
  broadcasts: Broadcast[];
}

function CampaignGroup({ campaignId, broadcasts }: CampaignGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const shortId = campaignId.slice(-8);
  const campaignLabel = broadcasts[0]?.name ? broadcasts[0].name : `Campaign #${shortId}`;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-1 text-left text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>Campaign</span>
        <span className="font-semibold text-[var(--foreground)]">{campaignLabel}</span>
        <Badge variant="outline" size="sm" className="font-mono">#{shortId}</Badge>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {broadcasts.length} broadcast{broadcasts.length !== 1 ? "s" : ""}
        </span>
      </button>

      {expanded && (
        <div className="ml-4 space-y-3 border-l border-[var(--border)] pl-4">
          {broadcasts.map((item) => (
            <BroadcastRow key={item.id} broadcast={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export function BroadcastsPage() {
  const { isEditorOrAbove } = useCurrentAdmin();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const id = getWorkspaceId() ?? "";
        setWorkspaceId(id);

        const oaRes = await lineOAApi.list({ workspace_id: id });
        setLineOAs(oaRes.data ?? []);
      } catch (err) {
        console.error("Failed to load LINE OAs", err);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);

    broadcastApi
      .list({
        workspace_id: workspaceId,
        line_oa_id: selectedLineOAId || undefined,
      })
      .then((res) => {
        setBroadcasts(res.data ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load broadcasts");
        setBroadcasts([]);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, selectedLineOAId]);

  const filteredBroadcasts = useMemo(
    () => statusFilter === "all" ? broadcasts : broadcasts.filter((item) => item.status === statusFilter),
    [broadcasts, statusFilter],
  );

  const grouped = useMemo(() => {
    const campaignMap = new Map<string, Broadcast[]>();
    const standalone: Broadcast[] = [];

    for (const item of filteredBroadcasts) {
      if (item.campaign_id) {
        const list = campaignMap.get(item.campaign_id) ?? [];
        list.push(item);
        campaignMap.set(item.campaign_id, list);
      } else {
        standalone.push(item);
      }
    }

    return { campaignMap, standalone };
  }, [filteredBroadcasts]);

  return (
    <AppLayout title="Broadcasts">
      <FeaturePageScaffold
        layout="list"
        header={(
          <PageHeader
            title="Broadcasts"
            subtitle="Send messages to all followers or specific segments with a DS-first campaign list."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Broadcasts" }]} />}
            actions={isEditorOrAbove ? (
              <DSButton variant="primary" onClick={() => { window.location.href = "/broadcasts/new"; }}>
                <Plus size={16} />
                <span className="ml-2">New Broadcast</span>
              </DSButton>
            ) : undefined}
          />
        )}
        filters={(
          <div className="space-y-4">
            <LineOAFilter
              lineOAs={lineOAs}
              selectedId={selectedLineOAId}
              onChange={setSelectedLineOAId}
              showAll={true}
            />

            <Tabs
              tabs={STATUS_TABS.map((tab) => ({
                id: tab.value,
                label: tab.label,
                badge: String(tab.value === "all" ? broadcasts.length : broadcasts.filter((b) => b.status === tab.value).length),
              }))}
              activeTab={statusFilter}
              onChange={setStatusFilter}
              variant="underline"
              size="md"
            />
          </div>
        )}
        table={(
          <div className="space-y-4">
            {error && (
              <Alert variant="error" title="Error loading broadcasts">
                {error}
              </Alert>
            )}

            {loading && (
              <Card elevation="none">
                <CardBody>
                  <div className="flex items-center justify-center gap-3 py-16 text-[var(--muted-foreground)]">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Loading broadcasts...</span>
                  </div>
                </CardBody>
              </Card>
            )}

            {!loading && !error && broadcasts.length === 0 && (
              <EmptyState
                icon={<Radio size={48} />}
                title="No broadcasts yet"
                description="Create your first broadcast to start sending messages to your customers."
                action={isEditorOrAbove ? (
                  <DSButton variant="primary" onClick={() => { window.location.href = "/broadcasts/new"; }}>
                    Create Broadcast
                  </DSButton>
                ) : undefined}
              />
            )}

            {!loading && !error && broadcasts.length > 0 && filteredBroadcasts.length === 0 && (
              <EmptyState
                icon={<Clock size={48} />}
                title={`No ${STATUS_TABS.find((tab) => tab.value === statusFilter)?.label?.toLowerCase() ?? "matching"} broadcasts`}
                description="Try another status or clear the current filter to view more broadcasts."
                action={
                  <DSButton variant="secondary" onClick={() => setStatusFilter("all")}>
                    Clear filter
                  </DSButton>
                }
              />
            )}

            {!loading && !error && filteredBroadcasts.length > 0 && (
              <div className="space-y-5">
                {Array.from(grouped.campaignMap.entries()).map(([campaignId, items]) => (
                  <CampaignGroup key={campaignId} campaignId={campaignId} broadcasts={items} />
                ))}

                {grouped.standalone.length > 0 && (
                  <section className="space-y-3">
                    {grouped.campaignMap.size > 0 && (
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                        Other Broadcasts
                      </div>
                    )}
                    {grouped.standalone.map((item) => (
                      <BroadcastRow key={item.id} broadcast={item} />
                    ))}
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      />
    </AppLayout>
  );
}
