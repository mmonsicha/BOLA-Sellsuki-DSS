import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, type MyWorkspace } from "@/api/auth";
import { setWorkspaceId, logout } from "@/lib/auth";
import { Building2, ChevronRight, FolderOpen, Loader2, LogOut, RefreshCw } from "lucide-react";
import { AuthStatusBar } from "@/components/auth/AuthStatusBar";

/** Group workspaces by company_name. Empty company → "Personal Workspaces". */
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

  // Sort: companies first (alphabetical), personal last
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

  // Loading
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Workspaces</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={fetchWorkspaces} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready — grouped workspace chooser
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <AuthStatusBar />
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#06C755] rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Choose Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Select a workspace to continue</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Your Workspaces</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => void logout()} className="text-muted-foreground hover:text-foreground gap-1.5 -mr-2">
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </CardHeader>
          <CardContent className="px-3">
            {workspaces.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workspaces found.</p>
                <p className="text-xs mt-1">Contact your administrator to get access.</p>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.companyId || "__personal__"} className="mb-4 last:mb-0">
                {/* Company header */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  {group.companyId ? (
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </span>
                </div>

                {/* Workspace list */}
                <ul className="divide-y rounded-lg border bg-white">
                  {group.items.map((ws) => (
                    <li key={ws.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between h-auto py-3 px-3 rounded-none first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => handleSelect(ws)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#06C755]/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-[#06C755]" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{ws.name}</p>
                            <p className="text-xs text-muted-foreground">{ws.slug}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
