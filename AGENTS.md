# Agent Guide: bola-frontend

## Project Overview

BOLA Frontend is the admin backoffice SPA for the BOLA LINE CRM platform.  
Admins use it to manage LINE Official Accounts, followers, broadcasts, automation rules, AI chatbot, analytics, and platform settings.

- **Stack:** React 18 + TypeScript 5 + Vite 4 + Tailwind CSS 3
- **Component library:** `@sellsuki-org/sellsuki-components` (Lit web components) + custom shadcn-style primitives
- **LINE SDK:** `@line/liff` for embedded consent and form pages
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Dev port:** 5173 (monorepo: `bola.sellsuki.local`)

---

## Architecture

```
src/
├── pages/          Route-level components (one directory per domain)
├── components/
│   ├── ui/         UI primitives: shadcn-style + sellsuki-components wrappers
│   ├── layout/     AppLayout, Sidebar, NavBar
│   ├── common/     Shared multi-domain components
│   ├── auth/       TokenExpiryGuard
│   └── rich_menu/  Rich menu canvas editor
├── api/            API service modules (one file per domain)
├── types/          src/types/index.ts — ALL shared interfaces (single file)
├── hooks/          useCurrentAdmin, useHealthCheck
├── lib/            auth.ts, utils.ts, domain-specific helpers
├── utils/          Flex message tools
├── data/           Static presets (rich menu templates)
└── App.tsx         Custom router + root component
```

---

## Key Conventions

### Routing

**No react-router-dom.** Custom router in `src/App.tsx` uses `window.location.pathname` + string matching.

- Public routes at top of `Router()` (no auth check)
- Protected routes via `resolveProtectedRoute(path, segments)`
- Navigation: `window.location.href = "/path"` (no `<Link>`)

### Styling

- **Tailwind CSS v3** — utility-first classes
- **CSS custom properties** for theming (HSL variables in `src/index.css`)
- **`cn(...inputs)`** from `@/lib/utils` = `clsx` + `tailwind-merge` — always use for conditional classes
- **Do NOT** use CSS Modules, styled-components, or inline `style=` for layout
- **Custom LINE color:** `text-line`, `bg-line` (`#06C755`)
- Tailwind content scan is `./index.html` only — do NOT dynamically build class names

### UI Components

**shadcn-style primitives** (`src/components/ui/`):
- `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Dialog`, `AlertDialog` — modal patterns
- `Input`, `Label`, `Select`, `Switch`, `Tabs` — form controls
- `Badge`, `Toast` / `ToastProvider` — notifications
- `InfoTooltip` — help text tooltip

**Sellsuki design system** (`src/components/ui/ssk.tsx`):
- Lit web components bridged via `@lit-labs/react` `createComponent`
- Import: `import { SskButton, SskInput, SskModal, ... } from '@/components/ui/ssk'`
- Use for: `Sidebar`, `TopNavbar`, `Container`, `Grid`, `Heading`, `Alert`, `Spinner`, `Skeleton`, `Badge`, `Table`, `DynamicTable`, etc.
- See `src/components/ui/ssk.tsx` for full list

**Icons:** `lucide-react` — `import { IconName } from 'lucide-react'`

### Types

All shared interfaces live in **`src/types/index.ts`** — single flat file.  
Do NOT create domain-specific type files. Add to `index.ts` and update `knowledge/data-models.md`.

### API Pattern

```typescript
import { api } from './client'
import { getWorkspaceId } from '@/lib/auth'

export async function listThings(workspaceId: string) {
  return api.get<Thing[]>(`/v1/workspaces/${workspaceId}/things`)
}
```

- All v1 calls use `/v1/workspaces/${workspaceId}/...`
- Workspace ID from `getWorkspaceId()` (localStorage `bola_workspace`)
- `api` handles auth header, 401 redirect, JSON parsing

### State Management

No global state store (no Redux, Zustand, etc.).  
Local `useState` / `useEffect` per page component.  
Shared auth state via `useCurrentAdmin()` hook (fetches from API on mount).

### Auth Modes

| Mode | Token | Login entry | Use |
|------|-------|------------|-----|
| `local_jwt` | localStorage `bola_token` | `/login` page | Default / standalone |
| `kratos` | Session cookie | `/choose-workspace` → Kratos | Monorepo with Sellsuki CCS |

`getAuthMode()` reads `VITE_AUTH_MODE` env var.

---

## Directory Map

```
bola-frontend/
├── src/
│   ├── App.tsx                      # Router + App root
│   ├── main.tsx                     # Vite entry point
│   ├── index.css                    # CSS custom properties (Tailwind theme vars)
│   ├── api/
│   │   ├── client.ts               # ApiClient singleton + fetch wrapper
│   │   ├── auth.ts
│   │   ├── lineOA.ts
│   │   ├── follower.ts
│   │   ├── broadcast.ts
│   │   ├── segment.ts
│   │   ├── autoReply.ts
│   │   ├── autoPushMessage.ts
│   │   ├── flexMessage.ts
│   │   ├── richMenu.ts
│   │   ├── lon.ts
│   │   ├── rgb.ts
│   │   ├── media.ts
│   │   ├── registrationForm.ts
│   │   ├── aiChatbot.ts
│   │   ├── analytics.ts
│   │   ├── auditLog.ts
│   │   ├── adminPerformance.ts
│   │   ├── webhookSetting.ts
│   │   ├── outboundEvent.ts
│   │   └── workspace.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ssk.tsx             # Sellsuki component wrappers
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── label.tsx
│   │   │   ├── toast.tsx
│   │   │   └── info-tooltip.tsx
│   │   ├── layout/                 # AppLayout, Sidebar, TopNavbar
│   │   ├── auth/                   # TokenExpiryGuard
│   │   ├── common/                 # Shared multi-domain components
│   │   ├── rich_menu/              # Rich menu canvas editor
│   │   ├── CopyButton.tsx
│   │   ├── FlexCardPreview.tsx
│   │   └── WebhookTestResultModal.tsx
│   ├── hooks/
│   │   ├── useCurrentAdmin.ts      # Fetches current admin from /auth/me
│   │   └── useHealthCheck.ts
│   ├── lib/
│   │   ├── auth.ts                 # Token management, auth mode, logout
│   │   └── utils.ts                # cn() utility
│   ├── types/
│   │   └── index.ts                # ALL shared TypeScript interfaces
│   ├── utils/                      # Flex message tools, preview
│   ├── data/                       # Static presets
│   └── test/
│       └── setup.ts                # Vitest setup (@testing-library/jest-dom)
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
└── package.json
```

---

## Adding a New Feature

1. **Type:** Add interface to `src/types/index.ts`; update `knowledge/data-models.md`
2. **API:** Create `src/api/<domain>.ts` using `api` singleton; update `knowledge/api-services.md`
3. **Page:** Create `src/pages/<domain>/<PageName>.tsx` using `AppLayout` + Tailwind + UI primitives
4. **Route:** Import page and add branch in `resolveProtectedRoute()` in `src/App.tsx`; update `knowledge/routing.md`
5. **Test:** Unit test the API module and any complex component logic with Vitest

---

## Testing

| Tool | Purpose | Run |
|------|---------|-----|
| Vitest | Unit/component tests | `npm run test:run` |
| Playwright | E2E tests | `npm run e2e` |

Test files: `src/**/*.test.ts(x)` for unit tests, `test/` dir for Playwright.  
Setup file: `src/test/setup.ts` imports `@testing-library/jest-dom`.

---

## Agent Roles

### Developer

Before implementing:
1. Read `.claude/CLAUDE.md` (auto-loaded) + `.claude/rules/*.md`
2. Read relevant `.claude/knowledge/*.md` (see `rules/knowledge.md` for inventory)
3. Follow Tailwind-only styling — no CSS Modules, no inline styles
4. Add all new types to `src/types/index.ts`

### QA

- Run `npm run type-check` and `npm run lint` before committing
- Unit tests with Vitest for business logic
- E2E tests with Playwright for critical flows (auth, broadcast send)

### Reviewer

Check:
- New types added to `src/types/index.ts` (not scattered)
- Routing updated in `App.tsx` for new pages
- No CSS Modules or inline styles — Tailwind + `cn()` only
- `api` singleton used, not direct `fetch`
- Knowledge files updated for new domains
