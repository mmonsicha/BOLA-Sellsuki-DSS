import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Phone, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { lonApi, type LONPublicOAInfo } from "@/api/lon";

/**
 * LONPublicSubscribePage — unauthenticated page accessed via QR code scan.
 *
 * Route: /lon/subscribe/:lineOAId
 * No BOLA login required. Anyone who scans the QR code can subscribe.
 *
 * Flow:
 *  1. Fetch public OA info (name, basic_id, picture_url)
 *  2. User enters their phone number (E.164)
 *  3. Submit → POST /v1/lon/subscribe-by-phone
 *  4. Show success/error state
 */
export function LONPublicSubscribePage() {
  // Extract lineOAId from URL: /lon/subscribe/<id>
  const segments = window.location.pathname.split("/").filter(Boolean);
  const lineOAId = segments[2] ?? "";

  const [oaInfo, setOAInfo] = useState<LONPublicOAInfo | null>(null);
  const [oaError, setOAError] = useState(false);
  const [loadingOA, setLoadingOA] = useState(true);

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!lineOAId) {
      setOAError(true);
      setLoadingOA(false);
      return;
    }
    lonApi
      .getPublicOAInfo(lineOAId)
      .then((info) => setOAInfo(info))
      .catch(() => setOAError(true))
      .finally(() => setLoadingOA(false));
  }, [lineOAId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned) {
      setErrorMsg("Phone number is required.");
      return;
    }
    if (!cleaned.startsWith("+")) {
      setErrorMsg("Phone number must be in E.164 format, e.g. +66812345678");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      await lonApi.subscribeByPhone({
        line_oa_id: lineOAId,
        phone_number: cleaned,
        source_form_id: undefined,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingOA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── OA not found ───────────────────────────────────────────────────────────
  if (oaError || !oaInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-destructive" />
            <p className="font-semibold">Subscribe Link Not Found</p>
            <p className="text-sm text-muted-foreground">
              This subscription link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            {oaInfo.picture_url && (
              <img
                src={oaInfo.picture_url}
                alt={oaInfo.name}
                className="w-16 h-16 rounded-full mx-auto object-cover"
              />
            )}
            <CheckCircle2 size={40} className="mx-auto text-green-500" />
            <div>
              <p className="font-semibold text-lg">You're subscribed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll now receive notifications from{" "}
                <span className="font-medium text-foreground">{oaInfo.name}</span>.
              </p>
            </div>
            {oaInfo.basic_id && (
              <p className="text-xs text-muted-foreground">
                LINE OA:{" "}
                <a
                  href={`https://line.me/R/ti/p/${oaInfo.basic_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-line underline"
                >
                  {oaInfo.basic_id}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Subscribe form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 space-y-5">
          {/* OA Header */}
          <div className="text-center space-y-2">
            {oaInfo.picture_url ? (
              <img
                src={oaInfo.picture_url}
                alt={oaInfo.name}
                className="w-16 h-16 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto bg-line/10 flex items-center justify-center">
                <Bell size={28} className="text-line" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold">{oaInfo.name}</h1>
              {oaInfo.basic_id && (
                <span className="inline-flex items-center gap-1 text-xs bg-line/10 text-line border border-line/20 rounded-full px-2 py-0.5 mt-1">
                  {oaInfo.basic_id}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your phone number to receive notifications from this LINE OA.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Phone size={13} />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+66812345678"
                disabled={submitting}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono disabled:opacity-60"
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">
                International format with country code, e.g.{" "}
                <code className="bg-muted px-1 rounded">+66812345678</code>
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={submitting || !phone.trim()}
            >
              {submitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Bell size={14} />
              )}
              {submitting ? "Subscribing..." : "Subscribe to Notifications"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By subscribing, you consent to receive LINE notifications from this business.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
