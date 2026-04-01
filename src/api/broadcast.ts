import { api } from "./client";
import type { Broadcast, BroadcastDeliveryLog } from "@/types";

// ─── Request types ─────────────────────────────────────────────────────────

export interface BroadcastMessageInput {
  type: "text" | "flex";
  payload: Record<string, unknown>;
}

export interface CreateBroadcastRequest {
  workspace_id: string;
  line_oa_id: string;
  name: string;
  messages: BroadcastMessageInput[];
  target_type: "all" | "segment" | "manual" | "lon_subscribers" | "phone_contacts";
  target_segment_id?: string;
  target_user_ids?: string[];
  target_template_id?: string;
  target_template_variables?: Record<string, string>;
  scheduled_at?: string | null;
}

export interface CreateCampaignBroadcastRequest {
  workspace_id: string;
  campaign_name: string;
  line_oa_ids: string[];
  messages: BroadcastMessageInput[];
  target_type: "all" | "segment" | "manual" | "lon_subscribers" | "phone_contacts";
  target_segment_id?: string;
  target_template_id?: string;
  target_template_variables?: Record<string, string>;
  scheduled_at?: string | null;
}

export interface ListBroadcastsParams {
  workspace_id: string;
  line_oa_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

// ─── API client ────────────────────────────────────────────────────────────

export const broadcastApi = {
  list: (params: ListBroadcastsParams) =>
    api.get<{ data: Broadcast[]; total: number }>("/v1/broadcasts", params as Record<string, string | number | boolean>),

  get: (id: string) =>
    api.get<{ data: Broadcast }>(`/v1/broadcasts/${id}`),

  create: (body: CreateBroadcastRequest) =>
    api.post<{ data: Broadcast }>("/v1/broadcasts", body),

  createCampaign: (body: CreateCampaignBroadcastRequest) =>
    api.post<{ data: Broadcast[] }>("/v1/broadcasts/campaign", body),

  send: (id: string) =>
    api.post<{ data: Broadcast }>(`/v1/broadcasts/${id}/send`),

  cancel: (id: string) =>
    api.post<{ data: Broadcast }>(`/v1/broadcasts/${id}/cancel`),

  listDeliveryLogs: (
    broadcastId: string,
    params?: { page?: number; page_size?: number; status?: string }
  ) =>
    api.get<{ data: BroadcastDeliveryLog[]; total: number }>(
      `/v1/broadcasts/${broadcastId}/delivery-logs`,
      params as Record<string, string | number | boolean> | undefined
    ),
};
