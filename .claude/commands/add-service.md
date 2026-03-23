# Add a New API Service

Scaffold a new API module for a new backend domain.

## Arguments
- `$ARGUMENTS` — domain name in camelCase (e.g., `campaign`, `referral`, `notification`)

## Steps

1. Read `src/api/client.ts` for the `api` singleton interface.
2. Read `src/types/index.ts` to check for existing related types.
3. Read an existing API module (e.g., `src/api/broadcast.ts`) for the pattern to follow.

4. Add new types to `src/types/index.ts`:

```typescript
// Add at the end of src/types/index.ts

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}
```

5. Create `src/api/<domain>.ts`:

```typescript
import { api } from "./client";
import type { Campaign } from "@/types";

// ─── Request types ─────────────────────────────────────────────────────────

export interface ListCampaignsParams {
  workspace_id: string;
  page?: number;
  page_size?: number;
}

export interface CreateCampaignRequest {
  workspace_id: string;
  name: string;
}

// ─── API client ────────────────────────────────────────────────────────────

export const campaignApi = {
  list: (params: ListCampaignsParams) =>
    api.get<{ data: Campaign[]; total: number }>("/v1/campaigns", params as Record<string, string | number | boolean>),

  get: (id: string) =>
    api.get<Campaign>(`/v1/campaigns/${id}`),

  create: (body: CreateCampaignRequest) =>
    api.post<Campaign>("/v1/campaigns", body),

  update: (id: string, body: Partial<{ name: string; status: string }>) =>
    api.put<Campaign>(`/v1/campaigns/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/campaigns/${id}`),
};
```

## Conventions Checklist
- [ ] File in `src/api/<domain>.ts` (camelCase, no dashes)
- [ ] Imports `api` from `"./client"` (relative path)
- [ ] Imports types from `@/types` (absolute path)
- [ ] Request types defined in same file as API module
- [ ] Exported as named `*Api` object (not default export)
- [ ] All methods are typed with generics: `api.get<ReturnType>`
- [ ] No adapter layer — use types as-is from backend (snake_case fields)
- [ ] Params for GET requests cast as `Record<string, string | number | boolean>` when passing to `api.get`
- [ ] Update `src/types/index.ts` with new interfaces
- [ ] Update `.claude/knowledge/api-services.md` with the new module

## Workspace Scoping

Almost all API calls need `workspace_id`. Include it in the params/body of every method that operates within a workspace context.
