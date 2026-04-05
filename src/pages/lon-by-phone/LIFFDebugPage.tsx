import { useState, useEffect } from "react";
import liff from "@line/liff";

type StepStatus = "idle" | "loading" | "ok" | "error";

interface StepResult {
  status: StepStatus;
  data?: unknown;
  error?: string;
}

const badge = (s: StepStatus) => {
  if (s === "ok") return "✅";
  if (s === "error") return "❌";
  if (s === "loading") return "⏳";
  return "⬜";
};

function ResultBox({ result }: { result: StepResult }) {
  if (result.status === "idle") return null;
  return (
    <pre className="mt-2 text-xs bg-gray-900 text-green-300 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
      {result.status === "error"
        ? `ERROR: ${result.error}`
        : JSON.stringify(result.data, null, 2)}
    </pre>
  );
}

export function LIFFDebugPage() {
  const [liffReady, setLiffReady] = useState<StepResult>({ status: "idle" });
  const [profileResult, setProfileResult] = useState<StepResult>({ status: "idle" });
  const [notifTokenResult, setNotifTokenResult] = useState<StepResult>({ status: "idle" });
  const [resolveResult, setResolveResult] = useState<StepResult>({ status: "idle" });
  const [consentResult, setConsentResult] = useState<StepResult>({ status: "idle" });

  const [liffId, setLiffId] = useState("");
  const [isInClient, setIsInClient] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<{ userId: string; displayName: string } | null>(null);
  const [notifToken, setNotifToken] = useState<string>("");
  const [publicApiBase, setPublicApiBase] = useState("");

  useEffect(() => {
    const id = (import.meta.env.VITE_SHARED_LIFF_ID as string | undefined) ?? "";
    const base = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)
      || (import.meta.env.VITE_API_URL as string | undefined)
      || "";
    setLiffId(id);
    setPublicApiBase(base);
  }, []);

  async function initLIFF() {
    setLiffReady({ status: "loading" });
    try {
      if (!liffId) throw new Error("VITE_SHARED_LIFF_ID is empty");
      await liff.init({ liffId });
      const inClient = liff.isInClient();
      const loggedIn = liff.isLoggedIn();
      setIsInClient(inClient);
      setIsLoggedIn(loggedIn);
      const params: Record<string, string> = {};
      new URLSearchParams(window.location.search).forEach((v, k) => { params[k] = v; });
      setUrlParams(params);
      setLiffReady({
        status: "ok",
        data: {
          liffId,
          isInClient: inClient,
          isLoggedIn: loggedIn,
          publicApiBase,
          urlParams: params,
          href: window.location.href,
        },
      });
    } catch (e) {
      setLiffReady({ status: "error", error: String(e) });
    }
  }

  async function getProfile() {
    setProfileResult({ status: "loading" });
    try {
      const p = await liff.getProfile();
      setProfile({ userId: p.userId, displayName: p.displayName });
      setProfileResult({ status: "ok", data: p });
    } catch (e) {
      setProfileResult({ status: "error", error: String(e) });
    }
  }

  async function getNotifToken() {
    setNotifTokenResult({ status: "loading" });
    try {
      // liff.getNotificationToken is not in the npm package types but may be
      // injected by LINE app into the native liff object.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liffAny = liff as any;
      // Also try window.liff as fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const windowLiff = (window as any).liff;

      const hasOnLiff = typeof liffAny.getNotificationToken === "function";
      const hasOnWindow = windowLiff && typeof windowLiff.getNotificationToken === "function";

      if (!hasOnLiff && !hasOnWindow) {
        setNotifTokenResult({
          status: "error",
          error: `getNotificationToken NOT found on liff (${hasOnLiff}) or window.liff (${hasOnWindow}). Available keys: ${Object.keys(liffAny).filter(k => typeof liffAny[k] === 'function').join(', ')}`,
        });
        return;
      }

      const fn = hasOnLiff ? liffAny.getNotificationToken.bind(liffAny) : windowLiff.getNotificationToken.bind(windowLiff);
      const token: string | null = await fn();
      setNotifToken(token ?? "");
      setNotifTokenResult({ status: "ok", data: { token, length: token?.length ?? 0, source: hasOnLiff ? "liff" : "window.liff" } });
    } catch (e) {
      setNotifTokenResult({ status: "error", error: String(e) });
    }
  }

  async function resolveToken() {
    setResolveResult({ status: "loading" });
    try {
      const token = urlParams["token"] ?? "";
      const lineUid = profile?.userId ?? "";
      if (!token) throw new Error("No 'token' param in URL");
      if (!lineUid) throw new Error("No profile — run getProfile first");
      const url = `${publicApiBase}/v1/pnp/resolve-link-token`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ token, line_uid: lineUid }),
      });
      const body = await res.json().catch(() => ({}));
      setResolveResult({ status: res.ok ? "ok" : "error", data: { status: res.status, body, url } });
    } catch (e) {
      setResolveResult({ status: "error", error: String(e) });
    }
  }

  async function sendConsent() {
    setConsentResult({ status: "loading" });
    try {
      const lineOAId = urlParams["line_oa_id"] ?? "";
      const lineUid = profile?.userId ?? "";
      if (!lineOAId) throw new Error("No 'line_oa_id' param in URL");
      if (!lineUid) throw new Error("No profile — run getProfile first");
      if (!notifToken) throw new Error("No notification token — run getNotifToken first");
      const url = `${publicApiBase}/v1/public/lon/liff-consent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          line_oa_id: lineOAId,
          line_user_id: lineUid,
          notification_token: notifToken,
        }),
      });
      const bodyData = await res.json().catch(() => ({}));
      setConsentResult({ status: res.ok ? "ok" : "error", data: { status: res.status, body: bodyData, url } });
    } catch (e) {
      setConsentResult({ status: "error", error: String(e) });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 font-mono text-sm">
      <h1 className="text-lg font-bold mb-1 text-yellow-400">🛠 LIFF Debug Page</h1>
      <p className="text-gray-400 text-xs mb-4">กดทีละ step ตามลำดับ — ดูผลแต่ละขั้น</p>

      {/* Env info */}
      <div className="bg-gray-800 rounded p-3 mb-4 text-xs space-y-1">
        <div><span className="text-gray-400">LIFF ID: </span><span className="text-cyan-300">{liffId || "(empty)"}</span></div>
        <div><span className="text-gray-400">publicApiBase: </span><span className="text-cyan-300">{publicApiBase || "(empty — will use relative URL)"}</span></div>
      </div>

      {/* Step 1: init */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span>{badge(liffReady.status)}</span>
          <span className="font-bold">Step 1: liff.init()</span>
        </div>
        <button
          onClick={() => { void initLIFF(); }}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs"
        >
          Init LIFF
        </button>
        {liffReady.status === "ok" && (
          <div className="mt-2 text-xs space-y-1 text-gray-300">
            <div>isInClient: <span className={isInClient ? "text-green-400" : "text-red-400"}>{String(isInClient)}</span></div>
            <div>isLoggedIn: <span className={isLoggedIn ? "text-green-400" : "text-red-400"}>{String(isLoggedIn)}</span></div>
            <div>URL params: <span className="text-cyan-300">{JSON.stringify(urlParams)}</span></div>
          </div>
        )}
        <ResultBox result={liffReady} />
      </section>

      {/* Step 2: getProfile */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span>{badge(profileResult.status)}</span>
          <span className="font-bold">Step 2: liff.getProfile()</span>
        </div>
        <button
          onClick={() => { void getProfile(); }}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs"
        >
          Get Profile
        </button>
        {profile && (
          <div className="mt-1 text-xs text-gray-300">
            lineUID: <span className="text-cyan-300">{profile.userId}</span>
          </div>
        )}
        <ResultBox result={profileResult} />
      </section>

      {/* Step 3: getNotificationToken */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span>{badge(notifTokenResult.status)}</span>
          <span className="font-bold">Step 3: liff.getNotificationToken()</span>
          <span className="text-gray-500 text-xs">(อาจแสดง consent dialog)</span>
        </div>
        <button
          onClick={() => { void getNotifToken(); }}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white text-xs"
        >
          Get Notification Token
        </button>
        {notifToken && (
          <div className="mt-1 text-xs text-gray-300">
            token length: <span className="text-green-400">{notifToken.length}</span>
          </div>
        )}
        <ResultBox result={notifTokenResult} />
      </section>

      {/* Step 4: resolve-link-token */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span>{badge(resolveResult.status)}</span>
          <span className="font-bold">Step 4: POST /v1/pnp/resolve-link-token</span>
        </div>
        <div className="text-xs text-gray-400 mb-1">
          token param: <span className="text-cyan-300">{urlParams["token"] || "(missing!)"}</span>
        </div>
        <button
          onClick={() => { void resolveToken(); }}
          className="px-4 py-1.5 bg-green-700 hover:bg-green-600 rounded text-white text-xs"
        >
          Resolve Link Token
        </button>
        <ResultBox result={resolveResult} />
      </section>

      {/* Step 5: liff-consent */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span>{badge(consentResult.status)}</span>
          <span className="font-bold">Step 5: POST /v1/public/lon/liff-consent</span>
        </div>
        <div className="text-xs text-gray-400 mb-1">
          line_oa_id param: <span className="text-cyan-300">{urlParams["line_oa_id"] || "(missing!)"}</span>
        </div>
        <button
          onClick={() => { void sendConsent(); }}
          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-white text-xs"
        >
          Send LON Consent
        </button>
        <ResultBox result={consentResult} />
      </section>

      {/* Summary */}
      <section className="mt-6 bg-gray-800 rounded p-3 text-xs space-y-1">
        <div className="text-gray-400 font-bold mb-1">Summary</div>
        <div>{badge(liffReady.status)} LIFF init</div>
        <div>{badge(profileResult.status)} getProfile → lineUID: {profile?.userId || "-"}</div>
        <div>{badge(notifTokenResult.status)} getNotificationToken → {notifToken ? `token (${notifToken.length} chars)` : "-"}</div>
        <div>{badge(resolveResult.status)} resolve-link-token</div>
        <div>{badge(consentResult.status)} liff-consent (LON subscribe)</div>
      </section>
    </div>
  );
}
