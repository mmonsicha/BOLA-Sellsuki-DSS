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
  liff_id: string;
  outbound_webhook_url: string;
  outbound_webhook_secret: string;
  outbound_webhook_events: string;
  status: "active" | "inactive" | "error";
  is_default: boolean;
  follower_count: number;
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
  linked_contact?: {
    phone_contact_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  contact_profile?: {
    id: string;
    email: string;
    note: string;
    tags: string[];
    custom_fields: Record<string, string>;
  } | null;
}

export type ContactStatus = "follower" | "phone" | "phone_only" | "subscriber" | "linked";

export interface UnifiedContact {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  contact_status: ContactStatus;
  line_user_id?: string;
  display_name?: string;
  picture_url?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  follow_status?: string;
  followed_at?: string | null;
  created_at: string;
  updated_at: string;
  linked_oa_count?: number;
}

// ---- Phone Contact Detail ----
export interface PhoneContactFollowerDetail {
  id: string;
  line_oa_id: string;
  line_oa_name: string;
  line_oa_basic_id: string;
  line_user_id: string;
  follower_id: string | null;
  is_follower: boolean;
  follower_display_name?: string;
  follower_picture_url?: string;
  linked_at: string;
}

export interface PhoneContactDetail {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  source: string;
  created_at: string;
  updated_at: string;
  linked_oas: PhoneContactFollowerDetail[];
  contact_profile?: {
    id: string;
    email: string;
    note: string;
    tags: string[];
    custom_fields: Record<string, string>;
  } | null;
}

// ---- PNP Templates ----
export interface PNPTemplateEditableField {
  path: string;
  type: "text" | "url" | "button_label";
  label: string;
  max_len?: number;
}

export interface PNPTemplate {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  description: string;
  message_type: "basic" | "emphasis" | "list" | "mix";
  variant: string;
  json_body: Record<string, unknown>;
  editable_schema: PNPTemplateEditableField[];
  /** ID of the greeting template used for LIFF Track & Greet PNP sends. */
  greeting_template_id: string;
  /** LINE OA ID that sends the greeting; empty means use the PNP sender OA. */
  greeting_line_oa_id?: string;
  /** Approach B: message type to send after user completes LIFF greeting. */
  on_greeting_message_type?: "none" | "flex" | "pnp_template";
  /** Approach B: flex JSON payload or {template_id: string} depending on on_greeting_message_type. */
  on_greeting_payload?: Record<string, unknown>;
  /** Approach B: LINE OA ID that pushes message 2; empty means use the template OA. */
  on_greeting_line_oa_id?: string;
  /** Approach B: when true, message 2 is sent only once per phone number. */
  on_greeting_send_once?: boolean;
  /** Approach B: if non-empty, LIFF page redirects here after greeting instead of closing. Supports {variable_key} placeholders. */
  on_greeting_redirect_url?: string;
  is_preset: boolean;
  preset_ref_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ---- Segment ----
export interface Segment {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  source_type: "follower" | "contact";
  name: string;
  description: string;
  rule: {
    operator: "AND" | "OR";
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
      key?: string;
    }>;
  };
  customer_count: number;
  is_dynamic: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Segment Preview ----
export interface PreviewSegmentListItem {
  id: string;
  display_name: string;
  picture_url: string;
  phone: string;
  email?: string;
  follow_status?: string;
  tags?: string[];
  first_name?: string;
  last_name?: string;
}

// ---- Broadcast ----
export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
export type BroadcastTargetType = "all" | "segment" | "manual" | "lon_subscribers" | "phone_contacts";

export interface Broadcast {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  campaign_id?: string;
  target_type: BroadcastTargetType;
  target_segment_id: string;
  target_user_ids?: string[];
  target_template_id?: string;
  target_template_variables?: Record<string, string>;
  messages?: Array<{ type: string; payload: unknown }>;
  scheduled_at: string | null;
  sent_at: string | null;
  status: BroadcastStatus;
  total_recipients: number;
  success_count: number;
  fail_count: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastDeliveryLog {
  id: string;
  broadcast_id: string;
  campaign_id: string;
  line_user_id: string;
  follower_id: string;
  status: "pending" | "success" | "failed";
  error_message?: string;
  sent_at: string | null;
  created_at: string;
}

// ---- Auto Reply ----
export type TriggerType = "follow" | "unfollow" | "keyword" | "postback" | "default" | "lon_subscribed" | "pnp_delivered" | "liff_uid_capture";
export type MatchMode = "exact" | "contains" | "prefix" | "regex";
export type AutoReplyConditionType = "" | "lon_phone_contact" | "lon_subscriber";
/** How a pnp_delivered rule sends message 2. */
export type AutoReplySendMethod = "pnp_hash" | "push" | "auto";

export interface AutoReplyTriggerConfig {
  /** Applies to pnp_delivered trigger: delivery channel for message 2. */
  send_method?: AutoReplySendMethod;
  /** Applies to liff_uid_capture trigger: when true, fires at most once per user per rule. */
  send_once?: boolean;
}

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
  condition_type: AutoReplyConditionType;
  trigger_config: AutoReplyTriggerConfig;
  quick_reply_id?: string;
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
  thumbnail_s3_key: string;
  uploaded_by: string;
  alt_text: string;
  action_url: string;
  width: number;
  height: number;
  tags: string[];
  upload_status: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PresignedUploadResponse {
  media_id: string;
  upload_url: string;
  thumbnail_upload_url: string;
  public_url: string;
  thumbnail_public_url: string;
  expires_at: string;
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

// ---- Outbound Webhook ----

export interface OutboundWebhookConfig {
  workspace_id: string;
  webhook_url: string;
  has_secret: boolean;
}

export type OutboundDeliveryStatus = "success" | "failed" | "pending";

export interface OutboundDeliveryLog {
  id: string;
  workspace_id: string;
  event_type: string;
  target_url: string;
  status: OutboundDeliveryStatus;
  http_status_code?: number;
  error_message?: string;
  triggered_at: string;
}

// ---- API Error ----
export interface ApiError {
  error: string;
  error_code: string;
  issue_id: string;
}

// ---- AI Chatbot ----
export type LLMProvider = "openai" | "anthropic" | "google" | "custom";
export type ChatMode = "ai" | "human";
export type ChatType = "one_on_one" | "group" | "room";
export type MessageRole = "user" | "assistant" | "system" | "human_agent";
export type KBSourceType = "manual" | "imported" | "learned_from_reply";
export type QuestionStatus = "pending" | "resolved" | "dismissed";
export type EscalationReason = "low_confidence" | "manual" | "keyword";

export interface AIChatbotConfig {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  is_enabled: boolean;
  enable_group_chat: boolean;
  group_chat_trigger_prefix: string;
  llm_provider: LLMProvider;
  llm_model: string;
  llm_api_base_url: string;
  llm_temperature: number;
  system_prompt: string;
  confidence_threshold: number;
  max_context_turns: number;
  fallback_message: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  chat_type: ChatType;
  line_chat_id: string;
  follower_id: string;
  follower_display_name: string;
  follower_picture_url: string;
  group_picture_url?: string;
  mode: ChatMode;
  assigned_admin_id: string;
  escalation_reason?: string;
  escalated_at?: string | null;
  first_human_reply_at?: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  workspace_id: string;
  role: MessageRole;
  content: string;
  message_type: string;
  line_message_id: string;
  metadata: string;
  is_escalation_trigger: boolean;
  sender_user_id?: string;
  sender_display_name?: string;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  source_type: KBSourceType;
  tags: string[];
  embedding_model: string;
  is_active: boolean;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
}

export interface UnansweredQuestion {
  id: string;
  workspace_id: string;
  session_id: string;
  follower_id: string;
  original_message: string;
  context_messages: ChatMessage[];
  status: QuestionStatus;
  resolved_knowledge_id: string;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by_admin_id: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// ---- Rich Menu ----
export interface RichMenuSize { width: number; height: number; }

export interface RichMenuPageArea {
  id: string;
  rich_menu_page_id: string;
  area_order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  action_type: string;
  action_label: string;
  action_uri: string;
  action_text: string;
  action_data: string;
  action_display_text: string;
  target_page_number: number;
}

export interface RichMenuPage {
  id: string;
  rich_menu_id: string;
  page_number: number;
  tab_label: string;
  image_url: string;
  image_media_id: string;
  line_rich_menu_id: string;
  line_rich_menu_alias_id: string;
  areas: RichMenuPageArea[];
}

export interface RichMenu {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  line_rich_menu_id: string;
  name: string;
  description: string;
  size_type: "large" | "compact";
  menu_type: "static" | "dynamic";
  chat_bar_text: string;
  selected: boolean;
  size: RichMenuSize;
  areas: unknown[];
  image_url: string;
  image_media_id: string;
  is_default: boolean;
  linked_segment_id: string;
  published_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  pages: RichMenuPage[];
  created_at: string;
  updated_at: string;
}

export interface AssignmentRule {
  field: string;
  operator: string;
  value: string;
}

export interface RichMenuAssignment {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  rich_menu_id: string;
  name: string;
  priority: number;
  rules: AssignmentRule[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickReplyItem {
  label: string;
  action_type: string;
  action_value: string;
  image_url: string;
}

export interface QuickReply {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  items: QuickReplyItem[];
  created_at: string;
  updated_at: string;
}

// ---- LON (LINE Notification Messaging) ----
export type LONSubscriberStatus = "active" | "revoked" | "expired";
export type LONDeliveryStatus = "success" | "failed" | "pending";

export type LONIdentityStatus = "unmapped" | "complete" | "purged";

export interface LONSubscriber {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  follower_id?: string;
  line_user_id: string;
  phone_number?: string | null;
  status: LONSubscriberStatus;
  source: string;
  consent_at: string;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched from followers table (null/undefined if subscriber is not an OA follower)
  display_name?: string | null;
  picture_url?: string | null;
  // RGB identity fields
  identity_status?: LONIdentityStatus | null;
  is_friend?: boolean | null;
}

export interface LONSubscriberStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
}

export interface LONDeliveryLog {
  id: string;
  workspace_id: string;
  lon_subscriber_id: string;
  line_user_id: string;
  messages: Array<Record<string, unknown>>;
  status: LONDeliveryStatus;
  error_message?: string;
  http_status_code?: number;
  triggered_by: string;
  sent_at: string;
}

// ---- LON by Phone (PNP) ----
export interface PNPDeliveryLog {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  phone_hash: string;
  masked_phone?: string;
  template_key: string;
  status: "success" | "failed";
  error_message?: string;
  http_status_code?: number;
  triggered_by: string;
  sent_at: string;
  created_at: string;
}

export interface BulkSendPNPResult {
  phone_number: string;
  log?: PNPDeliveryLog;
  error?: string;
}

export interface OnGreetingSentRecord {
  source_template_id: string;
  source_template_name: string;
  phone_hash: string;
  masked_phone?: string;
  sent_at: string;
}

export interface BulkSendLONByPhoneResponse {
  results: BulkSendPNPResult[];
}

// ---- LIFF UID Capture Log ----
export interface LIFFUIDCaptureLog {
  id: string;
  line_user_id: string;
  display_name: string;
  picture_url: string;
  created_at: string;
}

// ---- Registration Form ----
export type FieldType = "text" | "phone" | "email" | "date" | "select" | "checkbox" | "number";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface RegistrationForm {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  title: string;
  description: string;
  logo_url: string;
  primary_color: string;
  liff_id: string;
  liff_url: string;
  success_message: string;
  redirect_url: string;
  fields: FormField[];
  terms_text: string;
  is_active: boolean;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  workspace_id: string;
  follower_id: string;
  line_user_id: string;
  submission_data: Record<string, string>;
  ip_address: string;
  submitted_at: string;
}

// ---- Analytics & CDP ----
export interface AnalyticsEvent {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  line_user_id: string;
  follower_id: string;
  event_type: string;
  element_type: string;
  element_id: string;
  element_label: string;
  target_url: string;
  occurred_at: string;
}

export interface TopElementStats {
  element_id: string;
  element_label: string;
  element_type: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AnalyticsSummary {
  total_clicks: number;
  total_impressions: number;
  ctr: number;
  unique_users: number;
  top_elements: TopElementStats[];
}

export interface FollowerBehaviorSummary {
  id: string;
  workspace_id: string;
  follower_id: string;
  total_clicks: number;
  total_impressions: number;
  total_messages_sent: number;
  chat_sessions_count: number;
  last_active_at: string | null;
  first_active_at: string | null;
  most_clicked_label: string;
  most_clicked_element_type: string;
  engagement_score: number;
  interest_tags: string[];
  behavior_custom_fields: Record<string, unknown>;
  updated_at: string;
}

export interface AnalyticsEventConfig {
  token: string;
  tracking_url: string;
}

// ---- LON Jobs ----
export type LONJobScheduleType = "weekly" | "monthly";
export type LONJobStatus = "active" | "paused";

export interface LONJob {
  id: string;
  workspace_id: string;
  line_oa_id: string;
  name: string;
  description: string;
  schedule_type: LONJobScheduleType;
  schedule_weekdays: number[]; // 0=Sun..6=Sat (multiple days)
  schedule_days_of_month: number[]; // 1–31 (multiple days)
  schedule_hour: number; // 0–23
  schedule_minute: number; // 0–59
  timezone: string;
  target_type: "all_contacts" | "segment";
  target_segment_id?: string;
  template_id: string;
  template_variables: Record<string, string>;
  status: LONJobStatus;
  last_run_at: string | null;
  next_run_at: string | null;
  last_run_status: string; // "success" | "partial" | "failed" | ""
  total_runs: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LONJobRun {
  id: string;
  lon_job_id: string;
  workspace_id: string;
  executed_at: string;
  status: "success" | "partial" | "failed";
  sent_count: number;
  failed_count: number;
}

// ---- CSV Import Preview ----
export interface ImportPreviewError {
  row: number;
  phone: string;
  reason: string;
}

export interface ImportPhoneContactsPreview {
  total: number;
  insert_count: number;
  update_count: number;
  skip_count: number;
  error_count: number;
  errors: ImportPreviewError[];
}
