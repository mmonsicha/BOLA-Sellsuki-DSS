# Auth Flow

## Two Auth Modes

The auth mode is set via `VITE_AUTH_MODE` env var (runtime, not build-time):

### `local_jwt` (default)

1. User submits email + password on `/login` page
2. `authApi.globalLogin(email, password)` → returns list of workspace entries (each with a JWT token)
3. If one workspace: auto-select; if multiple: show workspace picker
4. Selected workspace: store `bola_token`, `bola_workspace`, `bola_token_expires_at` in `localStorage`
5. Redirect to `/`
6. `isAuthenticated()` = `Boolean(getToken())` = checks localStorage for `bola_token`
7. `TokenExpiryGuard` component polls every minute; when token is within 5 minutes of expiry, prompts user to re-login

### `kratos`

1. `isAuthenticated()` = `Boolean(getWorkspaceId())` — Kratos session cookie is validated server-side on every API call
2. App redirects to `/choose-workspace` if not authenticated
3. `ChooseWorkspacePage` calls `authApi.getMyWorkspaces()` → `/v1/me/workspaces`
4. User picks a workspace → `setWorkspaceId(ws.id)` in localStorage
5. On 401: clears workspace ID, redirects to `VITE_KRATOS_LOGIN_URL?return_to=...`
6. Logout: calls Kratos logout endpoint (`VITE_KRATOS_LOGIN_URL/logout`) to destroy session

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Token/workspace CRUD, `isAuthenticated()`, `getAuthMode()`, `logout()`, `switchWorkspace()` |
| `src/api/client.ts` | ApiClient — attaches Bearer token, handles 401 redirect |
| `src/api/auth.ts` | `authApi` — login, invite, password reset, admin CRUD, `getMyWorkspaces()` |
| `src/components/auth/TokenExpiryGuard.tsx` | JWT expiry watcher (local_jwt mode only) |
| `src/pages/auth/LoginPage.tsx` | Local JWT login with workspace picker |
| `src/pages/auth/ChooseWorkspacePage.tsx` | Kratos mode workspace selection |
| `src/pages/auth/AcceptInvitePage.tsx` | New admin invitation acceptance |
| `src/pages/auth/ForgotPasswordPage.tsx` | Password reset request |
| `src/pages/auth/ResetPasswordPage.tsx` | Password reset redemption |

## localStorage Keys

| Key | Value | Used By |
|-----|-------|---------|
| `bola_token` | JWT string | `local_jwt` mode only |
| `bola_workspace` | workspace UUID | Both modes |
| `bola_token_expires_at` | ISO 8601 datetime | `local_jwt` mode only |

## Admin Roles

Roles in ascending order: `viewer` < `editor` < `admin` < `super_admin`

Use `useCurrentAdmin()` hook for role checks:
```typescript
const { currentAdmin, isViewer, isEditorOrAbove, isAdminOrAbove, isSuperAdmin } = useCurrentAdmin();
```

The hook fetches from `/v1/workspaces/:id/auth/me` and caches at module level (cleared on logout).

## Protected Routes

`Router()` in `App.tsx`:
1. Check explicit public paths first (`/login`, `/accept-invite`, `/forgot-password`, `/reset-password`, `/lon/subscribe/*`, `/lon/rgb-consent`, `/choose-workspace`)
2. Call `isAuthenticated()` — redirect to login/workspace-picker if false
3. Wrap with `<TokenExpiryGuard>` in local_jwt mode
4. Pass to `resolveProtectedRoute(path, segments)`

## Public Pages (No Auth Required)
- `/lon/subscribe/:token` — LON subscriber public consent page (LIFF)
- `/lon/rgb-consent` — RGB consent page (LIFF)
