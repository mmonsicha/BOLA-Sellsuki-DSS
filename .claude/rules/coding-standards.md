# Coding Standards

## TypeScript
- Strict mode enabled (`strict: true`)
- `noUnusedLocals` and `noUnusedParameters` are OFF — do not add `_` prefixes just to satisfy the compiler
- Use `import type { Foo }` for type-only imports
- Prefer interfaces over type aliases for object shapes
- Never use `any` without a `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment
- Use `@/` path alias for all src imports — never relative `../../`

## React
- Functional components only — no class components
- Named exports: `export function MyComponent()`
- Props interface defined in the same file, above the component
- Use `useState`, `useEffect`, `useCallback` — no class lifecycle methods
- No global state library — use local state per page, or the `useCurrentAdmin` module-level cache pattern for singleton data

## Styling — Tailwind CSS
- Tailwind utility classes for all styling — no CSS modules, no CSS-in-JS
- Use `cn(...inputs)` from `@/lib/utils` to conditionally join classes (wraps `clsx` + `tailwind-merge`)
- Use CSS custom property tokens for semantic colors: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `ring`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `card`, `popover`
- LINE green: `bg-line` (`#06C755`) and `bg-line-dark` / `bg-line-light`
- Border radius tokens: `rounded-lg` = `var(--radius)`, `rounded-md`, `rounded-sm`
- No hardcoded hex colors in className — use the token system from `tailwind.config.js`

## Component Variants (CVA pattern)
- Use `class-variance-authority` (`cva`) for components with multiple visual variants
- Export `buttonVariants` / `badgeVariants` etc. for external composition
- Apply with `cn(variantFn({ variant, size, className }))`

## UI Components
- **Primitives** (`src/components/ui/`): Button, Card, Badge, Dialog, Input, Label, Select, AlertDialog, InfoTooltip — use these before building custom
- **Sellsuki components** (`src/components/ui/ssk.tsx`): Lit web components wrapped with `@lit-labs/react` createComponent — import as `SskButton`, `SskInput`, `SskModal`, etc. Use for design-system-aligned forms and data tables
- **Icons**: lucide-react — import individual icons (`import { Plus, Trash2 } from "lucide-react"`)
- **LINE LIFF**: `import liff from "@line/liff"` — only in LIFF-specific pages (consent, LON public subscribe)

## File Naming
- Components: `PascalCase.tsx` (no CSS module file — styling is all Tailwind)
- Hooks: `useCamelCase.ts`
- API modules: `camelCase.ts` (e.g., `broadcast.ts`, `lineOA.ts`)
- Types: all in `src/types/index.ts` (single file)
- Utils: `camelCase.ts`

## State Patterns
- Page-level: `useState` / `useEffect` directly in the page component
- Cross-component (read-only singleton): module-level cache pattern — see `src/hooks/useCurrentAdmin.ts`
- No React Context providers (not needed; workspace is from localStorage)

## Error Handling
- API errors are thrown by `api.request<T>()` — catch in the component with `try/catch` blocks
- Display errors via inline state (`const [error, setError] = useState("")`) rendered as a `<p className="text-sm text-destructive">` or similar
- Never swallow errors silently

## Forms
- Controlled inputs with `useState` — no form library
- Submit handlers are `async function handleSubmit(e: React.FormEvent)` with `e.preventDefault()`
- Loading state: `const [loading, setLoading] = useState(false)`
