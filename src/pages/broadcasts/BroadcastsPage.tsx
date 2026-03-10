import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Clock, CheckCircle, XCircle, Ban, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { workspaceApi } from "@/api/workspace";
import { lineOAApi } from "@/api/lineOA";
import { broadcastApi } from "@/api/broadcast";
import type { Broadcast, BroadcastStatus, LineOA } from "@/types";
import { LineOAFilter } from "@/components/common/LineOAFilter";

// ─── Status config ──────────────────────────────────────────────────────────

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

// ─── Broadcast row ──────────────────────────────────────────────────────────

interface BroadcastRowProps {
  broadcast: Broadcast;
}

function BroadcastRow({ broadcast }: BroadcastRowProps) {
  const cfg = statusConfig[broadcast.status];
  const StatusIcon = cfg.icon;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={() => { window.location.href = `/broadcasts/${broadcast.id}`; }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{broadcast.name}</span>
            <Badge
              variant={cfg.variant}
              className={`gap-1 flex-shrink-0 ${cfg.pulse ? "animate-pulse" : ""}`}
            >
              <StatusIcon size={10} />
              {cfg.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <span>
              Target:{" "}
              {broadcast.target_type === "all" && "All followers"}
              {broadcast.target_type === "segment" && "Segment"}
              {broadcast.target_type === "manual" && "Custom list"}
            </span>
            {broadcast.scheduled_at && (
              <span>Scheduled: {new Date(broadcast.scheduled_at).toLocaleString()}</span>
            )}
            <span className="text-muted-foreground/60">
              {new Date(broadcast.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Delivery stats */}
        {(broadcast.status === "sent" || broadcast.status === "sending") && (
          <div className="text-xs text-right flex-shrink-0 space-y-0.5">
            <div className="text-muted-foreground">
              {broadcast.total_recipients ?? 0} total
            </div>
            {broadcast.success_count > 0 && (
              <div className="text-green-600">{broadcast.success_count} delivered</div>
            )}
            {broadcast.fail_count > 0 && (
              <div className="text-destructive">{broadcast.fail_count} failed</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Campaign group ─────────────────────────────────────────────────────────

interface CampaignGroupProps {
  campaignId: string;
  broadcasts: Broadcast[];
}

function CampaignGroup({ campaignId, broadcasts }: CampaignGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const shortId = campaignId.slice(-8);

  return (
    <div className="space-y-2">
      {/* Campaign header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>Campaign</span>
        <Badge variant="outline" className="text-xs font-mono">#{shortId}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {broadcasts.length} broadcast{broadcasts.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Broadcasts in campaign */}
      {expanded && (
        <div className="ml-4 space-y-2 border-l-2 border-border pl-4">
          {broadcasts.map((b) => (
            <BroadcastRow key={b.id} broadcast={b} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");

  // Load workspace + LINE OAs on mount
  useEffect(() => {
    const load = async () => {
      try {
        const wsRes = await workspaceApi.list({ page: 1, page_size: 1 });
        const id = wsRes?.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";
        setWorkspaceId(id);

        const oaRes = await lineOAApi.list({ workspace_id: id });
        const oas = oaRes.data ?? [];
        setLineOAs(oas);
        // Don't pre-select a specific OA so we load all broadcasts
      } catch (err) {
        console.error("Failed to load LINE OAs", err);
      }
    };
    load();
  }, []);

  // Load broadcasts when workspace or filter changes
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

  // Group broadcasts by campaign_id
  const grouped = (() => {
    const campaignMap = new Map<string, Broadcast[]>();
    const standalone: Broadcast[] = [];

    for (const b of broadcasts) {
      if (b.campaign_id) {
        const list = campaignMap.get(b.campaign_id) ?? [];
        list.push(b);
        campaignMap.set(b.campaign_id, list);
      } else {
        standalone.push(b);
      }
    }

    return { campaignMap, standalone };
  })();

  return (
    <AppLayout title="Broadcasts">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Send messages to all followers or specific segments.
          </p>
          <Button
            className="gap-2 self-start sm:self-auto flex-shrink-0"
            onClick={() => { window.location.href = "/broadcasts/new"; }}
          >
            <Plus size={16} />
            New Broadcast
          </Button>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={setSelectedLineOAId}
          showAll={true}
        />

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="text-center py-8">
              <p className="font-medium text-destructive">Error loading broadcasts</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && !error && broadcasts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">📢</div>
              <p className="font-medium">No broadcasts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first broadcast to send messages to your customers.
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => { window.location.href = "/broadcasts/new"; }}
              >
                <Plus size={16} />
                New Broadcast
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Broadcast list */}
        {!loading && !error && broadcasts.length > 0 && (
          <div className="space-y-4">
            {/* Campaign groups */}
            {Array.from(grouped.campaignMap.entries()).map(([campaignId, items]) => (
              <CampaignGroup key={campaignId} campaignId={campaignId} broadcasts={items} />
            ))}

            {/* Standalone broadcasts */}
            {grouped.standalone.length > 0 && (
              <div className="space-y-2">
                {grouped.campaignMap.size > 0 && (
                  <p className="text-xs text-muted-foreground font-medium">Other Broadcasts</p>
                )}
                {grouped.standalone.map((b) => (
                  <BroadcastRow key={b.id} broadcast={b} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
