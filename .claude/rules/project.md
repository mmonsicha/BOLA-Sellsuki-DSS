# Project Context

## Product

BOLA (Business Operations LINE Agency) is the **admin backoffice SPA** for operators managing LINE Official Accounts (LINE OA) and LINE-based CRM capabilities.

It is used by:
- **Workspace admins** — manage LINE OA connections, followers, broadcasts, auto-replies, rich menus
- **Super admins** — manage workspace settings, invite other admins, view audit logs
- **AI chatbot operators** — configure chatbot, review chat sessions, manage knowledge base

## Key Domain Concepts

| Concept | Description |
|---------|-------------|
| Workspace | Top-level tenant. Every resource belongs to a workspace. |
| LINE OA | A LINE Official Account connected to the workspace. One workspace can have multiple OAs. |
| Follower | A LINE user who follows the OA. Has display_name, tags, custom_fields, follow_status. |
| Segment | A dynamic or static group of followers defined by rule conditions (AND/OR of field conditions). |
| Broadcast | A scheduled or immediate bulk message sent to all followers or a segment. |
| Auto Reply | Rule-based message responses triggered by follow/unfollow/keyword/postback events. |
| Auto Push Message | Scheduled outbound messages pushed to followers at a configured time. |
| Flex Message | LINE's rich card format. BOLA has a visual builder + JSON editor. |
| Rich Menu | The persistent menu shown at the bottom of the LINE chat UI. Visual block builder included. |
| LON Subscriber | LINE Official Notification subscriber (consent-based push). |
| AI Chatbot | Embedded chatbot with knowledge base, unanswered question learning, admin inbox handoff. |
| Registration Form | LIFF-based forms for collecting follower data. |
| Audit Log | Admin action history across all workspace operations. |

## Backend

- Backend repo: `backend/bola-backend` in the monorepo
- HTTP API on port 8081 (proxied through auth-proxy, then to 8080 for core API)
- API base: `/v1/`
- Auth proxy handles token validation and forwards to core backend

## Domain → URL Mapping

| Domain | URL Prefix | Key Pages |
|--------|-----------|-----------|
| Dashboard | `/` | DashboardPage |
| LINE OA management | `/line-oa` | LineOAPage, LineOADetailPage |
| Followers / Customers | `/followers`, `/customers` | FollowersPage, FollowerDetailPage |
| Segments | `/segments` | SegmentsPage, SegmentBuilderPage |
| Broadcasts | `/broadcasts` | BroadcastsPage, BroadcastWizardPage, BroadcastDetailPage |
| Auto Reply | `/auto-reply` | AutoReplyPage |
| Auto Push Messages | `/auto-push-messages` | AutoPushMessagesPage, AutoPushMessageDetailPage |
| Flex Messages | `/flex-messages` | FlexMessagesPage, FlexMessageDetailPage (with builder) |
| Media | `/media` | MediaPage |
| Webhook Settings | `/webhook-settings` | WebhookPage, WebhookDetailPage |
| Rich Menus | `/rich-menus` | RichMenusPage, RichMenuBuilderPage, RichMenuAssignmentsPage |
| Quick Replies | `/quick-replies` | QuickRepliesPage |
| LON Subscribers | `/lon-subscribers` | LONSubscribersPage |
| LON Delivery Logs | `/lon-delivery-logs` | LONDeliveryLogsPage |
| LON by Phone | `/lon-by-phone` | LONByPhonePage |
| LON Public (no auth) | `/lon/subscribe/:token` | LONPublicSubscribePage |
| RGB Consent (no auth) | `/lon/rgb-consent` | RGBConsentPage |
| Registration Forms | `/registration-forms` | RegistrationFormsPage, RegistrationFormBuilderPage, RegistrationSubmissionsPage |
| Analytics | `/analytics` | AnalyticsDashboardPage |
| AI Chatbot | `/chatbot-settings`, `/chatbot-analytics`, `/chat-sessions`, `/chat-inbox` | Various |
| Knowledge Base | `/knowledge-base` | KnowledgeBasePage |
| Unanswered Questions | `/unanswered-questions` | UnansweredQuestionsPage |
| Admin Performance | `/admin-performance`, `/reply-templates` | AdminPerformancePage, ReplyTemplatesPage |
| Admins | `/admins` | AdminsPage |
| Audit Logs | `/audit-logs` | AuditLogsPage |
| Settings | `/settings` | SettingsPage |
| Integration | `/integration` | IntegrationGuidePage |
| User Manual | `/user-manual` | UserManualPage |
| Use Cases | `/use-cases` | UseCasesPage |

## Environments

| Env | API | Auth |
|-----|-----|------|
| Local (dev) | `http://localhost:8081` (Vite proxy) | `/login` or `bola.sellsuki.local` |
| Dev with env file | `https://bola-api.sellsuki.local` | Caddy TLS |
| Staging/Prod | External URL via `VITE_API_URL` | Varies |
