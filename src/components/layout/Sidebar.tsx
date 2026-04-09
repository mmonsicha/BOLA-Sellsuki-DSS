import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Tag,
  Radio,
  Zap,
  Webhook,
  Image,
  Settings,
  ChevronRight,
  Menu,
  Layers,
  BookOpen,
  BookMarked,
  Bot,
  MessagesSquare,
  Database,
  HelpCircle,
  Inbox,
  LayoutTemplate,
  MessageCircleDashed,
  // Bell, // unused (LON Subscribers hidden)
  ScrollText,
  ClipboardList,
  BarChart2,
  PhoneCall,
  CalendarDays,
  FileText,
  LogOut,
  X,
  Lightbulb,
  ArrowLeftRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SetupProgressChecklist } from "./SetupProgressChecklist";
import { logout, switchWorkspace, getAuthMode } from "@/lib/auth";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tutorialId?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const BASE_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "LINE OA", href: "/line-oa", icon: MessageCircle, tutorialId: "connect-line-oa" },
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Segments", href: "/segments", icon: Tag, tutorialId: "segments" },
      { label: "Broadcasts", href: "/broadcasts", icon: Radio, tutorialId: "broadcasts" },
      { label: "Auto Reply", href: "/auto-reply", icon: ChevronRight, tutorialId: "auto-reply" },
      { label: "Auto Push Messages", href: "/auto-push-messages", icon: Zap },
      { label: "Message Logs", href: "/message-logs", icon: FileText },
      { label: "Rich Menus", href: "/rich-menus", icon: LayoutTemplate },
      // { label: "LON Subscribers", href: "/lon-subscribers", icon: Bell },
      { label: "LON by Phone", href: "/lon-by-phone", icon: PhoneCall },
      { label: "LON Jobs", href: "/lon-jobs", icon: CalendarDays },
      { label: "LON Templates", href: "/lon-templates", icon: LayoutTemplate },
      { label: "LON Delivery Logs", href: "/lon-delivery-logs", icon: ScrollText },
      { label: "Registration Forms", href: "/registration-forms", icon: ClipboardList },
    ],
  },
  {
    title: "AI Chatbot",
    items: [
      { label: "Chatbot Settings", href: "/chatbot-settings", icon: Bot, tutorialId: "ai-chatbot" },
      { label: "Chat Inbox", href: "/chat-inbox", icon: Inbox },
      { label: "Chat Sessions", href: "/chat-sessions", icon: MessagesSquare },
      { label: "Knowledge Base", href: "/knowledge-base", icon: Database },
      { label: "Unanswered Questions", href: "/unanswered-questions", icon: HelpCircle },
      { label: "Analytics", href: "/chatbot-analytics", icon: BarChart2 },
      { label: "Admin Performance", href: "/admin-performance", icon: BarChart2 },
      { label: "Reply Templates", href: "/reply-templates", icon: FileText },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Analytics Dashboard", href: "/analytics", icon: BarChart2 },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Media Library", href: "/media", icon: Image },
      { label: "Flex Messages", href: "/flex-messages", icon: Layers },
      { label: "Quick Replies", href: "/quick-replies", icon: MessageCircleDashed },
    ],
  },
];

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ className, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const currentPath = window.location.pathname;
  const { isAdminOrAbove } = useCurrentAdmin();
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  // Build the Team section dynamically so Audit Logs is only visible to admin+
  const teamSection: NavSection = {
    items: [
      { label: "Team Members", href: "/admins", icon: Users },
      ...(isAdminOrAbove ? [{ label: "Audit Logs", href: "/audit-logs", icon: ClipboardList }] : []),
      { label: "Webhook Settings", href: "/webhook-settings", icon: Webhook },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Integration Guide", href: "/integration", icon: BookOpen },
      { label: "User Manual", href: "/user-manual", icon: BookMarked },
      { label: "Use Case Templates", href: "/use-cases", icon: Lightbulb },
    ],
  };

  const navSections: NavSection[] = [...BASE_NAV_SECTIONS, teamSection];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-gray-900 text-white transition-all duration-300",
          // Desktop: always visible, collapsible
          "md:relative md:translate-x-0",
          // Mobile: fixed overlay, slides in/out
          "fixed inset-y-0 left-0 z-40 md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-64 md:w-16" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-gray-700",
          collapsed ? "flex-col justify-center gap-2 px-2 py-4" : "gap-3 px-4 py-5"
        )}>
          <img src="/bola-logo.svg" alt="BOLA" className="flex-shrink-0 w-8 h-8 rounded-lg" />
          {!collapsed && (
            <div>
              <div className="font-bold text-sm leading-none">BOLA</div>
              <div className="text-xs text-gray-400 leading-none mt-0.5">Back Office LINE API</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "text-gray-400 hover:text-white hidden md:block",
              !collapsed && "ml-auto"
            )}
          >
            <Menu size={16} />
          </button>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="ml-auto text-gray-400 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-4 overflow-y-auto",
          collapsed && "[&::-webkit-scrollbar]:w-0 [scrollbar-width:none]"
        )}>
          <div className={cn("space-y-4", collapsed ? "px-0" : "px-2")}>
            {navSections.map((section, sIdx) => (
              <div key={sIdx}>
                {!collapsed && section.title && (
                  <div className="px-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </div>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href ||
                      (item.href !== "/" && currentPath.startsWith(item.href));

                    return (
                      <li key={item.href}>
                        <a
                          ref={isActive ? activeItemRef : undefined}
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            "group flex items-center rounded-lg text-sm transition-colors w-full",
                            collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5",
                            isActive
                              ? "bg-line text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && (item.badge || item.tutorialId) && (
                            <div className="ml-auto flex items-center gap-1.5">
                              {item.badge && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                  {item.badge}
                                </span>
                              )}
                              {item.tutorialId && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.location.href = `/user-manual?section=${item.tutorialId}`;
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity hover:bg-white/10"
                                    aria-label="ดูคู่มือการใช้งาน"
                                  >
                                    <BookOpen size={12} className="text-gray-400 hover:text-gray-200" />
                                  </button>
                                  <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-700 px-2 py-1 text-xs text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    ดูคู่มือ
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Setup Progress Checklist */}
        <SetupProgressChecklist collapsed={collapsed} />

        {/* Footer */}
        <div className={cn("py-3 border-t border-gray-700", collapsed ? "px-0" : "px-2")}>
          {getAuthMode() === "kratos" && (
            <button
              onClick={switchWorkspace}
              className={cn(
                "flex items-center rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full",
                collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
              )}
            >
              <ArrowLeftRight size={18} className="flex-shrink-0" />
              {!collapsed && <span>Switch Workspace</span>}
            </button>
          )}
          <button
            onClick={() => { void logout(); }}
            className={cn(
              "flex items-center rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full",
              collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            )}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          {!collapsed && (
            <div className="px-3 pt-1 text-xs text-gray-600">BOLA v1.0.0</div>
          )}
        </div>
      </aside>
    </>
  );
}
