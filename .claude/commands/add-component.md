# Add a New Component

Scaffold a reusable React component for the BOLA frontend.

## Arguments
- `$ARGUMENTS` — component path relative to `src/components/` (e.g., `common/StatusBadge`, `ui/Spinner`, `layout/PageHeader`)

## Steps

1. Determine the component category:
   - `ui/` — Generic primitives (buttons, badges, inputs, dialogs)
   - `common/` — BOLA-specific shared components (filters, pickers, alerts)
   - `layout/` — Page structure components (AppLayout, Sidebar, headers)
   - `auth/` — Auth-specific components
   - `rich_menu/` — Rich menu builder components

2. Create `src/components/<path>.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface MyComponentProps {
  // define props here
  className?: string;
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <div className={cn("base-tailwind-classes", className)}>
      {/* content */}
    </div>
  );
}
```

3. Key conventions:
   - Named export (`export function ComponentName()`)
   - Props interface in same file
   - Use `cn()` from `@/lib/utils` for conditional class merging
   - Use Tailwind utility classes — no CSS files
   - Accept optional `className` prop for external overrides
   - Use semantic color tokens: `text-muted-foreground`, `bg-background`, `border`, etc.
   - Import icons from `lucide-react`
   - Use existing `src/components/ui/` primitives (Button, Card, Badge, etc.) before building new ones

4. For components with variants (like Button, Badge), use `cva`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "variant-classes",
      outline: "outline-classes",
    },
  },
  defaultVariants: { variant: "default" },
});

interface MyComponentProps extends VariantProps<typeof myVariants> {
  className?: string;
}

export function MyComponent({ variant, className }: MyComponentProps) {
  return <div className={cn(myVariants({ variant, className }))} />;
}
```

5. If wrapping a `@sellsuki-org/sellsuki-components` Lit web component, add to `src/components/ui/ssk.tsx` following the existing `createComponent` pattern.
