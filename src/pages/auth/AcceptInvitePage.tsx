import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { setToken, setWorkspaceId, setTokenExpiry } from "@/lib/auth";
import { KeyRound } from "lucide-react";

export function AcceptInvitePage() {
  const params = new URLSearchParams(window.location.search);
  const workspaceId = params.get("workspace_id") ?? "";
  const emailParam = params.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.acceptInvite(workspaceId, email, password);
      setToken(result.token);
      setWorkspaceId(workspaceId);
      setTokenExpiry(result.expires_at);
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set password";
      if (msg.includes("admin_not_pending")) {
        setError("This invitation has already been accepted. Try logging in.");
      } else if (msg.includes("admin_not_found")) {
        setError("Invitation not found. Please contact your administrator.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Invalid invitation link. Missing workspace_id parameter.</p>
          <a href="/login" className="text-line hover:underline text-sm mt-2 block">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <img src="/bola-logo.svg" alt="BOLA" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Set your password</h1>
          <p className="text-sm text-gray-500 mt-1">You've been invited to join BOLA</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  readOnly={Boolean(emailParam)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                <KeyRound size={16} className="mr-2" />
                {loading ? "Setting up…" : "Set password & sign in"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-center text-gray-400">
              Already have an account?{" "}
              <a href="/login" className="text-line hover:underline">Sign in</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
