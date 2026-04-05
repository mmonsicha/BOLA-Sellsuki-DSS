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

export interface UpdateLineOABody {
  name?: string;
  description?: string;
  channel_secret?: string;
  channel_access_token?: string;
  is_default?: boolean;
  liff_id?: string;
}

export interface MessageQuota {
  quota_type: "limited" | "none";
  /** Monthly message limit; -1 means unlimited. */
  limit: number;
  /** Messages sent this calendar month. */
  total_usage: number;
  /** limit - total_usage; -1 when unlimited. */
  remaining: number;
}

export const lineOAApi = {
  list: (params: ListLineOAsParams) =>
    api.get<{ data: LineOA[] }>("/v1/line-oas", params),

  get: (id: string) =>
    api.get<LineOA>(`/v1/line-oas/${id}`),

  create: (body: CreateLineOABody) =>
    api.post<LineOA>("/v1/line-oas", body),

  update: (id: string, body: UpdateLineOABody) =>
    api.put<LineOA>(`/v1/line-oas/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/line-oas/${id}`),

  updateOutboundWebhook: (id: string, body: { webhook_url: string; secret: string; events: string }) =>
    api.put<{ line_oa_id: string; webhook_url: string; has_secret: boolean; events: string }>(
      `/v1/line-oas/${id}/outbound-webhook`,
      body,
    ),

  getMessageQuota: (id: string) =>
    api.get<MessageQuota>(`/v1/line-oas/${id}/message-quota`),
};
