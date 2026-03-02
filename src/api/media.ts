import { api } from "./client";
import type { Media, MediaType } from "@/types";

export const mediaApi = {
  list: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: Media[] }>("/v1/media", params),

  get: (id: string) =>
    api.get<Media>(`/v1/media/${id}`),

  create: (body: {
    workspace_id: string;
    name: string;
    original_name: string;
    type: MediaType;
    mime_type: string;
    size: number;
    url: string;
    thumbnail_url?: string;
    storage_path?: string;
    uploaded_by?: string;
  }) => api.post<Media>("/v1/media", body),

  delete: (id: string) =>
    api.delete<void>(`/v1/media/${id}`),
};
