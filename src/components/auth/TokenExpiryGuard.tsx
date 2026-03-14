import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import {
  getWorkspaceId,
  setToken,
  setTokenExpiry,
  isTokenExpired,
  getTokenExpiresIn,
  logout,
} from "@/lib/auth";
import { AlertTriangle, LogIn } from "lucide-react";

const WARN_BEFORE_MS = 5 * 60 * 1000; // warn 5 minutes before expiry

/**
 * Mounts invisibly in all protected routes. On mount:
 * - If the token is already expired → redirect to /login?reason=expired
 * - If token expires within WARN_BEFORE_MS → show the re-auth dialog immediately
 * - Otherwise → schedule timers for the warning and the hard redirect
 */
export function TokenExpiryGuard() {
  const [showWarning, setShowWarning] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isTokenExpired()) {
      window.location.replace("/login?reason=expired");
      return;
    }

    const expiresIn = getTokenExpiresIn();
    if (expiresIn === Infinity) return; // no expiry stored — nothing to do

    // Show warning immediately if expiry is imminent
    if (expiresIn <= WARN_BEFORE_MS) {
      setShowWarning(true);
      return;
    }

    const warnTimer = setTimeout(() => setShowWarning(true), expiresIn - WARN_BEFORE_MS);
    const expireTimer = setTimeout(() => {
      window.location.replace("/login?reason=expired");
    }, expiresIn);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(expireTimer);
    };
  }, []);

  async function handleReAuth() {
    setError("");
    setLoading(true);
    try {
      const workspaceId = getWorkspaceId() ?? "";
      const result = await authApi.globalLogin(email, password);
      const ws = result.workspaces.find((w) => w.id === workspaceId) ?? result.workspaces[0];
      if (!ws) throw new Error("Workspace not found");
      setToken(ws.token);
      setTokenExpiry(ws.expires_at);
      setShowWarning(false);
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(
        msg.includes("invalid_credentials") || msg.includes("no_workspace_found")
          ? "Invalid email or password."
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  if (!showWarning) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Session expiring soon
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Your session is about to expire. Sign in again to continue working without losing your progress.
        </p>

        <div className="space-y-3 mt-1">
          <div className="space-y-1.5">
            <Label htmlFor="reauth-email">Email</Label>
            <Input
              id="reauth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") void handleReAuth(); }}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
            <Button size="sm" onClick={() => void handleReAuth()} disabled={loading}>
              <LogIn size={14} className="mr-1.5" />
              {loading ? "Signing in…" : "Stay signed in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
