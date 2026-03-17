import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Phone,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { lonApi } from "@/api/lon";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import type { PNPDeliveryLog, LineOA } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// ─── Infographic Component ─────────────────────────────────────────────────────
// Japanese infographic style: clean two-column comparison with numbered steps,
// color-coded sides (LINE green for LON Subscribers, blue for LON by Phone),
// and a feature comparison table at the bottom.

function HowItWorksInfographic() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className="overflow-hidden border-2">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b hover:bg-gray-100 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="font-bold text-sm">วิธีส่ง LINE Notification</span>
          <span className="text-xs text-muted-foreground ml-1">
            — How Each System Works
          </span>
        </div>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <CardContent className="p-0">
          {/* Two-column comparison */}
          <div className="grid grid-cols-2 divide-x">
            {/* LEFT: LON Subscribers */}
            <div className="p-5 space-y-4">
              {/* Column Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30 rounded-full px-3 py-1 text-sm font-bold mb-1">
                  <Bell size={13} />
                  LON Subscribers
                </div>
                <p className="text-xs text-muted-foreground">
                  Consent-based messaging
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  {
                    n: "1",
                    icon: "📱",
                    text: "User scans QR code or opens LIFF link",
                  },
                  { n: "2", icon: "✅", text: "User consents in LINE app" },
                  {
                    n: "3",
                    icon: "💾",
                    text: "Consent token stored in BOLA",
                  },
                  {
                    n: "4",
                    icon: "📨",
                    text: "Send any time using stored token",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#06C755] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.n}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="mr-1">{step.icon}</span>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  "Standard channel",
                  "Any message type",
                  "Subscriber list",
                  "Re-send anytime",
                ].map((f) => (
                  <span
                    key={f}
                    className="text-[10px] bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20 rounded px-1.5 py-0.5"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: LON by Phone */}
            <div className="p-5 space-y-4 bg-blue-50/40">
              {/* Column Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm font-bold mb-1">
                  <Phone size={13} />
                  LON by Phone
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct phone-based messaging
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  {
                    n: "1",
                    icon: "📋",
                    text: "You have customer's phone number",
                  },
                  { n: "2", icon: "🔒", text: "BOLA hashes phone (SHA256)" },
                  {
                    n: "3",
                    icon: "🚀",
                    text: "Message sent directly via LINE API",
                  },
                  {
                    n: "4",
                    icon: "💬",
                    text: "LINE shows consent prompt to user automatically",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.n}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="mr-1">{step.icon}</span>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  { label: "Partner approval needed", warn: true },
                  { label: "Templates only", warn: false },
                  { label: "No pre-consent needed", warn: false },
                  { label: "TH / JP / TW only", warn: true },
                ].map((f) => (
                  <span
                    key={f.label}
                    className={`text-[10px] rounded px-1.5 py-0.5 border ${
                      f.warn
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    }`}
                  >
                    {f.warn ? "⚠" : "✓"} {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom comparison row */}
          <div className="grid grid-cols-2 divide-x border-t bg-gray-50">
            <div className="px-5 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Best for:{" "}
                <span className="font-medium text-gray-700">
                  Loyal subscribers, re-engagement
                </span>
              </p>
            </div>
            <div className="px-5 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Best for:{" "}
                <span className="font-medium text-gray-700">
                  Transactional alerts, order updates
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LONByPhonePage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");
  const [logs, setLogs] = useState<PNPDeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Send form state
  const [phone, setPhone] = useState("");
  const [phoneValidationError, setPhoneValidationError] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [bodyJson, setBodyJson] = useState('{\n  "items": []\n}');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  // Map from truncated phone_hash prefix → original phone for display in logs
  const [sentPhoneMap, setSentPhoneMap] = useState<Record<string, string>>({});

  // Load OAs
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

  // Load logs when OA/page changes
  useEffect(() => {
    if (!selectedLineOAId) return;
    setLogsLoading(true);
    lonApi
      .listLONByPhoneLogs({
        line_oa_id: selectedLineOAId,
        page,
        page_size: PAGE_SIZE,
      })
      .then((res) => setLogs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, [selectedLineOAId, page]);

  function maskPhone(p: string): string {
    // Show first 3 chars (e.g. "+66") and last 3 digits, mask the rest
    const trimmed = p.trim();
    if (trimmed.length <= 6) return trimmed;
    const prefix = trimmed.slice(0, 3);
    const suffix = trimmed.slice(-3);
    const masked = "*".repeat(Math.max(0, trimmed.length - 6));
    return `${prefix}${masked}${suffix}`;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    setSendSuccess(false);
    setPhoneValidationError("");

    const trimmedPhone = phone.trim();
    const trimmedKey = templateKey.trim();

    if (!trimmedPhone) {
      setPhoneValidationError("Phone number is required.");
      return;
    }
    if (!trimmedPhone.startsWith("+") || trimmedPhone.length < 8) {
      setPhoneValidationError("Phone number must be in E.164 format (e.g. +66812345678).");
      return;
    }
    if (!trimmedKey) {
      setSendError("Template key is required.");
      return;
    }
    if (!selectedLineOAId) {
      setSendError("Please select a LINE OA.");
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyJson);
    } catch {
      setSendError("Message body must be valid JSON.");
      return;
    }

    setSending(true);
    try {
      await lonApi.sendLONByPhone({
        line_oa_id: selectedLineOAId,
        phone_number: trimmedPhone,
        template_key: trimmedKey,
        body,
      });
      setSendSuccess(true);
      setPhone("");
      // Refresh logs
      const res = await lonApi.listLONByPhoneLogs({
        line_oa_id: selectedLineOAId,
        page: 1,
        page_size: PAGE_SIZE,
      });
      const newLogs = res.data ?? [];
      // Store phone mapping: match the first log after send (most recent)
      if (newLogs.length > 0) {
        setSentPhoneMap((prev) => ({
          ...prev,
          [newLogs[0].phone_hash]: trimmedPhone,
        }));
      }
      setLogs(newLogs);
      setPage(1);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send notification. Please check your inputs and try again.");
    } finally {
      setSending(false);
    }
  }

  function handleRefreshLogs() {
    if (!selectedLineOAId) return;
    setLogsLoading(true);
    lonApi
      .listLONByPhoneLogs({
        line_oa_id: selectedLineOAId,
        page,
        page_size: PAGE_SIZE,
      })
      .then((res) => setLogs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }

  return (
    <AppLayout title="LON by Phone">
      <div className="space-y-5">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Send LINE notification messages directly to customers by phone number
          using LINE's partner API (PNP). No prior consent required — LINE
          handles the consent prompt automatically.
        </p>

        {/* Infographic */}
        <HowItWorksInfographic />

        {/* Requirements Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">LINE Partner Approval Required</p>
            <p className="text-xs">
              LON by Phone uses LINE's corporate/partner API. You must apply for
              approval via your LINE sales representative. Available in{" "}
              <strong>Thailand, Japan, and Taiwan</strong> only. Messages must
              use <strong>pre-approved templates</strong>.
            </p>
            <a
              href="https://developers.line.biz/en/docs/partner-docs/line-notification-messages/overview/"
              target="_blank"
              rel="noreferrer"
              className="text-xs underline text-amber-700 hover:text-amber-900"
            >
              LINE Notification Messages documentation →
            </a>
          </div>
        </div>

        {/* OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={(id) => {
            setSelectedLineOAId(id);
            setPage(1);
          }}
          showAll={false}
        />

        {/* Send Form */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <PhoneCall size={15} className="text-blue-600" />
              <span className="font-semibold text-sm">
                Send Notification by Phone
              </span>
            </div>
            <form onSubmit={(e) => void handleSend(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneValidationError("");
                    }}
                    placeholder="+66812345678"
                    disabled={sending}
                    className={`w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${phoneValidationError ? "border-destructive focus:ring-destructive/50" : ""}`}
                  />
                  {phoneValidationError ? (
                    <p className="text-[11px] text-destructive font-medium">{phoneValidationError}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      E.164 format (e.g. +66812345678). Will be SHA256-hashed before sending.
                    </p>
                  )}
                </div>

                {/* Template Key */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Template Key *
                  </label>
                  <input
                    type="text"
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                    placeholder="e.g. order_confirmation"
                    disabled={sending}
                    className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Pre-approved template key from LINE Developers Console.
                  </p>
                </div>
              </div>

              {/* Body JSON */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Message Body (JSON) *
                </label>
                <textarea
                  value={bodyJson}
                  onChange={(e) => setBodyJson(e.target.value)}
                  disabled={sending}
                  rows={5}
                  className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 resize-y"
                />
                <p className="text-[11px] text-muted-foreground">
                  Template body fields as defined in LINE Developers Console.
                </p>
              </div>

              {sendError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <XCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
              {sendSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  <CheckCircle2 size={14} />
                  Message sent successfully!
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  sending ||
                  !phone.trim() ||
                  !templateKey.trim() ||
                  !selectedLineOAId
                }
                className="gap-2"
              >
                {sending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Delivery Logs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Delivery Logs</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshLogs}
            >
              <RefreshCw size={13} className="mr-1" /> Refresh
            </Button>
          </div>

          {logsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Phone size={28} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No delivery logs yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {logs.map((log) => {
                const originalPhone = sentPhoneMap[log.phone_hash];
                return (
                <Card key={log.id}>
                  <CardContent className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {originalPhone ? (
                          <span className="text-xs font-mono text-foreground font-medium">
                            {maskPhone(originalPhone)}
                          </span>
                        ) : (
                          <span
                            className="text-xs font-mono text-muted-foreground truncate max-w-[200px]"
                            title={log.phone_hash}
                          >
                            {log.phone_hash.slice(0, 16)}…
                          </span>
                        )}
                        <Badge
                          variant={
                            log.status === "success" ? "success" : "destructive"
                          }
                        >
                          {log.status}
                        </Badge>
                        {log.http_status_code && (
                          <span className="text-xs text-muted-foreground">
                            HTTP {log.http_status_code}
                          </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.template_key}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.sent_at).toLocaleString()}
                        {log.error_message && (
                          <span className="text-destructive ml-2">
                            — {log.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
              {/* Pagination */}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logs.length < PAGE_SIZE}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
