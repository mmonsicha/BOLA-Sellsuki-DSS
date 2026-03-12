import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, type WorkspaceEntry } from "@/api/auth";
import { setToken, setWorkspaceId } from "@/lib/auth";
import { Building2, LogIn, ChevronRight } from "lucide-react";

type Step = "credentials" | "workspace-picker";

export function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.globalLogin(email, password);
      if (result.workspaces.length === 1) {
        // Auto-select the only workspace
        const ws = result.workspaces[0];
        setToken(ws.token);
        setWorkspaceId(ws.id);
        window.location.href = "/";
      } else {
        setWorkspaces(result.workspaces);
        setStep("workspace-picker");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("no_workspace_found") || msg.includes("invalid_credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectWorkspace(ws: WorkspaceEntry) {
    setToken(ws.token);
    setWorkspaceId(ws.id);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/bola-logo.svg" alt="BOLA" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">BOLA</h1>
          <p className="text-sm text-gray-500 mt-1">Back Office of LINE API</p>
        </div>

        {step === "credentials" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { void handleCredentialsSubmit(e); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn size={16} className="mr-2" />
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <p className="mt-4 text-xs text-center text-gray-400">
                Contact your workspace admin if you need access.
              </p>
            </CardContent>
          </Card>
        )}

        {step === "workspace-picker" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-line hover:bg-green-50 transition-colors text-left"
                >
                  <Building2 size={18} className="text-gray-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-800">{ws.name}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
              <button
                onClick={() => { setStep("credentials"); setError(""); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 mt-2 py-1"
              >
                ← Back
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
