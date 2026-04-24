# Phase 2 Storybook Gap Report

Date: 2026-04-24
Branch: `codex/merge-origin-20260417`
Scope: truthful audit between current BOLA frontend, Sellsuki Design System MCP, and Storybook expectations

## Sources Used

- Sellsuki DSS MCP
  - `get_quick_start`
  - `get_brand_rules`
  - `get_design_tokens(all)`
  - `list_components(layout)`
  - `list_components(navigation)`
  - `list_components(display)`
  - `list_components(form)`
  - `list_components(feedback)`
- Local codebase implementation
- Local preview at `http://127.0.0.1:4173/`

## Executive Summary

The current system is **not yet 100% identical to Storybook**.

What is true today:

- the app shell now uses DSS runtime `Sidebar` and `TopNavbar`
- the typography system is aligned to DSS MCP tokens using `DB HeaventRounded`
- multiple pages already use DSS runtime components directly
- several higher-level DSS components from MCP/Storybook are still **not available as runtime exports** in the installed package, so the project uses compatibility wrappers instead
- the project still cannot import `@uxuissk/design-system/styles.css` directly because it breaks the Tailwind v3 build pipeline in this repo

So the correct status is:

- **partially aligned with DSS**
- **not Storybook-identical yet**
- **blocked partly by package/runtime gaps, partly by migration scope**

## What Changed To Match DSS

### 1. Foundation and typography

Aligned in:

- `DB HeaventRounded` is used as the font family for all text
- typography tokens are defined in `src/index.css`
- base body size is raised to `--text-p`
- shell spacing uses DSS semantic spacing values
- default radius is aligned to `radius-md`

Files:

- `src/index.css`

### 2. App shell

Aligned in:

- `Sidebar` uses DSS runtime component
- `TopNavbar` uses DSS runtime component
- sidebar collapse/mobile drawer behavior is routed through DSS shell controls
- navbar breadcrumbs now reflect current route/page context
- shell spacing and shell height are normalized through tokens

Files:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/shellConfig.tsx`

### 3. Pages/components already moved toward DSS runtime

Direct DSS usage exists in these areas:

- auth shell/status
- dashboard
- broadcasts
- analytics
- followers
- line OA
- segments
- settings
- contact detail/follower detail/segment detail related pages

Representative files:

- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/broadcasts/BroadcastsPage.tsx`
- `src/pages/analytics/AnalyticsDashboardPage.tsx`
- `src/pages/followers/FollowersPage.tsx`
- `src/pages/line-oa/LineOAPage.tsx`
- `src/pages/segments/SegmentsPage.tsx`
- `src/pages/settings/SettingsPage.tsx`

## What Is Still NOT 100% Matching Storybook

### 1. CSS integration is not Storybook-identical

Storybook/MCP quick start says:

```tsx
import "@uxuissk/design-system/styles.css";
```

In this repo, doing that currently breaks production build because the package CSS includes `@layer base` and collides with Tailwind CSS v3 processing.

Current workaround:

- use DSS runtime React components
- use `@uxuissk/design-tokens/css`
- keep local token bridge in `src/index.css`

Truth:

- this is functionally aligned enough to build
- this is **not** the exact Storybook integration path

### 2. Some Storybook-listed components are not usable from runtime package

MCP/Storybook lists these higher-level components:

- `FeaturePageScaffold`
- `PageHeader`
- `FilterBar`
- `AdvancedDataTable`
- `BarChart`
- `DonutChart`
- `ChoiceCard`

But the installed runtime package does not export them all in a way this app can use directly.

Current workaround:

- local compatibility layer in `src/components/ui/ds-compat.tsx`

Truth:

- visually and structurally they were rebuilt to follow DSS tokens and available base components
- they are **not** the original Storybook runtime implementations

### 3. AppShellProvider is not wired into the app

MCP layout inventory includes `AppShellProvider`.

Current state:

- shell is composed manually using `Sidebar` and `TopNavbar`
- route state, active item logic, breadcrumbs, and product config are still managed locally

Truth:

- shell behavior works
- this is **not** a full canonical AppShellProvider integration

### 4. Not all pages are migrated

A number of core pages are migrated or partially migrated, but the entire system is not yet fully refactored page-by-page to Storybook parity.

Examples of pages that still contain legacy custom structure or older primitives outside full DSS parity:

- many admin detail pages
- legacy forms and builders
- older dialogs
- portions of media, webhook, automation, registration form, and chatbot flows

Truth:

- shell and several major feature pages are aligned more closely than before
- whole-app parity is still incomplete

### 5. Some interactions still use local or legacy patterns

Examples:

- route navigation still uses custom path routing in `src/App.tsx`
- some table/filter/chart/detail flows still depend on local wrappers
- some page-level UI patterns are adapted rather than direct Storybook composition

Truth:

- the product flow is preserved
- the architecture is still BOLA-first, not a clean-room DSS reference app

## Why These Gaps Still Exist

### A. Runtime package gap

The biggest reason is that MCP/Storybook surface area is currently larger than the runtime exports that work cleanly in this project.

### B. Tailwind v3 compatibility constraint

The package CSS import path recommended by quick start currently breaks this repo's build.

### C. Preserve existing system code and flow

This migration intentionally keeps BOLA routing, page logic, domain flow, and existing app behavior instead of rebuilding the product from scratch.

That is safer for the app, but it means some Storybook structures have to be adapted rather than copied one-to-one.

### D. Migration scope is still in progress

Phase 1 and the current shell/Typography work move the system significantly closer, but not to full parity yet.

## Real Current Status

### Matches DSS well

- typography tokens
- font family
- shell spacing/radius approach
- DSS `Sidebar`
- DSS `TopNavbar`
- many page-level cards/alerts/inputs/tabs/pagination states

### Partially matches DSS

- page scaffold patterns
- filter bars
- advanced tables
- charts
- choice/interactive cards

### Does not yet match DSS 100%

- root CSS integration path from quick start
- canonical AppShellProvider setup
- runtime use of every Storybook-listed high-level component
- whole-app page coverage

## Verification

- local preview is available at `http://127.0.0.1:4173/`
- `npm run type-check` ✅
- `npm run lint` ✅ (warnings only)
- `npm run build` ✅

## Recommended Next Steps

1. Continue page-by-page migration using DSS runtime components where they truly exist.
2. Keep `ds-compat.tsx` only as a temporary bridge and shrink it over time.
3. Open/track DSS issues for:
   - missing runtime exports vs MCP/Storybook
   - direct stylesheet incompatibility with Tailwind v3 projects
4. Migrate remaining high-traffic pages before low-frequency settings/detail flows.

