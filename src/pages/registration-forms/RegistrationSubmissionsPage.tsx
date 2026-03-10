import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, RefreshCw, ClipboardList } from "lucide-react";
import type { RegistrationForm, FormSubmission } from "@/types";
import { registrationFormApi } from "@/api/registrationForm";

const PAGE_SIZE = 20;

export function RegistrationSubmissionsPage() {
  // Path: /registration-forms/{id}/submissions
  const segments = window.location.pathname.split("/").filter(Boolean);
  const formId = segments[1]; // index 1 = the form ID

  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load form metadata
  useEffect(() => {
    if (!formId) return;
    registrationFormApi.get(formId).then(setForm).catch(() => {});
  }, [formId]);

  // Load submissions when page changes
  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    setError(null);
    registrationFormApi
      .listSubmissions(formId, page, PAGE_SIZE)
      .then((res) => {
        setSubmissions(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e: Error) => {
        setError(e.message);
        setSubmissions([]);
      })
      .finally(() => setLoading(false));
  }, [formId, page]);

  // Derive column keys from submissions and form fields
  const fieldKeys: string[] = form?.fields?.map((f) => f.key) || [];
  const submissionKeys: string[] = submissions.reduce<string[]>((acc, s) => {
    Object.keys(s.submission_data || {}).forEach((k) => {
      if (!acc.includes(k)) acc.push(k);
    });
    return acc;
  }, []);
  const allKeys = fieldKeys.length > 0
    ? fieldKeys
    : submissionKeys;

  const fieldLabelMap: Record<string, string> = {};
  (form?.fields || []).forEach((f) => { fieldLabelMap[f.key] = f.label; });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppLayout title="Form Submissions">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href={`/registration-forms/${formId}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to form
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-sm">
              Submissions — {form?.name ?? formId}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>

        {/* Body */}
        {loading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading submissions...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm mt-1">
                Submissions will appear here once followers complete the form.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    Submitted At
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    LINE User ID
                  </th>
                  {allKeys.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {fieldLabelMap[key] || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                      {sub.line_user_id || sub.follower_id || "—"}
                    </td>
                    {allKeys.map((key) => (
                      <td key={key} className="px-4 py-3">
                        {sub.submission_data?.[key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
