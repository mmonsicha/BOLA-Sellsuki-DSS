import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { rgbApi } from "@/api/rgb";
import liff from "@line/liff";

/**
 * RGBConsentPage — unauthenticated public page opened inside LINE via LIFF.
 *
 * Route: /lon/rgb-consent
 * No BOLA login required.
 *
 * Flow:
 *  1. Detect LIFF context via liff.isInClient()
 *  2. Initialize LIFF SDK with liffId from query param or VITE_RGB_LIFF_APP_ID
 *  3. Ensure user is logged in (trigger liff.login() if not)
 *  4. Get LINE user ID from decoded ID token
 *  5. Fetch masked phone from GET /public/lon/rgb-token-preview
 *  6. Show PDPA consent UI
 *  7. On confirm → POST /public/lon/rgb-identity-confirm → liff.closeWindow()
 */

type PageState = "loading" | "not_in_line" | "ready" | "submitting" | "success" | "error";

export function RGBConsentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("t") ?? "";
  const lineOAId = urlParams.get("line_oa_id") ?? "";
  const liffIdParam =
    urlParams.get("liff_app_id") ??
    (import.meta.env.VITE_RGB_LIFF_APP_ID as string | undefined) ??
    "";

  const [state, setState] = useState<PageState>("loading");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token || !lineOAId) {
      setErrorMsg("ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว");
      setState("error");
      return;
    }

    void initFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initFlow() {
    // Must check isInClient() BEFORE liff.init() to avoid errors in browser
    if (!liff.isInClient()) {
      setState("not_in_line");
      return;
    }

    try {
      const liffId = liffIdParam;
      if (!liffId) {
        setErrorMsg("ไม่พบ LIFF App ID กรุณาติดต่อผู้ดูแลระบบ");
        setState("error");
        return;
      }

      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const idToken = liff.getDecodedIDToken();
      const uid = idToken?.sub ?? "";
      if (!uid) {
        setErrorMsg("ไม่สามารถระบุตัวตน LINE ได้ กรุณาลองใหม่อีกครั้ง");
        setState("error");
        return;
      }
      setLineUserId(uid);

      // Fetch masked phone from backend
      const preview = await rgbApi.getTokenPreview({ t: token, line_oa_id: lineOAId });
      setMaskedPhone(preview.masked_phone);
      setState("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      setErrorMsg(msg);
      setState("error");
    }
  }

  async function handleConfirm() {
    setState("submitting");
    try {
      await rgbApi.confirmIdentity({
        line_oa_id: lineOAId,
        encrypted_token: token,
        line_user_id: lineUserId,
      });
      setState("success");
      // Brief pause so the user sees the success state before the window closes
      setTimeout(() => {
        liff.closeWindow();
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      setErrorMsg(msg);
      setState("ready"); // return to form so user can retry
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">กำลังโหลด…</p>
        </div>
      </div>
    );
  }

  // ── Not in LINE app ────────────────────────────────────────────────────────
  if (state === "not_in_line") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle size={40} className="mx-auto text-amber-500" />
            <div>
              <p className="font-semibold text-lg">กรุณาเปิดในแอป LINE</p>
              <p className="text-sm text-muted-foreground mt-2">
                หน้านี้ต้องเปิดผ่านแอป LINE เท่านั้น กรุณากดลิงก์จากข้อความ LINE ของคุณ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle size={40} className="mx-auto text-destructive" />
            <div>
              <p className="font-semibold text-lg">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <div>
              <p className="font-semibold text-lg">ยืนยันตัวตนสำเร็จ</p>
              <p className="text-sm text-muted-foreground mt-2">
                ขอบคุณที่ยืนยันตัวตน หน้าต่างนี้จะปิดโดยอัตโนมัติ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Consent form (ready / submitting) ─────────────────────────────────────
  const isSubmitting = state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full mx-auto bg-[#06C755]/10 flex items-center justify-center">
              <ShieldCheck size={28} className="text-[#06C755]" />
            </div>
            <h1 className="text-xl font-bold">ยืนยันตัวตนของคุณ</h1>
            <p className="text-sm text-muted-foreground">
              กรุณายืนยันหมายเลขโทรศัพท์ที่ลงทะเบียนไว้
            </p>
          </div>

          {/* Masked phone display */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">เบอร์โทรศัพท์ของคุณ</p>
            <div className="w-full border rounded-md px-4 py-3 bg-muted/40 font-mono text-base font-semibold tracking-wider text-center">
              {maskedPhone}
            </div>
          </div>

          {/* PDPA consent text */}
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ข้าพเจ้ายินยอมให้บริษัทฯ เก็บรวบรวมและใช้ข้อมูลส่วนบุคคล ได้แก่
              หมายเลขโทรศัพท์และ LINE ID เพื่อวัตถุประสงค์ในการส่งข้อมูลข่าวสารและบริการ
              โดยเป็นไปตามนโยบายความเป็นส่วนตัวของบริษัทฯ
            </p>
          </div>

          {/* Error message (retry after failed submit) */}
          {errorMsg && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white"
              onClick={() => { void handleConfirm(); }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {isSubmitting ? "กำลังยืนยัน…" : "ยอมรับและยืนยัน"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => liff.closeWindow()}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
