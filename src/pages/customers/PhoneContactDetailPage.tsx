import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Link2, UserCheck, UserX } from "lucide-react";
import { followerApi } from "@/api/follower";
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

export function PhoneContactDetailPage({ contactId }: PhoneContactDetailPageProps) {
  const [contact, setContact] = useState<PhoneContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    followerApi
      .getPhoneContact(contactId)
      .then(setContact)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load contact"))
      .finally(() => setLoading(false));
  }, [contactId]);

  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.phone
    : "";

  return (
    <AppLayout title="Contact Detail">
      <div className="space-y-4 max-w-3xl">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} />
          Back to Contacts
        </Button>

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
                    <span className="font-mono">{contact.phone}</span>
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
                        {/* Status icon */}
                        <div
                          className={cn(
                            "mt-0.5 flex-shrink-0",
                            oa.is_follower ? "text-line" : "text-muted-foreground"
                          )}
                        >
                          {oa.is_follower ? <UserCheck size={16} /> : <UserX size={16} />}
                        </div>

                        {/* Detail */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{oa.line_oa_name || oa.line_oa_id}</span>
                            {oa.is_follower ? (
                              <span className="text-xs text-line font-medium">Follower</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Phone Only</span>
                            )}
                          </div>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
