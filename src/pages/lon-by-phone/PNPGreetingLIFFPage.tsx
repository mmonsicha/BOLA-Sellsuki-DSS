import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import liff from "@line/liff";

/**
 * PNPGreetingLIFFPage — unauthenticated public page opened inside LINE via LIFF.
 *
 * Route: /lon/greeting
 * No BOLA login required.
 *
 * Flow:
 *  1. Parse ?token= from URL
 *  2. liff.init({ liffId: VITE_SHARED_LIFF_ID })
 *  3. if !liff.isInClient() → show error "กรุณาเปิดผ่าน LINE เท่านั้น"
 *  4. if !liff.isLoggedIn() → liff.login()
 *  5. liff.getProfile() → { userId }
 *  6. POST /v1/pnp/resolve-link-token { token, line_uid: userId }
 *  7. liff.closeWindow()
 *     (if closeWindow fails — show success message)
 */

type PageStatus = "loading" | "error" | "success";

export function PNPGreetingLIFFPage() {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    void initFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initFlow() {
    try {
      const liffId = (import.meta.env.VITE_SHARED_LIFF_ID as string | undefined) ?? "";
      if (!liffId) {
        setErrorMsg("ไม่พบ LIFF App ID กรุณาติดต่อผู้ดูแลระบบ");
        setStatus("error");
        return;
      }

      // init() must run first — it processes liff.state and restores query params
      // (e.g. ?token=xxx arrives encoded as liff.state before init runs)
      await liff.init({ liffId });

      if (!liff.isInClient()) {
        setErrorMsg("กรุณาเปิดผ่าน LINE เท่านั้น");
        setStatus("error");
        return;
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      // Read token AFTER liff.init() — liff.state has been decoded and applied to URL
      const token = new URLSearchParams(window.location.search).get("token") ?? "";
      if (!token) {
        setErrorMsg("ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว");
        setStatus("error");
        return;
      }

      const profile = await liff.getProfile();
      const lineUid = profile.userId;

      // Use raw fetch with credentials: "omit" (no BOLA session needed for this public endpoint).
      // VITE_PUBLIC_API_URL points directly at the backend tunnel to bypass the Vite dev proxy,
      // which can drop connections when accessed from mobile devices via cloudflare tunnel.
      const publicApiBase = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)
        || (import.meta.env.VITE_API_URL as string | undefined)
        || "";
      const res = await fetch(`${publicApiBase}/v1/pnp/resolve-link-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "omit",
        body: JSON.stringify({ token, line_uid: lineUid }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setStatus("success");

      try {
        liff.closeWindow();
      } catch {
        // closeWindow may fail outside full LIFF context — stay on success screen
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">กำลังดำเนินการ...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === "error") {
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-10 text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-green-500" />
          <div>
            <p className="font-semibold text-lg">ขอบคุณ!</p>
            <p className="text-sm text-muted-foreground mt-2">
              เราส่งข้อความพิเศษให้คุณแล้ว 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
