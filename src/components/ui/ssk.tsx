/**
 * React wrappers for @sellsuki-org/sellsuki-components (Lit Web Components)
 * Uses @lit-labs/react createComponent to bridge Lit → React event/prop model.
 *
 * Usage:
 *   import { SskButton, SskInput, SskModal } from '@/components/ui/ssk'
 */

import React from 'react'
import { createComponent } from '@lit-labs/react'

import {
  // Layout & Navigation
  Sidebar,
  SidebarGroup,
  SidebarHeader,
  SidebarItems,
  SidebarList,
  TopNavbar,
  Container,
  Grid,

  // Typography
  Heading,

  // Feedback
  Alert,
  Spinner,
  Skeleton,
  Tooltip,
  ToastProvider,

  // Data Display
  Avatar,
  Badge,
  Tag,
  Icon,
  MiscIcon,
  Divider,
  Table,
  TableRow,
  TableCell,
  DynamicTable,
  HeaderCell,
  Pagination,
  Timeline,
  ProgressBar,

  // Form Inputs
  Button,
  Input,
  InputAddon,
  InputRange,
  Inputtag,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  Toggle,
  Dropdown,
  DropdownButton,
  DropdownOption,
  DropdownPreview,
  PinCode,
  AddonPhoneCountry,

  // Overlays
  Modal,
  Drawer,
  DrawerHeader,

  // Navigation
  Tabs,
  TabButton,
  TabHeader,
  Accordion,
  AccordionItem,

  // Cards
  Card,
  CardGroup,
  CardSelect,
  ExpandableCard,

  // Date & Time
  DatePicker,
  RangeDatePicker,
  DateDisplay,
  Time,

  // Media
  ImageCropper,

  // Misc
  Logo,
  Stepper,
} from '@sellsuki-org/sellsuki-components'

// ─── Layout & Navigation ────────────────────────────────────────────────────

export const SskSidebar = createComponent({
  react: React,
  tagName: 'ssk-sidebar',
  elementClass: Sidebar,
})

export const SskSidebarGroup = createComponent({
  react: React,
  tagName: 'ssk-sidebar-group',
  elementClass: SidebarGroup,
})

export const SskSidebarHeader = createComponent({
  react: React,
  tagName: 'ssk-sidebar-header',
  elementClass: SidebarHeader,
})

export const SskSidebarItems = createComponent({
  react: React,
  tagName: 'ssk-sidebar-item',
  elementClass: SidebarItems,
})

export const SskSidebarList = createComponent({
  react: React,
  tagName: 'ssk-sidebar-list',
  elementClass: SidebarList,
})

export const SskTopNavbar = createComponent({
  react: React,
  tagName: 'ssk-top-navbar',
  elementClass: TopNavbar,
})

export const SskContainer = createComponent({
  react: React,
  tagName: 'ssk-container',
  elementClass: Container,
})

export const SskGrid = createComponent({
  react: React,
  tagName: 'ssk-grid',
  elementClass: Grid,
})

// ─── Typography ─────────────────────────────────────────────────────────────

export const SskHeading = createComponent({
  react: React,
  tagName: 'ssk-heading',
  elementClass: Heading,
})

// ─── Feedback ───────────────────────────────────────────────────────────────

export const SskAlert = createComponent({
  react: React,
  tagName: 'ssk-alert',
  elementClass: Alert,
  events: {
    onClose: 'close',
  },
})

export const SskSpinner = createComponent({
  react: React,
  tagName: 'ssk-spinner',
  elementClass: Spinner,
})

export const SskSkeleton = createComponent({
  react: React,
  tagName: 'ssk-skeleton',
  elementClass: Skeleton,
})

export const SskTooltip = createComponent({
  react: React,
  tagName: 'ssk-tooltip',
  elementClass: Tooltip,
})

export const SskToastProvider = createComponent({
  react: React,
  tagName: 'ssk-toast-provider',
  elementClass: ToastProvider,
})

// ─── Data Display ───────────────────────────────────────────────────────────

export const SskAvatar = createComponent({
  react: React,
  tagName: 'ssk-avatar',
  elementClass: Avatar,
})

export const SskBadge = createComponent({
  react: React,
  tagName: 'ssk-badge',
  elementClass: Badge,
})

export const SskTag = createComponent({
  react: React,
  tagName: 'ssk-tag',
  elementClass: Tag,
})

export const SskIcon = createComponent({
  react: React,
  tagName: 'ssk-icon',
  elementClass: Icon,
})

export const SskMiscIcon = createComponent({
  react: React,
  tagName: 'ssk-misc-icon',
  elementClass: MiscIcon,
})

export const SskDivider = createComponent({
  react: React,
  tagName: 'ssk-divider',
  elementClass: Divider,
})

export const SskTable = createComponent({
  react: React,
  tagName: 'ssk-table',
  elementClass: Table,
  events: {
    onPageChange: 'page-changed',
    onSort: 'sort',
    onRowSelect: 'row-select',
  },
})

export const SskTableRow = createComponent({
  react: React,
  tagName: 'ssk-table-row',
  elementClass: TableRow,
})

export const SskTableCell = createComponent({
  react: React,
  tagName: 'ssk-table-cell',
  elementClass: TableCell,
})

export const SskHeaderCell = createComponent({
  react: React,
  tagName: 'ssk-header-cell',
  elementClass: HeaderCell,
})

export const SskDynamicTable = createComponent({
  react: React,
  tagName: 'ssk-dynamic-table',
  elementClass: DynamicTable,
  events: {
    onPageChange: 'page-changed',
    onSort: 'sort',
    onRowSelect: 'row-select',
  },
})

export const SskPagination = createComponent({
  react: React,
  tagName: 'ssk-pagination',
  elementClass: Pagination,
  events: {
    onPageChange: 'page-changed',
  },
})

export const SskTimeline = createComponent({
  react: React,
  tagName: 'ssk-timeline',
  elementClass: Timeline,
})

export const SskProgressBar = createComponent({
  react: React,
  tagName: 'ssk-progress-bar',
  elementClass: ProgressBar,
})

// ─── Form Inputs ────────────────────────────────────────────────────────────

export const SskButton = createComponent({
  react: React,
  tagName: 'ssk-button',
  elementClass: Button,
  events: {
    onClick: 'click',
  },
})

export const SskInput = createComponent({
  react: React,
  tagName: 'ssk-input',
  elementClass: Input,
  events: {
    onChange: 'change',
    onInput: 'input',
  },
})

export const SskInputAddon = createComponent({
  react: React,
  tagName: 'ssk-input-addon',
  elementClass: InputAddon,
})

export const SskInputRange = createComponent({
  react: React,
  tagName: 'ssk-input-range',
  elementClass: InputRange,
  events: {
    onChange: 'change',
  },
})

export const SskInputtag = createComponent({
  react: React,
  tagName: 'ssk-input-tag',
  elementClass: Inputtag,
  events: {
    onChange: 'change',
  },
})

export const SskTextarea = createComponent({
  react: React,
  tagName: 'ssk-textarea',
  elementClass: Textarea,
  events: {
    onChange: 'change',
    onInput: 'input',
  },
})

export const SskCheckbox = createComponent({
  react: React,
  tagName: 'ssk-checkbox',
  elementClass: Checkbox,
  events: {
    onChange: 'change',
  },
})

export const SskRadio = createComponent({
  react: React,
  tagName: 'ssk-radio',
  elementClass: Radio,
  events: {
    onChange: 'change',
  },
})

export const SskRadioGroup = createComponent({
  react: React,
  tagName: 'ssk-radio-group',
  elementClass: RadioGroup,
  events: {
    onChange: 'change',
  },
})

export const SskToggle = createComponent({
  react: React,
  tagName: 'ssk-toggle',
  elementClass: Toggle,
  events: {
    onChange: 'change',
  },
})

export const SskDropdown = createComponent({
  react: React,
  tagName: 'ssk-dropdown',
  elementClass: Dropdown,
  events: {
    onChange: 'change',
  },
})

export const SskDropdownButton = createComponent({
  react: React,
  tagName: 'ssk-dropdown-button',
  elementClass: DropdownButton,
})

export const SskDropdownOption = createComponent({
  react: React,
  tagName: 'ssk-dropdown-option',
  elementClass: DropdownOption,
  events: {
    onSelect: 'select',
  },
})

export const SskDropdownPreview = createComponent({
  react: React,
  tagName: 'ssk-dropdown-preview',
  elementClass: DropdownPreview,
})

export const SskPinCode = createComponent({
  react: React,
  tagName: 'ssk-pin-code',
  elementClass: PinCode,
  events: {
    onChange: 'change',
    onComplete: 'complete',
  },
})

export const SskAddonPhoneCountry = createComponent({
  react: React,
  tagName: 'ssk-addon-phone-country',
  elementClass: AddonPhoneCountry,
  events: {
    onChange: 'change',
  },
})

// ─── Overlays ───────────────────────────────────────────────────────────────

export const SskModal = createComponent({
  react: React,
  tagName: 'ssk-modal',
  elementClass: Modal,
  events: {
    onClose: 'close',
  },
})

export const SskDrawer = createComponent({
  react: React,
  tagName: 'ssk-drawer',
  elementClass: Drawer,
  events: {
    onClose: 'close',
  },
})

export const SskDrawerHeader = createComponent({
  react: React,
  tagName: 'ssk-drawer-header',
  elementClass: DrawerHeader,
  events: {
    onClose: 'close',
  },
})

// ─── Navigation ─────────────────────────────────────────────────────────────

export const SskTabs = createComponent({
  react: React,
  tagName: 'ssk-tabs',
  elementClass: Tabs,
  events: {
    onTabChange: 'tab-change',
  },
})

export const SskTabButton = createComponent({
  react: React,
  tagName: 'ssk-tab-button',
  elementClass: TabButton,
})

export const SskTabHeader = createComponent({
  react: React,
  tagName: 'ssk-tab-header',
  elementClass: TabHeader,
})

export const SskAccordion = createComponent({
  react: React,
  tagName: 'ssk-accordion',
  elementClass: Accordion,
})

export const SskAccordionItem = createComponent({
  react: React,
  tagName: 'ssk-accordion-item',
  elementClass: AccordionItem,
})

// ─── Cards ──────────────────────────────────────────────────────────────────

export const SskCard = createComponent({
  react: React,
  tagName: 'ssk-card',
  elementClass: Card,
})

export const SskCardGroup = createComponent({
  react: React,
  tagName: 'ssk-card-group',
  elementClass: CardGroup,
})

export const SskCardSelect = createComponent({
  react: React,
  tagName: 'ssk-card-select',
  elementClass: CardSelect,
  events: {
    onChange: 'change',
  },
})

export const SskExpandableCard = createComponent({
  react: React,
  tagName: 'ssk-expandable-card',
  elementClass: ExpandableCard,
})

// ─── Date & Time ────────────────────────────────────────────────────────────

export const SskDatePicker = createComponent({
  react: React,
  tagName: 'ssk-date-picker',
  elementClass: DatePicker,
  events: {
    onChange: 'change',
  },
})

export const SskRangeDatePicker = createComponent({
  react: React,
  tagName: 'ssk-range-date-picker',
  elementClass: RangeDatePicker,
  events: {
    onChange: 'change',
  },
})

export const SskDateDisplay = createComponent({
  react: React,
  tagName: 'ssk-date-display',
  elementClass: DateDisplay,
})

export const SskTime = createComponent({
  react: React,
  tagName: 'ssk-time',
  elementClass: Time,
})

// ─── Media ──────────────────────────────────────────────────────────────────

export const SskImageCropper = createComponent({
  react: React,
  tagName: 'ssk-image',
  elementClass: ImageCropper,
  events: {
    onCrop: 'crop',
  },
})

// ─── Misc ───────────────────────────────────────────────────────────────────

export const SskLogo = createComponent({
  react: React,
  tagName: 'ssk-logo',
  elementClass: Logo,
})

export const SskStepper = createComponent({
  react: React,
  tagName: 'ssk-stepper',
  elementClass: Stepper,
  events: {
    onChange: 'change',
  },
})
