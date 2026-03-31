import type { RichMenu, RichMenuPage, RichMenuPageArea, RichMenuAssignment, QuickReply } from "@/types";
import { api } from "./client";

// Rich Menus
export const richMenuApi = {
  list: (lineOAID: string) =>
    api.get<{ data: RichMenu[] }>("/v1/rich-menus", { line_oa_id: lineOAID }),

  get: (id: string) =>
    api.get<RichMenu>(`/v1/rich-menus/${id}`),

  create: (data: Partial<RichMenu>) =>
    api.post<RichMenu>("/v1/rich-menus", data),

  update: (id: string, data: Partial<RichMenu>) =>
    api.put<RichMenu>(`/v1/rich-menus/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/v1/rich-menus/${id}`),

  publish: (id: string) =>
    api.post<RichMenu>(`/v1/rich-menus/${id}/publish`),

  setDefault: (id: string) =>
    api.post<RichMenu>(`/v1/rich-menus/${id}/set-default`),

  unsetDefault: (id: string) =>
    api.post<RichMenu>(`/v1/rich-menus/${id}/unset-default`),

  duplicate: (id: string, targetLineOAID: string) =>
    api.post<RichMenu>(`/v1/rich-menus/${id}/duplicate`, { target_line_oa_id: targetLineOAID }),
};

// Pages
export const richMenuPageApi = {
  create: (menuId: string, data: Partial<RichMenuPage>) =>
    api.post<RichMenuPage>(`/v1/rich-menus/${menuId}/pages`, data),

  update: (menuId: string, pageId: string, data: Partial<RichMenuPage>) =>
    api.put<RichMenuPage>(`/v1/rich-menus/${menuId}/pages/${pageId}`, data),

  uploadImage: (menuId: string, pageId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`/v1/rich-menus/${menuId}/pages/${pageId}/upload-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || `Request failed: ${res.status}`);
      return json as { image_url: string };
    });
  },

  delete: (menuId: string, pageId: string) =>
    api.delete<void>(`/v1/rich-menus/${menuId}/pages/${pageId}`),
};

// Areas
export const richMenuAreaApi = {
  replaceAll: (menuId: string, pageId: string, areas: Partial<RichMenuPageArea>[]) =>
    api.put<RichMenuPageArea[]>(`/v1/rich-menus/${menuId}/pages/${pageId}/areas`, areas),

  create: (menuId: string, pageId: string, data: Partial<RichMenuPageArea>) =>
    api.post<RichMenuPageArea>(`/v1/rich-menus/${menuId}/pages/${pageId}/areas`, data),

  update: (menuId: string, pageId: string, areaId: string, data: Partial<RichMenuPageArea>) =>
    api.put<RichMenuPageArea>(`/v1/rich-menus/${menuId}/pages/${pageId}/areas/${areaId}`, data),

  delete: (menuId: string, pageId: string, areaId: string) =>
    api.delete<void>(`/v1/rich-menus/${menuId}/pages/${pageId}/areas/${areaId}`),
};

// Assignments
export const richMenuAssignmentApi = {
  list: (lineOAID: string) =>
    api.get<{ data: RichMenuAssignment[] }>("/v1/rich-menu-assignments", { line_oa_id: lineOAID }),

  get: (id: string) =>
    api.get<RichMenuAssignment>(`/v1/rich-menu-assignments/${id}`),

  create: (data: Partial<RichMenuAssignment>) =>
    api.post<RichMenuAssignment>("/v1/rich-menu-assignments", data),

  update: (id: string, data: Partial<RichMenuAssignment>) =>
    api.put<RichMenuAssignment>(`/v1/rich-menu-assignments/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/v1/rich-menu-assignments/${id}`),

  evaluate: (lineOAID: string, followerID: string) =>
    api.post<{ matched: boolean; rich_menu_id: string; reason: string }>(
      "/v1/rich-menu-assignments/evaluate",
      { line_oa_id: lineOAID, follower_id: followerID }
    ),

  apply: (lineOAID: string, followerID: string) =>
    api.post<{ ok: boolean }>(
      "/v1/rich-menu-assignments/apply",
      { line_oa_id: lineOAID, follower_id: followerID }
    ),
};

// Quick Replies
export const quickReplyApi = {
  list: (workspaceID: string, lineOAID?: string) => {
    const params: Record<string, string> = { workspace_id: workspaceID };
    if (lineOAID) params.line_oa_id = lineOAID;
    return api.get<{ data: QuickReply[] }>("/v1/quick-replies", params);
  },

  get: (id: string) =>
    api.get<QuickReply>(`/v1/quick-replies/${id}`),

  create: (data: Partial<QuickReply>) =>
    api.post<QuickReply>("/v1/quick-replies", data),

  update: (id: string, data: Partial<QuickReply>) =>
    api.put<QuickReply>(`/v1/quick-replies/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/v1/quick-replies/${id}`),
};
