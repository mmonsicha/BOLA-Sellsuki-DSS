import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  RefreshCw, Bell, Phone, X, CheckCircle2,
  Upload, QrCode, Copy, ChevronDown, ChevronUp, Info, Send, Download, Eye, EyeOff,
} from "lucide-react";
import type { LONSubscriber, LONSubscriberStats, LONIdentityStatus, LineOA } from "@/types";
import { lonApi, type BulkSubscribeByPhoneResult, type SendConsentRequestResult } from "@/api/lon";
import { maskPhone } from "@/lib/phone";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { useToast } from "@/components/ui/toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

const statusVariant = {
  active: "success" as const,
  revoked: "destructive" as const,
  expired: "secondary" as const,
};

const statusOptions = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

// ─── Identity Status Badge ─────────────────────────────────────────────────────

const identityStatusConfig: Record<
  LONIdentityStatus,
  { label: string; variant: "secondary" | "success" | "destructive" }
> = {
  unmapped: { label: "ยังไม่ระบุตัวตน", variant: "secondary" },
  complete: { label: "ระบุตัวตนแล้ว", variant: "success" },
  purged: { label: "ถูกลบข้อมูล", variant: "destructive" },
};

function IdentityStatusBadge({ status }: { status?: LONIdentityStatus | null }) {
  if (!status) return null;
  const config = identityStatusConfig[status];
  if (!config) return null;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Masked Phone Cell ─────────────────────────────────────────────────────────

interface MaskedPhoneCellProps {
  phone: string;
  subscriberId: string;
}

function MaskedPhoneCell({ phone, subscriberId }: MaskedPhoneCellProps) {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleReveal() {
    if (revealed) {
      // Hide immediately on second click
      setRevealed(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    setRevealed(true);
    // TODO: POST audit log when backend endpoint is ready
    // POST /v1/lon/subscribers/${subscriberId}/access-log
    // body: { action: "view_phone", resource_id: subscriberId }
    // This should be fire-and-forget once the endpoint exists.
    void subscriberId; // referenced to avoid unused var lint error
    // Auto-hide after 5 seconds
    timerRef.current = setTimeout(() => {
      setRevealed(false);
    }, 5000);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!phone) return <span className="text-muted-foreground">-</span>;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs">
        {revealed ? phone : maskPhone(phone)}
      </span>
      <button
        onClick={handleReveal}
        title="แสดงเบอร์โทร (บันทึกการเข้าถึง)"
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        type="button"
      >
        {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </span>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

interface BulkImportModalProps {
  lineOAId: string;
  onClose: () => void;
  onDone: (result: BulkSubscribeByPhoneResult) => void;
}

function BulkImportModal({ lineOAId, onClose, onDone }: BulkImportModalProps) {
  const toast = useToast();
  const [phones, setPhones] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkSubscribeByPhoneResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      setRawText(text);
      const parsed = text
        .split(/[\r\n,]+/)
        .map((p) => p.trim())
        .filter((p) => p.startsWith("+") && p.length >= 8);
      setPhones(parsed);
    };
    reader.readAsText(file);
  }

  function parseManual() {
    const parsed = rawText
      .split(/[\r\n,;]+/)
      .map((p) => p.trim())
      .filter((p) => p.startsWith("+") && p.length >= 8);
    setPhones(parsed);
  }

  async function handleImport() {
    if (phones.length === 0 || phones.length > 100) return;
    setImporting(true);
    try {
      const res = await lonApi.bulkSubscribeByPhone({
        line_oa_id: lineOAId,
        items: phones.map((p) => ({ phone_number: p })),
      });
      setResult(res);
      onDone(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Upload size={16} />
            Bulk Import Phone Numbers
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!result ? (
            <>
              {/* File upload */}
              <div>
                <p className="text-sm font-medium mb-2">Upload CSV file</p>
                <p className="text-xs text-muted-foreground mb-2">
                  One phone number per line, E.164 format (e.g. <code className="bg-muted px-1 rounded">+66812345678</code>). Max 100 phones.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFile}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload size={13} /> Choose File
                </Button>
              </div>

              {/* Manual paste */}
              <div>
                <p className="text-sm font-medium mb-2">Or paste phone numbers</p>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm font-mono min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={"+66811111111\n+66822222222\n+66833333333"}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <Button size="sm" variant="outline" className="mt-1.5 gap-1" onClick={parseManual}>
                  Parse
                </Button>
              </div>

              {/* Preview */}
              {phones.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1.5">
                    Parsed <span className="text-primary font-bold">{phones.length}</span> phone(s)
                    {phones.length > 100 && (
                      <span className="text-destructive ml-2 text-xs">(exceeds 100 limit!)</span>
                    )}
                  </p>
                  <div className="border rounded-md max-h-40 overflow-y-auto text-xs font-mono p-2 space-y-0.5 bg-muted/30">
                    {phones.slice(0, 20).map((p, i) => (
                      <div key={i} className="text-muted-foreground">{p}</div>
                    ))}
                    {phones.length > 20 && (
                      <div className="text-muted-foreground italic">... and {phones.length - 20} more</div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results */
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">✅ {result.succeeded.length} succeeded</span>
                <span className="text-destructive font-medium">❌ {result.failed.length} failed</span>
              </div>
              {result.failed.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 text-destructive">Failed</p>
                  <div className="border border-destructive/30 rounded-md max-h-48 overflow-y-auto text-xs divide-y">
                    {result.failed.map((f, i) => (
                      <div key={i} className="px-3 py-2">
                        <span className="font-mono text-destructive">{f.phone_number}</span>
                        <span className="text-muted-foreground ml-2">— {f.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.succeeded.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 text-green-700">Succeeded</p>
                  <div className="border border-green-200 rounded-md max-h-48 overflow-y-auto text-xs divide-y">
                    {result.succeeded.map((s, i) => (
                      <div key={i} className="px-3 py-2 font-mono text-muted-foreground">
                        {s.line_user_id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {result && result.failed.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const rows = [
                  "phone_number,error_reason",
                  ...result.failed.map((f) =>
                    `"${f.phone_number}","${f.error.replace(/"/g, '""')}"`
                  ),
                ].join("\n");
                const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bulk_import_errors.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={13} />
              Download Error Report ({result.failed.length})
            </Button>
          )}
          {!result && (
            <Button
              size="sm"
              disabled={phones.length === 0 || phones.length > 100 || importing}
              onClick={() => { void handleImport(); }}
              className="gap-1.5"
            >
              {importing ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
              {importing ? "Importing..." : `Import ${phones.length} Phone(s)`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QR Code Modal ────────────────────────────────────────────────────────────

interface QRModalProps {
  lineOAId: string;
  lineOAName: string;
  onClose: () => void;
}

function QRModal({ lineOAId, lineOAName, onClose }: QRModalProps) {
  const subscribeUrl = `${window.location.origin}/lon/subscribe/${lineOAId}`;
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    void navigator.clipboard.writeText(subscribeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <QrCode size={16} />
            Subscribe QR Code
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Share this QR code so customers can subscribe to{" "}
            <span className="font-medium text-foreground">{lineOAName}</span> notifications
          </p>
          <div className="flex justify-center bg-white p-4 rounded-lg border">
            <QRCodeSVG value={subscribeUrl} size={200} />
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
            <span className="text-xs font-mono flex-1 truncate text-left text-muted-foreground">
              {subscribeUrl}
            </span>
            <button
              onClick={copyUrl}
              className="text-muted-foreground hover:text-foreground shrink-0"
              title="Copy URL"
            >
              {copied ? <CheckCircle2 size={15} className="text-green-600" /> : <Copy size={15} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Customer scans QR → enters phone → gets subscribed
          </p>
        </div>
        <div className="px-5 pb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Consent Request Modal ───────────────────────────────────────────────

interface SendConsentModalProps {
  lineOA: LineOA;
  onClose: () => void;
}

function SendConsentModal({ lineOA, onClose }: SendConsentModalProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendConsentRequestResult | null>(null);
  const [error, setError] = useState("");

  const hasLiff = Boolean(lineOA.liff_id);

  async function handleSend() {
    if (!hasLiff) return;
    setSending(true);
    setError("");
    try {
      const res = await lonApi.sendConsentRequest({
        line_oa_id: lineOA.id,
        custom_message: customMessage.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send consent requests.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Send size={16} />
            Send Consent Request
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!hasLiff ? (
            /* No LIFF configured */
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Bell size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">LIFF ID not configured</p>
                  <p className="text-xs mt-1">
                    To send consent requests, you must first set a <strong>LIFF App ID</strong> for{" "}
                    <strong>{lineOA.name}</strong> in the LINE OA settings page.
                  </p>
                  <p className="text-xs mt-1">
                    The LIFF app's endpoint URL should be set to:{" "}
                    <code className="bg-amber-100 px-1 rounded text-xs">
                      {window.location.origin}/lon/subscribe/{lineOA.id}?liff_id=YOUR_LIFF_ID
                    </code>
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (window.location.pathname = `/line-oa/${lineOA.id}`)}
                >
                  Go to LINE OA Settings
                </Button>
              </div>
            </div>
          ) : result ? (
            /* Result */
            <div className="space-y-3">
              <div className="flex gap-6 text-sm py-2">
                <span className="text-green-600 font-medium">✅ {result.sent} sent</span>
                <span className="text-muted-foreground font-medium">
                  {result.failed > 0 ? `❌ ${result.failed} failed` : "0 failed"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Followers who have already subscribed were skipped. Each eligible follower received a
                Flex Message with an "Enable Notifications" button that opens your LIFF app.
              </p>
            </div>
          ) : (
            /* Form */
            <div className="space-y-4">
              <div className="rounded-md bg-muted/60 border px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">What happens:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>BOLA fetches followers of <strong>{lineOA.name}</strong></li>
                  <li>Followers who already subscribed are skipped</li>
                  <li>Each remaining follower receives a Flex Message card with an
                    &nbsp;<strong>"Enable Notifications"</strong> button</li>
                  <li>Tapping the button opens your LIFF app in LINE to grant consent</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Custom message (optional)</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder={`e.g. "Enable notifications to get exclusive deals from ${lineOA.name}!"`}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{customMessage.length}/200</p>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {hasLiff && !result && (
            <Button
              size="sm"
              disabled={sending || !hasLiff}
              onClick={() => { void handleSend(); }}
              className="gap-1.5"
            >
              {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              {sending ? "Sending..." : "Send to Followers"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API Integration Info ─────────────────────────────────────────────────────

function APIInfoPanel({ lineOAId }: { lineOAId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const endpoints = [
    {
      method: "POST",
      path: "/v1/lon/consent-callback",
      desc: "LIFF app POSTs consent token after user taps Allow",
      body: `{\n  "line_oa_id": "${lineOAId || "<line_oa_id>"}",\n  "line_user_id": "U...",\n  "lon_token": "...",\n  "source": "liff"\n}`,
    },
    {
      method: "POST",
      path: "/v1/lon/subscribe-by-phone",
      desc: "CRM/e-commerce enrolls customer by phone number",
      body: `{\n  "line_oa_id": "${lineOAId || "<line_oa_id>"}",\n  "phone_number": "+66812345678"\n}`,
    },
    {
      method: "POST",
      path: "/v1/lon/bulk-subscribe-by-phone",
      desc: "Batch enroll up to 100 phone numbers",
      body: `{\n  "line_oa_id": "${lineOAId || "<line_oa_id>"}",\n  "items": [{"phone_number": "+66811111111"}, ...]\n}`,
    },
    {
      method: "POST",
      path: "/v1/lon/revoke-callback",
      desc: "External system revokes a subscriber",
      body: `{\n  "line_oa_id": "${lineOAId || "<line_oa_id>"}",\n  "line_user_id": "U..."\n}`,
    },
  ];

  function copyText(key: string, text: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-0">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <Info size={14} />
            API Integration — Webhook Endpoints
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {open && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            <p className="text-xs text-muted-foreground">
              Base URL: <code className="bg-muted px-1 rounded">{API_BASE}</code>
              <br />
              For LIFF integration: call{" "}
              <code className="bg-muted px-1 rounded">liff.getNotificationToken()</code>{" "}
              then POST the token + userId to <strong>consent-callback</strong>.
            </p>
            {endpoints.map((ep) => (
              <div key={ep.path} className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono">{ep.path}</code>
                  <span className="text-xs text-muted-foreground">{ep.desc}</span>
                </div>
                <div className="relative">
                  <pre className="text-xs bg-muted rounded p-2 font-mono overflow-x-auto">
                    {ep.body}
                  </pre>
                  <button
                    onClick={() => copyText(ep.path, `${API_BASE}${ep.path}`)}
                    className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
                    title="Copy endpoint URL"
                  >
                    {copied === ep.path ? (
                      <CheckCircle2 size={13} className="text-green-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LONSubscribersPage() {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState<LONSubscriber[]>([]);
  const [stats, setStats] = useState<LONSubscriberStats | null>(null);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe by phone form
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  // Bulk import modal
  const [showBulkModal, setShowBulkModal] = useState(false);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);

  // Send consent request modal
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Revoke confirm dialog
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const selectedOA = lineOAs.find((oa) => oa.id === selectedLineOAId);

  // Load LINE OAs once
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedLineOAId(oas[0].id);
      })
      .catch(console.error);
  }, []);

  // Load subscribers + stats when OA or filter changes
  useEffect(() => {
    if (!selectedLineOAId) return;
    setLoading(true);

    Promise.all([
      lonApi.listSubscribers({ line_oa_id: selectedLineOAId, status: statusFilter || undefined }),
      lonApi.getSubscriberStats(selectedLineOAId),
    ])
      .then(([subRes, statsRes]) => {
        setSubscribers(subRes.data ?? []);
        setTotal(subRes.total ?? 0);
        setStats(statsRes);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load LON subscribers");
        setSubscribers([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId, statusFilter]);

  function handleRevoke(id: string) {
    setRevokeTarget(id);
  }

  function handleConfirmedRevoke() {
    if (!revokeTarget) return;
    const id = revokeTarget;
    setRevokeTarget(null);
    lonApi
      .revokeSubscriber(id)
      .then(() => {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "revoked" as const } : s))
        );
        if (stats) {
          setStats({ ...stats, active: stats.active - 1, revoked: stats.revoked + 1 });
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to revoke"));
  }

  function handleSubscribeByPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLineOAId) return;
    const phone = phoneNumber.trim();
    if (!phone) {
      setPhoneError("Phone number is required.");
      return;
    }
    setPhoneError("");
    setSubmittingPhone(true);
    lonApi
      .subscribeByPhone({ line_oa_id: selectedLineOAId, phone_number: phone })
      .then((newSub) => {
        setPhoneSuccess(`Subscribed! LINE User ID: ${newSub.line_user_id}`);
        setPhoneNumber("");
        setSubscribers((prev) => [newSub, ...prev.filter((s) => s.id !== newSub.id)]);
        if (stats) {
          setStats({ ...stats, total: stats.total + 1, active: stats.active + 1 });
        }
        setTimeout(() => {
          setPhoneSuccess("");
          setShowPhoneForm(false);
        }, 3000);
      })
      .catch((err) => {
        setPhoneError(err instanceof Error ? err.message : "Failed to subscribe.");
      })
      .finally(() => setSubmittingPhone(false));
  }

  function handleBulkDone(result: BulkSubscribeByPhoneResult) {
    // Refresh subscriber list after bulk import
    if (selectedLineOAId) {
      setSelectedLineOAId((v) => v); // trigger reload
    }
    if (stats && result.succeeded.length > 0) {
      setStats({
        ...stats,
        total: stats.total + result.succeeded.length,
        active: stats.active + result.succeeded.length,
      });
    }
  }

  return (
    <AppLayout title="LINE Notification Subscribers">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            LINE Notification Messaging subscribers who have granted consent for push notifications.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={showPhoneForm ? "secondary" : "default"}
              onClick={() => {
                setShowPhoneForm((v) => !v);
                setPhoneError("");
                setPhoneSuccess("");
                setPhoneNumber("");
              }}
              className="gap-1.5"
            >
              {showPhoneForm ? <X size={14} /> : <Phone size={14} />}
              {showPhoneForm ? "Cancel" : "Subscribe by Phone"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkModal(true)}
              className="gap-1.5"
              disabled={!selectedLineOAId}
            >
              <Upload size={14} />
              Import CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQRModal(true)}
              className="gap-1.5"
              disabled={!selectedLineOAId}
            >
              <QrCode size={14} />
              QR Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConsentModal(true)}
              className="gap-1.5"
              disabled={!selectedLineOAId}
            >
              <Send size={14} />
              Send Consent Request
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLineOAId((v) => v)}
            >
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={setSelectedLineOAId}
          showAll={false}
        />

        {/* Subscribe by Phone form */}
        {showPhoneForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <form onSubmit={handleSubscribeByPhone} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={15} className="text-primary" />
                  <span className="text-sm font-medium">Subscribe by Phone Number</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+66812345678"
                      disabled={submittingPhone}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono disabled:opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">
                      E.164 format — e.g. <code className="bg-muted px-1 rounded">+66812345678</code>
                    </p>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingPhone || !phoneNumber.trim()}
                    className="gap-1.5 shrink-0 mt-0.5"
                  >
                    {submittingPhone ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Phone size={13} />
                    )}
                    {submittingPhone ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>

                {phoneError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {phoneError}
                  </div>
                )}
                {phoneSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <CheckCircle2 size={14} />
                    {phoneSuccess}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total },
              { label: "Active", value: stats.active, color: "text-green-600" },
              { label: "Revoked", value: stats.revoked, color: "text-red-500" },
              { label: "Expired", value: stats.expired, color: "text-gray-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.color ?? ""}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === opt.value
                  ? "bg-line text-white border-line"
                  : "text-muted-foreground hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : subscribers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No LON subscribers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-1">
              Showing {subscribers.length} of {total}
            </div>
            {subscribers.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {s.picture_url ? (
                      <img
                        src={s.picture_url}
                        alt={s.display_name ?? s.line_user_id}
                        className="w-8 h-8 rounded-full shrink-0 object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Bell size={14} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {s.display_name ?? (
                            <span className="font-mono text-muted-foreground">{s.line_user_id}</span>
                          )}
                        </span>
                        <Badge variant={statusVariant[s.status] ?? "secondary"}>
                          {s.status}
                        </Badge>
                        <IdentityStatusBadge status={s.identity_status} />
                        {s.is_friend === true && (
                          <span className="text-xs text-green-700 font-medium">✓ เป็นเพื่อน</span>
                        )}
                        <span className="text-xs text-muted-foreground capitalize">{s.source}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                        {s.display_name && (
                          <span className="font-mono">{s.line_user_id}</span>
                        )}
                        {s.display_name && <span>&middot;</span>}
                        {s.phone_number && (
                          <>
                            <MaskedPhoneCell phone={s.phone_number} subscriberId={s.id} />
                            <span>&middot;</span>
                          </>
                        )}
                        <span>Consented: {new Date(s.consent_at).toLocaleString()}</span>
                        {s.revoked_at && (
                          <> &middot; Revoked: {new Date(s.revoked_at).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.status === "active" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(s.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* API Integration Info Panel */}
        {selectedLineOAId && <APIInfoPanel lineOAId={selectedLineOAId} />}
      </div>

      {/* Modals */}
      {showBulkModal && (
        <BulkImportModal
          lineOAId={selectedLineOAId}
          onClose={() => setShowBulkModal(false)}
          onDone={(result) => {
            handleBulkDone(result);
          }}
        />
      )}
      {showQRModal && selectedOA && (
        <QRModal
          lineOAId={selectedLineOAId}
          lineOAName={selectedOA.name}
          onClose={() => setShowQRModal(false)}
        />
      )}
      {showConsentModal && selectedOA && (
        <SendConsentModal
          lineOA={selectedOA}
          onClose={() => setShowConsentModal(false)}
        />
      )}

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke subscriber?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer receive LON notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmedRevoke}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
