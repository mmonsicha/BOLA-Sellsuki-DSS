import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, MessageCircle, Bell, Users, Settings } from "lucide-react";

type Category = "marketing" | "communication" | "notification" | "crm" | "internal";

interface UseCase {
  id: string;
  category: Category;
  icon: string;
  title: string;
  description: string;
  industries: string[];
  setupTime: string;
  metric: string;
  bolaFeature: string;
  href: string;
}

const USE_CASES: UseCase[] = [
  // Marketing
  {
    id: "flash-sale",
    category: "marketing",
    icon: "⚡",
    title: "Flash Sale Campaign",
    description: "Segment VIP customers → Flex Message with countdown timer → auto follow-up to non-openers after 2h.",
    industries: ["Retail", "E-commerce", "FMCG"],
    setupTime: "15 min",
    metric: "ROI 4–8×",
    bolaFeature: "Broadcasts + Segments",
    href: "/broadcasts/new",
  },
  {
    id: "product-launch",
    category: "marketing",
    icon: "🚀",
    title: "Product Launch Carousel",
    description: "Rich Flex Message carousel with product images, pricing, and Buy Now button. Schedule 3 days before launch.",
    industries: ["Beauty", "Electronics", "Fashion"],
    setupTime: "20 min",
    metric: "Engagement +60%",
    bolaFeature: "Flex Messages + Broadcasts",
    href: "/flex-messages",
  },
  {
    id: "loyalty-alert",
    category: "marketing",
    icon: "🏆",
    title: "Loyalty Reward Alert",
    description: "Notify when points are earned, near expiry, or when customer reaches a new tier. Personalized per customer.",
    industries: ["Retail", "Coffee shops", "Airlines"],
    setupTime: "30 min",
    metric: "Retention +35%",
    bolaFeature: "Auto Push Messages",
    href: "/auto-push-messages",
  },
  {
    id: "abandoned-cart",
    category: "marketing",
    icon: "🛒",
    title: "Abandoned Cart Recovery",
    description: "Webhook triggers 30min after abandonment. Send item reminder + discount. Auto-expire after 24h.",
    industries: ["E-commerce", "Fashion", "Electronics"],
    setupTime: "45 min",
    metric: "Recovery 15–25%",
    bolaFeature: "Auto Push Messages + Webhook",
    href: "/auto-push-messages",
  },
  {
    id: "qr-capture",
    category: "marketing",
    icon: "📱",
    title: "QR Code Subscriber Capture",
    description: "Generate QR code for in-store. Scan → follow OA → instant welcome offer. Track by location.",
    industries: ["Retail", "Events", "Restaurants"],
    setupTime: "10 min",
    metric: "Acquisition tool",
    bolaFeature: "LINE OA",
    href: "/line-oa",
  },
  {
    id: "birthday-campaign",
    category: "marketing",
    icon: "🎂",
    title: "Birthday Special",
    description: "Auto-send personalized birthday message with exclusive coupon on customer's birthday. Set and forget.",
    industries: ["All verticals", "Membership"],
    setupTime: "15 min",
    metric: "Open rate 85%",
    bolaFeature: "Auto Push Messages",
    href: "/auto-push-messages",
  },
  // Communication
  {
    id: "ai-faq-bot",
    category: "communication",
    icon: "🤖",
    title: "AI-Powered FAQ Bot",
    description: "Auto-reply with AI handles common questions 24/7. Escalate complex queries to human agent with full context.",
    industries: ["Customer support", "Banking", "Telecom"],
    setupTime: "1 hour",
    metric: "80% deflection",
    bolaFeature: "AI Chatbot + Auto Reply",
    href: "/chatbot-settings",
  },
  {
    id: "appointment-reminder",
    category: "communication",
    icon: "📅",
    title: "Appointment Reminder Flow",
    description: "Confirm booking → reminder 24h before → 1h before. Quick Reply: Confirm / Reschedule / Cancel.",
    industries: ["Healthcare", "Beauty salons", "Clinics"],
    setupTime: "20 min",
    metric: "No-show -40%",
    bolaFeature: "Auto Push Messages + Quick Replies",
    href: "/auto-push-messages",
  },
  {
    id: "welcome-onboarding",
    category: "communication",
    icon: "👋",
    title: "Onboarding Welcome Flow",
    description: "Auto-greet new followers with Rich Menu, quick start guide, and first-timer coupon.",
    industries: ["All verticals"],
    setupTime: "15 min",
    metric: "Conversion +28%",
    bolaFeature: "Auto Reply + Rich Menu",
    href: "/auto-reply",
  },
  {
    id: "order-tracking",
    category: "communication",
    icon: "📦",
    title: "Order Tracking Updates",
    description: "Real-time order status via LINE. Packed → Shipped → Out for delivery → Delivered with photo confirmation.",
    industries: ["E-commerce", "Logistics", "Food delivery"],
    setupTime: "30 min",
    metric: "CSAT +4.2/5",
    bolaFeature: "Auto Push Messages",
    href: "/auto-push-messages",
  },
  {
    id: "rich-menu",
    category: "communication",
    icon: "🗺",
    title: "Smart Rich Menu",
    description: "Persistent bottom menu with 6 tap zones. Personalized per segment: VIP sees different options.",
    industries: ["Banking", "Retail", "Insurance"],
    setupTime: "25 min",
    metric: "Self-serve +50%",
    bolaFeature: "Rich Menus",
    href: "/rich-menus",
  },
  {
    id: "group-broadcast",
    category: "communication",
    icon: "👥",
    title: "LINE Group Broadcast",
    description: "Send structured updates to LINE Group Chats. Perfect for franchise networks and team announcements.",
    industries: ["Franchise", "Community", "Teams"],
    setupTime: "10 min",
    metric: "Reach ×10",
    bolaFeature: "Broadcasts",
    href: "/broadcasts",
  },
  // Notification
  {
    id: "transaction-alert",
    category: "notification",
    icon: "💳",
    title: "Transaction Alert (LON)",
    description: "Push payment confirmation, receipt, and fraud alerts via LINE Notification Messaging — no OA follow required.",
    industries: ["FinTech", "Banking", "Insurance"],
    setupTime: "30 min",
    metric: "No follow needed",
    bolaFeature: "LON Subscribers",
    href: "/lon-subscribers",
  },
  {
    id: "shipment-tracking",
    category: "notification",
    icon: "🚚",
    title: "Shipment Tracking Push",
    description: "Webhook from logistics API → instant LINE push at each status change. No app download required.",
    industries: ["Kerry", "Flash Express", "J&T"],
    setupTime: "45 min",
    metric: "CSAT +45%",
    bolaFeature: "Auto Push Messages",
    href: "/auto-push-messages",
  },
  {
    id: "medication-reminder",
    category: "notification",
    icon: "💊",
    title: "Medication Reminder",
    description: "Scheduled daily reminders per patient. Doctor sets schedule, patient receives via LINE. Tap to confirm taken.",
    industries: ["Hospitals", "Pharmacies", "Clinics"],
    setupTime: "20 min",
    metric: "Adherence +60%",
    bolaFeature: "Auto Push Messages",
    href: "/auto-push-messages",
  },
  {
    id: "service-outage",
    category: "notification",
    icon: "🚨",
    title: "Service Outage Alert",
    description: "Auto-push to subscribers during maintenance or service disruption. Include ETA and status page link.",
    industries: ["SaaS", "Telecom", "ISP"],
    setupTime: "15 min",
    metric: "MTTD -70%",
    bolaFeature: "Broadcasts + LON",
    href: "/broadcasts",
  },
  {
    id: "event-countdown",
    category: "notification",
    icon: "🎪",
    title: "Event Countdown Series",
    description: "T-7 days, T-1 day, T-1 hour nudge series for webinars, concerts, product launches.",
    industries: ["Events", "Webinars", "Entertainment"],
    setupTime: "20 min",
    metric: "Attendance +30%",
    bolaFeature: "Broadcasts (scheduled)",
    href: "/broadcasts/new",
  },
  {
    id: "bulk-csv",
    category: "notification",
    icon: "📋",
    title: "Bulk Phone CSV Push (LON)",
    description: "Upload CSV of phone numbers → BOLA matches to LINE users → batch push. No OA follow required.",
    industries: ["Utilities", "Government", "HR/Payroll"],
    setupTime: "10 min",
    metric: "Scale to 100k",
    bolaFeature: "LON by Phone",
    href: "/lon-by-phone",
  },
  // CRM
  {
    id: "segmentation",
    category: "crm",
    icon: "🎯",
    title: "Smart Customer Segmentation",
    description: "Filter followers by purchase frequency, last active, location, tags. Build RFM segments for precision campaigns.",
    industries: ["Retail CRM", "D2C brands"],
    setupTime: "20 min",
    metric: "Conversion +55%",
    bolaFeature: "Segments",
    href: "/segments",
  },
  {
    id: "vip-journey",
    category: "crm",
    icon: "👑",
    title: "VIP Customer Journey",
    description: "Auto-tag customers as VIP when spend crosses threshold. Trigger personalized Rich Menu and exclusive early access.",
    industries: ["Luxury retail", "Premium services"],
    setupTime: "30 min",
    metric: "LTV 3×",
    bolaFeature: "Segments + Rich Menu",
    href: "/segments",
  },
  {
    id: "win-back",
    category: "crm",
    icon: "🔄",
    title: "Dormant Customer Win-Back",
    description: "Identify customers inactive 90+ days. Send 'We miss you' campaign with special offer.",
    industries: ["Subscription", "Retail"],
    setupTime: "25 min",
    metric: "Win-back 18%",
    bolaFeature: "Segments + Broadcasts",
    href: "/segments",
  },
  {
    id: "nps-survey",
    category: "crm",
    icon: "⭐",
    title: "Post-Purchase NPS Survey",
    description: "3 days after delivery → LINE message with 1-tap rating. Route detractors to support, promoters to review page.",
    industries: ["E-commerce", "Services"],
    setupTime: "15 min",
    metric: "Response rate 45%",
    bolaFeature: "Auto Push Messages + Quick Replies",
    href: "/auto-push-messages",
  },
  {
    id: "lead-routing",
    category: "crm",
    icon: "📞",
    title: "Sales Lead Routing",
    description: "Customer inquiry via LINE → AI qualifies intent → routed to correct sales OA with conversation history.",
    industries: ["Real estate", "Auto dealers", "Insurance"],
    setupTime: "1 hour",
    metric: "Lead speed -80%",
    bolaFeature: "AI Chatbot + Chat Inbox",
    href: "/chat-inbox",
  },
  {
    id: "profile-enrichment",
    category: "crm",
    icon: "📊",
    title: "Progressive Profile Enrichment",
    description: "Ask 1 question per week via LINE. Build customer preferences over time for personalized messaging.",
    industries: ["Beauty", "Fashion", "Fitness"],
    setupTime: "25 min",
    metric: "Data quality +70%",
    bolaFeature: "Auto Reply + Registration Forms",
    href: "/registration-forms",
  },
  // Internal
  {
    id: "server-alert",
    category: "internal",
    icon: "🖥",
    title: "Server Monitoring Alert",
    description: "Grafana/Datadog webhook → LINE Group alert with severity, metrics snapshot, and runbook link.",
    industries: ["DevOps", "SRE", "IT teams"],
    setupTime: "20 min",
    metric: "MTTR -55%",
    bolaFeature: "Webhook Settings + Broadcasts",
    href: "/webhook-settings",
  },
  {
    id: "approval-workflow",
    category: "internal",
    icon: "✅",
    title: "Approval Workflow via LINE",
    description: "Leave / purchase order submitted → manager gets LINE message → Approve or Reject inline. No login required.",
    industries: ["HR", "Finance", "Operations"],
    setupTime: "30 min",
    metric: "Cycle time -60%",
    bolaFeature: "Auto Push Messages + Quick Replies",
    href: "/auto-push-messages",
  },
  {
    id: "daily-report",
    category: "internal",
    icon: "📈",
    title: "Daily Sales Report Push",
    description: "8am every day: auto-push revenue summary, top SKUs, vs yesterday to management LINE Group.",
    industries: ["Retail chain", "Sales teams"],
    setupTime: "30 min",
    metric: "Decision speed +40%",
    bolaFeature: "Auto Push Messages (scheduled)",
    href: "/auto-push-messages",
  },
  {
    id: "hr-notification",
    category: "internal",
    icon: "💼",
    title: "HR & Payroll Notification",
    description: "Payslip available → LINE push. Company announcement → broadcast to all staff. Shift schedule → individual push.",
    industries: ["Manufacturing", "Retail staff", "Blue collar"],
    setupTime: "20 min",
    metric: "HR efficiency",
    bolaFeature: "Broadcasts + LON",
    href: "/broadcasts",
  },
  {
    id: "low-stock",
    category: "internal",
    icon: "📦",
    title: "Low Stock Alert",
    description: "ERP webhook when SKU reaches reorder point → LINE push to purchasing team with recommended PO quantity.",
    industries: ["Retail", "Warehouse", "Manufacturing"],
    setupTime: "25 min",
    metric: "Stockout -35%",
    bolaFeature: "Webhook Settings",
    href: "/webhook-settings",
  },
  {
    id: "franchise-checklist",
    category: "internal",
    icon: "🏪",
    title: "Franchise Daily Checklist",
    description: "Each branch confirms opening checklist via LINE Bot. HQ gets real-time compliance dashboard.",
    industries: ["Restaurant chains", "Convenience", "Gas stations"],
    setupTime: "45 min",
    metric: "Compliance +45%",
    bolaFeature: "AI Chatbot + Registration Forms",
    href: "/chatbot-settings",
  },
];

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; count: number }[] = [
  { id: "marketing", label: "Marketing", icon: Zap, count: USE_CASES.filter((u) => u.category === "marketing").length },
  { id: "communication", label: "Communication", icon: MessageCircle, count: USE_CASES.filter((u) => u.category === "communication").length },
  { id: "notification", label: "Notification", icon: Bell, count: USE_CASES.filter((u) => u.category === "notification").length },
  { id: "crm", label: "CRM", icon: Users, count: USE_CASES.filter((u) => u.category === "crm").length },
  { id: "internal", label: "Internal Ops", icon: Settings, count: USE_CASES.filter((u) => u.category === "internal").length },
];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  marketing: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  communication: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  notification: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  crm: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  internal: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

export function UseCasesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("marketing");

  const filtered = USE_CASES.filter((u) => u.category === activeCategory);
  const colors = CATEGORY_COLORS[activeCategory];

  return (
    <AppLayout title="Use Case Templates">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Use Case Templates</h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-world LINE API playbooks — pick one to jump straight to the right BOLA feature.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "LINE open rate", value: "98%" },
          { label: "vs email CTR", value: "3×" },
          { label: "LINE users in TH", value: "95M" },
          { label: "Templates", value: `${USE_CASES.length}` },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const c = CATEGORY_COLORS[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? `${c.bg} ${c.text} border ${c.border} shadow-sm`
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? c.bg : "bg-gray-100 text-gray-400"}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((uc) => (
          <Card
            key={uc.id}
            className="border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            onClick={() => { window.location.href = uc.href; }}
          >
            <CardContent className="p-5">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                  {uc.icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                    {uc.bolaFeature}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{uc.metric}</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-green-700 transition-colors">
                {uc.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{uc.description}</p>

              {/* Industries */}
              <div className="flex flex-wrap gap-1 mb-4">
                {uc.industries.map((ind) => (
                  <span key={ind} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                    {ind}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">⏱ {uc.setupTime} setup</span>
                <span className="text-xs font-semibold text-green-700 group-hover:underline">
                  Go to {uc.bolaFeature.split(" ")[0]} →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
