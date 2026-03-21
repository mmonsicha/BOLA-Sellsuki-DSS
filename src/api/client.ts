// Use empty string so all requests go through Vite's proxy (defined in vite.config.ts).
// Set VITE_API_URL only if you need to point to a remote backend directly.
const BASE_URL = import.meta.env.VITE_API_URL || "";

/** Public paths that should not trigger a redirect on 401. */
const PUBLIC_PATHS = ["/v1/auth/login", "/auth/accept-invite"];

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    let url = `${this.baseURL}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          searchParams.set(k, String(v));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("bola_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 401 on any protected endpoint → clear session and redirect appropriately
    if (res.status === 401 && !PUBLIC_PATHS.some((p) => path.includes(p))) {
      localStorage.removeItem("bola_token");
      localStorage.removeItem("bola_workspace");
      const authMode = import.meta.env.VITE_AUTH_MODE;
      if (authMode === "kratos") {
        // No valid Kratos session — send user to the Sellsuki login page.
        // Include return_to so Kratos redirects back to BOLA after login.
        const kratosLoginUrl = import.meta.env.VITE_KRATOS_LOGIN_URL || "https://accounts.sellsuki.local/login";
        // Use origin + pathname only — strip query params to prevent recursive
        // nesting of return_to when Kratos redirects back with extra params.
        const cleanUrl = window.location.origin + window.location.pathname;
        window.location.href = `${kratosLoginUrl}?return_to=${encodeURIComponent(cleanUrl)}`;
      } else {
        window.location.href = "/login";
      }
      return undefined as T;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    return this.request<T>("GET", path, undefined, params);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

export const api = new ApiClient(BASE_URL);
