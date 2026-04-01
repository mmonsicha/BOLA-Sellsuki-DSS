# Data Models

All shared TypeScript interfaces live in `src/types/index.ts`. Do NOT scatter types across files.

## Workspace & Admin

```typescript
interface Workspace { id, name, slug, logo_url, plan_id, is_active, created_at, updated_at }

interface Admin {
  id, workspace_id, email, name, avatar_url
  role: "super_admin" | "admin" | "editor" | "viewer"
  status: "active" | "inactive" | "pending"
  last_login_at: string | null
  created_at, updated_at
}
```

**Role hierarchy:** `viewer` < `editor` < `admin` < `super_admin`

Fetched via `useCurrentAdmin()` hook (calls `api/auth.ts:getMe()`).

## LINE OA

```typescript
interface LineOA {
  id, workspace_id, name, description, picture_url
  channel_id, webhook_url, basic_id, liff_id
  status: "active" | "inactive" | "error"
  is_default: boolean
  follower_count: number
  created_at, updated_at
}
```

Note: `channel_secret` and `channel_access_token` are NOT returned to the frontend.

## Follower / Customer

```typescript
type FollowStatus = "following" | "unfollowed" | "blocked"

interface Follower {
  id, workspace_id, line_oa_id, line_user_id
  display_name, picture_url, status_message, language
  follow_status: FollowStatus
  email, phone, note
  tags: string[]
  custom_fields: Record<string, string>
  followed_at: string | null
  created_at, updated_at
}
```

## Phone Contact (detail view)

```typescript
type ContactStatus = "follower" | "phone_only" | "subscriber" | "linked"

interface UnifiedContact {
  id, workspace_id, line_oa_id
  contact_status: ContactStatus
  line_user_id?, display_name?, picture_url?, phone?
  first_name?, last_name?, follow_status?, followed_at?
  created_at, updated_at
}

interface PhoneContactFollowerDetail {
  id: string
  line_oa_id: string
  line_user_id: string         // LINE UID for this OA
  follower_id: string | null   // null until contact follows the OA
  is_follower: boolean
  linked_at: string
}

interface PhoneContactDetail {
  id, phone, first_name, last_name
  source: "csv" | "webhook" | "manual"
  created_at, updated_at
  linked_oas: PhoneContactFollowerDetail[]  // one per LINE OA this phone is linked to
}
```

## Segment

```typescript
interface Segment {
  id, workspace_id, line_oa_id, name, description
  rule: {
    operator: "AND" | "OR"
    conditions: Array<{ field: string; operator: string; value: string }>
  }
  customer_count: number
  is_dynamic: boolean
  created_at, updated_at
}
```

## Broadcast

```typescript
type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled"
type BroadcastTargetType = "all" | "segment" | "manual"

interface Broadcast {
  id, workspace_id, line_oa_id, name, campaign_id?
  target_type: BroadcastTargetType
  target_segment_id: string
  target_user_ids?: string[]
  messages?: Array<{ type: string; payload: unknown }>
  scheduled_at: string | null
  sent_at: string | null
  status: BroadcastStatus
  total_recipients, success_count, fail_count: number
  created_at, updated_at
}

interface BroadcastDeliveryLog {
  id, broadcast_id, campaign_id, line_user_id, follower_id
  status: "pending" | "success" | "failed"
  error_message?: string
  sent_at: string | null
  created_at
}
```

## Auto Reply

```typescript
type TriggerType = "follow" | "unfollow" | "keyword" | "postback" | "default"
type MatchMode = "exact" | "contains" | "prefix" | "regex"

interface AutoReply {
  id, workspace_id, line_oa_id, name
  is_enabled: boolean
  priority: number
  trigger: TriggerType
  keywords: string[]
  match_mode: MatchMode
  postback_data, quick_reply_id?: string
  messages: Array<{ type: string; payload: unknown }>
  created_at, updated_at
}
```

## Media

```typescript
type MediaType = "image" | "video" | "audio" | "file" | "rich_menu"

interface Media {
  id, workspace_id, name
  type: MediaType
  url, file_path, mime_type: string
  size_bytes: number
  created_at, updated_at
}
```

## PNP Templates

```typescript
interface PNPTemplateEditableField {
  path: string           // dot-notation JSON path into json_body, e.g. "body.contents[0].text"
  type: "text" | "url" | "button_label"  // input UI hint (for send form), NOT a structure change
  label: string          // human-readable label in send form
  max_len?: number       // 0 or undefined = no limit
}

interface PNPTemplate {
  id: string
  workspace_id: string
  line_oa_id: string
  name: string
  description: string
  message_type: "basic" | "emphasis" | "list" | "mix"
  variant: string        // "a" .. "f"
  json_body: Record<string, unknown>   // full LINE Flex bubble {type:"bubble", header, body, footer, styles}
  editable_schema: PNPTemplateEditableField[]
  is_preset: boolean     // true = global LINE-approved preset (read-only, cannot delete/update)
  preset_ref_id: string  // e.g. "1a", "2c"
  created_by: string
  created_at, updated_at: string
}
```

**Key rules:**
- `json_body` is a Flex **bubble** object — pass directly to `FlexCardPreview` as `JSON.stringify(template.json_body)`
- `is_preset: true` = global preset seeded from LINE sample code (18 total: 1a-1c, 2a-2c, 3a-3f, 4a-4f)
- `is_preset: false` = OA-specific custom template (editable, deletable)
- `editable_schema[].type` only affects input UI in the send form; does NOT change how values are applied to json_body
- Use `applyTemplateVariables(json_body, editable_schema, vars)` from `@/utils/pnpTemplateUtils.ts` to patch example/real values onto json_body for preview or sending

## LON (LINE Notification Messaging)

```typescript
type LONSubscriberStatus = "active" | "revoked" | "expired"
type LONIdentityStatus = "unmapped" | "complete" | "purged"

interface LONSubscriber {
  id, workspace_id, line_oa_id
  follower_id?, line_user_id
  phone_number?: string | null
  status: LONSubscriberStatus
  source: string            // "liff" | "qr_code" | "chat" | "web_embed" | "unknown"
  consent_at, created_at, updated_at: string
  revoked_at?: string | null
  display_name?, picture_url?: string | null
  identity_status?: LONIdentityStatus | null
  is_friend?: boolean | null
}

interface LONSubscriberStats { total, active, revoked, expired: number }

type LONDeliveryStatus = "pending" | "success" | "failed"
interface LONDeliveryLog {
  id, workspace_id, lon_subscriber_id, line_user_id
  messages: Array<Record<string, unknown>>
  status: LONDeliveryStatus
  error_message?, http_status_code?: number
  triggered_by, sent_at: string
}

// PNP (LON by Phone) — delivery via LINE Partner Notification Push
interface PNPDeliveryLog {
  id, workspace_id, line_oa_id: string
  phone_hash: string          // SHA256(phone); resolve via bola_lon_phone_map localStorage key
  template_key: string
  status: "success" | "failed"
  error_message?: string
  http_status_code?: number
  triggered_by, sent_at, created_at: string
}

interface PNPTemplateEditableField {
  path: string
  type: "text" | "url" | "button_label"
  label: string
  max_len?: number
}

interface PNPTemplate {
  id, workspace_id, line_oa_id: string
  name, description: string
  message_type: "basic" | "emphasis" | "list" | "mix"
  variant: string
  json_body: Record<string, unknown>
  editable_schema: PNPTemplateEditableField[]
  is_preset: boolean       // true = global preset (read-only); false = OA-specific (editable)
  preset_ref_id: string
  created_by, created_at, updated_at: string
}
```

## Registration Form

```typescript
type FieldType = "text" | "phone" | "email" | "date" | "select" | "checkbox" | "number"

interface FormField { key, label, type: FieldType, required: boolean, options?: string[] }

interface RegistrationForm {
  id, workspace_id, line_oa_id, name, title, description
  logo_url, primary_color, liff_id, liff_url
  success_message, redirect_url
  fields: FormField[]
  terms_text: string
  is_active: boolean
  submission_count: number
  created_at, updated_at
}

interface FormSubmission {
  id, form_id, workspace_id, follower_id, line_user_id
  submission_data: Record<string, string>
  ip_address, submitted_at: string
}
```

## Analytics

```typescript
interface AnalyticsSummary {
  total_clicks, total_impressions: number
  ctr: number
  unique_users: number
  top_elements: TopElementStats[]
}

interface TopElementStats {
  element_id, element_label, element_type: string
  impressions, clicks: number
  ctr: number
}

interface FollowerBehaviorSummary {
  id, workspace_id, follower_id: string
  total_clicks, total_impressions, total_messages_sent, chat_sessions_count: number
  last_active_at, first_active_at: string | null
  most_clicked_label, most_clicked_element_type: string
  engagement_score: number
  interest_tags: string[]
  behavior_custom_fields: Record<string, unknown>
  updated_at: string
}
```

## Adding New Types

Always add to `src/types/index.ts`. Do NOT create separate type files per domain.
