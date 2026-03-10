import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Tag,
  Radio,
  Webhook,
  Image,
  Settings,
  ChevronRight,
  Menu,
  Layers,
  BookOpen,
  Bot,
  MessagesSquare,
  Database,
  HelpCircle,
  Inbox,
  LayoutTemplate,
  MessageCircleDashed,
  Bell,
  ScrollText,
  ClipboardList,
  BarChart2,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "LINE OA", href: "/line-oa", icon: MessageCircle },
      { label: "Followers", href: "/followers", icon: Users },
      { label: "Segments", href: "/segments", icon: Tag },
      { label: "Broadcasts", href: "/broadcasts", icon: Radio },
      { label: "Auto Reply", href: "/auto-reply", icon: ChevronRight },
      { label: "Auto Push Messages", href: "/auto-push-messages", icon: Radio },
      { label: "Rich Menus", href: "/rich-menus", icon: LayoutTemplate },
      { label: "LON Subscribers", href: "/lon-subscribers", icon: Bell },
      { label: "LON Delivery Logs", href: "/lon-delivery-logs", icon: ScrollText },
      { label: "LON by Phone", href: "/lon-by-phone", icon: PhoneCall },
      { label: "Registration Forms", href: "/registration-forms", icon: ClipboardList },
    ],
  },
  {
    title: "AI Chatbot",
    items: [
      { label: "Chatbot Settings", href: "/chatbot-settings", icon: Bot },
      { label: "Chat Inbox", href: "/chat-inbox", icon: Inbox },
      { label: "Chat Sessions", href: "/chat-sessions", icon: MessagesSquare },
      { label: "Knowledge Base", href: "/knowledge-base", icon: Database },
      { label: "Unanswered Questions", href: "/unanswered-questions", icon: HelpCircle },
      { label: "Analytics", href: "/chatbot-analytics", icon: BarChart2 },
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
  {
    items: [
      { label: "Webhook Settings", href: "/webhook-settings", icon: Webhook },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Integration Guide", href: "/integration", icon: BookOpen },
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
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <img src="/bola-logo.svg" alt="BOLA" className="flex-shrink-0 w-8 h-8 rounded-lg" />
          {!collapsed && (
            <div>
              <div className="font-bold text-sm leading-none">BOLA</div>
              <div className="text-xs text-gray-400 leading-none mt-0.5">Back Office LINE API</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-400 hover:text-white hidden md:block"
          >
            <Menu size={16} />
          </button>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="ml-auto text-gray-400 hover:text-white md:hidden"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-4 px-2">
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
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-line text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                              {item.badge}
                            </span>
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

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-gray-700">
            <div className="text-xs text-gray-500">BOLA v1.0.0</div>
          </div>
        )}
      </aside>
    </>
  );
}
