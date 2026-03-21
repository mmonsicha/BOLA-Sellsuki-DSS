import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, type MyWorkspace } from "@/api/auth";
import { setWorkspaceId, logout } from "@/lib/auth";
import { Building2, ChevronRight, Loader2, LogOut, RefreshCw } from "lucide-react";

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
          // client.ts 401 handler fired — browser is navigating to Kratos login.
          // Just stay on loading spinner until navigation completes.
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

  function handleSelect(ws: MyWorkspace) {
    setWorkspaceId(ws.id);
    window.location.href = "/";
  }

  // Loading — spinner only, no page chrome
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error — show error with retry + sign out
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
            <Button variant="outline" className="w-full gap-2" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready — workspace chooser
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
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
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground gap-1.5 -mr-2">
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </CardHeader>
          <CardContent>
            {workspaces.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workspaces found.</p>
                <p className="text-xs mt-1">Contact your administrator to get access.</p>
              </div>
            )}

            {workspaces.length > 0 && (
              <ul className="divide-y">
                {workspaces.map((ws) => (
                  <li key={ws.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 px-2"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
