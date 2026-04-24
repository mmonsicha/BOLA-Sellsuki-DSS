import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  DSButton,
  EmptyState,
  Spinner,
} from "@uxuissk/design-system";
import { ChoiceCard, ChoiceCardGroup, FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronRight,
  ClipboardList,
  Image,
  Inbox,
  Layers,
  LayoutTemplate,
  MessageCircle,
  MessageCircleDashed,
  Radio,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  Tag,
  Users,
  Webhook,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { authApi } from "@/api/auth";
import { broadcastApi } from "@/api/broadcast";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { segmentApi } from "@/api/segment";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { getWorkspaceId } from "@/lib/auth";
import type { Broadcast, LineOA } from "@/types";

const WORKSPACE_ID = getWorkspaceId() ?? "";

const featureGroups = [
  {
    title: "Messaging",
    items: [
      { label: "Broadcasts", href: "/broadcasts", icon: Radio, desc: "Send to followers & segments" },
      { label: "Auto Reply", href: "/auto-reply", icon: ChevronRight, desc: "Keyword-triggered replies" },
      { label: "Auto Push", href: "/auto-push-messages", icon: Bell, desc: "Event-based push messages" },
      { label: "LON Subscribers", href: "/lon-subscribers", icon: Bell, desc: "Notification opt-in list" },
    ],
  },
  {
    title: "Audience",
    items: [
      { label: "Followers", href: "/followers", icon: Users, desc: "Manage LINE followers" },
      { label: "Segments", href: "/segments", icon: Tag, desc: "Group by rules & filters" },
      { label: "Registration Forms", href: "/registration-forms", icon: ClipboardList, desc: "Collect follower data" },
      { label: "LON Delivery Logs", href: "/lon-delivery-logs", icon: ScrollText, desc: "Notification history" },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Rich Menus", href: "/rich-menus", icon: LayoutTemplate, desc: "Persistent bottom menus" },
      { label: "Flex Messages", href: "/flex-messages", icon: Layers, desc: "Rich message templates" },
      { label: "Quick Replies", href: "/quick-replies", icon: MessageCircleDashed, desc: "One-tap reply chips" },
      { label: "Media Library", href: "/media", icon: Image, desc: "Images & file storage" },
    ],
  },
  {
    title: "AI & Settings",
    items: [
      { label: "AI Chatbot", href: "/chatbot-settings", icon: Bot, desc: "Automated AI responses" },
      { label: "Chat Inbox", href: "/chat-inbox", icon: Inbox, desc: "Live chat conversations" },
      { label: "Webhook Settings", href: "/webhook-settings", icon: Webhook, desc: "Outbound event hooks" },
    ],
  },
];

const WARNING_MESSAGES: Record<string, string> = {
  default_jwt_secret:
    "AUTH_LOCAL_JWT_SECRET is still the factory default. Set a strong secret before going to production.",
  default_admin_credentials:
    "You are logged in as admin@bola.local. Change the default admin email and password.",
};

const broadcastStatusVariant: Record<string, "success" | "default" | "secondary" | "destructive" | "outline" | "warning"> = {
  sent: "success",
  sending: "default",
  scheduled: "warning",
  draft: "secondary",
  failed: "destructive",
  cancelled: "secondary",
};

function DashboardPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card elevation="none" className="h-full">
      <CardHeader action={action}>
        <div className="space-y-1">
          <h3 className="font-[var(--font-h4)] text-[var(--text-h4)] font-medium text-[var(--Colors--Text--text-primary)]">
            {title}
          </h3>
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

function LineOAList({ lineOAs }: { lineOAs: LineOA[] }) {
  if (lineOAs.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={40} />}
        title="No LINE OA connected yet"
        description="Connect your first LINE Official Account to start managing customers and sending messages."
        action={
          <DSButton variant="primary" onClick={() => { window.location.href = "/line-oa"; }}>
            Connect LINE OA
          </DSButton>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {lineOAs.map((oa) => (
        <a
          key={oa.id}
          href={`/line-oa/${oa.id}`}
          className="flex items-center gap-[var(--Spacing--Spacing-3xl)] rounded-[var(--Border-radius--radius-xl)] border border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] p-[var(--Spacing--Spacing-3xl)] transition hover:border-[var(--Colors--Stroke--stroke-brand)] hover:bg-[var(--Colors--Background--bg-brand-primary)]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--Colors--Stroke--stroke-brand-lighter)] bg-[var(--Colors--Background--bg-brand-primary)]">
            {oa.picture_url ? (
              <img src={oa.picture_url} alt={oa.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[var(--text-label)] font-semibold text-[var(--Colors--Text--text-brand-primary)]">
                {oa.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[var(--text-label)] font-semibold text-[var(--Colors--Text--text-primary)]">{oa.name}</div>
            <div className="truncate text-[var(--text-caption)] text-[var(--Colors--Text--text-secondary)]">{oa.basic_id || oa.channel_id}</div>
          </div>
          <Badge
            variant={oa.status === "active" ? "success" : oa.status === "error" ? "destructive" : "secondary"}
            size="sm"
          >
            {oa.status}
          </Badge>
        </a>
      ))}
    </div>
  );
}

function BroadcastList({ broadcasts }: { broadcasts: Broadcast[] }) {
  if (broadcasts.length === 0) {
    return (
      <EmptyState
        icon={<Radio size={40} />}
        title="No broadcasts yet"
        description="Create your first campaign to start sending targeted messages."
        action={
          <DSButton variant="secondary" onClick={() => { window.location.href = "/broadcasts"; }}>
            Create Broadcast
          </DSButton>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.map((broadcast) => (
        <a
          key={broadcast.id}
          href={`/broadcasts/${broadcast.id}`}
          className="flex items-center gap-[var(--Spacing--Spacing-3xl)] rounded-[var(--Border-radius--radius-xl)] border border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] p-[var(--Spacing--Spacing-3xl)] transition hover:border-[var(--Colors--Stroke--stroke-brand)] hover:bg-[var(--Colors--Background--bg-brand-primary)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--Colors--Background--bg-brand-primary)] text-[var(--Colors--Text--text-brand-primary)]">
            <Radio size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[var(--text-label)] font-semibold text-[var(--Colors--Text--text-primary)]">{broadcast.name}</div>
            <div className="text-[var(--text-caption)] text-[var(--Colors--Text--text-secondary)]">
              {broadcast.sent_at
                ? `Sent ${new Date(broadcast.sent_at).toLocaleDateString()}`
                : broadcast.scheduled_at
                  ? `Scheduled ${new Date(broadcast.scheduled_at).toLocaleDateString()}`
                  : "Draft"}
            </div>
          </div>
          <Badge variant={broadcastStatusVariant[broadcast.status] ?? "secondary"} size="sm">
            {broadcast.status}
          </Badge>
        </a>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { currentAdmin } = useCurrentAdmin();
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [followerTotal, setFollowerTotal] = useState<number | null>(null);
  const [broadcastTotal, setBroadcastTotal] = useState<number | null>(null);
  const [segmentTotal, setSegmentTotal] = useState<number | null>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentAdmin?.role !== "super_admin") return;
    void authApi.getSystemStatus(WORKSPACE_ID)
      .then(({ warnings }) => setSecurityWarnings(warnings ?? []))
      .catch(() => {});
  }, [currentAdmin]);

  useEffect(() => {
    void Promise.allSettled([
      lineOAApi.list({ workspace_id: WORKSPACE_ID, page_size: 10 }),
      followerApi.list({ workspace_id: WORKSPACE_ID, page_size: 1 }),
      broadcastApi.list({ workspace_id: WORKSPACE_ID, page_size: 5 }),
      segmentApi.list({ workspace_id: WORKSPACE_ID, page_size: 100 }),
    ]).then(([oaRes, followerRes, broadcastRes, segmentRes]) => {
      if (oaRes.status === "fulfilled") setLineOAs(oaRes.value.data ?? []);
      if (followerRes.status === "fulfilled") setFollowerTotal(followerRes.value.total ?? 0);
      if (broadcastRes.status === "fulfilled") {
        setBroadcastTotal(broadcastRes.value.total ?? 0);
        setRecentBroadcasts(broadcastRes.value.data ?? []);
      }
      if (segmentRes.status === "fulfilled") {
        setSegmentTotal((segmentRes.value.data ?? []).length);
      }

      if ([oaRes, followerRes, broadcastRes, segmentRes].every((result) => result.status === "rejected")) {
        setError("Dashboard data is unavailable right now. Check backend connectivity and try again.");
      }

      setLoading(false);
    });
  }, []);

  const stats = [
    { label: "LINE OAs", value: lineOAs.length, icon: <MessageCircle size={18} />, href: "/line-oa" },
    { label: "Followers", value: followerTotal ?? 0, icon: <Users size={18} />, href: "/contacts" },
    { label: "Broadcasts", value: broadcastTotal ?? 0, icon: <Radio size={18} />, href: "/broadcasts" },
    { label: "Segments", value: segmentTotal ?? 0, icon: <Tag size={18} />, href: "/segments" },
  ];

  return (
    <AppLayout title="Dashboard">
      <FeaturePageScaffold
        layout="dashboard"
        header={(
          <PageHeader
            title="BOLA Overview"
            subtitle="Monitor channels, audience health, and campaign activity from one modern control panel."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} />}
            actions={(
              <DSButton
                variant="secondary"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Refresh data
              </DSButton>
            )}
          />
        )}
        kpis={(
          <ChoiceCardGroup
            value=""
            size="lg"
            className="grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            onChange={(value) => {
              window.location.href = value;
            }}
          >
            {stats.map((stat) => (
              <ChoiceCard
                key={stat.href}
                value={stat.href}
                title={stat.label}
                description={loading ? "..." : String(stat.value)}
                icon={stat.icon}
              />
            ))}
          </ChoiceCardGroup>
        )}
        primaryChart={(
          <div className="space-y-4">
            {securityWarnings.length > 0 && (
              <Alert variant="warning" title="Security warnings" icon={<ShieldAlert size={18} />}>
                <ul className="list-disc space-y-1 pl-5">
                  {securityWarnings.map((warning) => (
                    <li key={warning}>{WARNING_MESSAGES[warning] ?? warning}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <DashboardPanel
              title="Connected LINE OAs"
              action={(
                <DSButton variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => { window.location.href = "/line-oa"; }}>
                  Manage
                </DSButton>
              )}
            >
              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <Spinner />
                </div>
              ) : error ? (
                <Alert variant="error" title="Failed to load LINE OA data">{error}</Alert>
              ) : (
                <LineOAList lineOAs={lineOAs} />
              )}
            </DashboardPanel>
          </div>
        )}
        secondaryCharts={(
          <DashboardPanel
            title="Recent Broadcasts"
            action={(
              <DSButton variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => { window.location.href = "/broadcasts"; }}>
                View all
              </DSButton>
            )}
          >
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Spinner />
              </div>
            ) : error ? (
              <Alert variant="error" title="Failed to load broadcast data">{error}</Alert>
            ) : (
              <BroadcastList broadcasts={recentBroadcasts} />
            )}
          </DashboardPanel>
        )}
        table={(
          <div className="space-y-6">
            {featureGroups.map((group) => (
              <section key={group.title} className="space-y-3">
                <div className="text-[var(--text-caption)] font-semibold uppercase tracking-[0.12em] text-[var(--Colors--Text--text-secondary)]">
                  {group.title}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a key={item.href} href={item.href} className="block">
                        <Card hover elevation="none" className="h-full">
                          <CardBody>
                            <div className="flex items-start gap-[var(--Spacing--Spacing-3xl)]">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--Border-radius--radius-xl)] bg-[var(--Colors--Background--bg-brand-primary)] text-[var(--Colors--Text--text-brand-primary)]">
                                <Icon size={20} />
                              </div>
                              <div className="min-w-0 space-y-2">
                                <div className="text-[var(--text-label)] font-semibold text-[var(--Colors--Text--text-primary)]">{item.label}</div>
                                <p className="text-[var(--text-caption)] leading-6 text-[var(--Colors--Text--text-secondary)]">{item.desc}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      />
    </AppLayout>
  );
}
