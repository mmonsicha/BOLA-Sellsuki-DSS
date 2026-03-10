import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Phone, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { lonApi, type LONPublicOAInfo } from "@/api/lon";
import liff from "@line/liff";

/**
 * LONPublicSubscribePage — unauthenticated page accessed via QR code scan or LIFF push message.
 *
 * Route: /lon/subscribe/:lineOAId
 * No BOLA login required.
 *
 * Flow A — LIFF (opened from LINE app via liff.line.me URL):
 *  1. Detect LIFF context via liff.isInClient()
 *  2. Initialize LIFF SDK with the OA's liff_id (passed as ?liff_id= query param)
 *  3. Call liff.getNotificationToken() → get notification token + userId
 *  4. POST to /v1/public/lon/liff-consent
 *  5. Show success screen (no phone form needed)
 *
 * Flow B — Phone (opened via browser QR scan):
 *  1. Fetch public OA info (name, basic_id, picture_url)
 *  2. User enters their phone number (E.164)
 *  3. Submit → POST /v1/lon/subscribe-by-phone
 *  4. Show success/error state
 */
export function LONPublicSubscribePage() {
  // Extract lineOAId from URL: /lon/subscribe/<id>
  const segments = window.location.pathname.split("/").filter(Boolean);
  const lineOAId = segments[2] ?? "";
  const urlParams = new URLSearchParams(window.location.search);
  const liffId = urlParams.get("liff_id") ?? "";

  const [oaInfo, setOAInfo] = useState<LONPublicOAInfo | null>(null);
  const [oaError, setOAError] = useState(false);
  const [loadingOA, setLoadingOA] = useState(true);

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // LIFF states
  const [liffMode, setLiffMode] = useState(false);
  const [liffLoading, setLiffLoading] = useState(false);

  useEffect(() => {
    if (!lineOAId) {
      setOAError(true);
      setLoadingOA(false);
      return;
    }

    // Fetch OA info first (needed for both flows)
    lonApi
      .getPublicOAInfo(lineOAId)
      .then((info) => {
        setOAInfo(info);
        // After we have OA info, try LIFF if we have a liff_id
        if (liffId) {
          attemptLIFFFlow(liffId);
        }
      })
      .catch(() => setOAError(true))
      .finally(() => setLoadingOA(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineOAId, liffId]);

  async function attemptLIFFFlow(id: string) {
    // Only attempt if running inside the LINE app
    if (!liff.isInClient()) {
      // Not in LINE app — fall through to phone form
      return;
    }
    setLiffMode(true);
    setLiffLoading(true);
    try {
      await liff.init({ liffId: id });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      const token = await liff.getNotificationToken();
      if (!token) {
        setErrorMsg("LINE did not return a notification token. Please try the phone number method.");
        setLiffMode(false);
        setLiffLoading(false);
        return;
      }
      const profile = await liff.getProfile();
      await lonApi.liffConsent({
        line_oa_id: lineOAId,
        line_user_id: profile.userId,
        notification_token: token,
      });
      setSuccess(true);
    } catch (err) {
      // If LIFF flow fails, fall back to phone form
      const msg = err instanceof Error ? err.message : "LIFF consent failed.";
      if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("deny")) {
        setErrorMsg("You chose not to enable notifications. You can still subscribe by phone number below.");
      } else {
        setErrorMsg(msg);
      }
      setLiffMode(false);
    } finally {
      setLiffLoading(false);
    }
  }

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
  if (loadingOA || liffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-muted-foreground mx-auto" />
          {liffLoading && (
            <p className="text-sm text-muted-foreground">
              Connecting to LINE notifications…
            </p>
          )}
        </div>
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

  // ── LIFF mode: show waiting screen while LIFF loads (shouldn't normally reach here) ──
  if (liffMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-3">
            <Bell size={32} className="mx-auto text-line animate-pulse" />
            <p className="font-semibold">Waiting for LINE consent…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Subscribe form (phone flow) ─────────────────────────────────────────────
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
