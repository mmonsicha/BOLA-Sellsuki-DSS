# API Services

All API service modules live in `src/api/`. Each file corresponds to one backend domain.

## Client (`src/api/client.ts`)

```typescript
export const api = new ApiClient(BASE_URL);
```

- `BASE_URL` = `VITE_API_URL` env var (empty = use Vite dev proxy, which routes to `localhost:8081`)
- All requests include `Authorization: Bearer <token>` if `bola_token` exists in localStorage
- 401 response: clears auth state, redirects to `/login` (local_jwt) or Kratos login (kratos mode)
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

## Followers (`src/api/follower.ts`)

- `listFollowers(workspaceId, params)` — `GET /v1/workspaces/:id/followers`
- `getFollower(workspaceId, id)` — `GET /v1/workspaces/:id/followers/:id`
- `updateFollower(workspaceId, id, data)` — `PUT`

## Segments (`src/api/segment.ts`)

- `listSegments(workspaceId)` — list
- `createSegment(workspaceId, data)` — create
- `updateSegment(workspaceId, id, data)` — update
- `deleteSegment(workspaceId, id)` — delete

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

- `listSubscribers(workspaceId, params)` — list LON subscribers
- `getSubscriberStats(workspaceId)` — stats
- `revokeSubscriber(workspaceId, id)` — revoke consent
- `listDeliveryLogs(workspaceId, params)` — delivery log list
- `sendNotification(workspaceId, data)` — send LON message

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

## Adding a New API Service

1. Create `src/api/<domain>.ts`
2. Import and use `api` singleton from `./client`
3. All calls include `workspaceId` from `getWorkspaceId()` in `@/lib/auth`
4. Add shared response types to `src/types/index.ts`
5. Update `knowledge/api-services.md`
