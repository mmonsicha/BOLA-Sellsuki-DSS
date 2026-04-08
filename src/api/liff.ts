// liff.ts — Public LIFF endpoint API (no auth required, called from LIFF pages)
const BASE_URL =
  (import.meta.env.VITE_PUBLIC_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "";

export const liffApi = {
  /** Returns minimal public info (name) of a LINE OA. Used to set the LIFF page title. */
  getOAInfo: async (lineOAId: string): Promise<{ name: string }> => {
    const res = await fetch(
      `${BASE_URL}/v1/public/liff/oa-info?line_oa_id=${encodeURIComponent(lineOAId)}`,
      { credentials: "omit" },
    );
    if (!res.ok) return { name: "" };
    return res.json() as Promise<{ name: string }>;
  },

  /** Called by the LIFF UID capture page after liff.getProfile() succeeds. */
  uidCaptured: async (lineOAId: string, lineUserId: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/v1/public/liff/uid-captured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ line_oa_id: lineOAId, line_user_id: lineUserId }),
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }
  },

  /**
   * Resolves a PNP greeting token — links the phone contact to the LINE UID
   * and optionally returns a redirect URL.
   * Called when the LIFF page is opened from a LON by Phone message that includes a greeting token.
   */
  resolveGreetingToken: async (
    token: string,
    lineUid: string
  ): Promise<{ ok: boolean; redirect_url?: string }> => {
    const res = await fetch(`${BASE_URL}/v1/pnp/resolve-link-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ token, line_uid: lineUid }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ ok: boolean; redirect_url?: string }>;
  },
};
