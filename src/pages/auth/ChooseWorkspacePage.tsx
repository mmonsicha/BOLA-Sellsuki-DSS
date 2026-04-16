import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  DSButton,
  EmptyState,
} from "@uxuissk/design-system";
import { authApi, type MyWorkspace } from "@/api/auth";
import { setWorkspaceId, logout } from "@/lib/auth";
import { AuthStatusBar } from "@/components/auth/AuthStatusBar";
import {
  Building2,
  ChevronRight,
  FolderOpen,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";

function groupByCompany(workspaces: MyWorkspace[]): { label: string; companyId: string; items: MyWorkspace[] }[] {
  const groups = new Map<string, { label: string; companyId: string; items: MyWorkspace[] }>();

  for (const ws of workspaces) {
    const key = ws.company_id || "__personal__";
    if (!groups.has(key)) {
      groups.set(key, {
        label: ws.company_name || "Personal Workspaces",
        companyId: ws.company_id || "",
        items: [],
      });
    }
    groups.get(key)!.items.push(ws);
  }

  return [...groups.values()].sort((a, b) => {
    if (!a.companyId && b.companyId) return 1;
    if (a.companyId && !b.companyId) return -1;
    return a.label.localeCompare(b.label);
  });
}

export function ChooseWorkspacePage() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [workspaces, setWorkspaces] = useState<MyWorkspace[]>([]);
  const [error, setError] = useState("");

  const fetchWorkspaces = useCallback(() => {
    setPhase("loading");
    setError("");

    authApi
      .getMyWorkspaces()
      .then((res) => {
        if (!res || !res.workspaces) {
          setWorkspaces([]);
          setPhase("ready");
          return;
        }

        setWorkspaces(res.workspaces);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load workspaces";
        setError(msg);
        setPhase("error");
      });
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const groups = useMemo(() => groupByCompany(workspaces), [workspaces]);

  function handleSelect(ws: MyWorkspace) {
    setWorkspaceId(ws.id);
    window.location.href = "/";
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef5f1_100%)]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-[#06C755]" />
          <span className="text-sm font-medium text-[var(--foreground)]">Loading your workspaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,199,85,0.08),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef5f1_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden rounded-[28px] border border-white/60 bg-white/75 p-8 shadow-sm backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#06C755]/10 text-[#06C755]">
                <Building2 size={26} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#06C755]">Workspace Access</p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight text-[var(--foreground)]">
                  Choose where you want to continue working in BOLA.
                </h1>
                <p className="max-w-lg text-base leading-7 text-[var(--muted-foreground)]">
                  Grouped workspaces help you switch cleanly between companies while keeping the admin experience
                  consistent with the latest Sellsuki Design System.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Companies", value: String(groups.filter((group) => group.companyId).length) },
                { label: "Workspaces", value: String(workspaces.length) },
              ].map((item) => (
                <Card key={item.label} elevation="none" className="border-[var(--border)]/80 bg-white/90">
                  <CardBody>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[var(--muted-foreground)]">{item.label}</div>
                      <div className="text-2xl font-semibold text-[var(--foreground)]">{item.value}</div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          <section className="w-full">
            <AuthStatusBar />
            <Card className="border-white/60 bg-white/92 shadow-sm backdrop-blur" elevation="none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06C755]/10 text-[#06C755]">
                      <FolderOpen size={20} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">Choose Workspace</h2>
                      <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                        Select a workspace to continue into the latest DS-aligned admin area.
                      </p>
                    </div>
                  </div>

                  <DSButton variant="ghost" onClick={() => void logout()}>
                    <LogOut size={16} />
                    <span className="ml-2">Sign out</span>
                  </DSButton>
                </div>
              </CardHeader>

              <CardBody>
                {phase === "error" && (
                  <div className="space-y-4">
                    <Alert variant="error" title="Cannot load workspaces">
                      {error}
                    </Alert>
                    <div className="flex flex-wrap gap-3">
                      <DSButton variant="primary" onClick={fetchWorkspaces}>
                        <RefreshCw size={16} />
                        <span className="ml-2">Try Again</span>
                      </DSButton>
                      <DSButton variant="secondary" onClick={() => void logout()}>
                        <LogOut size={16} />
                        <span className="ml-2">Sign out</span>
                      </DSButton>
                    </div>
                  </div>
                )}

                {phase === "ready" && workspaces.length === 0 && (
                  <EmptyState
                    icon={<Building2 size={48} />}
                    title="No workspaces found"
                    description="Your account does not have any accessible workspaces yet. Contact your administrator to request access."
                    action={
                      <DSButton variant="secondary" onClick={() => void logout()}>
                        Sign out
                      </DSButton>
                    }
                  />
                )}

                {phase === "ready" && workspaces.length > 0 && (
                  <div className="space-y-5">
                    {groups.map((group) => (
                      <section key={group.companyId || "__personal__"} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          {group.companyId ? (
                            <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
                          ) : (
                            <FolderOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                          )}
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                            {group.label}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((ws) => (
                            <button
                              key={ws.id}
                              type="button"
                              onClick={() => handleSelect(ws)}
                              className="flex w-full items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-left transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#06C755]/10 text-[#06C755]">
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold text-[var(--foreground)]">{ws.name}</div>
                                <div className="truncate text-sm text-[var(--muted-foreground)]">{ws.slug}</div>
                              </div>
                              <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
