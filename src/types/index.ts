// ---- LINE OA ----
export interface LineOA {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  picture_url: string;
  channel_id: string;
  webhook_url: string;
  basic_id: string;
  status: "active" | "inactive" | "error";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Follower (was Customer) ----
export type FollowStatus = "following" | "unfollowed" | "blocked";

export interface Follower {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  line_user_id: string;
  display_name: string;
  picture_url: string;
  status_message: string;
  language: string;
  follow_status: FollowStatus;
  email: string;
  phone: string;
  note: string;
  tags: string[];
  custom_fields: Record<string, string>;
  followed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Segment ----
export interface Segment {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  description: string;
  rule: {
    operator: "AND" | "OR";
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  };
  customer_count: number;
  is_dynamic: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Broadcast ----
export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
export type BroadcastTargetType = "all" | "segment" | "manual";

export interface Broadcast {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  target_type: BroadcastTargetType;
  target_segment_id: string;
  scheduled_at: string | null;
  sent_at: string | null;
  status: BroadcastStatus;
  total_recipients: number;
  success_count: number;
  fail_count: number;
  created_at: string;
  updated_at: string;
}

// ---- Auto Reply ----
export type TriggerType = "follow" | "keyword" | "postback" | "message" | "image";
export type MatchMode = "exact" | "contains" | "starts_with";

export interface AutoReply {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  is_enabled: boolean;
  priority: number;
  trigger: TriggerType;
  keywords: string[];
  match_mode: MatchMode;
  postback_data: string;
  messages: Array<{ type: string; payload: unknown }>;
  created_at: string;
  updated_at: string;
}

// ---- Media ----
export type MediaType = "image" | "video" | "audio" | "file" | "rich_menu";

export interface Media {
  id: string;
  workspace_id: string;
  name: string;
  original_name: string;
  type: MediaType;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

// ---- Webhook Setting ----
export type WebhookEventType =
  | "message" | "follow" | "unfollow" | "join" | "leave"
  | "postback" | "beacon" | "accountLink" | "memberJoined" | "memberLeft";

export type WebhookType = "LINE-HOOK" | "HOOK";
export type WebhookStatus = "active" | "inactive";

export interface WebhookVariable {
  name: string;
  description: string;
  required: boolean;
}

export interface WebhookSetting {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  // SRS fields
  webhook_type: WebhookType;       // LINE-HOOK | HOOK
  name: string;                    // display name
  webhook_event: string;           // "follow" | "message" | "all" etc.
  webhook_url: string;             // auto-generated inbound URL (immutable)
  description: string;
  category: string;
  status: WebhookStatus;           // active | inactive
  variables: WebhookVariable[];
  default_values: Record<string, unknown>;
  security_token: string;
  allowed_ips: string[];
  http_status_code: number;
  response_msg: string;
  created_by: string;
  // Legacy outbound fields
  target_url: string;
  secret: string;
  event_types: WebhookEventType[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestWebhookResponse {
  success: boolean; // true = BOLA processed successfully, false = rejected/errored
  webhook_event_id: string; // ID of created webhook_event record
  event_status: "processed" | "failed" | "pending"; // BOLA processing status
  message: string; // "✅ Webhook received and processed" or error details
  error?: string; // Detailed error if failed
  response_time_ms: number; // BOLA processing time (milliseconds)
  test_event_id: string; // Test ID for tracking
  timestamp: Date;
}

// ---- Workspace ----
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  plan_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---- API Error ----
export interface ApiError {
  error: string;
  error_code: string;
  issue_id: string;
}
