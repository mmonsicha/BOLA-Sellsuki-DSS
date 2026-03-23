# Scaffold Feature

Full end-to-end feature scaffold for BOLA Frontend: types → API module → page → route → sidebar nav.

## Trigger
When the user asks to "add a new section", "scaffold a new feature", or "build a new CRUD page for X".

## Steps

### Step 1: Gather Requirements
Before starting, determine:
1. **Domain name** — e.g., "campaigns", "notifications"
2. **Backend API endpoints** — what REST endpoints exist or will exist
3. **Data shape** — fields on the main entity
4. **Pages needed** — list page, detail page, create/edit wizard?
5. **Nav item** — where in the sidebar should it appear?

### Step 2: Add Types to `src/types/index.ts`
Define the main entity interface and any status/union types at the end of the file.

### Step 3: Create API Module `src/api/<domain>.ts`
Follow the `*Api` object pattern:
- `list(params)` — GET with workspace_id + optional filters
- `get(id)` — GET by ID
- `create(body)` — POST
- `update(id, body)` — PUT with partial body
- `delete(id)` — DELETE

### Step 4: Create Page(s) in `src/pages/<domain>/`

**List Page pattern:**
```tsx
export function CampaignsPage() {
  const workspaceId = getWorkspaceId() ?? "";
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    campaignApi.list({ workspace_id: workspaceId })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return (
    <AppLayout title="Campaigns">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Button onClick={() => { window.location.href = "/campaigns/new"; }}>
          <Plus size={16} className="mr-2" /> New Campaign
        </Button>
      </div>
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {items.map((item) => (
        <Card key={item.id} className="cursor-pointer hover:bg-muted/40 transition-colors mb-2"
          onClick={() => { window.location.href = `/campaigns/${item.id}`; }}>
          <CardContent className="p-4">{item.name}</CardContent>
        </Card>
      ))}
    </AppLayout>
  );
}
```

### Step 5: Register Routes in `src/App.tsx`

Import pages at the top, then add route branches in `resolveProtectedRoute()`.

### Step 6: Add Nav Item to `src/components/layout/Sidebar.tsx`

Add to the appropriate section in `BASE_NAV_SECTIONS`:
```typescript
{ label: "Campaigns", href: "/campaigns", icon: Radio }
```

### Step 7: Verify
```bash
cd /home/dorasu/Work/autogen/repos/frontend/bola-frontend && npm run build
```

## Parallel vs Sequential

- Types + API module → can be done in parallel (no dependency)
- Pages → after types and API module (depend on both)
- Route registration → after pages are created
- Build verification → last step
