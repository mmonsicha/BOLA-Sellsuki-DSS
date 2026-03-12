// Token and workspace storage helpers

const TOKEN_KEY = "bola_token";
const WORKSPACE_KEY = "bola_workspace";

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

/** Clear all auth state and redirect to login. */
export function logout(): void {
  clearToken();
  clearWorkspaceId();
  window.location.href = "/login";
}

/** Returns true if the user has a stored JWT. */
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
