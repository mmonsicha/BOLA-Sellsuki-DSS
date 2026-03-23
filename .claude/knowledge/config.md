# Configuration

## Environment Variables

Defined in `.env` (dev defaults), `.env.dev` (monorepo dev), `.env.staging`, `.env.production`.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (empty) | Backend API base URL. Empty = use Vite dev proxy (routes to `localhost:8081`). Set to full URL for remote backend (e.g., `https://bola-api.sellsuki.local`). |
| `VITE_APP_ENV` | `development` | Runtime environment label (`development` / `staging` / `production`). Used in feedback widget and stored with feedback entries. |
| `VITE_AUTH_MODE` | (unset = `local_jwt`) | Auth mode: `local_jwt` (default) or `kratos`. Controls login flow and token handling. |
| `VITE_KRATOS_LOGIN_URL` | `https://accounts.sellsuki.local/login` | Kratos login page URL (kratos mode only). |

## Vite Config (`vite.config.ts`)

- **Port:** `PORT` env var or `5173`
- **Allowed hosts:** `bola.sellsuki.local`
- **Path alias:** `@/` → `src/`
- **Test environment:** `jsdom` (Vitest)
- **Test setup:** `src/test/setup.ts`

### Dev Proxy

Vite proxies these paths to `http://localhost:8081`:
- `/auth` — auth routes (global login, password reset)
- `/v1` — all v1 API routes
- `/webhook/` — webhook test endpoints
- `/uploads/` — static file serving
- `/media/` — media CDN fallback

In monorepo dev, `VITE_API_URL=https://bola-api.sellsuki.local` bypasses the proxy (set in `.env.dev`).

## TypeScript Config

- `tsconfig.app.json` — `strict: true`, `target: ES2020`, `moduleResolution: bundler`
- Path alias `@/*` defined in `tsconfig.app.json` and `vite.config.ts`
- `noUnusedLocals` and `noUnusedParameters` intentionally OFF (team preference)

## Tailwind Config (`tailwind.config.js`)

- CSS custom property theming (HSL variables defined in `src/index.css`)
- Custom colors: `border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card` — all mapped to CSS vars
- Custom LINE brand color: `line: { DEFAULT: '#06C755', dark: '#00B050', light: '#3FDB7A' }`
- `darkMode: ['class']` — dark mode via `.dark` class
- Content scan: `./index.html` only (note: `./src/**/*.{ts,tsx}` is NOT in the content array — classes must be complete strings, no template literals)

## ESLint Config (`.eslintrc.cjs`)

- TypeScript ESLint + React Hooks + React Refresh plugins
- Max warnings threshold: `200` (lint), `0` (lint-staged pre-commit)

## Husky + lint-staged

Pre-commit hook: `eslint --fix --max-warnings 0` on staged `src/**/*.{ts,tsx}` files.

## Build Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run build:development` | Vite build in development mode |
| `npm run build:staging` | Vite build in staging mode |
| `npm run lint` | ESLint check (max-warnings 200) |
| `npm run lint:fix` | ESLint autofix |
| `npm run type-check` | TypeScript check only (`tsc --noEmit`) |
| `npm run test:run` | Vitest run once |
| `npm run test:coverage` | Vitest with v8 coverage |
| `npm run e2e` | Playwright tests |

## Package Manager

Uses `npm` (has `package-lock.json`) and also `bun` (has `bun.lock`) — prefer `npm` for new installs to keep lock files consistent.

## Auth State (localStorage keys)

| Key | Purpose |
|-----|---------|
| `bola_token` | JWT Bearer token (local_jwt mode) |
| `bola_workspace` | Current workspace ID |
| `bola_token_expires_at` | Token expiry ISO timestamp |

All auth helpers in `src/lib/auth.ts`.
