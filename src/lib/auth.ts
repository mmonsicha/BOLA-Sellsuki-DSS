// Token and workspace storage helpers

const TOKEN_KEY = "bola_token";
const WORKSPACE_KEY = "bola_workspace";
const TOKEN_EXPIRY_KEY = "bola_token_expires_at";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getWorkspaceId(): string | null {
  return localStorage.getItem(WORKSPACE_KEY);
}

export function setWorkspaceId(id: string): void {
  localStorage.setItem(WORKSPACE_KEY, id);
}

export function clearWorkspaceId(): void {
  localStorage.removeItem(WORKSPACE_KEY);
}

export function setTokenExpiry(expiresAt: string): void {
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
}

export function getTokenExpiry(): Date | null {
  const val = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function clearTokenExpiry(): void {
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/** Returns true if the stored token has already passed its expiry time. */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return false; // no expiry stored → assume still valid
  return expiry <= new Date();
}

/** Returns milliseconds until expiry, or Infinity if no expiry is stored. */
export function getTokenExpiresIn(): number {
  const expiry = getTokenExpiry();
  if (!expiry) return Infinity;
  return expiry.getTime() - Date.now();
}

/** "kratos" | "local_jwt" — set by VITE_AUTH_MODE env var (default: local_jwt) */
export function getAuthMode(): "kratos" | "local_jwt" {
  const mode = import.meta.env.VITE_AUTH_MODE as string | undefined;
  return mode === "kratos" ? "kratos" : "local_jwt";
}

/**
 * Clear all auth state and redirect appropriately.
 * In Kratos mode, calls the backend to destroy the Kratos session first,
 * then redirects to the Kratos login page — one click, no confirmation pages.
 */
export async function logout(): Promise<void> {
  clearToken();
  clearWorkspaceId();
  clearTokenExpiry();

  if (getAuthMode() === "kratos") {
    // Wait for the backend to revoke the Kratos session BEFORE redirecting.
    // If we redirect too early, Kratos still sees an active session and
    // bounces the user right back to /choose-workspace.
    try {
      await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Network error — session might still be active, but redirect anyway.
    }

    // Redirect to Kratos login flow.
    const accountsBase = import.meta.env.VITE_KRATOS_ACCOUNTS_URL || "https://accounts.sellsuki.local";
    const returnTo = encodeURIComponent(window.location.origin + "/choose-workspace");
    window.location.href = `${accountsBase}/self-service/login/browser?return_to=${returnTo}`;
  } else {
    window.location.href = "/login";
  }
}

/**
 * Kratos mode only — leave the current workspace but keep the Kratos session.
 * Used for the "Switch Workspace" button in the sidebar.
 */
export function switchWorkspace(): void {
  clearWorkspaceId();
  window.location.href = "/choose-workspace";
}

/**
 * Returns true if the user is considered authenticated.
 * - local_jwt mode: has a stored JWT token
 * - kratos mode: has a selected workspace (session cookie validated on each API call)
 */
export function isAuthenticated(): boolean {
  if (getAuthMode() === "kratos") {
    return Boolean(getWorkspaceId());
  }
  return Boolean(getToken());
}
