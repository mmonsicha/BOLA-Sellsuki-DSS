import { useCallback, useEffect, useState } from "react";
import { Badge, DSButton } from "@uxuissk/design-system";
import { AlertCircle, RefreshCw, Shield, User } from "lucide-react";
import { getAuthMode } from "@/lib/auth";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; email: string; workspaceCount: number }
  | { status: "unauthenticated"; detail?: string }
  | { status: "error"; message: string };

export function AuthStatusBar() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const authMode = getAuthMode();

  const checkSession = useCallback(() => {
    setSession({ status: "loading" });

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
  }, [authMode]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div className="mx-auto mb-[var(--Spacing--Spacing-3xl)] w-full max-w-sm">
      <div className="rounded-[var(--Border-radius--radius-md)] border border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] px-[var(--Spacing--Spacing-xl)] py-[var(--Spacing--Spacing-lg)] shadow-[var(--elevation-sm)]">
        <div className="flex items-center justify-between gap-[var(--Spacing--Spacing-lg)]">
          <div className="flex min-w-0 items-center gap-[var(--Spacing--Spacing-lg)]">
            {session.status === "loading" && (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--Colors--Background--bg-disabled)]" />
            )}
            {session.status === "authenticated" && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--Colors--Background--bg-success-solid)]" />
            )}
            {session.status === "unauthenticated" && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--Colors--Background--bg-danger-solid)]" />
            )}
            {session.status === "error" && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--Colors--Background--bg-warning-solid)]" />
            )}

            {session.status === "loading" && (
              <span className="text-[var(--text-caption)] text-[var(--Colors--Text--text-secondary)]">
                Checking session...
              </span>
            )}
            {session.status === "authenticated" && (
              <div className="flex min-w-0 items-center gap-[var(--Spacing--Spacing-sm)]">
                <User className="h-3 w-3 shrink-0 text-[var(--Colors--Icon--icon-success)]" />
                <span className="text-[var(--text-caption)] font-medium text-[var(--Colors--Text--text-success-primary)]">
                  Session valid • {session.email}
                </span>
              </div>
            )}
            {session.status === "unauthenticated" && (
              <div className="flex items-center gap-[var(--Spacing--Spacing-sm)]">
                <AlertCircle className="h-3 w-3 shrink-0 text-[var(--Colors--Icon--icon-error)]" />
                <span className="text-[var(--text-caption)] text-[var(--Colors--Text--text-danger-primary)]">
                  Not authenticated
                  {session.detail && (
                    <span className="ml-1 text-[var(--Colors--Text--text-secondary)]">({session.detail})</span>
                  )}
                </span>
              </div>
            )}
            {session.status === "error" && (
              <div className="flex min-w-0 items-center gap-[var(--Spacing--Spacing-sm)]">
                <AlertCircle className="h-3 w-3 shrink-0 text-[var(--Colors--Icon--icon-warning)]" />
                <span className="truncate text-[var(--text-caption)] text-[var(--Colors--Text--text-warning-primary)]">
                  {session.message}
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-[var(--Spacing--Spacing-sm)]">
            <DSButton
              onClick={checkSession}
              variant="ghost"
              size="sm"
              aria-label="Refresh auth status"
            >
              <RefreshCw className="h-3 w-3" />
            </DSButton>
            <Shield className="h-3 w-3 text-[var(--Colors--Icon--icon-primary)]" />
            <Badge variant="secondary" size="sm">
              {authMode}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
