# API Services

All API service modules live in `src/api/`. Each file corresponds to one backend domain.

## Client (`src/api/client.ts`)

```typescript
export const api = new ApiClient(BASE_URL);
export const publicApi = new ApiClient(PUBLIC_API_BASE, "omit");
```

- `BASE_URL` = `VITE_API_URL` env var (empty = use Vite dev proxy, which routes to `localhost:8081`)
- `PUBLIC_API_BASE` = `VITE_PUBLIC_API_URL` env var (backend Cloudflare tunnel URL for public endpoints). Falls back to `BASE_URL` if not set.
- `api` — authenticated client: includes `Authorization: Bearer <token>`, `credentials: "include"` (cookies), `workspace_id` query param injected automatically
- `publicApi` — unauthenticated client: `credentials: "omit"` (compatible with `Access-Control-Allow-Origin: *`), no auth headers, no workspace_id injection. Use for public endpoints like `/v1/public/lon/*`.
- `publicApi` is required when the frontend is served from a **public HTTPS origin** (e.g. Cloudflare tunnel) and the backend is on a loopback/private address — Chrome's Private Network Access blocks `credentials: "include"` requests to private IPs from public origins.
- 401 response (api only): clears auth state, redirects to `/login` (local_jwt) or Kratos login (kratos mode)
- Methods: `api.get<T>(path, params?)`, `api.post<T>(path, body?)`, `api.put<T>(path, body?)`, `api.patch<T>(path, body?)`, `api.delete<T>(path)`

All API paths are prefixed with `/v1/workspaces/${workspaceId}/...` where `workspaceId = getWorkspaceId()`.

## Auth (`src/api/auth.ts`)

- `login(workspaceId, email, password)` — `POST /workspaces/:id/auth/login`
- `globalLogin(email, password)` — `POST /auth/login` (returns workspace list with tokens)
- `acceptInvite(workspaceId, token, name, password)` — `POST /workspaces/:id/auth/accept-invite`
- `getMe(workspaceId)` — `GET /workspaces/:id/auth/me`
- `forgotPassword(email)` — `POST /auth/forgot-password`
- `resetPassword(token, password)` — `POST /auth/reset-password`

## Workspace (`src/api/workspace.ts`)

- `listWorkspaces()` — `GET /workspaces`
- `getWorkspace(id)` — `GET /workspaces/:id`

## LINE OA (`src/api/lineOA.ts`)

- `listLineOAs(workspaceId)` — `GET /v1/workspaces/:id/line-oas`
- `getLineOA(workspaceId, id)` — `GET /v1/workspaces/:id/line-oas/:id`

## Followers & Contacts (`src/api/follower.ts` — `followerApi`)

- `list(params)` — `GET /v1/followers` — list LINE followers
- `get(id)` — `GET /v1/followers/:id`
- `update(id, body)` — `PUT /v1/followers/:id`
- `startSync(lineOAId)` — `POST /v1/followers/sync`
- `getSyncStatus(lineOAId)` — `GET /v1/followers/sync/status`
- `listUnified(params)` — `GET /v1/contacts` — unified contacts (pass `contact_status=phone_only` for phone tab)
- `previewImportPhones(lineOaId, contacts)` — `POST /v1/contacts/import-phones/preview`
- `importPhones(lineOaId, contacts)` — `POST /v1/contacts/import-phones`
- `getPhoneContact(id)` — `GET /v1/contacts/phone/:id` — returns `PhoneContactDetail` with `linked_oas[]`

## Segments (`src/api/segment.ts`)

- `listSegments(workspaceId)` — list
- `createSegment(workspaceId, data)` — create
- `updateSegment(workspaceId, id, data)` — update
- `deleteSegment(workspaceId, id)` — delete
- `previewCount(body)` — `POST /v1/segments/preview-count` — count matching members (debounced in SegmentBuilderPage)
- `previewList(body)` — `POST /v1/segments/preview-list` — paginated list of matching members (infinite scroll in SegmentBuilderPage)

## Broadcasts (`src/api/broadcast.ts`)

- `listBroadcasts(workspaceId)` — list
- `getBroadcast(workspaceId, id)` — get
- `createBroadcast(workspaceId, data)` — create
- `updateBroadcast(workspaceId, id, data)` — update
- `deleteBroadcast(workspaceId, id)` — delete
- `sendBroadcast(workspaceId, id)` — trigger send

## Auto Reply (`src/api/autoReply.ts`)

Standard CRUD for workspace auto-reply rules.

## Auto Push Messages (`src/api/autoPushMessage.ts`)

Standard CRUD + enable/disable for APM rules.

## Flex Messages (`src/api/flexMessage.ts`)

Standard CRUD for flex message templates.

## Rich Menus (`src/api/richMenu.ts`)

- Full CRUD
- `setDefault(workspaceId, id)` — set as LINE default
- `unsetDefault(workspaceId, id)` — unset
- `uploadImage(workspaceId, id, file)` — multipart image upload

## LON (`src/api/lon.ts`)

`lonApi`:
- `listSubscribers(params)` — GET `/v1/lon-subscribers`
- `getSubscriberStats(lineOAId)` — GET `/v1/lon-subscribers/stats`
- `getSubscriber(id)` — GET `/v1/lon-subscribers/:id`
- `revokeSubscriber(id)` — DELETE `/v1/lon-subscribers/:id`
- `recordSubscriberAccess(id)` — POST `/v1/lon-subscribers/:id/access-log` (fire-and-forget; fires audit `lon_subscriber.view_phone`)
- `listDeliveryLogs(params)` — GET `/v1/lon-delivery-logs`
- `subscribeByPhone(params)` — POST `/v1/lon/subscribe-by-phone` (admin auth required)
- `bulkSubscribeByPhone(params)` — POST `/v1/lon/bulk-subscribe-by-phone` (admin auth required)
- `getPublicOAInfo(lineOAId)` — GET `/v1/public/lon/oa-info` (uses `publicApi`)
- `liffConsent(params)` — POST `/v1/public/lon/liff-consent` (uses `publicApi`)
- `publicSubscribeByPhone(params)` — POST `/v1/public/lon/subscribe-by-phone` (uses `publicApi`, no auth — for QR subscribe page)
- `sendConsentRequest(params)` — POST `/v1/lon/send-consent-request`

> **⚠️ LINE LON Consent Flow — Known Limitation (verified Apr 2026)**
>
> `liff.getNotificationToken()` has been removed from LIFF v2 SDK. The LIFF consent flow in `LONPublicSubscribePage` is broken for new users.
> `publicSubscribeByPhone` only succeeds if the user has previously consented to notifications via LINE (LON token exists).
> See `backend/.claude/knowledge/integrations.md` for full details and migration path.
- `sendLONByPhone(params)` — POST `/v1/pnp/send` → returns `PNPDeliveryLog` (incl. `phone_hash`)
- `bulkSendLONByPhone(body)` — POST `/v1/pnp/bulk-send` → returns `BulkSendLONByPhoneResponse { results: BulkSendPNPResult[] }`
- `listLONByPhoneLogs(params)` — GET `/v1/pnp/logs`

**localStorage side-effect**: after `sendLONByPhone`, `LONByPhonePage` writes `{ [phone_hash]: maskedPhone }` to `bola_lon_phone_map` so `LONDeliveryLogsPage` PNP tab can show readable masked phones.

**LONByPhonePage send modes** (`/lon-by-phone`):
- `single` — sends to one phone number via `sendLONByPhone`
- `bulk` — picks contacts from workspace (phone-type UnifiedContacts), sends via `bulkSendLONByPhone`
- `segment` — picks a segment (global, not per-OA), paginates `segmentApi.previewList` to collect phone numbers, sends via `bulkSendLONByPhone` with `triggered_by: "manual_segment"`. Segments are loaded once on mount (no OA filter).

### `pnpTemplateApi` (same file `src/api/lon.ts`)

```typescript
pnpTemplateApi.list({ line_oa_id? })           // GET /v1/pnp-templates — returns { data: PNPTemplate[] }
pnpTemplateApi.get(id)                          // GET /v1/pnp-templates/:id — returns PNPTemplate
pnpTemplateApi.saveAs({ line_oa_id, name, description?, source_id?, json_body?, message_type?, variant? })
                                                // POST /v1/pnp-templates — clone from preset (source_id) or create from scratch
pnpTemplateApi.update(id, { name?, description?, json_body?, editable_schema? })
                                                // PUT /v1/pnp-templates/:id
pnpTemplateApi.delete(id)                       // DELETE /v1/pnp-templates/:id
```

**Response** for list: `{ data: PNPTemplate[] }` — includes both global presets (`is_preset: true`) and OA-specific templates.
Filter to show only custom templates on the page: `templates.filter(t => !t.is_preset)`
Filter to get presets for the picker: `templates.filter(t => t.is_preset)`

## RGB (`src/api/rgb.ts`)

LON RGB identity consent page API calls (public, no auth required).

## Media (`src/api/media.ts`)

- `listMedia(workspaceId, params)` — list media
- `uploadMedia(workspaceId, file, name, type)` — multipart upload
- `deleteMedia(workspaceId, id)` — delete

## Registration Forms (`src/api/registrationForm.ts`)

- Full CRUD for forms
- `listSubmissions(workspaceId, formId)` — list submissions

## AI Chatbot (`src/api/aiChatbot.ts`)

- `getChatbotSettings(workspaceId)` / `updateChatbotSettings`
- `listChatSessions(workspaceId)` / `getChatSession(workspaceId, id)`
- `listChatMessages(workspaceId, sessionId)`
- `listKnowledgeBases(workspaceId)` / create / update / delete
- `listUnansweredQuestions(workspaceId)`

## Analytics (`src/api/analytics.ts`)

- `getAnalyticsSummary(workspaceId, params)` — summary with date range
- `listAnalyticsEvents(workspaceId, params)` — event list

## Audit Log (`src/api/auditLog.ts`)

- `listAuditLogs(workspaceId, params)` — paginated list

## Admin Performance (`src/api/adminPerformance.ts`)

- `getAdminPerformance(workspaceId, params)` — metrics
- CRUD for reply templates

## Webhook Settings (`src/api/webhookSetting.ts`)

- Standard CRUD for outbound webhook configs

## Outbound Events (`src/api/outboundEvent.ts`)

- `listOutboundEvents(workspaceId)` — list outbound events

---

## Shared Rendering Utilities

### `FlexCardPreview` (`src/components/FlexCardPreview.tsx`)

Renders a LINE Flex Message JSON string as a visual card (mimics LINE chat background `#C6D0D9`).

```tsx
<FlexCardPreview
  content={JSON.stringify(template.json_body)}  // must be a bubble object {type:"bubble",...}
  height={320}      // default 320px
  scrollable        // optional: overflow-y-auto + max-height instead of clipped overflow-hidden
/>
```

- Uses `flex-render` library internally; silently shows "Preview unavailable" on error
- Pass `scrollable` in editor modals so tall templates (list/mix) can be scrolled instead of clipped
- Broken image URLs (LINE CDN, CORS) are replaced with a gray placeholder automatically

### `patchFlexHtml` (`src/utils/flexPreviewUtils.ts`)

Patches raw HTML from `flex-render` to fix broken image URLs and other rendering issues.
Used by `FlexCardPreview` and `LONTemplatesPage` JPG export.

### JPG Export (`LONTemplatesPage.tsx` — `handleExportJpg`)

Exports the Flex card preview as a JPEG file using `html2canvas`:
1. **Fresh render** — re-renders flex HTML via `renderFlexMessage` + `patchFlexHtml` (no inherited constraints from the scrollable preview container)
2. **onclone unlock** — sets all elements to `overflow:visible` in html2canvas's internal clone to prevent content clipping from nested flex-render CSS rules
3. **Height buffer** — captures at `naturalHeight + 120px` to accommodate font rendering differences (especially Thai/CJK text)
4. **Auto-crop** — trims canvas back to `naturalHeight` for tight fit

### `applyTemplateVariables` (`src/utils/pnpTemplateUtils.ts`)

Patches a Flex bubble JSON body with user-provided values using dot-notation paths.

```typescript
import { applyTemplateVariables } from "@/utils/pnpTemplateUtils";

const patched = applyTemplateVariables(
  template.json_body,         // Record<string, unknown> — source bubble
  template.editable_schema,   // PNPTemplateEditableField[]
  vars                        // Record<string, string> — keyed by field.path
);
// Returns deep-copied bubble with values applied; unknown paths are silently skipped
```

Path format: `body.contents[0].contents[1].text` — dot-notation with `[N]` array indices.

---

## Adding a New API Service

1. Create `src/api/<domain>.ts`
2. Import and use `api` singleton from `./client`
3. All calls include `workspaceId` from `getWorkspaceId()` in `@/lib/auth`
4. Add shared response types to `src/types/index.ts`
5. Update `knowledge/api-services.md`
