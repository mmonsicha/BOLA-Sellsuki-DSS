# Add a New Page

Scaffold a new route page and register it in the router.

## Arguments
- `$ARGUMENTS` — domain/page name (e.g., `campaigns/CampaignsPage`, `reports/ReportDetailPage`)

## Steps

1. Read `src/App.tsx` to understand the router structure and existing route patterns.
2. Read `src/types/index.ts` to check for existing types, or identify what new types are needed.
3. Read `src/components/layout/AppLayout.tsx` to understand the layout wrapper.

4. Create `src/pages/<domain>/<PageName>.tsx`:

```tsx
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { someApi } from "@/api/someApi";
import type { SomeType } from "@/types";
import { getWorkspaceId } from "@/lib/auth";

export function MyNewPage() {
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
    <AppLayout title="My New Section">
      <Card>
        <CardContent className="p-6">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {/* page content */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
```

5. Import the page in `src/App.tsx`:
```typescript
import { MyNewPage } from "@/pages/my-domain/MyNewPage";
```

6. Add a route branch in `resolveProtectedRoute()` in `src/App.tsx`:
```typescript
if (path.startsWith("/my-new-route")) return <MyNewPage />;
// or with segments:
if (segments[0] === "my-domain") {
  if (segments[1]) return <MyNewDetailPage />;
  return <MyNewPage />;
}
```

7. Add nav item to `BASE_NAV_SECTIONS` in `src/components/layout/Sidebar.tsx`:
```typescript
{ label: "My Section", href: "/my-new-route", icon: SomeIcon }
```

## Conventions Checklist
- [ ] Uses `<AppLayout title="...">` wrapper
- [ ] Gets workspace ID via `getWorkspaceId()` from `@/lib/auth`
- [ ] API calls through `*Api` modules (not `api` singleton directly)
- [ ] Loading + error state handled
- [ ] Navigation via `window.location.href = "..."` (not useNavigate)
- [ ] Types imported from `@/types`
- [ ] Tailwind classes for all styling (no CSS files)
