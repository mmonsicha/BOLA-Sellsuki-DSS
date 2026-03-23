# Build

Verify TypeScript types and produce a production build.

## Usage

```bash
cd /home/dorasu/Work/autogen/repos/frontend/bola-frontend
npm run build
```

This runs `tsc && vite build` — TypeScript compilation check first, then Vite production bundle.

## Other build targets

```bash
npm run build:development   # vite build --mode development (uses .env.dev)
npm run build:staging       # vite build --mode staging
npm run type-check          # tsc --noEmit only (fast type check, no output)
```

## Lint check

```bash
npm run lint           # eslint check (max-warnings 200)
npm run lint:fix       # eslint autofix
```

## Output
- `dist/` directory — production-ready static files
- `dist/index.html` — SPA entry point (all routes serve this)

## Common build errors and fixes

| Error | Fix |
|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Fix the TypeScript type mismatch |
| `Cannot find module '@/...'` | Check path alias — `@/` must map to `src/` |
| `Property '...' does not exist` | Add the property to the interface in `src/types/index.ts` |
| `Object is possibly 'null'` | Add null check or use optional chaining |
| `Verbatim module syntax: use import type` | Change `import { Foo }` to `import type { Foo }` for type-only imports |

## Notes
- Always run `npm run build` after implementing a feature to verify there are no TypeScript errors
- CI/CD runs `npm run build` — code that doesn't build will fail the pipeline
