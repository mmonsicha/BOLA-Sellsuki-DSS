import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LineOAPage } from "@/pages/line-oa/LineOAPage";
import { LineOADetailPage } from "@/pages/line-oa/LineOADetailPage";
import { FollowersPage } from "@/pages/followers/FollowersPage";
import { FollowerDetailPage } from "@/pages/followers/FollowerDetailPage";
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
import { ChatSessionsPage } from "@/pages/ai-chatbot/ChatSessionsPage";
import { ChatSessionDetailPage } from "@/pages/ai-chatbot/ChatSessionDetailPage";
import { KnowledgeBasePage } from "@/pages/knowledge-base/KnowledgeBasePage";
import { UnansweredQuestionsPage } from "@/pages/unanswered-questions/UnansweredQuestionsPage";
import { ChatInboxPage } from "@/pages/chat-inbox/ChatInboxPage";
import { RichMenusPage } from "@/pages/rich-menus/RichMenusPage";
import { RichMenuBuilderPage } from "@/pages/rich-menus/RichMenuBuilderPage";
import { RichMenuAssignmentsPage } from "@/pages/rich-menus/RichMenuAssignmentsPage";
import { QuickRepliesPage } from "@/pages/quick-replies/QuickRepliesPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

// Simple path-based routing (no react-router dependency needed for v1)
function Router() {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean); // e.g. ["line-oa", "abc-123"]

  if (path === "/" || path === "/dashboard") return <DashboardPage />;

  // LINE OA: list vs. detail
  if (segments[0] === "line-oa") {
    if (segments[1]) return <LineOADetailPage />;
    return <LineOAPage />;
  }

  if (path.startsWith("/customers") || segments[0] === "followers") {
    if (segments[1]) return <FollowerDetailPage />;
    return <FollowersPage />;
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

  // 404
  return (
    <AppLayout title="Not Found">
      <Card><CardContent className="py-12 text-center text-muted-foreground">Page not found</CardContent></Card>
    </AppLayout>
  );
}

function App() {
  return <Router />;
}

export default App;
