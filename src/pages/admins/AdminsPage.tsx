import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { authApi, type AdminResponse } from "@/api/auth";
import { getWorkspaceId } from "@/lib/auth";
import { KeyRound, Users } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";

export function AdminsPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const { addToast } = useToast();
  const { currentAdmin } = useCurrentAdmin();

  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState<AdminResponse | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    authApi.listAdmins(workspaceId)
      .then(({ data }) => {
        setAdmins(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Only show Reset password controls when the current user is a super_admin.
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  function openResetDialog(admin: AdminResponse) {
    setResetTarget(admin);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  }

  async function handleReset() {
    if (!resetTarget) return;
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetting(true);
    setResetError("");
    try {
      await authApi.resetAdminPassword(workspaceId, resetTarget.id, newPassword);
      addToast({ type: "success", message: `Password reset for ${resetTarget.name || resetTarget.email}` });
      setResetTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      if (msg.includes("forbidden")) {
        setResetError("Only super admins can reset passwords.");
      } else {
        setResetError(msg);
      }
    } finally {
      setResetting(false);
    }
  }

  function roleBadgeVariant(role: string) {
    switch (role) {
      case "super_admin": return "default";
      case "admin": return "secondary";
      default: return "outline";
    }
  }

  function statusBadgeVariant(status: string) {
    return status === "active" ? "default" : "secondary";
  }

  return (
    <AppLayout title="Team Members" icon={<Users size={20} />}>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : admins.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No team members yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Name / Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  {isSuperAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{admin.name || "—"}</div>
                      <div className="text-muted-foreground text-xs">{admin.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeVariant(admin.role)} className="text-xs">
                        {admin.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(admin.status)} className="text-xs">
                        {admin.status}
                      </Badge>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResetDialog(admin)}
                          className="gap-1.5"
                        >
                          <KeyRound size={13} />
                          Reset password
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Reset password dialog */}
      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-4">
            Set a new password for <strong>{resetTarget?.name || resetTarget?.email}</strong>.
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            {resetError && <p className="text-sm text-red-600">{resetError}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetting}>
              Cancel
            </Button>
            <Button onClick={() => { void handleReset(); }} disabled={resetting}>
              <KeyRound size={14} className="mr-1.5" />
              {resetting ? "Resetting…" : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
