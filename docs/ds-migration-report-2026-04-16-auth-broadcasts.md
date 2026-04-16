# DS Migration Report — Auth & Broadcasts

Date: 2026-04-16

## Scope

This migration round focused on two high-visibility areas:
- authentication entry flow
- broadcast list flow

Updated pages:
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/ChooseWorkspacePage.tsx`
- `src/pages/broadcasts/BroadcastsPage.tsx`

## What Changed

### LoginPage

Rebuilt around direct DS components:
- `Card`
- `CardHeader`
- `CardBody`
- `DSInput`
- `DSButton`
- `Alert`

Key changes:
- removed dependency on local auth card/input/button primitives
- upgraded sign-in form to a DS-first visual structure
- kept existing login logic and workspace-selection flow intact

### ChooseWorkspacePage

Rebuilt around direct DS components:
- `Card`
- `CardHeader`
- `CardBody`
- `DSButton`
- `Alert`
- `EmptyState`

Key changes:
- replaced local empty/error shell with DS feedback primitives
- grouped workspace chooser now matches the DS-first visual language better
- kept workspace fetching and selection behavior unchanged

### BroadcastsPage

Rebuilt around direct DS components:
- `FeaturePageScaffold`
- `PageHeader`
- `Tabs`
- `Card`
- `CardBody`
- `Badge`
- `Alert`
- `EmptyState`
- `DSButton`

Key changes:
- replaced the older manual page shell with DS list-page composition
- migrated status filtering to DS `Tabs`
- migrated loading/error/empty states to DS feedback patterns
- preserved LINE OA filtering and grouped campaign behavior

## Verification

- `npm run type-check`: passed
- `npm run build`: passed

## Known Compatibility Notes

- Tailwind v3 + DS stylesheet import order warning still exists
- latest DS quick-start root-import guidance breaks this repo's build, so the current CSS integration remains a compatibility exception

## Related DS Issue

- DS quick-start / Tailwind v3 compatibility:
  - https://github.com/BearyCenter/Sellsukidesignsystemv12/issues/13
