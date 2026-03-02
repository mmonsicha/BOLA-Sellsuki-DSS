import { api } from "./client";
import type { Segment } from "@/types";

export const segmentApi = {
  list: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: Segment[] }>("/v1/segments", params),

  get: (id: string) =>
    api.get<Segment>(`/v1/segments/${id}`),

  create: (body: {
    workspace_id: string;
    name: string;
    description?: string;
    rule: object;
    is_dynamic?: boolean;
  }) => api.post<Segment>("/v1/segments", body),

  update: (id: string, body: Partial<{ name: string; description: string; rule: object; is_dynamic: boolean }>) =>
    api.put<Segment>(`/v1/segments/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/segments/${id}`),
};
