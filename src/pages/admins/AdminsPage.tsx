import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authApi, type AdminResponse } from "@/api/auth";
import { getWorkspaceId } from "@/lib/auth";
import { Copy, KeyRound, UserPlus, Users, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";

const ROLE_ORDER: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  super_admin: 4,
};

function roleBadgeClass(role: string): string {
  switch (role) {
    case "super_admin": return "bg-purple-100 text-purple-800 border-purple-200";
    case "admin": return "bg-blue-100 text-blue-800 border-blue-200";
    case "editor": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function AdminsPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const { addToast } = useToast();
  const { currentAdmin, isSuperAdmin, isAdminOrAbove } = useCurrentAdmin();

  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState<AdminResponse | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<AdminResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Remove confirmation dialog state
  const [removeTarget, setRemoveTarget] = useState<AdminResponse | null>(null);
  const [removing, setRemoving] = useState(false);

  // Toggle status confirmation state
  const [toggleTarget, setToggleTarget] = useState<AdminResponse | null>(null);
  const [toggling, setToggling] = useState(false);

  const loadAdmins = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    authApi.listAdmins(workspaceId)
      .then(({ data }) => { setAdmins(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  /** Can the current user manage the given target admin? */
  function canManage(target: AdminResponse): boolean {
    if (!currentAdmin) return false;
    // Cannot manage yourself
    if (target.id === currentAdmin.id) return false;
    const targetRank = ROLE_ORDER[target.role] ?? 0;
    // super_admin can manage anyone below super_admin
    if (isSuperAdmin) return targetRank < 4;
    // admin can manage editors and viewers only
    if (isAdminOrAbove) return targetRank < 3;
    return false;
  }

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

  function openInviteDialog() {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("admin");
    setInviteError("");
    setInviteUrl("");
    setInviteOpen(true);
  }

  async function handleInvite() {
    setInviteError("");
    if (!inviteEmail.trim()) {
      setInviteError("Email is required.");
      return;
    }
    setInviting(true);
    try {
      const created = await authApi.inviteAdmin(workspaceId, inviteEmail.trim(), inviteName.trim(), inviteRole);
      const url = `${window.location.origin}/accept-invite?workspace_id=${workspaceId}&email=${encodeURIComponent(created.email)}`;
      setInviteUrl(url);
      const { data } = await authApi.listAdmins(workspaceId);
      setAdmins(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to invite admin";
      if (msg.includes("email_taken")) {
        setInviteError("This email is already a member of this workspace.");
      } else if (msg.includes("invalid_role")) {
        setInviteError("Invalid role selected.");
      } else {
        setInviteError(msg);
      }
    } finally {
      setInviting(false);
    }
  }

  function copyInviteUrl() {
    void navigator.clipboard.writeText(inviteUrl);
    addToast({ type: "success", message: "Invite link copied to clipboard" });
  }

  function openEditDialog(admin: AdminResponse) {
    setEditTarget(admin);
    setEditName(admin.name);
    setEditRole(admin.role);
    setEditError("");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditing(true);
    setEditError("");
    try {
      const updated = await authApi.updateAdmin(workspaceId, editTarget.id, {
        name: editName.trim() || undefined,
        role: editRole,
      });
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      addToast({ type: "success", message: `Updated ${updated.name || updated.email}` });
      setEditTarget(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setEditing(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await authApi.removeAdmin(workspaceId, removeTarget.id);
      setAdmins((prev) => prev.filter((a) => a.id !== removeTarget.id));
      addToast({ type: "success", message: `Removed ${removeTarget.name || removeTarget.email}` });
      setRemoveTarget(null);
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to remove admin" });
    } finally {
      setRemoving(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const isActive = toggleTarget.status === "active";
      const updated = isActive
        ? await authApi.deactivateAdmin(workspaceId, toggleTarget.id)
        : await authApi.activateAdmin(workspaceId, toggleTarget.id);
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      addToast({
        type: "success",
        message: `${updated.name || updated.email} ${updated.status === "active" ? "activated" : "deactivated"}`,
      });
      setToggleTarget(null);
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setToggling(false);
    }
  }

  function statusBadgeVariant(status: string) {
    return status === "active" ? "default" : "secondary";
  }

  const showActionColumn = isAdminOrAbove;

  return (
    <AppLayout title="Team Members" icon={<Users size={20} />}>
      <div className="space-y-4">
        {isSuperAdmin && (
          <div className="flex justify-end">
            <Button onClick={openInviteDialog} className="gap-2">
              <UserPlus size={16} />
              Invite member
            </Button>
          </div>
        )}

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
                    {showActionColumn && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{admin.name || "—"}</div>
                        <div className="text-muted-foreground text-xs">{admin.email}</div>
                        {admin.id === currentAdmin?.id && (
                          <span className="text-xs text-muted-foreground italic">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass(admin.role)}`}>
                          {admin.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(admin.status)} className="text-xs">
                          {admin.status}
                        </Badge>
                      </td>
                      {showActionColumn && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {isSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openResetDialog(admin)}
                                className="gap-1.5 text-xs"
                                title="Reset password"
                              >
                                <KeyRound size={13} />
                                <span className="hidden sm:inline">Reset pw</span>
                              </Button>
                            )}
                            {canManage(admin) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(admin)}
                                  title="Edit"
                                >
                                  <Pencil size={13} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setToggleTarget(admin)}
                                  title={admin.status === "active" ? "Deactivate" : "Activate"}
                                >
                                  {admin.status === "active"
                                    ? <UserX size={13} className="text-amber-600" />
                                    : <UserCheck size={13} className="text-green-600" />
                                  }
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRemoveTarget(admin)}
                                  title="Remove"
                                >
                                  <Trash2 size={13} className="text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset password dialog */}
      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{resetTarget?.name || resetTarget?.email}</strong>.
            </p>
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
          <DialogFooter>
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

      {/* Edit admin dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team member</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                type="text"
                autoComplete="off"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editing}>
              Cancel
            </Button>
            <Button onClick={() => { void handleEdit(); }} disabled={editing}>
              <Pencil size={14} className="mr-1.5" />
              {editing ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeTarget?.name || removeTarget?.email}</strong> from the workspace.
              They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleRemove(); }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle status confirmation */}
      <AlertDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.status === "active" ? "Deactivate" : "Activate"} team member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.status === "active"
                ? `Deactivating ${toggleTarget?.name || toggleTarget?.email} will prevent them from logging in.`
                : `Activating ${toggleTarget?.name || toggleTarget?.email} will restore their access.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleToggleStatus(); }}
              disabled={toggling}
            >
              {toggling ? "Updating…" : (toggleTarget?.status === "active" ? "Deactivate" : "Activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite member dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) { setInviteOpen(false); setInviteUrl(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
          </DialogHeader>

          {inviteUrl ? (
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Invitation created. Share this link with the new team member so they can set their password.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyInviteUrl} title="Copy link">
                  <Copy size={15} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The link is valid until they set their password. You can reset it later if needed.
              </p>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="off"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="invite-name"
                  type="text"
                  autoComplete="off"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            </div>
          )}

          {inviteUrl ? (
            <DialogFooter>
              <Button onClick={() => { setInviteOpen(false); setInviteUrl(""); }}>Done</Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                Cancel
              </Button>
              <Button onClick={() => { void handleInvite(); }} disabled={inviting}>
                <UserPlus size={14} className="mr-1.5" />
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
