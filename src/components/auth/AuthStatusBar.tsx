import { useEffect, useState } from "react";
import { User, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { getAuthMode } from "@/lib/auth";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; email: string; workspaceCount: number }
  | { status: "unauthenticated"; detail?: string }
  | { status: "error"; message: string };

export function AuthStatusBar() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const authMode = getAuthMode();

  const checkSession = () => {
    setSession({ status: "loading" });

    // Call /v1/me/workspaces through same-origin (Caddy routes to bola-backend).
    // Backend validates Kratos session cookie and returns workspaces.
    // 401 = not authenticated, 405 = auth mode doesn't support this, 200 = OK
    fetch("/v1/me/workspaces", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          const body = await res.json().catch(() => ({}));
          setSession({
            status: "unauthenticated",
            detail: body.error_code || "no_session",
          });
          return;
        }
        if (res.status === 405) {
          setSession({
            status: "error",
            message: `Auth mode "${authMode}" does not support workspace listing`,
          });
          return;
        }
        if (!res.ok) {
          setSession({ status: "error", message: `API returned ${res.status}` });
          return;
        }
        const data = await res.json();
        const workspaces = data?.workspaces ?? [];
        setSession({
          status: "authenticated",
          email: workspaces.length > 0 ? `${workspaces.length} workspace(s)` : "no workspaces",
          workspaceCount: workspaces.length,
        });
      })
      .catch((err) => {
        setSession({ status: "error", message: err.message ?? "Network error" });
      });
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="rounded-lg border px-3 py-2 text-xs bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status dot */}
            {session.status === "loading" && (
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />
            )}
            {session.status === "authenticated" && (
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            )}
            {session.status === "unauthenticated" && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
            {session.status === "error" && (
              <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
            )}

            {/* Identity info */}
            {session.status === "loading" && (
              <span className="text-gray-400">Checking session...</span>
            )}
            {session.status === "authenticated" && (
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-medium">
                  Session valid · {session.email}
                </span>
              </div>
            )}
            {session.status === "unauthenticated" && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="text-red-600">
                  Not authenticated
                  {session.detail && (
                    <span className="text-red-400 ml-1">({session.detail})</span>
                  )}
                </span>
              </div>
            )}
            {session.status === "error" && (
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                <span className="text-yellow-700 truncate">{session.message}</span>
              </div>
            )}
          </div>

          {/* Right side: auth mode badge + refresh */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={checkSession}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <Shield className="w-3 h-3 text-gray-400" />
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
              {authMode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
