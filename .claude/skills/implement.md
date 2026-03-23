# Implement Feature

Architect-driven feature implementation for BOLA Frontend (React 18 + TypeScript 5 + Vite 4 + Tailwind CSS).

## Trigger
When the user asks to implement a feature or describes a new feature.

## Steps

### 1. Analyze
- Read `.claude/knowledge/routing.md` to understand current routes
- Read `.claude/knowledge/api-services.md` to understand existing API modules
- Read `.claude/knowledge/data-models.md` to understand existing types
- Read all related existing files (pages, components, API modules, types)
- Identify what exists vs what needs to be created/modified

### 2. Plan
- Break the feature into discrete sub-tasks (aim for 1-3 files per sub-task)
- Identify dependencies between sub-tasks (what must be sequential vs parallel)
- For each sub-task, determine: files to create, files to modify, acceptance criteria
- If any API endpoint is missing, document the requirement clearly

### 3. Implement
For each sub-task, implement following these conventions:

**New types:**
- Add to `src/types/index.ts` — never create separate entity files

**New API module:**
- Create `src/api/<domain>.ts` following the `*Api` object pattern
- Import `api` from `"./client"`, types from `@/types`
- No adapter layer — use snake_case from backend directly

**New page:**
- Create `src/pages/<domain>/<PageName>.tsx`
- Wrap with `<AppLayout title="...">` from `@/components/layout/AppLayout`
- Get workspace ID via `getWorkspaceId()` from `@/lib/auth`
- Pattern: `useState` for data/loading/error, `useEffect` for data fetching
- Import page in `src/App.tsx`, add branch in `resolveProtectedRoute()`

**New component:**
- Create in appropriate subdirectory of `src/components/`
- Named export, props interface in same file
- Tailwind classes + `cn()` for conditional styling
- No CSS files

**Styling:**
- Tailwind CSS utility classes
- Semantic tokens: `text-muted-foreground`, `bg-background`, `border`, `text-destructive`, etc.
- LINE brand color: `bg-line`, `text-line` (#06C755)
- `cn()` from `@/lib/utils` for conditional classes

### 4. Review
After implementation:
- Read all modified/created files to verify correctness
- Check: workspace scoping, loading/error state, correct imports with `@/` alias, Tailwind styling
- Run `cd /home/dorasu/Work/autogen/repos/frontend/bola-frontend && npm run build`
- Fix TypeScript errors before declaring done

### 5. Verify
- Run final `npm run build` — must pass with no errors
- Confirm all acceptance criteria are met
- Report completion with a summary of changes made
