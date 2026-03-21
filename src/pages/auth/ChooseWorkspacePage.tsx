import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, type MyWorkspace } from "@/api/auth";
import { setWorkspaceId, logout, getAuthMode } from "@/lib/auth";
import { Building2, ChevronRight, Loader2, LogOut } from "lucide-react";

/**
 * Redirect to Kratos login with return_to so we come back here after login.
 */
function redirectToKratosLogin() {
  const kratosLoginUrl = import.meta.env.VITE_KRATOS_LOGIN_URL || "https://accounts.sellsuki.local/login";
  // Use origin + pathname only — strip query params to prevent recursive
  // nesting of return_to (which causes the URL to grow exponentially).
  const cleanUrl = window.location.origin + window.location.pathname;
  window.location.href = `${kratosLoginUrl}?return_to=${encodeURIComponent(cleanUrl)}`;
}

export function ChooseWorkspacePage() {
  // "checking" = verifying Kratos session (show only spinner, no UI)
  // "ready"    = session valid, show workspace list
  // "error"    = non-Kratos error (local_jwt mode only)
  const [phase, setPhase] = useState<"checking" | "ready" | "error">("checking");
  const [workspaces, setWorkspaces] = useState<MyWorkspace[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi
      .getMyWorkspaces()
      .then((res) => {
        if (!res || !res.workspaces) {
          // client.ts 401 handler returned undefined — session invalid
          if (getAuthMode() === "kratos") {
            redirectToKratosLogin();
            return;
          }
        }
        setWorkspaces(res.workspaces ?? []);
        setPhase("ready");
      })
      .catch(() => {
        // In Kratos mode, any API error = session invalid → login
        if (getAuthMode() === "kratos") {
          redirectToKratosLogin();
          return;
        }
        setError("Failed to load workspaces");
        setPhase("error");
      });
  }, []);

  function handleSelect(ws: MyWorkspace) {
    setWorkspaceId(ws.id);
    window.location.href = "/";
  }

  // Phase 1: Checking session — show only a centered spinner, no page chrome.
  // If user isn't logged in, they'll be redirected before seeing anything else.
  if (phase === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Phase 2: Session confirmed — show workspace chooser
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
            {error && (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            )}

            {!error && workspaces.length === 0 && (
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
