import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  // Dev helper: store token returned by API for direct use without email
  const [devToken, setDevToken] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSent(true);
      // If the backend returned a raw token (dev / SMTP-less), store it so the
      // user can follow the link directly from this page.
      if (result.reset_token) {
        setDevToken(result.reset_token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm px-4">
          <div className="text-center mb-8">
            <img src="/bola-logo.svg" alt="BOLA" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
            <h1 className="text-2xl font-bold text-gray-900">BOLA</h1>
            <p className="text-sm text-gray-500 mt-1">Back Office of LINE API</p>
          </div>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 size={40} className="mx-auto text-green-500" />
              <p className="text-sm text-gray-700">
                If an account with that email exists, a reset link has been sent.
              </p>
              {devToken && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-left text-xs space-y-1">
                  <p className="font-semibold text-yellow-800">Dev mode — no SMTP configured</p>
                  <p className="text-yellow-700">Use this link to reset your password:</p>
                  <a
                    href={`/reset-password?token=${devToken}`}
                    className="text-blue-600 underline break-all"
                  >
                    {window.location.origin}/reset-password?token={devToken}
                  </a>
                </div>
              )}
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <img src="/bola-logo.svg" alt="BOLA" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">BOLA</h1>
          <p className="text-sm text-gray-500 mt-1">Back Office of LINE API</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forgot password?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Enter your email address and we'll send you a reset link.
            </p>
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                <Mail size={16} className="mr-2" />
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <a href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={14} />
                Back to sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
