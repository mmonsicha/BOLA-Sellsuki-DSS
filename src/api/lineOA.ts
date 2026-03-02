import { api } from "./client";
import type { LineOA } from "@/types";

export interface ListLineOAsParams {
  workspace_id: string;
  page?: number;
  page_size?: number;
}

export interface CreateLineOABody {
  workspace_id: string;
  name: string;
  description?: string;
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  basic_id?: string;
  is_default?: boolean;
}

export const lineOAApi = {
  list: (params: ListLineOAsParams) =>
    api.get<{ data: LineOA[] }>("/v1/line-oas", params),

  get: (id: string) =>
    api.get<LineOA>(`/v1/line-oas/${id}`),

  create: (body: CreateLineOABody) =>
    api.post<LineOA>("/v1/line-oas", body),

  update: (id: string, body: Partial<CreateLineOABody>) =>
    api.put<LineOA>(`/v1/line-oas/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/line-oas/${id}`),
};
