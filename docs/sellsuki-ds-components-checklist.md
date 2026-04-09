# Sellsuki Design System Components Checklist

Source: Sellsuki Design System MCP  
Package: `@uxuissk/design-system`  
Local barrel export: `src/components/ui/sellsuki-ds.ts`

## Ready To Use

- [x] CSS loaded at app root via `@uxuissk/design-system/styles.css`
- [x] DS package installed in the repo
- [x] Local barrel export created at `@/components/ui/sellsuki-ds`
- [x] Component inventory synced from MCP into this codebase

## Form Controls

- [x] DSButton
- [x] DSInput
- [x] DSCheckbox
- [x] DSRadio
- [x] Switch
- [x] DatePicker
- [x] SearchField
- [x] Dropdown
- [x] TagInput
- [x] ColorPicker
- [x] Rating
- [x] FileUpload
- [x] FormField
- [x] NumberInput
- [x] OTPInput
- [x] DateRangePicker
- [x] TimePicker
- [x] DateTimePicker
- [x] ChoiceCard
- [x] RadioCard
- [x] RepeatableFieldList
- [x] RichTextEditor

## Layout

- [x] TransferList
- [x] Divider
- [x] PageHeader
- [x] FilterBar
- [x] Accordion
- [x] FeaturePageScaffold
- [x] AppShellProvider

## Data Display

- [x] DSTable
- [x] Badge
- [x] Tag
- [x] Avatar
- [x] Statistic
- [x] StatCard
- [x] Timeline
- [x] Tree
- [x] Skeleton
- [x] Card
- [x] ImagePreview
- [x] AdvancedDataTable
- [x] LineChart
- [x] AreaChart
- [x] BarChart
- [x] DonutChart
- [x] MiniSparkline
- [x] ImageGallery
- [x] ThumbnailCell

## Feedback

- [x] EmptyState
- [x] Alert
- [x] ToastContainer
- [x] toast
- [x] Modal
- [x] ConfirmDialog
- [x] Notification
- [x] NotificationCenter
- [x] Spinner
- [x] ProgressBar
- [x] Tooltip
- [x] Popover
- [x] Drawer

## Navigation

- [x] Tabs
- [x] Pagination
- [x] Breadcrumb
- [x] Sidebar
- [x] TopNavbar
- [x] Menu
- [x] Stepper

## Notes

- Typography from MCP:
  - `DB HeaventRounded, sans-serif`
  - `--text-h1`
  - `--text-h2`
  - `--text-h3`
  - `--text-h4`
  - `--text-p`
  - `--text-caption`
  - `--text-label`
  - `--text-button`
- Brand rule from MCP:
  - Use DS components before building custom UI primitives when an equivalent DS component exists.
- Suggested import style for new code:

```ts
import {
  DSButton,
  PageHeader,
  FeaturePageScaffold,
  Alert,
  StatCard,
} from "@/components/ui/sellsuki-ds";
```
