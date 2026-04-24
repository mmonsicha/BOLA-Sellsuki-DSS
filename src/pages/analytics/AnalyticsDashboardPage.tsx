import { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  Card,
  CardBody,
  EmptyState,
  Notification,
  StatCard,
  Tabs,
} from "@uxuissk/design-system";
import {
  AdvancedDataTable,
  BarChart,
  DonutChart,
  FeaturePageScaffold,
  FilterBar,
  PageHeader,
  type AdvancedColumn,
  type FilterBarValue,
} from "@/components/ui/ds-compat";
import { BarChart2, Eye, MousePointerClick, RefreshCw, TrendingUp, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { analyticsApi } from "@/api/analytics";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId } from "@/lib/auth";
import type { AnalyticsEvent, AnalyticsSummary, LineOA, TopElementStats } from "@/types";

const PERIOD_TABS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

export function AnalyticsDashboardPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [period, setPeriod] = useState("30d");
  const [filters, setFilters] = useState<FilterBarValue>({
    search: "",
    filters: {
      lineOa: "",
    },
  });
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(10);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setError("Workspace is not available.");
      return;
    }

    lineOAApi
      .list({ workspace_id: workspaceId })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(() => setLineOAs([]));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const selectedOA = typeof filters.filters.lineOa === "string" ? filters.filters.lineOa : "";
    setLoading(true);
    setError(null);

    Promise.all([
      analyticsApi.getSummary({
        workspace_id: workspaceId,
        line_oa_id: selectedOA || undefined,
        period,
      }),
      analyticsApi.listEvents({
        workspace_id: workspaceId,
        line_oa_id: selectedOA || undefined,
        page: eventsPage,
        page_size: eventsPageSize,
      }),
    ])
      .then(([summaryRes, eventsRes]) => {
        setSummary(summaryRes);
        setEvents(eventsRes.data ?? []);
        setTotalEvents(eventsRes.total ?? 0);
      })
      .catch((err) => {
        setSummary(null);
        setEvents([]);
        setTotalEvents(0);
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, [workspaceId, filters, period, eventsPage, eventsPageSize]);

  const lineOAOptions = useMemo(
    () => lineOAs.map((oa) => ({ label: oa.name, value: oa.id })),
    [lineOAs],
  );

  const topElementColumns = useMemo<AdvancedColumn<TopElementStats>[]>(() => [
    {
      key: "element_label",
      header: "Element",
      sortable: true,
      render: (_value, row) => (
        <div className="space-y-1">
          <div className="font-medium text-[var(--foreground)]">{row.element_label || row.element_id}</div>
          <div className="text-sm text-[var(--muted-foreground)]">{row.element_type}</div>
        </div>
      ),
    },
    {
      key: "impressions",
      header: "Impressions",
      sortable: true,
      align: "right",
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: "clicks",
      header: "Clicks",
      sortable: true,
      align: "right",
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: "ctr",
      header: "CTR",
      sortable: true,
      align: "right",
      render: (value: number) => `${value.toFixed(1)}%`,
    },
  ], []);

  const eventColumns = useMemo<AdvancedColumn<AnalyticsEvent>[]>(() => [
    {
      key: "occurred_at",
      header: "Time",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      key: "event_type",
      header: "Event",
      render: (value: string) => value.replaceAll("_", " "),
    },
    {
      key: "element_label",
      header: "Element",
      render: (_value, row) => row.element_label || row.element_id || "-",
    },
    {
      key: "element_type",
      header: "Type",
      render: (value: string) => value || "-",
    },
  ], []);

  const topElementsSeries = useMemo(() => [
    {
      name: "Clicks",
      data: (summary?.top_elements ?? []).slice(0, 6).map((element) => ({
        label: element.element_label || element.element_id,
        value: element.clicks,
      })),
    },
  ], [summary]);

  const eventTypeData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const event of events) {
      buckets.set(event.event_type, (buckets.get(event.event_type) ?? 0) + 1);
    }

    const palette = ["#06C755", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444"];
    return Array.from(buckets.entries()).map(([label, value], index) => ({
      label: label.replaceAll("_", " "),
      value,
      color: palette[index % palette.length],
    }));
  }, [events]);

  return (
    <AppLayout title="Analytics Dashboard">
      <FeaturePageScaffold
        layout="dashboard"
        header={(
          <PageHeader
            title="Analytics Dashboard"
            subtitle="Track impressions, clicks, CTR, and engagement patterns with DS-first KPIs and charts."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Analytics" }]} />}
          />
        )}
        filters={(
          <div className="space-y-4">
            <FilterBar
              filters={[
                {
                  key: "lineOa",
                  label: "LINE OA",
                  type: "single",
                  options: [{ label: "All LINE OAs", value: "" }, ...lineOAOptions],
                },
              ]}
              value={filters}
              onFilterChange={(value) => {
                setFilters(value);
                setEventsPage(1);
              }}
            />

            <Tabs
              tabs={PERIOD_TABS}
              activeTab={period}
              onChange={(nextPeriod) => {
                setPeriod(nextPeriod);
                setEventsPage(1);
              }}
              variant="underline"
            />
          </div>
        )}
        stats={(
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total impressions" value={loading ? "..." : summary?.total_impressions.toLocaleString() ?? "-"} icon={<Eye size={18} />} />
            <StatCard title="Total clicks" value={loading ? "..." : summary?.total_clicks.toLocaleString() ?? "-"} icon={<MousePointerClick size={18} />} />
            <StatCard title="CTR" value={loading ? "..." : summary ? `${summary.ctr.toFixed(1)}%` : "-"} icon={<TrendingUp size={18} />} />
            <StatCard title="Unique users" value={loading ? "..." : summary?.unique_users.toLocaleString() ?? "-"} icon={<Users size={18} />} />
          </div>
        )}
        charts={(
          <div className="space-y-4">
            {error && (
              <Notification
                type="error"
                title="Failed to load analytics"
                message={error}
                dismissible={false}
              />
            )}

            {!error && !loading && !summary && (
              <EmptyState
                icon={<BarChart2 size={48} />}
                title="No analytics data available"
                description="Analytics summary is empty for the current workspace and selected filters."
              />
            )}

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <Card elevation="none">
                <CardBody className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Top elements by clicks</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">The highest-performing tracked elements for the selected period.</p>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-20 text-[var(--muted-foreground)]">
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Loading chart...
                    </div>
                  ) : topElementsSeries[0].data.length > 0 ? (
                    <BarChart series={topElementsSeries} />
                  ) : (
                    <EmptyState
                      icon={<BarChart2 size={40} />}
                      title="No top element data"
                      description="Tracked element clicks will appear here after users interact with messages or menus."
                    />
                  )}
                </CardBody>
              </Card>

              <Card elevation="none">
                <CardBody className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent event mix</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Event distribution from the latest analytics activity batch.</p>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-20 text-[var(--muted-foreground)]">
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Loading chart...
                    </div>
                  ) : eventTypeData.length > 0 ? (
                    <DonutChart data={eventTypeData} centerLabel="Events" centerValue={String(totalEvents)} />
                  ) : (
                    <EmptyState
                      icon={<Users size={40} />}
                      title="No event distribution yet"
                      description="Recent tracked events will populate this breakdown automatically."
                    />
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card elevation="none">
                <CardBody className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Top elements table</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Sortable breakdown of impressions, clicks, and CTR.</p>
                  </div>
                  <AdvancedDataTable
                    rowKey="element_id"
                    columns={topElementColumns}
                    data={summary?.top_elements ?? []}
                    loading={loading}
                    emptyMessage="No element data"
                    emptyDescription="The selected LINE OA and period have not generated tracked element analytics yet."
                  />
                </CardBody>
              </Card>

              <Card elevation="none">
                <CardBody className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent events</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Latest analytics events recorded for the current workspace.</p>
                  </div>
                  <AdvancedDataTable
                    rowKey="id"
                    columns={eventColumns}
                    data={events}
                    loading={loading}
                    pagination={{ page: eventsPage, pageSize: eventsPageSize, totalCount: totalEvents }}
                    onPageChange={(nextPage, nextPageSize) => {
                      setEventsPage(nextPage);
                      setEventsPageSize(nextPageSize);
                    }}
                    emptyMessage="No events recorded"
                    emptyDescription="Events will appear here after users interact with tracked links or UI elements."
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      />
    </AppLayout>
  );
}
