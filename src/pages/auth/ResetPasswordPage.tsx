import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { KeyRound, CheckCircle2 } from "lucide-react";

function getTokenFromURL(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

export function ResetPasswordPage() {
  const [token] = useState(getTokenFromURL);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("reset_token_expired")) {
        setError("This reset link has expired. Please request a new one.");
      } else if (msg.includes("reset_token_used")) {
        setError("This reset link has already been used. Please request a new one.");
      } else if (msg.includes("reset_token_invalid")) {
        setError("Invalid reset link. Please request a new one.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
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
              <p className="font-semibold text-gray-800">Password updated!</p>
              <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => { window.location.href = "/login"; }}>
                Sign in
              </Button>
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
            <CardTitle className="text-lg">Set new password</CardTitle>
          </CardHeader>
          <CardContent>
            {!token && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                No reset token found. Please use the link from your email.
              </div>
            )}
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !token}>
                <KeyRound size={16} className="mr-2" />
                {loading ? "Saving…" : "Set new password"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <a href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Back to sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
