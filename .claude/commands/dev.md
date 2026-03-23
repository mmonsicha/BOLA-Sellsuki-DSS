# Start Dev Server

Start the BOLA frontend dev server with hot module replacement.

## Usage

```bash
cd /home/dorasu/Work/autogen/repos/frontend/bola-frontend
npm run dev
```

Or inside the monorepo via overmind:
```bash
overmind start -l bola-frontend
# or
make dev
```

## Access
- Local: `http://localhost:5173`
- Monorepo: `https://bola.sellsuki.local` (Caddy TLS)

## Environment
- Default `.env` — uses Vite proxy to `localhost:8081` (BOLA backend)
- `.env.dev` — uses `https://bola-api.sellsuki.local` (monorepo Caddy)

## Proxy Routes
- `/v1/*` → `http://localhost:8081`
- `/auth/*` → `http://localhost:8081`
- `/webhook/*` → `http://localhost:8081`
- `/uploads/*` → `http://localhost:8081`
- `/media/*` → `http://localhost:8081`

## Notes
- Port is overridden by `$PORT` env var (overmind Procfile sets it)
- Backend must be running for API calls to work
- Auth mode is set via `VITE_AUTH_MODE` env var (`local_jwt` or `kratos`)
