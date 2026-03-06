import type { ApiResponse } from "@/types";

export interface AutoPushMessage {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  webhook_setting_id: string;
  webhook_url: string;
  name: string;
  description?: string;
  message_type: "text" | "flex";
  message_template: string;
  flex_message_id?: string;
  target_type: "follower" | "segment" | "all_followers" | "line_group";
  target_segment_id?: string;
  target_follower_ids?: string[];
  group_chat_id?: string;
  is_enabled: boolean;
  total_deliveries: number;
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
  example_payload?: Record<string, any>;
}

export interface DeliveryLog {
  id: string;
  auto_push_message_id: string;
  status: "pending" | "success" | "partial_failure" | "failed";
  target_follower_count: number;
  success_count: number;
  failure_count: number;
  error_message?: string;
  triggered_at: string;
  completed_at?: string;
}

export interface CreateAutoPushMessageRequest {
  line_oa_id: string;
  webhook_setting_id: string;
  name: string;
  description?: string;
  message_type?: "text" | "flex";
  message_template?: string;
  flex_message_id?: string;
  target_type: "follower" | "segment" | "all_followers" | "line_group";
  target_segment_id?: string;
  target_follower_ids?: string[];
}

export interface UpdateAutoPushMessageRequest {
  name?: string;
  description?: string;
  message_type?: "text" | "flex";
  message_template?: string;
  flex_message_id?: string;
  is_enabled?: boolean;
  target_type?: string;
  target_segment_id?: string;
  target_follower_ids?: string[];
}

const API_BASE = "/v1/auto-push-messages";

export const autoPushMessageApi = {
  // Create auto push message
  async create(data: CreateAutoPushMessageRequest): Promise<ApiResponse<AutoPushMessage>> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Get single auto push message
  async get(id: string): Promise<ApiResponse<AutoPushMessage>> {
    const response = await fetch(`${API_BASE}/${id}`);
    return response.json();
  },

  // List auto push messages
  async list(params: { line_oa_id: string; page?: number; page_size?: number }): Promise<ApiResponse<AutoPushMessage[]>> {
    const queryParams = new URLSearchParams({
      line_oa_id: params.line_oa_id,
      page: String(params.page || 1),
      page_size: String(params.page_size || 20),
    });
    const response = await fetch(`${API_BASE}?${queryParams}`);
    return response.json();
  },

  // Update auto push message
  async update(id: string, data: UpdateAutoPushMessageRequest): Promise<ApiResponse<AutoPushMessage>> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Delete auto push message
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Delete failed with status ${response.status}`);
    }
  },

  // Toggle auto push message enabled status
  async toggle(id: string, currentIsEnabled: boolean): Promise<ApiResponse<AutoPushMessage>> {
    return this.update(id, { is_enabled: !currentIsEnabled });
  },

  // List delivery logs
  async listDeliveries(
    autoPushMessageId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<ApiResponse<DeliveryLog[]>> {
    const queryParams = new URLSearchParams({
      page: String(params?.page || 1),
      page_size: String(params?.page_size || 20),
    });
    const response = await fetch(`${API_BASE}/${autoPushMessageId}/deliveries?${queryParams}`);
    return response.json();
  },
};
