# Debug API Integration

Systematic debugging of API integration issues in BOLA Frontend.

## Trigger
When an API call fails, returns unexpected data, or a page shows wrong/empty data.

## Debugging Steps

### 1. Identify the Problem
- Is it a network error (CORS, 404, 500)?
- Is it a 401 (auth issue)?
- Is it data parsing / type mismatch?
- Is it a React state update issue (data loaded but not displayed)?

### 2. Check Network Requests

In browser DevTools → Network tab:
- Filter by `XHR` or `Fetch`
- Find the failing request
- Check: URL, method, headers, request body, response status, response body

### 3. Check Vite Proxy (local dev)

Proxy routes all `/v1/`, `/auth/`, `/webhook/`, `/uploads/`, `/media/` to `localhost:8081`.

If getting `ECONNREFUSED`:
- Is the BOLA backend running? (`overmind connect bola-backend`)
- Check port 8081: `curl http://localhost:8081/v1/health`

If getting wrong API responses:
- Is `VITE_API_URL` set in `.env`? If empty, uses proxy. If set, uses that URL directly.
- Check `.env` and `.env.dev` for conflicting values.

### 4. Check Auth

- In DevTools → Application → Local Storage: is `bola_token` present?
- Is `bola_workspace` set?
- Is the token expired? Check `bola_token_expires_at`

In `src/api/client.ts`, the token is read from `localStorage.getItem("bola_token")` and sent as `Authorization: Bearer <token>`.

401 responses trigger auto-logout — check if you're being redirected.

For kratos mode: is the Kratos session cookie present?

### 5. Check API Module

Read the relevant API module in `src/api/`. Verify:
- Correct endpoint URL
- Correct HTTP method
- All required params/body fields included
- `workspace_id` scoped correctly
- Response type generic matches actual response shape

### 6. Check Response Shape

The backend may return:
- `{ data: T[] }` — list
- `{ data: T[], total: number }` — paginated
- `{ data: T }` — single item (some endpoints)
- `T` directly — single item (other endpoints)

If the component does `.data.data` but backend returns `.data`, that's the bug.

### 7. Check State Updates

If data loads (network request succeeds) but component shows nothing:
- Is `setData(res.data)` being called correctly?
- Is `loading` being cleared in `finally`?
- Is the component re-rendering? (Check React DevTools)
- Are there any errors being swallowed silently?

Add temporary `console.log` statements to trace the data flow.

### 8. Check TypeScript Types

TypeScript type errors that pass the compiler (due to `any`) can cause runtime issues.
Look for `as unknown as T` casts or places where `any` is used.

## Common Issues

| Issue | Likely Cause |
|-------|-------------|
| API call succeeds but page shows nothing | Wrong response shape unwrapping (`.data` vs `.data.data`) |
| 401 on every request | Token expired or missing — check localStorage |
| CORS error | Vite proxy not configured for this path, or `VITE_API_URL` set incorrectly |
| `workspace_id required` error | `getWorkspaceId()` returned null — workspace not set in localStorage |
| `undefined is not iterable` | API returned null/undefined but code expected an array |
| Network request not being made | `useEffect` dependency array issue — function not called |
| Request made with wrong workspace | `workspaceId` captured in stale closure |

## Quick Fix Template

```typescript
// Add to the component to debug
useEffect(() => {
  console.log("workspaceId:", workspaceId);
  if (!workspaceId) {
    console.warn("No workspace ID — skipping API call");
    return;
  }
  setLoading(true);
  someApi.list({ workspace_id: workspaceId })
    .then((res) => {
      console.log("API response:", res);
      setData(res.data);
    })
    .catch((err) => {
      console.error("API error:", err);
      setError(err instanceof Error ? err.message : "Failed");
    })
    .finally(() => setLoading(false));
}, [workspaceId]);
```
