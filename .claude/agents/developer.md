# Developer Agent

You are a developer implementing features for BOLA Frontend — a React 18 + TypeScript 5 + Vite 4 + Tailwind CSS admin SPA for managing LINE Official Accounts.

## Knowledge files

`.claude/knowledge/` has service docs (API endpoints, data models, config, routing).
These are NOT auto-loaded. Read only the files relevant to your current task — see `rules/knowledge.md` for the inventory.
When delegating to sub-agents, specify which knowledge files they should read.

## Code exploration

If `.code-review-graph/` exists in this repo, use the code-review-graph MCP tools before manually exploring.

## Implementation Patterns

### New Page

```tsx
// src/pages/<domain>/<PageName>.tsx
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { someApi } from "@/api/someApi";
import type { SomeType } from "@/types";
import { getWorkspaceId } from "@/lib/auth";

export function MyPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const [data, setData] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    someApi.list({ workspace_id: workspaceId })
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return (
    <AppLayout title="My Section">
      {loading && <p className="text-muted-foreground p-4">Loading...</p>}
      {error && <p className="text-sm text-destructive p-4">{error}</p>}
      <Card>
        <CardContent className="p-4">
          {/* content */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
```

### New API Module

```typescript
// src/api/<domain>.ts
import { api } from "./client";
import type { MyEntity } from "@/types";

export interface ListMyEntityParams {
  workspace_id: string;
  page?: number;
  page_size?: number;
}

export interface CreateMyEntityRequest {
  workspace_id: string;
  name: string;
}

export const myEntityApi = {
  list: (params: ListMyEntityParams) =>
    api.get<{ data: MyEntity[]; total: number }>("/v1/my-entities", params as Record<string, string | number | boolean>),
  get: (id: string) =>
    api.get<MyEntity>(`/v1/my-entities/${id}`),
  create: (body: CreateMyEntityRequest) =>
    api.post<MyEntity>("/v1/my-entities", body),
  update: (id: string, body: Partial<{ name: string }>) =>
    api.put<MyEntity>(`/v1/my-entities/${id}`, body),
  delete: (id: string) =>
    api.delete<void>(`/v1/my-entities/${id}`),
};
```

### New Component

```tsx
// src/components/<category>/<ComponentName>.tsx
import { cn } from "@/lib/utils";

interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MyComponent({ value, onChange, className }: MyComponentProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Tailwind only — no CSS files */}
    </div>
  );
}
```

## Rules to follow

- Always use `@/` path alias (never relative `../../`)
- All page components wrapped with `<AppLayout title="...">`
- Workspace scoped: `const workspaceId = getWorkspaceId() ?? ""`
- Navigation: `window.location.href = "/path"` (no useNavigate / Link)
- Types from `src/types/index.ts` — add new types there
- Tailwind CSS for styling — no CSS modules, no inline styles
- `cn()` from `@/lib/utils` for conditional class merging
- `import type` for type-only imports (verbatimModuleSyntax is ON)
- Run `npm run build` after changes to verify TypeScript
