import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DSButton,
  EmptyState,
  Spinner,
  StatCard,
} from "@uxuissk/design-system";
import { FeaturePageScaffold, PageHeader } from "@/components/ui/ds-compat";
import { ArrowLeft, Link2, Phone, Send, Trash2, Unlink, UserCheck, UserX } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
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

function PhoneContactActivityCard({ contactId }: { contactId: string }) {
  const [activity, setActivity] = useState<PhoneContactActivity | null>(null);

  useEffect(() => {
    followerApi.getPhoneContactActivity(contactId).then(setActivity).catch(() => {});
  }, [contactId]);

  if (!activity) return null;

  return (
    <Card elevation="none">
      <CardHeader title="Messaging activity" subtitle="Latest broadcast delivery footprint for this contact." />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Broadcasts" value={activity.total_broadcasts.toLocaleString()} icon={<Send size={18} />} />
          <StatCard title="LON messages" value={activity.lon_count.toLocaleString()} icon={<Send size={18} />} />
          <StatCard title="PNP success" value={`${activity.pnp_success.toLocaleString()} / ${activity.pnp_total.toLocaleString()}`} icon={<Send size={18} />} />
        </div>
        {activity.recent_broadcasts.length > 0 && (
          <div className="space-y-3">
            {activity.recent_broadcasts.map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : "-"}
                </span>
                <Badge variant={delivery.status === "success" ? "success" : delivery.status === "failed" ? "destructive" : "secondary"} size="sm">
                  {delivery.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
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

  useEffect(() => {
    setLoading(true);
    followerApi
      .getPhoneContact(contactId)
      .then(setContact)
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
      setError(err instanceof Error ? err.message : "Failed to unlink contact from LINE OA");
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

  if (loading) {
    return (
      <AppLayout title="Contact Detail">
        <div className="flex justify-center py-16">
          <Spinner label="Loading contact" />
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout title="Contact Detail">
        <EmptyState
          title="Contact not found"
          description={error ?? "This phone contact is not available in the current workspace."}
          action={<DSButton variant="secondary" onClick={() => window.history.back()}>Go back</DSButton>}
        />
      </AppLayout>
    );
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || maskPhone(contact.phone);

  return (
    <AppLayout title="Contact Detail">
      <FeaturePageScaffold
        layout="detail"
        header={(
          <PageHeader
            title={fullName}
            subtitle="Phone-only contact profile and LINE OA linkage details."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contacts", href: "/contacts" }, { label: fullName }]} />}
            actions={(
              <div className="flex items-center gap-3">
                <DSButton variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
                  Back
                </DSButton>
                <DSButton variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setDeleteOpen(true)}>
                  Delete Contact
                </DSButton>
              </div>
            )}
          />
        )}
        banner={error ? <Alert variant="danger" title="Something needs attention">{error}</Alert> : undefined}
        main={(
          <div className="space-y-6">
            <Card elevation="none">
              <CardBody className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-lg font-semibold text-sky-700">
                  {getInitials(contact.first_name, contact.last_name, contact.phone)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{fullName}</h2>
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", sourceBadgeClass[contact.source] ?? sourceBadgeClass.manual)}>
                      {contact.source}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Phone size={14} />
                    <span className="font-mono">{maskPhone(contact.phone)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Imported {formatDate(contact.created_at)}</p>
                </div>
              </CardBody>
            </Card>

            <Card elevation="none">
              <CardHeader
                title="Linked LINE OAs"
                subtitle="Phone contact matches and follower relationships connected to this profile."
                action={<Badge variant="secondary" size="sm">{contact.linked_oas.length}</Badge>}
              />
              <CardBody>
                {contact.linked_oas.length === 0 ? (
                  <EmptyState
                    icon={<Link2 size={36} />}
                    title="No linked LINE OA yet"
                    description="This phone contact has not been matched to any follower record yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {contact.linked_oas.map((oa) => (
                      <div key={oa.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--border-default)] bg-white p-4 md:flex-row md:items-start">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                          {oa.is_follower && oa.follower_picture_url ? (
                            <img src={oa.follower_picture_url} alt={oa.follower_display_name} className="h-10 w-10 rounded-full object-cover" />
                          ) : oa.is_follower ? <UserCheck size={18} /> : <UserX size={18} />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">{oa.line_oa_name || oa.line_oa_id}</span>
                            <Badge variant={oa.is_follower ? "success" : "secondary"} size="sm">
                              {oa.is_follower ? "Follower" : "Phone only"}
                            </Badge>
                          </div>
                          <div className="grid gap-2 text-sm text-[var(--text-secondary)] md:grid-cols-2">
                            {oa.follower_display_name && <span>LINE Name: <span className="font-medium text-[var(--text-primary)]">{oa.follower_display_name}</span></span>}
                            {oa.line_oa_basic_id && <span>Basic ID: <span className="font-mono text-[var(--text-primary)]">{oa.line_oa_basic_id}</span></span>}
                            {oa.line_user_id && <span>LINE UID: <span className="font-mono text-[var(--text-primary)]">{oa.line_user_id}</span></span>}
                            <span>Linked: <span className="text-[var(--text-primary)]">{formatDate(oa.linked_at)}</span></span>
                          </div>
                        </div>
                        {oa.line_user_id && (
                          <DSButton
                            variant="ghost"
                            size="sm"
                            leftIcon={<Unlink size={14} />}
                            loading={unlinkingOAId === oa.line_oa_id}
                            onClick={() => { void handleUnlink(oa.line_oa_id); }}
                          >
                            Unlink
                          </DSButton>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <PhoneContactActivityCard contactId={contact.id} />
          </div>
        )}
        aside={(
          <div className="space-y-4">
            <StatCard title="Linked OAs" value={contact.linked_oas.length} icon={<Link2 size={18} />} />
            <StatCard title="Source" value={contact.source} icon={<Phone size={18} />} />
            <Card elevation="none">
              <CardHeader title="Quick context" />
              <CardBody className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div>
                  <div className="text-xs uppercase tracking-wide">Phone</div>
                  <div className="font-mono text-[var(--text-primary)]">{maskPhone(contact.phone)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide">Created</div>
                  <div className="text-[var(--text-primary)]">{formatDate(contact.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide">Updated</div>
                  <div className="text-[var(--text-primary)]">{formatDate(contact.updated_at)}</div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { void handleDelete(); }}
        title="Delete this contact?"
        description={`${fullName} (${maskPhone(contact.phone)}) will be permanently removed together with its OA linkage history.`}
        confirmLabel={deleting ? "Deleting..." : "Delete contact"}
        cancelLabel="Cancel"
        variant="destructive"
      />
    </AppLayout>
  );
}
