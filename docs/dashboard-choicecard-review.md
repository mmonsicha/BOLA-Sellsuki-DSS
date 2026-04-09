# Dashboard KPI ChoiceCard Review

Date: 2026-04-09

Scope:
- Dashboard KPI blocks only
- `LINE OAs`
- `Followers`
- `Broadcasts`
- `Segments`

Reference:
- Sellsuki Design System MCP component: `ChoiceCard`
- BOLA implementation: `src/pages/dashboard/DashboardPage.tsx`

## Summary

The Dashboard KPI row now uses `ChoiceCard` and `ChoiceCardGroup` from the Sellsuki Design System. This satisfies the request to adopt the DS component directly, but the result is not a 1:1 match with the KPI-style card previously shown in BOLA or with the metric-card expectation from the storybook examples.

The main reason is structural: `ChoiceCard` is designed for selection flows with `title`, `description`, `icon`, and arrow/check affordances. It does not provide a dedicated metric slot, trend slot, or KPI-specific typography API like `StatCard`.

## Findings

### 1. KPI value is rendered as description text, not as a primary metric

Severity: High

Current implementation maps the count (`0`, `12`, etc.) into `description`, because `ChoiceCard` does not expose a `value` prop.

Impact:
- The numeric KPI loses visual hierarchy.
- The number uses description typography from the DS, not metric typography.
- The card reads like a navigation option instead of a dashboard statistic.

Recommendation:
- Add a KPI-specific variant to `ChoiceCard`, for example `variant="metric"`.
- Or expose a dedicated `meta` / `value` slot for prominent numeric content.
- If metric cards are a core use case, document that `StatCard` is the correct component and avoid using `ChoiceCard` for KPI blocks.

### 2. Interaction model is selection-first, while Dashboard KPI is navigation-first

Severity: High

`ChoiceCard` is built to represent selectable options in a group. In BOLA Dashboard, each KPI card is a shortcut that navigates immediately to another page.

Impact:
- The component semantics suggest choosing one option, not opening a destination page.
- The `selected` state is not meaningful on the Dashboard landing page.
- Arrow/check affordances may imply selection persistence that does not exist in this flow.

Recommendation:
- Add a navigation mode to `ChoiceCard`, for example `interaction="link"`.
- In navigation mode, remove selection styling and expose a proper `href`.
- If DS should keep `ChoiceCard` selection-only, publish a separate interactive navigation card for dashboard shortcuts.

### 3. Layout density differs from the original BOLA KPI row

Severity: Medium

The DS `ChoiceCard` padding, vertical rhythm, and icon block are optimized for option cards. The original BOLA KPI row is denser and puts more emphasis on quick scanning across four metrics.

Impact:
- Cards feel taller and less dashboard-like.
- Numeric comparison across the row is harder.
- The row visually shifts toward a settings/options pattern.

Recommendation:
- Add a compact density token or `size="dashboard"` preset for `ChoiceCard`.
- Reduce body padding and tighten title/value spacing for KPI usage.

### 4. Icon container treatment does not match the previous KPI presentation

Severity: Medium

`ChoiceCard` owns the icon wrapper styling internally. In the Dashboard KPI design, the icon tile is part of the metric visual hierarchy and may need different emphasis than the default muted selection icon container.

Impact:
- Icon emphasis may feel too soft or too generic.
- Harder to preserve the previous BOLA visual signature for KPI cards.

Recommendation:
- Expose icon wrapper variant props such as `iconTone`, `iconSurface`, or `iconAlign`.
- Or allow a fully custom leading slot while keeping the DS card shell.

### 5. No native support for trend, delta, or KPI metadata

Severity: Medium

The current KPI row only shows counts, but dashboard cards often need trend data, change indicators, or workspace-scoped metadata.

Impact:
- Future dashboard growth will hit the same limitation again.
- Teams may fork styling locally to add KPI metadata under the card title.

Recommendation:
- Either extend `ChoiceCard` with optional KPI metadata slots
- Or keep KPI dashboards on `StatCard` and reserve `ChoiceCard` for selection flows.

## Suggested DS Decision

Best fit by intent:
- Use `ChoiceCard` for selectable options, plans, methods, or setup flows
- Use `StatCard` for dashboard KPIs and metric summaries

If the design system wants one component to cover both use cases, the cleaner path is:
- introduce a dedicated dashboard metric variant
- add `value`
- add `href`
- disable selection affordance in navigation mode

## Files Touched

- `src/pages/dashboard/DashboardPage.tsx`
- `docs/dashboard-choicecard-review.md`
