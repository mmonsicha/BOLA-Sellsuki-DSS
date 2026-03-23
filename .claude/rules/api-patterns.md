# API Integration Patterns

## API Client (`src/api/client.ts`)

Single `ApiClient` class, exported as `api` singleton.

```typescript
import { api } from "@/api/client";
```

- Base URL: `VITE_API_URL` env var (defaults to `""` — uses Vite proxy)
- Auth: reads `bola_token` from `localStorage`, sends as `Authorization: Bearer <token>`
- 401 handling: clears `bola_token` + `bola_workspace` from localStorage, redirects to `/login` (or Kratos login in kratos mode)
- 204 responses: returns `undefined as T`
- Non-OK responses: throws `Error(errData.error || "HTTP <status>")`
- All methods are generic: `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.patch<T>()`, `api.delete<T>()`

## API Module Pattern

Each domain has one file in `src/api/`:

```typescript
// src/api/broadcast.ts
import { api } from "./client";
import type { Broadcast } from "@/types";

// Request types defined in same file
export interface CreateBroadcastRequest { ... }

// API object with named methods
export const broadcastApi = {
  list: (params: ListBroadcastsParams) =>
    api.get<{ data: Broadcast[]; total: number }>("/v1/broadcasts", params),
  get: (id: string) =>
    api.get<{ data: Broadcast }>(`/v1/broadcasts/${id}`),
  create: (body: CreateBroadcastRequest) =>
    api.post<{ data: Broadcast }>("/v1/broadcasts", body),
  update: (id: string, body: Partial<...>) =>
    api.put<Broadcast>(`/v1/broadcasts/${id}`, body),
  delete: (id: string) =>
    api.delete<void>(`/v1/broadcasts/${id}`),
};
```

Key rules:
- Import types from `@/types` (single types file)
- Define request/param types in the same API file (not in types/index.ts)
- No adapter layer — API returns snake_case which is used directly in components
- All API modules export a named `*Api` object (e.g., `broadcastApi`, `followerApi`, `lineOAApi`)

## Workspace Scoping

Almost all API calls are scoped to a workspace ID:

```typescript
import { getWorkspaceId } from "@/lib/auth";

const workspaceId = getWorkspaceId() ?? "";
// Pass as a param or embed in URL
api.get<T>(`/v1/workspaces/${workspaceId}/...`)
```

Some endpoints use `workspace_id` as a query/body param instead:
```typescript
broadcastApi.list({ workspace_id: workspaceId, page: 1 })
```

## LINE OA Scoping

Most resources are further scoped by `line_oa_id`. Use the `LineOAFilter` component to let users switch context:

```typescript
const [selectedLineOAId, setSelectedLineOAId] = useState("");
// "" = "All" (show aggregated data)
// "uuid" = filtered to specific OA
```

## Response Shapes

Endpoints return one of:
- `{ data: T[] }` — list
- `{ data: T[], total: number }` — paginated list
- `{ data: T }` — single item (some endpoints)
- `T` directly — single item (other endpoints)
- `void` — delete/action endpoints

Check the specific API module to confirm the shape.

## Error Handling in Components

```typescript
const [error, setError] = useState<string | null>(null);

async function loadData() {
  try {
    const result = await broadcastApi.list({ workspace_id: workspaceId });
    setData(result.data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load");
  }
}
```

## Do Not
- Never hardcode workspace IDs or tokens
- Never bypass the `api` singleton with raw `fetch` or `axios`
- Never add an adapter layer (no snake_case -> camelCase mapping — use types as-is)
- Never import `api` client directly in components — always go through `*Api` modules
