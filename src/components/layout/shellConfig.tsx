import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BarChart2,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  HelpCircle,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Lightbulb,
  LogOut,
  MessageCircle,
  MessageCircleDashed,
  MessagesSquare,
  PhoneCall,
  Radio,
  ScrollText,
  Settings,
  Tag,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import {
  sellsukiBrandConfig,
  type NavItem,
  type ProductBrandConfig,
  type ShellSidebarGroup,
  type SidebarItem,
} from "@uxuissk/design-system";

interface BolaNavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

interface BolaNavSection {
  title?: string;
  items: BolaNavItem[];
}

const BASE_NAV_SECTIONS: BolaNavSection[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
      { id: "line-oa", label: "LINE OA", href: "/line-oa", icon: <MessageCircle size={18} /> },
      { id: "contacts", label: "Contacts", href: "/contacts", icon: <Users size={18} /> },
      { id: "segments", label: "Segments", href: "/segments", icon: <Tag size={18} /> },
      { id: "broadcasts", label: "Broadcasts", href: "/broadcasts", icon: <Radio size={18} /> },
      { id: "auto-reply", label: "Auto Reply", href: "/auto-reply", icon: <ChevronRight size={18} /> },
      { id: "auto-push-messages", label: "Auto Push Messages", href: "/auto-push-messages", icon: <Zap size={18} /> },
      { id: "rich-menus", label: "Rich Menus", href: "/rich-menus", icon: <LayoutTemplate size={18} /> },
      { id: "lon-subscribers", label: "LON Subscribers", href: "/lon-subscribers", icon: <Bell size={18} /> },
      { id: "lon-delivery-logs", label: "LON Delivery Logs", href: "/lon-delivery-logs", icon: <ScrollText size={18} /> },
      { id: "message-logs", label: "Message Logs", href: "/message-logs", icon: <FileText size={18} /> },
      { id: "lon-by-phone", label: "LON by Phone", href: "/lon-by-phone", icon: <PhoneCall size={18} /> },
      { id: "lon-jobs", label: "LON Jobs", href: "/lon-jobs", icon: <CalendarDays size={18} /> },
      { id: "lon-templates", label: "LON Templates", href: "/lon-templates", icon: <LayoutTemplate size={18} /> },
      { id: "registration-forms", label: "Registration Forms", href: "/registration-forms", icon: <ClipboardList size={18} /> },
    ],
  },
  {
    title: "AI Chatbot",
    items: [
      { id: "chatbot-settings", label: "Chatbot Settings", href: "/chatbot-settings", icon: <Bot size={18} /> },
      { id: "chat-inbox", label: "Chat Inbox", href: "/chat-inbox", icon: <Inbox size={18} /> },
      { id: "chat-sessions", label: "Chat Sessions", href: "/chat-sessions", icon: <MessagesSquare size={18} /> },
      { id: "knowledge-base", label: "Knowledge Base", href: "/knowledge-base", icon: <Database size={18} /> },
      { id: "unanswered-questions", label: "Unanswered Questions", href: "/unanswered-questions", icon: <HelpCircle size={18} /> },
      { id: "chatbot-analytics", label: "Analytics", href: "/chatbot-analytics", icon: <BarChart2 size={18} /> },
      { id: "admin-performance", label: "Admin Performance", href: "/admin-performance", icon: <BarChart2 size={18} /> },
      { id: "reply-templates", label: "Reply Templates", href: "/reply-templates", icon: <FileText size={18} /> },
    ],
  },
  {
    title: "Analytics",
    items: [{ id: "analytics", label: "Analytics Dashboard", href: "/analytics", icon: <BarChart2 size={18} /> }],
  },
  {
    title: "Assets",
    items: [
      { id: "media", label: "Media Library", href: "/media", icon: <Image size={18} /> },
      { id: "flex-messages", label: "Flex Messages", href: "/flex-messages", icon: <Layers size={18} /> },
      { id: "quick-replies", label: "Quick Replies", href: "/quick-replies", icon: <MessageCircleDashed size={18} /> },
    ],
  },
];

function withHref(items: BolaNavItem[]): NavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    icon: item.icon,
    badge: item.badge,
  }));
}

export const bolaProductConfig: ProductBrandConfig = {
  ...sellsukiBrandConfig,
  brand: {
    ...sellsukiBrandConfig.brand,
    name: "BOLA",
    logo: "/bola-logo.svg",
    logoFull: (
      <div className="flex items-center gap-3">
        <img src="/bola-logo.svg" alt="BOLA" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold text-[var(--text-primary)]">BOLA</div>
          <div className="text-xs text-[var(--text-secondary)]">Back Office LINE API</div>
        </div>
      </div>
    ),
  },
};

export function buildBolaNavGroups(isAdminOrAbove: boolean): ShellSidebarGroup[] {
  const teamItems: BolaNavItem[] = [
    { id: "admins", label: "Team Members", href: "/admins", icon: <Users size={18} /> },
    ...(isAdminOrAbove ? [{ id: "audit-logs", label: "Audit Logs", href: "/audit-logs", icon: <ClipboardList size={18} /> }] : []),
    { id: "webhook-settings", label: "Webhook Settings", href: "/webhook-settings", icon: <Webhook size={18} /> },
    { id: "settings", label: "Settings", href: "/settings", icon: <Settings size={18} /> },
    { id: "integration", label: "Integration Guide", href: "/integration", icon: <BookOpen size={18} /> },
    { id: "user-manual", label: "User Manual", href: "/user-manual", icon: <BookMarked size={18} /> },
    { id: "use-cases", label: "Use Case Templates", href: "/use-cases", icon: <Lightbulb size={18} /> },
  ];

  return [
    ...BASE_NAV_SECTIONS.map((section) => ({
      title: section.title,
      items: withHref(section.items),
    })),
    {
      title: "Team",
      items: withHref(teamItems),
    },
  ];
}

export function buildBolaUtilityItems(isKratos: boolean): SidebarItem[] {
  return [
    ...(isKratos
      ? [{ id: "switch-workspace", label: "Switch Workspace", icon: <ArrowLeftRight size={18} /> }]
      : []),
    { id: "sign-out", label: "Sign out", icon: <LogOut size={18} /> },
  ];
}

const ACTIVE_ROUTE_MATCHERS: Array<{ id: string; test: (path: string) => boolean }> = [
  { id: "dashboard", test: (path) => path === "/" || path === "/dashboard" },
  { id: "line-oa", test: (path) => path.startsWith("/line-oa") },
  { id: "contacts", test: (path) => path.startsWith("/contacts") || path.startsWith("/followers") },
  { id: "segments", test: (path) => path.startsWith("/segments") },
  { id: "broadcasts", test: (path) => path.startsWith("/broadcasts") },
  { id: "auto-reply", test: (path) => path.startsWith("/auto-reply") },
  { id: "auto-push-messages", test: (path) => path.startsWith("/auto-push-messages") },
  { id: "rich-menus", test: (path) => path.startsWith("/rich-menus") },
  { id: "lon-subscribers", test: (path) => path.startsWith("/lon-subscribers") },
  { id: "lon-delivery-logs", test: (path) => path.startsWith("/lon-delivery-logs") },
  { id: "message-logs", test: (path) => path.startsWith("/message-logs") },
  { id: "lon-by-phone", test: (path) => path.startsWith("/lon-by-phone") },
  { id: "lon-jobs", test: (path) => path.startsWith("/lon-jobs") },
  { id: "lon-templates", test: (path) => path.startsWith("/lon-templates") },
  { id: "registration-forms", test: (path) => path.startsWith("/registration-forms") },
  { id: "chatbot-settings", test: (path) => path.startsWith("/chatbot-settings") },
  { id: "chat-inbox", test: (path) => path.startsWith("/chat-inbox") },
  { id: "chat-sessions", test: (path) => path.startsWith("/chat-sessions") },
  { id: "knowledge-base", test: (path) => path.startsWith("/knowledge-base") },
  { id: "unanswered-questions", test: (path) => path.startsWith("/unanswered-questions") },
  { id: "chatbot-analytics", test: (path) => path.startsWith("/chatbot-analytics") },
  { id: "admin-performance", test: (path) => path.startsWith("/admin-performance") },
  { id: "reply-templates", test: (path) => path.startsWith("/reply-templates") },
  { id: "analytics", test: (path) => path.startsWith("/analytics") },
  { id: "media", test: (path) => path.startsWith("/media") },
  { id: "flex-messages", test: (path) => path.startsWith("/flex-messages") },
  { id: "quick-replies", test: (path) => path.startsWith("/quick-replies") },
  { id: "admins", test: (path) => path.startsWith("/admins") },
  { id: "audit-logs", test: (path) => path.startsWith("/audit-logs") },
  { id: "webhook-settings", test: (path) => path.startsWith("/webhook-settings") },
  { id: "settings", test: (path) => path.startsWith("/settings") },
  { id: "integration", test: (path) => path.startsWith("/integration") },
  { id: "user-manual", test: (path) => path.startsWith("/user-manual") },
  { id: "use-cases", test: (path) => path.startsWith("/use-cases") },
];

export function resolveBolaActiveItem(path: string): string {
  return ACTIVE_ROUTE_MATCHERS.find((matcher) => matcher.test(path))?.id ?? "dashboard";
}
