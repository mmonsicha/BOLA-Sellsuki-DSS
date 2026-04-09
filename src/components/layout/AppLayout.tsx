import { AppShell, Alert, type NavItem, type ShellUser } from "@uxuissk/design-system";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { getAuthMode, logout, switchWorkspace } from "@/lib/auth";
import { bolaProductConfig, buildBolaNavGroups, buildBolaUtilityItems, resolveBolaActiveItem } from "./shellConfig";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean;
}

export function AppLayout({ children, title, fullHeight }: AppLayoutProps) {
  const { currentAdmin, isAdminOrAbove } = useCurrentAdmin();
  const { dbOk } = useHealthCheck();
  const currentPath = window.location.pathname;

  const shellUser: ShellUser = {
    name: currentAdmin?.name || "BOLA Admin",
    email: currentAdmin?.email,
    role: currentAdmin?.role,
    permissions: [],
  };

  const handleNavigate = (item: NavItem) => {
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

  return (
    <AppShell
      product={bolaProductConfig}
      user={shellUser}
      navResolver={async () => buildBolaNavGroups(isAdminOrAbove)}
      activeItemId={resolveBolaActiveItem(currentPath)}
      onNavigate={handleNavigate}
      title={title || "BOLA"}
      version="v1.0.0"
      contentPadding={!fullHeight}
      utilityItems={buildBolaUtilityItems(getAuthMode() === "kratos")}
    >
      <div className={fullHeight ? "h-full overflow-hidden" : "space-y-6"}>
        {!dbOk && (
          <Alert variant="warning" title="Database connection issue">
            The backend database is unreachable right now. Some data on this page may be incomplete.
          </Alert>
        )}
        {children}
      </div>
    </AppShell>
  );
}
