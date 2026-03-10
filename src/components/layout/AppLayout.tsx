import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean; // for pages that need full-height, no-padding content area (e.g. Chat Inbox)
}

export function AppLayout({ children, title, fullHeight }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">{title || "BOLA"}</h1>
          <div className="flex items-center gap-3">
            {/* Workspace selector placeholder */}
            <button className="text-sm text-gray-600 border rounded-md px-3 py-1.5 hover:bg-gray-50">
              My Workspace
            </button>
            {/* User avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-line text-white flex items-center justify-center text-sm font-medium">
              A
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={fullHeight ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}
