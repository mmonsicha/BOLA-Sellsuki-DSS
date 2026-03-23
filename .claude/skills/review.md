# Post-Implementation Review

Review cycle after implementing a feature in BOLA Frontend.

## Trigger
After a sub-agent completes an implementation task, or when the user asks to review recent changes.

## Review Steps

### 1. Read Modified Files
Read every file that was created or modified. Verify:
- Correct Tailwind CSS styling (no inline styles, no CSS modules)
- `cn()` used for conditional classes
- `@/` path alias used everywhere (no relative `../../`)
- `import type` used for type-only imports (`verbatimModuleSyntax` is ON)
- Types imported from `@/types` (not local inline types for shared models)

### 2. React Patterns
- [ ] Functional components with named exports
- [ ] Props interface defined in same file, above component
- [ ] `useState`/`useEffect` hooks — no class components
- [ ] No missing `useEffect` dependencies (check for stale closure bugs)
- [ ] Navigation via `window.location.href = "..."` (not react-router)
- [ ] No direct DOM manipulation

### 3. API Integration
- [ ] Calls go through `*Api` modules — not raw `api.get(...)` in components
- [ ] Workspace ID obtained via `getWorkspaceId()` from `@/lib/auth`
- [ ] Loading state set before async calls, cleared in `finally`
- [ ] Error state set in `catch` block
- [ ] Request types defined in the API module file (not in `src/types/index.ts`)
- [ ] New shared entity types added to `src/types/index.ts`

### 4. Routing (if new page added)
- [ ] Page imported in `src/App.tsx`
- [ ] Route branch added in `resolveProtectedRoute()`
- [ ] Nav item added to `BASE_NAV_SECTIONS` in `src/components/layout/Sidebar.tsx`
- [ ] Page wrapped with `<AppLayout title="...">` 

### 5. Build Verification
```bash
cd /home/dorasu/Work/autogen/repos/frontend/bola-frontend && npm run build
```
- Must complete with no TypeScript errors and no Vite build errors
- Common fixes:
  - Add `import type` for type-only imports
  - Fix `null | undefined` checks
  - Remove unused variables (or prefix with `_`)

### 6. Auth & Security
- [ ] No hardcoded user IDs, tokens, or secrets
- [ ] Protected pages check auth — rely on router's `isAuthenticated()` guard
- [ ] Role-gated features use `useCurrentAdmin()` hook

### 7. Decision: Fix vs Re-delegate
- **Fix directly** if: single-line type fix, missing import, trivial rename
- **Re-delegate to Sonnet** if: logic error, wrong pattern, 3+ lines to change

## Report Template

```
## Review Results

### Files Reviewed
- [list of files]

### Issues Found
- [issue + fix applied, or "None"]

### Build Status
- npm run build: PASS / FAIL

### Verdict
- APPROVED / NEEDS FIXES
```
