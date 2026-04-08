import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Phone, Link2, UserCheck, UserX, Trash2, Unlink, Send, Plus, X, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { maskPhone } from "@/lib/phone";
import { followerApi } from "@/api/follower";
import type { PhoneContactActivity } from "@/api/follower";
import type { PhoneContactDetail } from "@/types";
import { cn } from "@/lib/utils";

interface PhoneContactDetailPageProps {
  contactId: string;
}

function getInitials(first: string, last: string, phone: string): string {
  if (first) return (first[0] + (last ? last[0] : "")).toUpperCase();
  return phone.slice(-2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const sourceBadgeClass: Record<string, string> = {
  csv: "bg-blue-100 text-blue-700 border-0",
  webhook: "bg-purple-100 text-purple-700 border-0",
  manual: "bg-gray-100 text-gray-700 border-0",
};

function PhoneContactActivitySection({ contactId }: { contactId: string }) {
  const [activity, setActivity] = useState<PhoneContactActivity | null>(null);

  useEffect(() => {
    followerApi.getPhoneContactActivity(contactId)
      .then(setActivity)
      .catch(() => {});
  }, [contactId]);

  if (!activity) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send size={16} />
          Messaging Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Broadcasts</div>
            <div className="font-semibold">{activity.total_broadcasts.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">LON Messages</div>
            <div className="font-semibold">{activity.lon_count.toLocaleString()}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">PNP</div>
            <div className="font-semibold">{activity.pnp_success.toLocaleString()} <span className="text-xs text-muted-foreground">/ {activity.pnp_total}</span></div>
          </div>
        </div>
        {activity.recent_broadcasts.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Recent Broadcasts</div>
            <div className="space-y-2">
              {activity.recent_broadcasts.map((dl) => (
                <div key={dl.id} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                  <span className="text-muted-foreground">{dl.created_at ? new Date(dl.created_at).toLocaleString() : "-"}</span>
                  <Badge variant={dl.status === "success" ? "success" : dl.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                    {dl.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PhoneContactDetailPage({ contactId }: PhoneContactDetailPageProps) {
  const [contact, setContact] = useState<PhoneContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unlinkingOAId, setUnlinkingOAId] = useState<string | null>(null);

  // Contact profile form state
  const [profileForm, setProfileForm] = useState({ email: "", note: "", tags: [] as string[], custom_fields: {} as Record<string, string> });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  useEffect(() => {
    setLoading(true);
    followerApi
      .getPhoneContact(contactId)
      .then((c) => {
        setContact(c);
        const cp = c.contact_profile;
        setProfileForm({
          email: cp?.email ?? "",
          note: cp?.note ?? "",
          tags: cp?.tags ?? [],
          custom_fields: cp?.custom_fields ?? {},
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load contact"))
      .finally(() => setLoading(false));
  }, [contactId]);

  const handleUnlink = async (lineOAId: string) => {
    setUnlinkingOAId(lineOAId);
    try {
      await followerApi.unlinkPhoneContactFollower(contactId, lineOAId);
      const fresh = await followerApi.getPhoneContact(contactId);
      setContact(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink");
    } finally {
      setUnlinkingOAId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await followerApi.deletePhoneContact(contactId);
      window.history.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!contact) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const updated = await followerApi.updatePhoneContactProfile(contact.id, profileForm);
      setContact(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || maskPhone(contact.phone)
    : "";

  return (
    <AppLayout title="Contact Detail">
      <div className="space-y-4 max-w-3xl">
        {/* Back */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Back to Contacts
          </Button>

          {contact && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Delete Contact
            </Button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card>
            <CardContent className="py-12 text-center text-destructive text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!loading && contact && (
          <>
            {/* Header card */}
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-lg flex-shrink-0">
                  {getInitials(contact.first_name, contact.last_name, contact.phone)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-semibold">{fullName}</h1>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        sourceBadgeClass[contact.source] ?? sourceBadgeClass.manual
                      )}
                    >
                      {contact.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Phone size={13} />
                    <span className="font-mono">{maskPhone(contact.phone)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Imported {formatDate(contact.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Linked OAs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 size={16} />
                  Linked LINE OAs
                  <Badge variant="secondary" className="ml-auto">
                    {contact.linked_oas.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {contact.linked_oas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <div className="text-2xl mb-2">🔗</div>
                    No LINE OAs linked yet.
                    <br />
                    This contact has not been matched to any LINE OA follower.
                  </div>
                ) : (
                  <div className="divide-y">
                    {contact.linked_oas.map((oa) => (
                      <div key={oa.id} className="flex items-start gap-3 py-3">
                        {/* Status icon / follower avatar */}
                        <div className="mt-0.5 flex-shrink-0">
                          {oa.is_follower && oa.follower_picture_url ? (
                            <img
                              src={oa.follower_picture_url}
                              alt={oa.follower_display_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={cn(oa.is_follower ? "text-line" : "text-muted-foreground")}>
                              {oa.is_follower ? <UserCheck size={16} /> : <UserX size={16} />}
                            </div>
                          )}
                        </div>

                        {/* Detail */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{oa.line_oa_name || oa.line_oa_id}</span>
                            {oa.is_follower ? (
                              <span className="text-xs text-line font-medium">Follower</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Phone</span>
                            )}
                          </div>
                          {oa.is_follower && oa.follower_display_name && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">LINE Name:</span>
                              <span className="text-xs font-medium text-foreground">{oa.follower_display_name}</span>
                            </div>
                          )}
                          {oa.line_oa_basic_id && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Basic ID:</span>
                              <span className="font-mono text-xs text-foreground">{oa.line_oa_basic_id}</span>
                            </div>
                          )}
                          {oa.line_user_id && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">LINE UID:</span>
                              <span className="font-mono text-xs text-foreground">{oa.line_user_id}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Linked {formatDate(oa.linked_at)}
                          </p>
                        </div>

                        {/* Unlink button — only when LINE UID is set */}
                        {oa.line_user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
                            disabled={unlinkingOAId === oa.line_oa_id}
                            onClick={() => void handleUnlink(oa.line_oa_id)}
                          >
                            <Unlink size={12} />
                            {unlinkingOAId === oa.line_oa_id ? "Unlinking…" : "Unlink"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Contact Profile */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="contact@example.com"
                  />
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Note</label>
                  <textarea
                    rows={2}
                    value={profileForm.note}
                    onChange={(e) => setProfileForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Internal notes about this contact…"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {profileForm.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setProfileForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                          className="hover:text-blue-900"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTag.trim()) {
                          e.preventDefault();
                          if (!profileForm.tags.includes(newTag.trim())) {
                            setProfileForm((f) => ({ ...f, tags: [...f.tags, newTag.trim()] }));
                          }
                          setNewTag("");
                        }
                      }}
                      className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Add tag and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newTag.trim() && !profileForm.tags.includes(newTag.trim())) {
                          setProfileForm((f) => ({ ...f, tags: [...f.tags, newTag.trim()] }));
                        }
                        setNewTag("");
                      }}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Custom Fields</label>
                  <div className="space-y-1.5 mb-2">
                    {Object.entries(profileForm.custom_fields).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{k}</span>
                        <span className="flex-1 text-muted-foreground truncate">{v}</span>
                        <button
                          type="button"
                          onClick={() => setProfileForm((f) => {
                            const next = { ...f.custom_fields };
                            delete next[k];
                            return { ...f, custom_fields: next };
                          })}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      className="w-1/3 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newFieldKey.trim()) {
                          setProfileForm((f) => ({ ...f, custom_fields: { ...f.custom_fields, [newFieldKey.trim()]: newFieldValue } }));
                          setNewFieldKey("");
                          setNewFieldValue("");
                        }
                      }}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>

                {/* Save button + status */}
                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={() => void handleSaveProfile()} disabled={saving} size="sm">
                    {saving ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : null}
                    {saving ? "Saving…" : "Save Profile"}
                  </Button>
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle size={14} /> Saved
                    </span>
                  )}
                  {saveError && (
                    <span className="flex items-center gap-1 text-sm text-destructive">
                      <XCircle size={14} /> {saveError}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Messaging Activity */}
        {contact && <PhoneContactActivitySection contactId={contact.id} />}
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Contact นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{fullName}</span> ({contact ? maskPhone(contact.phone) : ""}) จะถูกลบออกจากระบบถาวร
              รวมถึง OA linkage ทั้งหมด ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "กำลังลบ…" : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
