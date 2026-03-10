import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean; // for pages that need full-height, no-padding content area (e.g. Chat Inbox)
}

export function AppLayout({ children, title, fullHeight }: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-white shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger - mobile only */}
            <button
              className="md:hidden flex-shrink-0 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {title || "BOLA"}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Workspace selector placeholder */}
            <button className="hidden sm:block text-sm text-gray-600 border rounded-md px-3 py-1.5 hover:bg-gray-50">
              My Workspace
            </button>
            {/* User avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-line text-white flex items-center justify-center text-sm font-medium">
              A
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={fullHeight ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-4 sm:p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}
