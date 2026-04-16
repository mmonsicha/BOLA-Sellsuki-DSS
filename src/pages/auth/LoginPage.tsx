import { useState } from "react";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  DSButton,
  DSInput,
} from "@uxuissk/design-system";
import { authApi, type WorkspaceEntry } from "@/api/auth";
import { setToken, setTokenExpiry, setWorkspaceId } from "@/lib/auth";
import { Building2, ChevronRight, LogIn, Mail, Lock } from "lucide-react";

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
        const ws = result.workspaces[0];
        setToken(ws.token);
        setWorkspaceId(ws.id);
        setTokenExpiry(ws.expires_at);
        window.location.href = "/";
        return;
      }

      setWorkspaces(result.workspaces);
      setStep("workspace-picker");
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
    setTokenExpiry(ws.expires_at);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,199,85,0.10),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef5f1_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[28px] border border-white/60 bg-white/75 p-8 shadow-sm backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#06C755] shadow-sm">
                <img src="/bola-logo.svg" alt="BOLA" className="h-10 w-10 rounded-xl" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#06C755]">BOLA Workspace</p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight text-[var(--foreground)]">
                  Back Office of LINE API built on the latest Sellsuki Design System.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
                  Sign in to manage broadcasts, contacts, LINE OA connections, and automation flows from one
                  admin workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "LINE OA", value: "Multi account" },
                { label: "Contacts", value: "Follower CRM" },
                { label: "Automation", value: "Always-on flows" },
              ].map((item) => (
                <Card key={item.label} elevation="none" className="border-[var(--border)]/80 bg-white/90">
                  <CardBody>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[var(--muted-foreground)]">{item.label}</div>
                      <div className="text-base font-semibold text-[var(--foreground)]">{item.value}</div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          <section className="w-full">
            <Card className="border-white/60 bg-white/92 shadow-sm backdrop-blur" elevation="none">
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06C755]/10 text-[#06C755]">
                      <LogIn size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--muted-foreground)]">BOLA</div>
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        {step === "credentials" ? "Sign in" : "Choose workspace"}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {step === "credentials"
                      ? "Use your workspace credentials to access the latest DS-first BOLA admin."
                      : "Pick the workspace you want to enter for this session."}
                  </p>
                </div>
              </CardHeader>

              <CardBody>
                {step === "credentials" ? (
                  <form onSubmit={(e) => { void handleCredentialsSubmit(e); }} className="space-y-5">
                    <DSInput
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      leftIcon={<Mail size={16} />}
                      inputSize="lg"
                      required
                      fullWidth
                    />

                    <DSInput
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      leftIcon={<Lock size={16} />}
                      showPasswordToggle
                      inputSize="lg"
                      required
                      fullWidth
                    />

                    {error && (
                      <Alert variant="error" title="Sign in failed">
                        {error}
                      </Alert>
                    )}

                    <div className="space-y-3 pt-1">
                      <DSButton type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                      </DSButton>

                      <div className="space-y-1 text-center">
                        <a href="/forgot-password" className="text-sm text-[var(--primary)] hover:underline">
                          Forgot password?
                        </a>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Contact your workspace admin if you need access.
                        </p>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => handleSelectWorkspace(ws)}
                        className="flex w-full items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-left transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#06C755]/10 text-[#06C755]">
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-[var(--foreground)]">{ws.name}</div>
                          <div className="truncate text-sm text-[var(--muted-foreground)]">
                            Access workspace and continue to dashboard
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
                      </button>
                    ))}

                    <DSButton
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={() => {
                        setStep("credentials");
                        setError("");
                      }}
                    >
                      Back to credentials
                    </DSButton>
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
