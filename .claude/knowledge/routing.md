# Routing

## Router Implementation

`src/App.tsx` implements a **custom client-side router** — NO react-router-dom.

Routing is based on `window.location.pathname` string matching. No route config array — routes are resolved imperatively.

```
App
└── ToastProvider
    └── Router
        ├── Public routes (no auth check)
        │   ├── /login → LoginPage
        │   ├── /accept-invite → AcceptInvitePage
        │   ├── /forgot-password → ForgotPasswordPage
        │   ├── /reset-password → ResetPasswordPage
        │   ├── /lon/subscribe/:token → LONPublicSubscribePage
        │   ├── /lon/rgb-consent → RGBConsentPage
        │   └── /choose-workspace → ChooseWorkspacePage
        └── Protected routes (isAuthenticated() check)
            └── resolveProtectedRoute(path, segments)
                └── ... (see route table below)
```

## Auth Check

```typescript
if (!isAuthenticated()) {
  if (getAuthMode() === "kratos") {
    window.location.replace("/choose-workspace");
  } else {
    window.location.replace("/login");
  }
  return null;
}
```

`isAuthenticated()` checks for `bola_token` in localStorage.

## Protected Route Table

| Path pattern | Component |
|-------------|-----------|
| `/` or `/dashboard` | `DashboardPage` |
| `/line-oa` | `LineOAPage` |
| `/line-oa/:id` | `LineOADetailPage` |
| `/contacts` | `ContactsPage` (followers + phone-only tabs) |
| `/contacts/phone/:id` | `PhoneContactDetailPage` — phone contact detail with linked OAs |
| `/customers` or `/followers` | `FollowersPage` |
| `/followers/:id` | `FollowerDetailPage` |
| `/broadcasts` | `BroadcastsPage` |
| `/broadcasts/new` | `BroadcastWizardPage` |
| `/broadcasts/:id` | `BroadcastDetailPage` |
| `/segments` | `SegmentsPage` |
| `/segments/new` | `SegmentBuilderPage mode="create"` |
| `/segments/:id/edit` | `SegmentBuilderPage mode="edit"` |
| `/auto-reply` | `AutoReplyPage` |
| `/auto-push-messages` | `AutoPushMessagesPage` |
| `/auto-push-messages/:id` | `AutoPushMessageDetailPage` |
| `/flex-messages` | `FlexMessagesPage` |
| `/flex-messages/:id` | `FlexMessageDetailPage` |
| `/media` | `MediaPage` |
| `/webhook-settings` | `WebhookPage` |
| `/webhook-settings/:id` | `WebhookDetailPage` |
| `/settings` | `SettingsPage` |
| `/integration` | `IntegrationGuidePage` |
| `/chatbot-analytics` | `ChatbotAnalyticsPage` |
| `/chatbot-settings` | `ChatbotSettingsPage` |
| `/chat-sessions` | `ChatSessionsPage` |
| `/chat-sessions/:id` | `ChatSessionDetailPage` |
| `/knowledge-base` | `KnowledgeBasePage` |
| `/unanswered-questions` | `UnansweredQuestionsPage` |
| `/chat-inbox` | `ChatInboxPage` |
| `/rich-menus` | `RichMenusPage` |
| `/rich-menus/assignments` | `RichMenuAssignmentsPage` |
| `/rich-menus/:id` | `RichMenuBuilderPage` |
| `/quick-replies` | `QuickRepliesPage` |
| `/lon-subscribers` | `LONSubscribersPage` |
| `/lon-delivery-logs` | `LONDeliveryLogsPage` |
| `/lon-by-phone` | `LONByPhonePage` |
| `/lon-templates` | `LONTemplatesPage` |
| `/registration-forms` | `RegistrationFormsPage` |
| `/registration-forms/:id` | `RegistrationFormBuilderPage` |
| `/registration-forms/:id/submissions` | `RegistrationSubmissionsPage` |
| `/analytics` | `AnalyticsDashboardPage` |
| `/admin-performance` | `AdminPerformancePage` |
| `/reply-templates` | `ReplyTemplatesPage` |
| `/user-manual` | `UserManualPage` |
| `/use-cases` | `UseCasesPage` |
| `/admins` | `AdminsPage` |
| `/audit-logs` | `AuditLogsPage` |
| (unmatched) | 404 card in AppLayout |

## Navigation

Navigation is done via `window.location.href = "/path"` or `window.location.replace("/path")`.  
There is NO `<Link>` component or programmatic push — direct location assignment only.

## Page Directory Structure

Pages live in `src/pages/<domain>/`. Each domain directory contains one or more page components.

```
src/pages/
├── auth/              LoginPage, AcceptInvitePage, ForgotPasswordPage, ResetPasswordPage, ChooseWorkspacePage
├── dashboard/         DashboardPage
├── line-oa/           LineOAPage, LineOADetailPage
├── followers/         FollowersPage, FollowerDetailPage
├── broadcasts/        BroadcastsPage, BroadcastWizardPage, BroadcastDetailPage
├── segments/          SegmentsPage, SegmentBuilderPage
├── auto-reply/        AutoReplyPage
├── auto-push-messages/ AutoPushMessagesPage, AutoPushMessageDetailPage
├── flex-messages/     FlexMessagesPage, FlexMessageDetailPage
├── media/             MediaPage
├── webhook-settings/  WebhookPage, WebhookDetailPage
├── settings/          SettingsPage
├── integration/       IntegrationGuidePage
├── ai-chatbot/        ChatbotSettingsPage, ChatbotAnalyticsPage, ChatSessionsPage, ChatSessionDetailPage
├── knowledge-base/    KnowledgeBasePage
├── unanswered-questions/ UnansweredQuestionsPage
├── chat-inbox/        ChatInboxPage
├── rich-menus/        RichMenusPage, RichMenuBuilderPage, RichMenuAssignmentsPage
├── quick-replies/     QuickRepliesPage
├── lon-subscribers/   LONSubscribersPage, LONPublicSubscribePage
├── lon-delivery-logs/ LONDeliveryLogsPage
├── lon-by-phone/      LONByPhonePage
├── lon-templates/     LONTemplatesPage
├── lon/               RGBConsentPage
├── registration-forms/ RegistrationFormsPage, RegistrationFormBuilderPage, RegistrationSubmissionsPage
├── analytics/         AnalyticsDashboardPage
├── admin-performance/ AdminPerformancePage, ReplyTemplatesPage
├── user-manual/       UserManualPage
├── use-cases/         UseCasesPage
├── admins/            AdminsPage
└── audit-logs/        AuditLogsPage
```

## Adding a New Route

1. Create the page component in `src/pages/<domain>/<PageName>.tsx`
2. Import it at the top of `src/App.tsx`
3. Add a branch in `resolveProtectedRoute()` (or public route block if unauthenticated)
4. Use `window.location.href` for navigation to the new route
5. Update `knowledge/routing.md`
