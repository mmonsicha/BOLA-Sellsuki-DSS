import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, MousePointerClick, Eye, Users, TrendingUp, RefreshCw } from "lucide-react";
import { analyticsApi } from "@/api/analytics";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId } from "@/lib/auth";
import type { AnalyticsSummary, AnalyticsEvent, TopElementStats, LineOA } from "@/types";

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

function StatCard({
  icon: Icon,
  title,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold mt-0.5">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function TopElementsTable({ elements }: { elements: TopElementStats[] }) {
  if (!elements || elements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        No element data for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2 font-medium">Element</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium text-right">Impressions</th>
            <th className="pb-2 font-medium text-right">Clicks</th>
            <th className="pb-2 font-medium text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((el) => (
            <tr key={el.element_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-2 font-medium truncate max-w-[200px]">
                {el.element_label || el.element_id}
              </td>
              <td className="py-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {el.element_type.replace("_", " ")}
                </Badge>
              </td>
              <td className="py-2 text-right">{el.impressions.toLocaleString()}</td>
              <td className="py-2 text-right">{el.clicks.toLocaleString()}</td>
              <td className="py-2 text-right font-medium">{el.ctr.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentEventsTable({ events }: { events: AnalyticsEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        No events recorded for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 font-medium">Event</th>
            <th className="pb-2 font-medium">Element</th>
            <th className="pb-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(ev.occurred_at).toLocaleString()}
              </td>
              <td className="py-2">
                <Badge variant="secondary" className="text-xs">
                  {ev.event_type.replace("_", " ")}
                </Badge>
              </td>
              <td className="py-2 truncate max-w-[160px]">
                {ev.element_label || ev.element_id || "—"}
              </td>
              <td className="py-2 text-muted-foreground text-xs">
                {ev.element_type || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsDashboardPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState<string>("");
  const [period, setPeriod] = useState<string>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(false);
  const workspaceId = getWorkspaceId() ?? "";

  useEffect(() => {
    if (!workspaceId) return;
    lineOAApi.list({ workspace_id: workspaceId }).then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oas = (res as any).data || res;
      setLineOAs(Array.isArray(oas) ? oas : []);
    }).catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([
      analyticsApi.getSummary({ workspace_id: workspaceId, line_oa_id: selectedOA || undefined, period }),
      analyticsApi.listEvents({ workspace_id: workspaceId, line_oa_id: selectedOA || undefined, page: 1, page_size: 20 }),
    ])
      .then(([sum, evResp]) => {
        setSummary(sum);
        setEvents(evResp.data || []);
        setTotalEvents(evResp.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId, selectedOA, period]);

  const ctrDisplay = summary ? `${summary.ctr.toFixed(1)}%` : "—";

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-line p-2">
              <BarChart2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Track clicks, impressions, and follower engagement</p>
            </div>
          </div>
          {loading && <RefreshCw size={16} className="animate-spin text-muted-foreground" />}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="text-sm border rounded-md px-3 py-1.5 bg-background"
            value={selectedOA}
            onChange={(e) => setSelectedOA(e.target.value)}
          >
            <option value="">All LINE OAs</option>
            {lineOAs.map((oa) => (
              <option key={oa.id} value={oa.id}>{oa.name}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  period === p.value
                    ? "bg-line text-white border-line"
                    : "bg-background hover:bg-muted border-border"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            title="Total Impressions"
            value={summary?.total_impressions.toLocaleString() ?? "—"}
            color="bg-blue-500"
          />
          <StatCard
            icon={MousePointerClick}
            title="Total Clicks"
            value={summary?.total_clicks.toLocaleString() ?? "—"}
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            title="CTR"
            value={ctrDisplay}
            sub="click-through rate"
            color="bg-purple-500"
          />
          <StatCard
            icon={Users}
            title="Unique Users"
            value={summary?.unique_users.toLocaleString() ?? "—"}
            color="bg-orange-500"
          />
        </div>

        {/* Top Elements + Recent Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Elements by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <TopElementsTable elements={summary?.top_elements ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Events</CardTitle>
              {totalEvents > 0 && (
                <span className="text-xs text-muted-foreground">{totalEvents.toLocaleString()} total</span>
              )}
            </CardHeader>
            <CardContent>
              <RecentEventsTable events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
