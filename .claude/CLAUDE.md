# BOLA Frontend

BOLA (Business Operations LINE Agency) is the admin backoffice SPA for managing LINE Official Accounts and LINE-based CRM features. Built with React 18 + TypeScript 5 + Vite 4 + Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev          # proxy -> localhost:8081 (BOLA backend)
npm run build        # tsc + vite build
npm run lint         # eslint check
npm run lint:fix     # eslint autofix
npm run type-check   # tsc --noEmit only
npm run test:run     # vitest (unit tests)
npm run e2e          # playwright (e2e tests)
```

**First time setup** (inside the monorepo):
```bash
make dev   # starts all services via overmind
# or:
overmind start -l bola-frontend
```

Dev server: `http://bola.sellsuki.local` (Caddy) or `http://localhost:5173`

## Architecture Overview

| Layer | Location | Purpose |
|-------|----------|---------|
| Pages | `src/pages/` | Route-level React components (organized by domain) |
| Components | `src/components/` | Reusable UI (`ui/`, `layout/`, `common/`, `auth/`, `rich_menu/`) |
| API | `src/api/` | Flat API modules — one file per domain, all use `api` singleton |
| Types | `src/types/index.ts` | All shared TypeScript interfaces (single file) |
| Hooks | `src/hooks/` | Custom React hooks (`useCurrentAdmin`, `useHealthCheck`) |
| Lib | `src/lib/` | Auth helpers, `cn()` utility, domain-specific utils |
| Utils | `src/utils/` | Flex message tools, preview utilities |
| Data | `src/data/` | Static presets (rich menu templates, etc.) |
| Test | `src/test/` | Vitest setup |

## Routing

Custom hash-free client-side router in `src/App.tsx` — NO react-router-dom. Routes are resolved with `window.location.pathname` + manual string matching in `resolveProtectedRoute()`.

To add a new route: import the page and add a branch in `resolveProtectedRoute()` (or the public route guard block at the top of `Router()`).

## Key Conventions

- **React 18** — functional components only, hooks-first
- **TypeScript strict** — `strict: true`; `noUnusedLocals`/`noUnusedParameters` intentionally OFF
- **Path alias**: `@/` maps to `src/`
- **Styling**: Tailwind CSS v3 with CSS custom properties for theming (HSL variables in `src/index.css`)
- **Utility**: `cn(...inputs)` from `@/lib/utils` = `clsx` + `tailwind-merge`
- **UI primitives**: shadcn-style components in `src/components/ui/` (Button, Card, Badge, Dialog, etc.) using `cva` + `cn`
- **Sellsuki design system**: `@sellsuki-org/sellsuki-components` (Lit web components) bridged via `@lit-labs/react` createComponent — see `src/components/ui/ssk.tsx`
- **Icons**: lucide-react
- **LINE LIFF**: `@line/liff` for LINE embedded pages (consent flows, public subscribe pages)
- **State**: local `useState`/`useEffect` per page — no global store
- **API**: Single `api` singleton in `src/api/client.ts` — fetch-based, JWT Bearer auth, auto-redirects on 401
- **Auth mode**: `VITE_AUTH_MODE` env var — `"local_jwt"` (default) or `"kratos"`
- **Workspace context**: `getWorkspaceId()` from `@/lib/auth` used to scope all API calls
- **Admin roles**: `viewer` < `editor` < `admin` < `super_admin` — checked via `useCurrentAdmin()` hook

## Auth Modes

| Mode | Token Storage | Login URL | Used In |
|------|--------------|-----------|---------|
| `local_jwt` | `localStorage` (`bola_token`) | `/login` (built-in) | Default / standalone |
| `kratos` | Session cookie | `/choose-workspace` -> Kratos SSO | Monorepo with CCS |

## Rules & Knowledge

Read all `.claude/rules/*.md` (auto-loaded) and relevant `.claude/knowledge/*.md` (lazy) before any task.

## Commands

| Command | Purpose |
|---------|---------|
| `dev` | Start dev server |
| `build` | TypeScript check + Vite build |
| `add-component` | Scaffold a new UI component |
| `add-page` | Scaffold a new page + register route |
| `add-service` | Scaffold a new API service module |

## Skills

| Skill | Purpose |
|-------|---------|
| `implement` | Architect-driven feature implementation |
| `scaffold-feature` | Full feature scaffold (types -> API -> page -> route) |
| `review` | Post-implementation review cycle |
| `debug-api` | Debug API integration issues |
