# Tech Stack

## Core
- **React 18.3** + **TypeScript 5** + **Vite 4**
- **npm** as package manager (has `package-lock.json`; also supports `bun` — `bun.lock` present)
- **Tailwind CSS 3.4** for styling
- **PostCSS + Autoprefixer** for CSS processing

## UI / Component Libraries
- **shadcn-style primitives** in `src/components/ui/` — Button, Card, Badge, Dialog, Input, Label, Select, AlertDialog, InfoTooltip
  - Built with `class-variance-authority` (cva) + `cn()` (clsx + tailwind-merge)
- **@sellsuki-org/sellsuki-components ^0.22.8** — Lit web components design system
  - Bridged to React via `@lit-labs/react` createComponent in `src/components/ui/ssk.tsx`
  - Import as named `Ssk*` exports: `SskButton`, `SskInput`, `SskModal`, `SskTable`, etc.
- **lucide-react ^0.439.0** — icon set
- **@line/liff ^2.27.3** — LINE LIFF SDK for embedded LINE browser pages
- **class-variance-authority ^0.7.1** — component variant builder
- **clsx ^2.1.1** + **tailwind-merge ^2.6.1** — class name utilities

## Rich Content / Editors
- **@uiw/react-codemirror ^4.25.5** + **@codemirror/lang-json** + **@codemirror/theme-one-dark** — JSON code editor (used in Flex Message builder and Webhook test modal)
- **flex-render ^0.1.9** + **flex-render-react ^0.1.7** — LINE Flex Message rendering library
- **html2canvas ^1.4.1** — canvas screenshot for Rich Menu builder
- **qrcode.react ^4.2.0** — QR code generation (LON subscribe page)
- **@lit-labs/react ^2.1.3** — React wrapper for Lit web components

## Testing
- **Vitest ^4.0.18** — unit tests (environment: jsdom)
  - Setup: `src/test/setup.ts`
  - `@testing-library/react ^16.3.2`, `@testing-library/user-event ^14.6.1`, `@testing-library/jest-dom ^6.9.1`
- **Playwright ^1.58.2** — e2e tests
  - Config: `playwright.config.ts`
  - Tests: `e2e/` directory
  - Browser: Chromium only
  - Base URL: `http://localhost:5173`

## Build Tooling
- **Vite 4** (not 5/6) — fast HMR, Rollup bundler
- **@vitejs/plugin-react ^4.7.0** — Babel-based React Fast Refresh
- **TypeScript 5** — strict mode, `verbatimModuleSyntax`, bundler resolution
- **ESLint 8** — `@typescript-eslint`, `react-hooks`, `react-refresh` plugins
- **Husky + lint-staged** — pre-commit hook runs `eslint --fix --max-warnings 0` on staged `src/**/*.{ts,tsx}`

## File Organization
```
src/
  api/           # API modules (one file per domain)
  assets/        # Static assets (SVGs)
  components/    # Reusable components
    auth/        # TokenExpiryGuard
    common/      # DatabaseAlert, FeedbackWidget, LineOAFilter, FlexMessagePicker
    layout/      # AppLayout, Sidebar, SetupProgressChecklist
    rich_menu/   # RichMenu-specific components
    ui/          # Primitive UI components + ssk.tsx (Sellsuki web components)
  data/          # Static data (rich menu presets, etc.)
  hooks/         # Custom hooks
  lib/           # auth.ts, utils.ts, lineOAUtils.ts, mediaUtils.ts, phone.ts
  pages/         # Route pages (organized by domain)
  test/          # Vitest setup
  types/         # TypeScript interfaces (index.ts)
  utils/         # Flex message utilities
```

## Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_URL` | Backend base URL | `""` (uses Vite proxy) |
| `VITE_APP_ENV` | Environment label | `development` |
| `VITE_AUTH_MODE` | Auth mode | `local_jwt` |
| `VITE_KRATOS_LOGIN_URL` | Kratos SSO login URL (kratos mode only) | — |

## Vite Dev Proxy
All requests are proxied to `http://localhost:8081` (BOLA backend / auth proxy):
- `/auth` — authentication endpoints
- `/v1` — main API
- `/webhook/` — webhook testing
- `/uploads/` — file uploads
- `/media/` — media files
