# Contacts DS Review

Date: 2026-04-10

Scope:
- `Tabs` with icons
- `AdvancedDataTable`
- `EmptyState`
- Page: `src/pages/customers/CustomersPage.tsx`

## Summary

The Contacts page was rebuilt as a mock-driven DS page:
- `All Followers` uses `AdvancedDataTable`
- `Phone` uses `EmptyState`
- the tab switcher uses `Tabs` with icons

This version uses DS components directly and renders them without relying on custom BOLA table primitives.

## Findings

### 1. Tabs supports icons in implementation, but MCP docs do not document the `icon` field

Severity: Medium

The Contacts page uses:
- `All Followers` with `Users` icon
- `Phone` with `Phone` icon

This works because the DS source renders `w.icon` inside each tab item. However, the MCP `Tabs` documentation only describes:
- `id`
- `label`
- `content`
- `badge`
- `disabled`

Impact:
- Teams can miss an existing feature and assume a custom wrapper is needed.
- Developers have to inspect source to confirm whether icon tabs are officially supported.

Recommendation:
- Update the MCP/storybook docs for `Tabs` to include `icon?: ReactNode`
- Add an explicit story example for `Tabs with icons`

### 2. AdvancedDataTable exposes `emptyDescription`, but the rendered empty state only shows the message

Severity: High

The `AdvancedDataTable` API documents:
- `emptyMessage`
- `emptyDescription`

But the DS source only renders the message in the empty row state and does not render the description under it.

Impact:
- Consumers cannot match the richer empty-state example implied by the docs.
- Teams may think they configured the table incorrectly when the description never appears.

Recommendation:
- Either render `emptyDescription` in the component
- Or remove it from the public API/docs if it is intentionally unsupported

### 3. AdvancedDataTable is strong for table rendering, but page-level search/filter orchestration is still consumer-owned

Severity: Low

For this Contacts mockup, the page handles:
- mock search
- LINE OA filtering
- client-side sorting
- client-side pagination slice

This is fine, but it means the component is primarily a table shell rather than a full data-grid state manager.

Impact:
- Teams still need custom orchestration per page
- Storybook examples should make the ownership boundary explicit

Recommendation:
- Add one storybook example for local/client mode
- Add one storybook example for server mode
- Make the docs clearer about where filtering and data shaping should live

### 4. EmptyState works cleanly as a standalone panel

Severity: None

The `Phone` tab now uses `EmptyState` directly and it maps well to the DS API:
- icon
- title
- description
- action

This component required no workaround in the final Contacts implementation.

## Suggested Issues

Design system repo:
- document `Tabs` icon support
- fix or remove `AdvancedDataTable.emptyDescription`

App repo:
- replace mock orchestration with real contacts API once the DS-first preview is approved

## Files Touched

- `src/pages/customers/CustomersPage.tsx`
- `docs/contacts-ds-review.md`
