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
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "LINE OA", href: "/line-oa", icon: MessageCircle },
  { label: "Followers", href: "/followers", icon: Users },
  { label: "Segments", href: "/segments", icon: Tag },
  { label: "Broadcasts", href: "/broadcasts", icon: Radio },
  { label: "Auto Reply", href: "/auto-reply", icon: ChevronRight },
  { label: "Auto Push Messages", href: "/auto-push-messages", icon: Radio },
  { label: "Flex Messages", href: "/flex-messages", icon: Layers },
  { label: "Media", href: "/media", icon: Image },
  { label: "Webhook Settings", href: "/webhook-settings", icon: Webhook },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Integration Guide", href: "/integration", icon: BookOpen },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const currentPath = window.location.pathname;

  return (
    <aside
      className={cn(
        "flex flex-col bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-line flex items-center justify-center font-bold text-white text-sm">
          B
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm leading-none">BOLA</div>
            <div className="text-xs text-gray-400 leading-none mt-0.5">Back Office LINE API</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-white"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href ||
              (item.href !== "/" && currentPath.startsWith(item.href));

            return (
              <li key={item.href}>
                <a
                  href={item.href}
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
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="text-xs text-gray-500">BOLA v1.0.0</div>
        </div>
      )}
    </aside>
  );
}
