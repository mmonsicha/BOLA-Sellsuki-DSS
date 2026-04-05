import { api } from "./client";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface LogFilterParams {
  line_oa_id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  from?: string;
  to?: string;
}

export interface StatsFilterParams {
  line_oa_id?: string;
  from?: string;
  to?: string;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export interface BroadcastDeliveryLog {
  id: string;
  broadcast_id: string;
  campaign_id: string;
  line_user_id: string;
  follower_id: string;
  status: string;
  error_message: string;
  sent_at: string | null;
  created_at: string;
}

export interface BroadcastDeliveryLogStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
}

// ─── Auto-Reply ───────────────────────────────────────────────────────────────

export interface AutoReplyLogEntry {
  id: string;
  session_id: string;
  line_oa_id: string;
  content: string;
  message_type: string;
  follower_display_name: string;
  follower_picture_url: string;
  created_at: string;
}

export interface AutoReplyLogStats {
  total: number;
}

// ─── Auto Push Message ────────────────────────────────────────────────────────

export interface AutoPushDeliveryLog {
  id: string;
  auto_push_message_id: string;
  status: string;
  target_follower_count: number;
  success_count: number;
  failure_count: number;
  error_message: string | null;
  triggered_at: string;
  completed_at: string | null;
}

export interface AutoPushDeliveryLogStats {
  total: number;
  success: number;
  failed: number;
  partial_failure: number;
  pending: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const messageLogsApi = {
  // Broadcast
  listBroadcastLogs: (params: LogFilterParams) =>
    api.get<{ data: BroadcastDeliveryLog[]; total: number }>("/v1/broadcast-delivery-logs", params),
  getBroadcastStats: (params: StatsFilterParams) =>
    api.get<BroadcastDeliveryLogStats>("/v1/broadcast-delivery-logs/stats", params),

  // Auto-Reply
  listAutoReplyLogs: (params: LogFilterParams) =>
    api.get<{ data: AutoReplyLogEntry[]; total: number }>("/v1/auto-reply-logs", params),
  getAutoReplyStats: (params: StatsFilterParams) =>
    api.get<AutoReplyLogStats>("/v1/auto-reply-logs/stats", params),

  // Auto Push Message
  listAutoPushLogs: (params: Omit<LogFilterParams, "line_oa_id">) =>
    api.get<{ data: AutoPushDeliveryLog[]; total: number }>("/v1/auto-push-delivery-logs", params),
  getAutoPushStats: (params: Omit<StatsFilterParams, "line_oa_id">) =>
    api.get<AutoPushDeliveryLogStats>("/v1/auto-push-delivery-logs/stats", params),
};
