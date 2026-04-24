import { useMemo, useState } from "react";
import {
  Alert,
  DSButton,
  Sidebar,
  TopNavbar,
  type BreadcrumbItem,
  type SidebarGroup,
  type TopNavbarUser,
} from "@uxuissk/design-system";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { getAuthMode, logout, switchWorkspace } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  bolaProductConfig,
  buildBolaNavGroups,
  buildBolaUtilityItems,
  type BolaSidebarItem,
  resolveBolaActiveItem,
} from "./shellConfig";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean;
  icon?: React.ReactNode;
}

function buildSidebarGroups(navGroups: SidebarGroup[], utilityItems: BolaSidebarItem[]): SidebarGroup[] {
  return [
    ...navGroups,
    {
      label: "Account",
      items: utilityItems,
    },
  ];
}

export function AppLayout({ children, title, fullHeight }: AppLayoutProps) {
  const { currentAdmin, isAdminOrAbove } = useCurrentAdmin();
  const { dbOk } = useHealthCheck();
  const currentPath = window.location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = useMemo(() => buildBolaNavGroups(isAdminOrAbove), [isAdminOrAbove]);
  const pageTitle = title || "BOLA";
  const utilityItems = useMemo(
    () => buildBolaUtilityItems(getAuthMode() === "kratos"),
    [],
  );
  const sidebarGroups = useMemo(
    () => buildSidebarGroups(navGroups, utilityItems),
    [navGroups, utilityItems],
  );
  const activeItemId = resolveBolaActiveItem(currentPath);
  const activeGroupContext = useMemo(() => {
    for (const group of sidebarGroups) {
      const item = group.items.find((entry) => entry.id === activeItemId);
      if (item) {
        return {
          groupLabel: group.label,
          itemLabel: item.label,
          href: item.href,
        };
      }
    }

    return {
      groupLabel: "Main",
      itemLabel: pageTitle,
      href: currentPath,
    };
  }, [activeItemId, currentPath, pageTitle, sidebarGroups]);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: "BOLA", href: "/" }];

    if (activeGroupContext.groupLabel !== "Main") {
      items.push({ label: activeGroupContext.groupLabel });
    }

    const currentLabel = title || activeGroupContext.itemLabel;
    if (currentLabel) {
      items.push({ label: currentLabel, href: activeGroupContext.href });
    }

    return items;
  }, [activeGroupContext.groupLabel, activeGroupContext.href, activeGroupContext.itemLabel, title]);

  const shellUser: TopNavbarUser = {
    name: currentAdmin?.name || "BOLA Admin",
  };

  const handleNavigate = (item: BolaSidebarItem) => {
    setMobileOpen(false);

    if (item.id === "sign-out") {
      void logout();
      return;
    }

    if (item.id === "switch-workspace") {
      switchWorkspace();
      return;
    }

    if (item.href) {
      window.location.href = item.href;
    }
  };

  const sidebarBrand = {
    name: bolaProductConfig.brand.name,
    logo: bolaProductConfig.brand.logo,
  };

  return (
    <div className="min-h-screen bg-[var(--Colors--Background--bg-quaternary)] text-[var(--Colors--Text--text-primary)]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-[var(--z-shell-overlay)] bg-[color:rgb(17_24_39_/_0.28)] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[var(--z-shell-sidebar)] hidden border-r border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] md:block",
          collapsed
            ? "w-[var(--shell-sidebar-collapsed)]"
            : "w-[var(--shell-sidebar-width)]",
        )}
      >
        <Sidebar
          brand={sidebarBrand}
          groups={sidebarGroups}
          activeItem={activeItemId}
          onNavigate={(item) => handleNavigate(item as BolaSidebarItem)}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          width="var(--shell-sidebar-width)"
          className="h-full"
        />
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[calc(var(--z-shell-sidebar)+1)] w-[var(--shell-sidebar-width)] border-r border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          brand={sidebarBrand}
          groups={sidebarGroups}
          activeItem={activeItemId}
          onNavigate={(item) => handleNavigate(item as BolaSidebarItem)}
          width="var(--shell-sidebar-width)"
          className="h-full"
        />
      </aside>

      <div
        className={cn(
          "min-h-screen transition-[margin-left] duration-200",
          collapsed
            ? "md:ml-[var(--shell-sidebar-collapsed)]"
            : "md:ml-[var(--shell-sidebar-width)]",
        )}
      >
        <div className="sticky top-0 z-[var(--z-shell-nav)] border-b border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)]">
          <TopNavbar
            breadcrumbs={breadcrumbs}
            actions={(
              <div className="flex items-center gap-[var(--Spacing--Spacing-sm)]">
                <DSButton
                  variant="ghost"
                  size="md"
                  className="hidden md:inline-flex"
                  onClick={() => setCollapsed((value) => !value)}
                >
                  {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </DSButton>
                <DSButton
                  variant="ghost"
                  size="md"
                  className="inline-flex md:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu size={16} />
                </DSButton>
              </div>
            )}
            user={shellUser}
            height="var(--shell-nav-height)"
            onMobileMenuClick={() => setMobileOpen(true)}
            onBreadcrumbClick={(item) => {
              if (item.href) {
                window.location.href = item.href;
              }
            }}
            className="bg-[var(--Colors--Background--bg-primary)]"
          />
        </div>

        <main
          aria-label={pageTitle}
          className={cn(
            fullHeight
              ? "h-[calc(100vh-var(--shell-nav-height))] overflow-hidden px-[var(--shell-content-padding-sm)] py-[var(--shell-content-padding-sm)] md:px-[var(--shell-content-padding)] md:py-[var(--shell-content-padding)]"
              : "px-[var(--shell-content-padding-sm)] py-[var(--shell-content-padding-sm)] md:px-[var(--shell-content-padding)] md:py-[var(--shell-content-padding)]",
          )}
        >
          <div
            className={
              fullHeight
                ? "h-full overflow-hidden"
                : "space-y-[var(--Spacing--Spacing-6xl)]"
            }
          >
            <h1 className="sr-only">{pageTitle}</h1>
            {!dbOk && (
              <Alert variant="warning" title="Database connection issue">
                The backend database is unreachable right now. Some data on this page may be incomplete.
              </Alert>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
