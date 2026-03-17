import type { RichMenu, RichMenuPage, RichMenuPageArea, RichMenuAssignment, QuickReply } from "@/types";

const BASE = "/v1";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("bola_token");
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...(options?.headers as Record<string, string>) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || `Request failed: ${res.status}`);
  return json;
}

// Rich Menus
export const richMenuApi = {
  list: (lineOAID: string) =>
    fetchJSON<{ data: RichMenu[] }>(`${BASE}/rich-menus?line_oa_id=${lineOAID}`),

  get: (id: string) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}`),

  create: (data: Partial<RichMenu>) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<RichMenu>) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetch(`${BASE}/rich-menus/${id}`, { method: "DELETE" }),

  publish: (id: string) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}/publish`, { method: "POST" }),

  setDefault: (id: string) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}/set-default`, { method: "POST" }),

  unsetDefault: (id: string) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}/unset-default`, { method: "POST" }),

  duplicate: (id: string, targetLineOAID: string) =>
    fetchJSON<RichMenu>(`${BASE}/rich-menus/${id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_line_oa_id: targetLineOAID }),
    }),
};

// Pages
export const richMenuPageApi = {
  create: (menuId: string, data: Partial<RichMenuPage>) =>
    fetchJSON<RichMenuPage>(`${BASE}/rich-menus/${menuId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (menuId: string, pageId: string, data: Partial<RichMenuPage>) =>
    fetchJSON<RichMenuPage>(`${BASE}/rich-menus/${menuId}/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  uploadImage: (menuId: string, pageId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${BASE}/rich-menus/${menuId}/pages/${pageId}/upload-image`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || `Request failed: ${res.status}`);
      return json as { image_url: string };
    });
  },

  delete: (menuId: string, pageId: string) =>
    fetch(`${BASE}/rich-menus/${menuId}/pages/${pageId}`, { method: "DELETE" }),
};

// Areas
export const richMenuAreaApi = {
  // Replace ALL areas for a page atomically. Returns saved areas with real IDs.
  replaceAll: (menuId: string, pageId: string, areas: Partial<RichMenuPageArea>[]) =>
    fetchJSON<RichMenuPageArea[]>(`${BASE}/rich-menus/${menuId}/pages/${pageId}/areas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(areas),
    }),

  create: (menuId: string, pageId: string, data: Partial<RichMenuPageArea>) =>
    fetchJSON<RichMenuPageArea>(`${BASE}/rich-menus/${menuId}/pages/${pageId}/areas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (menuId: string, pageId: string, areaId: string, data: Partial<RichMenuPageArea>) =>
    fetchJSON<RichMenuPageArea>(`${BASE}/rich-menus/${menuId}/pages/${pageId}/areas/${areaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (menuId: string, pageId: string, areaId: string) =>
    fetch(`${BASE}/rich-menus/${menuId}/pages/${pageId}/areas/${areaId}`, { method: "DELETE" }),
};

// Assignments
export const richMenuAssignmentApi = {
  list: (lineOAID: string) =>
    fetchJSON<{ data: RichMenuAssignment[] }>(`${BASE}/rich-menu-assignments?line_oa_id=${lineOAID}`),

  get: (id: string) =>
    fetchJSON<RichMenuAssignment>(`${BASE}/rich-menu-assignments/${id}`),

  create: (data: Partial<RichMenuAssignment>) =>
    fetchJSON<RichMenuAssignment>(`${BASE}/rich-menu-assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<RichMenuAssignment>) =>
    fetchJSON<RichMenuAssignment>(`${BASE}/rich-menu-assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetch(`${BASE}/rich-menu-assignments/${id}`, { method: "DELETE" }),

  evaluate: (lineOAID: string, followerID: string) =>
    fetchJSON<{ matched: boolean; rich_menu_id: string; reason: string }>(
      `${BASE}/rich-menu-assignments/evaluate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_oa_id: lineOAID, follower_id: followerID }),
      }
    ),

  apply: (lineOAID: string, followerID: string) =>
    fetchJSON<{ ok: boolean }>(
      `${BASE}/rich-menu-assignments/apply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_oa_id: lineOAID, follower_id: followerID }),
      }
    ),
};

// Quick Replies
export const quickReplyApi = {
  list: (workspaceID: string, lineOAID?: string) => {
    const params = new URLSearchParams({ workspace_id: workspaceID });
    if (lineOAID) params.set("line_oa_id", lineOAID);
    return fetchJSON<{ data: QuickReply[] }>(`${BASE}/quick-replies?${params.toString()}`);
  },

  get: (id: string) =>
    fetchJSON<QuickReply>(`${BASE}/quick-replies/${id}`),

  create: (data: Partial<QuickReply>) =>
    fetchJSON<QuickReply>(`${BASE}/quick-replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<QuickReply>) =>
    fetchJSON<QuickReply>(`${BASE}/quick-replies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: async (id: string) => {
    const res = await fetch(`${BASE}/quick-replies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.message || `Delete failed: ${res.status}`);
    }
  },
};
