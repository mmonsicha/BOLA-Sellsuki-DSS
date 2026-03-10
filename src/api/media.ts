import { api } from "./client";
import type { Media, MediaType, PresignedUploadResponse } from "@/types";

export interface RequestUploadBody {
  workspace_id: string;
  name: string;
  original_name: string;
  type: MediaType;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  alt_text: string;
  action_url: string;
  tags: string[];
  has_thumbnail: boolean;
}

export interface UpdateMediaBody {
  name?: string;
  alt_text?: string;
  action_url?: string;
  tags?: string[];
}

export const mediaApi = {
  list: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: Media[] }>("/v1/media", params),

  get: (id: string) =>
    api.get<Media>(`/v1/media/${id}`),

  requestUpload: (body: RequestUploadBody) =>
    api.post<PresignedUploadResponse>("/v1/media/request-upload", body),

  uploadToS3: async (presignedUrl: string, file: Blob, mimeType: string): Promise<void> => {
    const res = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": mimeType },
    });
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  },

  confirmUpload: (id: string) =>
    api.post<Media>(`/v1/media/${id}/confirm-upload`, {}),

  update: (id: string, body: UpdateMediaBody) =>
    api.put<Media>(`/v1/media/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/media/${id}`),

  listDeleted: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: Media[] }>("/v1/media/deleted", params),

  restore: (id: string) =>
    api.post<Media>(`/v1/media/${id}/restore`, {}),
};
