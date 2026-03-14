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

/** Clear all auth state and redirect to login. */
export function logout(): void {
  clearToken();
  clearWorkspaceId();
  clearTokenExpiry();
  window.location.href = "/login";
}

/** Returns true if the user has a stored JWT. */
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
