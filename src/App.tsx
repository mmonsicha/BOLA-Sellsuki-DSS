import React from "react";
import { LoginPage } from "@/pages/auth/LoginPage";
import { AcceptInvitePage } from "@/pages/auth/AcceptInvitePage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { isAuthenticated, isAuthBypassed } from "@/lib/auth";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LineOAPage } from "@/pages/line-oa/LineOAPage";
import { LineOADetailPage } from "@/pages/line-oa/LineOADetailPage";
import { FollowerDetailPage } from "@/pages/followers/FollowerDetailPage";
import { ContactsPage } from "@/pages/customers/CustomersPage";
import { PhoneContactDetailPage } from "@/pages/customers/PhoneContactDetailPage";
import { BroadcastsPage } from "@/pages/broadcasts/BroadcastsPage";
import { BroadcastWizardPage } from "@/pages/broadcasts/BroadcastWizardPage";
import { BroadcastDetailPage } from "@/pages/broadcasts/BroadcastDetailPage";
import { SegmentsPage } from "@/pages/segments/SegmentsPage";
import { SegmentBuilderPage } from "@/pages/segments/SegmentBuilderPage";
import { AutoReplyPage } from "@/pages/auto-reply/AutoReplyPage";
import { AutoPushMessagesPage } from "@/pages/auto-push-messages/AutoPushMessagesPage";
import { AutoPushMessageDetailPage } from "@/pages/auto-push-messages/AutoPushMessageDetailPage";
import { FlexMessagesPage } from "@/pages/flex-messages/FlexMessagesPage";
import { FlexMessageDetailPage } from "@/pages/flex-messages/FlexMessageDetailPage";
import { MediaPage } from "@/pages/media/MediaPage";
import { WebhookPage } from "@/pages/webhook-settings/WebhookPage";
import { WebhookDetailPage } from "@/pages/webhook-settings/WebhookDetailPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { IntegrationGuidePage } from "@/pages/integration/IntegrationGuidePage";
import { ChatbotSettingsPage } from "@/pages/ai-chatbot/ChatbotSettingsPage";
import { ChatbotAnalyticsPage } from "@/pages/ai-chatbot/ChatbotAnalyticsPage";
import { ChatSessionsPage } from "@/pages/ai-chatbot/ChatSessionsPage";
import { ChatSessionDetailPage } from "@/pages/ai-chatbot/ChatSessionDetailPage";
import { KnowledgeBasePage } from "@/pages/knowledge-base/KnowledgeBasePage";
import { UnansweredQuestionsPage } from "@/pages/unanswered-questions/UnansweredQuestionsPage";
import { ChatInboxPage } from "@/pages/chat-inbox/ChatInboxPage";
import { RichMenusPage } from "@/pages/rich-menus/RichMenusPage";
import { RichMenuBuilderPage } from "@/pages/rich-menus/RichMenuBuilderPage";
import { RichMenuAssignmentsPage } from "@/pages/rich-menus/RichMenuAssignmentsPage";
import { QuickRepliesPage } from "@/pages/quick-replies/QuickRepliesPage";
import { LONSubscribersPage } from "@/pages/lon-subscribers/LONSubscribersPage";
import { LONDeliveryLogsPage } from "@/pages/lon-delivery-logs/LONDeliveryLogsPage";
import { MessageLogsPage } from "@/pages/message-logs/MessageLogsPage";
import { LONByPhonePage } from "@/pages/lon-by-phone/LONByPhonePage";
import { LONTemplatesPage } from "@/pages/lon-templates/LONTemplatesPage";
import { LONJobsPage } from "@/pages/lon-jobs/LONJobsPage";
import { LONPublicSubscribePage } from "@/pages/lon-subscribers/LONPublicSubscribePage";
import { RGBConsentPage } from "@/pages/lon/RGBConsentPage";
import { PNPGreetingLIFFPage } from "@/pages/lon-by-phone/PNPGreetingLIFFPage";
import { LIFFDebugPage } from "@/pages/lon-by-phone/LIFFDebugPage";
import { RegistrationFormsPage } from "@/pages/registration-forms/RegistrationFormsPage";
import { RegistrationFormBuilderPage } from "@/pages/registration-forms/RegistrationFormBuilderPage";
import { RegistrationSubmissionsPage } from "@/pages/registration-forms/RegistrationSubmissionsPage";
import { AnalyticsDashboardPage } from "@/pages/analytics/AnalyticsDashboardPage";
import { UserManualPage } from "@/pages/user-manual/UserManualPage";
import { UseCasesPage } from "@/pages/use-cases/UseCasesPage";
import { AdminPerformancePage } from "@/pages/admin-performance/AdminPerformancePage";
import { ReplyTemplatesPage } from "@/pages/admin-performance/ReplyTemplatesPage";
import { AdminsPage } from "@/pages/admins/AdminsPage";
import { AuditLogsPage } from "@/pages/audit-logs/AuditLogsPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ToastProvider } from "@/components/ui/toast";
import { TokenExpiryGuard } from "@/components/auth/TokenExpiryGuard";
import { ChooseWorkspacePage } from "@/pages/auth/ChooseWorkspacePage";
import { getAuthMode } from "@/lib/auth";

function resolveProtectedRoute(path: string, segments: string[]): React.ReactElement {
  if (path === "/" || path === "/dashboard") return <DashboardPage />;

  // LINE OA: list vs. detail
  if (segments[0] === "line-oa") {
    if (segments[1]) return <LineOADetailPage />;
    return <LineOAPage />;
  }

  if (segments[0] === "contacts" && segments[1] === "phone" && segments[2]) {
    return <PhoneContactDetailPage contactId={segments[2]} />;
  }
  if (path.startsWith("/contacts")) {
    return <ContactsPage />;
  }
  if (segments[0] === "followers") {
    if (segments[1]) return <FollowerDetailPage />;
    // Redirect bare /followers to /contacts (ContactsPage is the unified list)
    window.location.href = "/contacts";
    return <ContactsPage />;
  }
  if (segments[0] === "broadcasts") {
    if (segments[1] === "new") return <BroadcastWizardPage />;
    if (segments[1]) return <BroadcastDetailPage />;
    return <BroadcastsPage />;
  }
  if (segments[0] === "segments") {
    if (segments[1] === "new") return <SegmentBuilderPage mode="create" />;
    if (segments[1] && segments[2] === "edit") return <SegmentBuilderPage mode="edit" segmentId={segments[1]} />;
    return <SegmentsPage />;
  }
  if (path.startsWith("/auto-reply")) return <AutoReplyPage />;

  // Auto Push Messages: list vs. detail
  if (segments[0] === "auto-push-messages") {
    if (segments[1]) return <AutoPushMessageDetailPage />;
    return <AutoPushMessagesPage />;
  }

  // Flex Messages: list vs. detail
  if (segments[0] === "flex-messages") {
    if (segments[1]) return <FlexMessageDetailPage />;
    return <FlexMessagesPage />;
  }

  if (path.startsWith("/media")) return <MediaPage />;

  // Webhook Settings: list vs. detail
  if (segments[0] === "webhook-settings") {
    if (segments[1]) return <WebhookDetailPage />;
    return <WebhookPage />;
  }

  if (path.startsWith("/settings")) return <SettingsPage />;
  if (path.startsWith("/integration")) return <IntegrationGuidePage />;

  // AI Chatbot routes
  if (path.startsWith("/chatbot-analytics")) return <ChatbotAnalyticsPage />;
  if (path.startsWith("/chatbot-settings")) return <ChatbotSettingsPage />;
  if (segments[0] === "chat-sessions") {
    if (segments[1]) return <ChatSessionDetailPage />;
    return <ChatSessionsPage />;
  }
  if (path.startsWith("/knowledge-base")) return <KnowledgeBasePage />;
  if (path.startsWith("/unanswered-questions")) return <UnansweredQuestionsPage />;
  if (path.startsWith("/chat-inbox")) return <ChatInboxPage />;

  // Rich Menus
  if (segments[0] === "rich-menus") {
    if (segments[1] === "assignments") return <RichMenuAssignmentsPage />;
    if (segments[1]) return <RichMenuBuilderPage />;
    return <RichMenusPage />;
  }

  // Quick Replies
  if (path.startsWith("/quick-replies")) return <QuickRepliesPage />;

  // LON — authenticated pages
  if (path.startsWith("/lon-subscribers")) return <LONSubscribersPage />;
  if (path.startsWith("/lon-delivery-logs")) return <LONDeliveryLogsPage />;
  if (path.startsWith("/message-logs")) return <MessageLogsPage />;
  if (path.startsWith("/lon-by-phone")) return <LONByPhonePage />;
  if (path.startsWith("/lon-templates")) return <LONTemplatesPage />;
  if (path.startsWith("/lon-jobs")) return <LONJobsPage />;

  // Registration Forms
  if (segments[0] === "registration-forms") {
    if (segments[1] && segments[2] === "submissions") return <RegistrationSubmissionsPage />;
    if (segments[1]) return <RegistrationFormBuilderPage />;
    return <RegistrationFormsPage />;
  }

  // Analytics
  if (path.startsWith("/analytics")) return <AnalyticsDashboardPage />;

  // Admin Performance
  if (path.startsWith("/admin-performance")) return <AdminPerformancePage />;
  if (path.startsWith("/reply-templates")) return <ReplyTemplatesPage />;

  // User Manual
  if (path.startsWith("/user-manual")) return <UserManualPage />;

  // Use Cases
  if (path.startsWith("/use-cases")) return <UseCasesPage />;

  // Team members (admins)
  if (path.startsWith("/admins")) return <AdminsPage />;

  // Audit logs
  if (path.startsWith("/audit-logs")) return <AuditLogsPage />;

  // 404
  return (
    <AppLayout title="Not Found">
      <Card><CardContent className="py-12 text-center text-muted-foreground">Page not found</CardContent></Card>
    </AppLayout>
  );
}

// Simple path-based routing (no react-router dependency needed for v1)
function Router() {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean); // e.g. ["line-oa", "abc-123"]

  // ── Public routes (no auth needed) ───────────────────────────────────────
  if (path === "/login") return <LoginPage />;
  if (path === "/accept-invite") return <AcceptInvitePage />;
  if (path === "/forgot-password") return <ForgotPasswordPage />;
  if (path === "/reset-password") return <ResetPasswordPage />;
  // LON public subscribe page is also public (accessed via QR code from LINE)
  if (path.startsWith("/lon/subscribe/")) return <LONPublicSubscribePage />;
  // RGB LIFF consent page — opened inside LINE via LIFF link
  if (path === "/lon/rgb-consent") return <RGBConsentPage />;
  // PNP Greeting LIFF page — captures LINE UID and resolves greeting token
  if (path.startsWith("/lon/greeting")) return <PNPGreetingLIFFPage />;
  // LIFF Debug page — step-by-step manual test page (dev only)
  if (path.startsWith("/lon/liff-debug")) return <LIFFDebugPage />;
  // Kratos mode: workspace chooser (public — Kratos session already proves identity)
  if (path === "/choose-workspace") return <ChooseWorkspacePage />;

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!isAuthenticated()) {
    if (getAuthMode() === "kratos") {
      // Redirect to Kratos login flow — /self-service/login/browser creates
      // a fresh flow. If the user already has a valid session, Kratos skips
      // the form and redirects back immediately.
      const accountsBase = import.meta.env.VITE_KRATOS_ACCOUNTS_URL || "https://accounts.sellsuki.local";
      const returnTo = encodeURIComponent(window.location.origin + "/choose-workspace");
      window.location.replace(`${accountsBase}/self-service/login/browser?return_to=${returnTo}`);
    } else {
      window.location.replace("/login");
    }
    return null;
  }

  return (
    <>
      {/* TokenExpiryGuard only applies in local_jwt mode (Kratos uses session cookies) */}
      {getAuthMode() === "local_jwt" && !isAuthBypassed() && <TokenExpiryGuard />}
      {resolveProtectedRoute(path, segments)}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router />
    </ToastProvider>
  );
}

export default App;
