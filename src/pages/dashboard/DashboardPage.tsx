import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Radio, MessageCircle, Tag, Bot, Bell, ClipboardList,
  Webhook, Image, Layers, LayoutTemplate, MessageCircleDashed,
  ChevronRight, RefreshCw, ArrowRight, ScrollText, Inbox, ShieldAlert,
} from "lucide-react";
import { lineOAApi } from "@/api/lineOA";
import { followerApi } from "@/api/follower";
import { broadcastApi } from "@/api/broadcast";
import { segmentApi } from "@/api/segment";
import { authApi } from "@/api/auth";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import type { LineOA, Broadcast } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

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

const broadcastStatusVariant: Record<string, "success" | "default" | "secondary" | "destructive" | "outline" | "warning"> = {
  sent: "success",
  sending: "default",
  scheduled: "warning",
  draft: "secondary",
  failed: "destructive",
  cancelled: "secondary",
};

const WARNING_MESSAGES: Record<string, string> = {
  default_jwt_secret:
    "AUTH_LOCAL_JWT_SECRET is still the factory default. Set a strong secret before going to production.",
  default_admin_credentials:
    "You are logged in as admin@bola.local. Change the default admin email and password.",
};

export function DashboardPage() {
  const { currentAdmin } = useCurrentAdmin();
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [followerTotal, setFollowerTotal] = useState<number | null>(null);
  const [broadcastTotal, setBroadcastTotal] = useState<number | null>(null);
  const [segmentTotal, setSegmentTotal] = useState<number | null>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAdmin?.role !== "super_admin") return;
    void authApi.getSystemStatus(WORKSPACE_ID)
      .then(({ warnings }) => setSecurityWarnings(warnings))
      .catch(() => { /* silently ignore — non-super_admin or backend unavailable */ });
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
      if (segmentRes.status === "fulfilled") setSegmentTotal((segmentRes.value.data ?? []).length);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: "LINE OAs", value: lineOAs.length, icon: MessageCircle, color: "text-green-500", href: "/line-oa" },
    { label: "Followers", value: followerTotal, icon: Users, color: "text-blue-500", href: "/followers" },
    { label: "Broadcasts", value: broadcastTotal, icon: Radio, color: "text-purple-500", href: "/broadcasts" },
    { label: "Segments", value: segmentTotal, icon: Tag, color: "text-orange-500", href: "/segments" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">

        {/* ── Security warnings (super_admin only) ── */}
        {securityWarnings.length > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">
                  Security warnings
                </p>
                <ul className="mt-1 space-y-1">
                  {securityWarnings.map((key) => (
                    <li key={key} className="text-sm text-red-700 dark:text-red-400">
                      {WARNING_MESSAGES[key] ?? key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <a key={stat.label} href={stat.href}>
                <Card className="hover:border-border/80 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon size={15} className={stat.color} />
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <span className="text-muted-foreground text-lg">—</span>
                      ) : (
                        stat.value ?? 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* ── LINE OAs + Recent Broadcasts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Connected LINE OAs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Connected LINE OAs</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href="/line-oa">Manage <ArrowRight className="h-3 w-3" /></a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : lineOAs.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">No LINE OA connected yet</p>
                  <Button size="sm" className="bg-line hover:bg-line/90" asChild>
                    <a href="/line-oa">Connect LINE OA</a>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {lineOAs.map((oa) => (
                    <li key={oa.id}>
                      <a
                        href={`/line-oa/${oa.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-line/10 border border-line/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {oa.picture_url ? (
                            <img src={oa.picture_url} alt={oa.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-line font-bold text-sm">{oa.name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{oa.name}</div>
                          {oa.basic_id && (
                            <div className="text-xs text-muted-foreground">{oa.basic_id}</div>
                          )}
                        </div>
                        <Badge
                          variant={oa.status === "active" ? "success" : oa.status === "error" ? "destructive" : "secondary"}
                          className="text-xs flex-shrink-0"
                        >
                          {oa.status}
                        </Badge>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Broadcasts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Broadcasts</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href="/broadcasts">View all <ArrowRight className="h-3 w-3" /></a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : recentBroadcasts.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">No broadcasts yet</p>
                  <Button size="sm" asChild>
                    <a href="/broadcasts">Create Broadcast</a>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {recentBroadcasts.map((b) => (
                    <li key={b.id}>
                      <a
                        href={`/broadcasts/${b.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Radio className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{b.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.sent_at
                              ? `Sent ${new Date(b.sent_at).toLocaleDateString()}`
                              : b.scheduled_at
                              ? `Scheduled ${new Date(b.scheduled_at).toLocaleDateString()}`
                              : "Draft"}
                          </div>
                        </div>
                        <Badge
                          variant={broadcastStatusVariant[b.status] ?? "secondary"}
                          className="text-xs flex-shrink-0 capitalize"
                        >
                          {b.status}
                        </Badge>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Feature shortcuts ── */}
        <div className="space-y-5">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0.5">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.href} href={item.href}>
                      <Card className="hover:border-line/40 hover:bg-line/5 transition-colors cursor-pointer h-full">
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-line/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-line" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium leading-tight">{item.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">{item.desc}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
