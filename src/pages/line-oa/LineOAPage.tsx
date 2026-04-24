import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  DSButton,
  EmptyState,
  StatCard,
  toast,
} from "@uxuissk/design-system";
import { AdvancedDataTable, FeaturePageScaffold, PageHeader, type AdvancedColumn } from "@/components/ui/ds-compat";
import { Copy, Link2, MessageCircle, Plus, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import { ConnectLineOADialog } from "./ConnectLineOADialog";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";

const statusVariant = {
  active: "success" as const,
  inactive: "secondary" as const,
  error: "destructive" as const,
};

export function LineOAPage() {
  const { isAdminOrAbove } = useCurrentAdmin();
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);

  const load = () => {
    setLoading(true);
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(() => {
        toast.error("Unable to load LINE OA list", "Please check backend connectivity and try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreated = (oa: LineOA) => {
    setLineOAs((prev) => [oa, ...prev]);
    if (oa.webhook_url) {
      void navigator.clipboard.writeText(oa.webhook_url);
    }
    toast.success(
      oa.webhook_url
        ? "Webhook URL copied. Paste it into LINE Developers Console and enable webhook usage."
        : "LINE OA connected successfully.",
      "LINE Official Account connected",
    );
  };

  const copyWebhookURL = (oa: LineOA) => {
    if (!oa.webhook_url) return;
    void navigator.clipboard.writeText(oa.webhook_url);
    toast.success("Webhook URL copied to your clipboard.");
  };

  const stats = [
    { title: "Connected accounts", value: lineOAs.length, icon: <MessageCircle size={18} /> },
    { title: "Active accounts", value: lineOAs.filter((oa) => oa.status === "active").length, icon: <Link2 size={18} /> },
    {
      title: "Total followers",
      value: lineOAs.reduce((sum, oa) => sum + (oa.follower_count ?? 0), 0).toLocaleString(),
      icon: <Users size={18} />,
    },
  ];

  const columns = useMemo<AdvancedColumn<LineOA>[]>(() => [
    {
      key: "name",
      header: "LINE OA",
      sortable: true,
      render: (_value, oa) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-600">
            {oa.picture_url ? (
              <img src={oa.picture_url} alt={oa.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{oa.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{oa.name}</div>
            <div className="truncate text-sm text-[var(--text-secondary)]">{oa.basic_id || oa.channel_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: LineOA["status"], oa) => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[value] ?? "secondary"} size="sm">{value}</Badge>
          {oa.is_default && <Badge variant="outline" size="sm">Default</Badge>}
        </div>
      ),
    },
    {
      key: "follower_count",
      header: "Followers",
      align: "right",
      render: (value: number | null | undefined) => (value ?? 0).toLocaleString(),
    },
    {
      key: "webhook_url",
      header: "Webhook",
      render: (value: string | undefined, oa) => value ? (
        <DSButton
          variant="ghost"
          size="sm"
          leftIcon={<Copy size={14} />}
          onClick={(event) => {
            event.stopPropagation();
            copyWebhookURL(oa);
          }}
        >
          Copy URL
        </DSButton>
      ) : (
        <span className="text-sm text-[var(--text-secondary)]">Not configured</span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ], []);

  const tableContent = lineOAs.length === 0 && !loading ? (
    <Card elevation="none">
      <CardBody>
        <EmptyState
          icon={<MessageCircle size={44} />}
          title="No LINE OA connected yet"
          description="Connect your first LINE Official Account to start managing customers, contacts, and campaigns."
          action={(
            isAdminOrAbove ? (
              <DSButton variant="primary" leftIcon={<Plus size={16} />} onClick={() => setConnectOpen(true)}>
                Connect LINE OA
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
      data={lineOAs}
      loading={loading}
      emptyMessage="No LINE OA found"
      emptyDescription="Connect an official account to populate this list."
      onRowClick={(row) => { window.location.pathname = `/line-oa/${row.id}`; }}
    />
  );

  return (
    <AppLayout title="LINE Official Accounts">
      <FeaturePageScaffold
        layout="list"
        header={(
          <PageHeader
            title="LINE Official Accounts"
            subtitle="Connect, monitor, and manage every official account in one DS-powered workspace."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "LINE OA" }]} />}
            actions={(
              isAdminOrAbove ? (
                <DSButton variant="primary" leftIcon={<Plus size={16} />} onClick={() => setConnectOpen(true)}>
                  Connect LINE OA
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
        table={tableContent}
      />

      <ConnectLineOADialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onCreated={handleCreated}
      />
    </AppLayout>
  );
}
