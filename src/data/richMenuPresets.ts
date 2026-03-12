// Rich Menu Preset Templates
// Used by the Template Gallery (create flow) and Block Layout Picker (builder quick-start).

export interface PresetAreaDef {
  xPct: number;  // 0.0–1.0, fraction of canvas width
  yPct: number;  // 0.0–1.0, fraction of canvas height
  wPct: number;
  hPct: number;
  label: string; // button label / area name
}

export interface PresetPageDef {
  areas: PresetAreaDef[];
}

export type PresetSizeType = "large" | "compact";

export type PresetCategory =
  | "general"
  | "ecommerce"
  | "restaurant"
  | "services"
  | "support"
  | "blank";

export interface RichMenuPreset {
  id: string;
  name: string;
  description: string;    // one-line use case description
  useCaseGuide: string;   // expanded guide shown in the gallery
  category: PresetCategory;
  sizeType: PresetSizeType;
  chatBarText: string;
  pages: PresetPageDef[];
}

// ---- Coordinate Utility ----
const LINE_LARGE_W = 2500;
const LINE_LARGE_H = 1686;
const LINE_COMPACT_H = 843;

/**
 * Converts percentage-based preset area coordinates to LINE pixel coordinates.
 * For 3-column equal-width layouts the last column may be 1px wider due to rounding;
 * LINE API accepts this without error.
 */
export function pctToLineArea(
  area: PresetAreaDef,
  sizeType: PresetSizeType,
): { x: number; y: number; width: number; height: number } {
  const lineH = sizeType === "compact" ? LINE_COMPACT_H : LINE_LARGE_H;
  return {
    x:      Math.round(area.xPct * LINE_LARGE_W),
    y:      Math.round(area.yPct * lineH),
    width:  Math.round(area.wPct * LINE_LARGE_W),
    height: Math.round(area.hPct * lineH),
  };
}

// ---- Preset Definitions ----

export const richMenuPresets: RichMenuPreset[] = [
  // ── General: Large ──────────────────────────────────────────────────────────
  {
    id: "large-6block",
    name: "6 Blocks (2×3)",
    description: "Classic 6-button grid — the most popular LINE rich menu layout",
    useCaseGuide:
      "The 2-row × 3-column grid is the standard LINE rich menu layout used by thousands of OAs. " +
      "Each of the 6 equally-sized blocks gets one action. Perfect when you need to offer several options at a glance — e.g. promotions, product catalog, customer service, store locator, LINE LIFF, and contact.",
    category: "general",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,       yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Area 1" },
        { xPct: 1/3,     yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Area 2" },
        { xPct: 2/3,     yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Area 3" },
        { xPct: 0,       yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Area 4" },
        { xPct: 1/3,     yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Area 5" },
        { xPct: 2/3,     yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Area 6" },
      ],
    }],
  },
  {
    id: "large-4block",
    name: "4 Blocks (2×2)",
    description: "Clean 4-button layout with larger tap areas",
    useCaseGuide:
      "Four large equal blocks work well when you have 4 key actions and want each button to be easy to tap. " +
      "Great for menus that only need core shortcuts: e.g. Browse, Cart, Orders, Support. The bigger touch targets reduce mis-taps on mobile.",
    category: "general",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,   yPct: 0,   wPct: 0.5, hPct: 0.5, label: "Area 1" },
        { xPct: 0.5, yPct: 0,   wPct: 0.5, hPct: 0.5, label: "Area 2" },
        { xPct: 0,   yPct: 0.5, wPct: 0.5, hPct: 0.5, label: "Area 3" },
        { xPct: 0.5, yPct: 0.5, wPct: 0.5, hPct: 0.5, label: "Area 4" },
      ],
    }],
  },
  {
    id: "large-wide-3",
    name: "3 Wide Columns",
    description: "3 tall equal columns spanning the full menu height",
    useCaseGuide:
      "Three tall columns give each button strong visual weight. " +
      "Ideal for menus where the background image is designed with 3 distinct vertical sections — e.g. a restaurant showing food, drink, and dessert categories side-by-side.",
    category: "general",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0, wPct: 1/3, hPct: 1, label: "Area 1" },
        { xPct: 1/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Area 2" },
        { xPct: 2/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Area 3" },
      ],
    }],
  },
  {
    id: "large-2block",
    name: "2 Blocks",
    description: "Two side-by-side wide buttons — perfect for binary choices",
    useCaseGuide:
      "Two large buttons work well for simple binary CTAs: e.g. 'View Products' vs 'Get Support', or 'Register' vs 'Check Status'. " +
      "The spacious layout makes both actions unmissable and reduces choice fatigue.",
    category: "general",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,   yPct: 0, wPct: 0.5, hPct: 1, label: "Area 1" },
        { xPct: 0.5, yPct: 0, wPct: 0.5, hPct: 1, label: "Area 2" },
      ],
    }],
  },
  {
    id: "large-1block",
    name: "Full Width",
    description: "Single full-canvas action — maximum impact for one CTA",
    useCaseGuide:
      "Use a single full-area block for campaigns where you want every follower to click one thing only. " +
      "Perfect for limited-time promotions, event registrations, or a single deep-link into your LIFF app.",
    category: "general",
    sizeType: "large",
    chatBarText: "Tap to open",
    pages: [{
      areas: [
        { xPct: 0, yPct: 0, wPct: 1, hPct: 1, label: "Area 1" },
      ],
    }],
  },
  {
    id: "large-3top-2bottom",
    name: "3 Top + 2 Bottom",
    description: "3 equal blocks on top row + 2 wide blocks on bottom row",
    useCaseGuide:
      "This asymmetric layout highlights two primary actions at the bottom while providing three secondary links above. " +
      "For example: top row = News, Blog, Gallery; bottom row = Shop Now, Contact Us. The wider bottom buttons draw the eye to your most important CTAs.",
    category: "general",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0,   wPct: 1/3, hPct: 0.6, label: "Area 1" },
        { xPct: 1/3,  yPct: 0,   wPct: 1/3, hPct: 0.6, label: "Area 2" },
        { xPct: 2/3,  yPct: 0,   wPct: 1/3, hPct: 0.6, label: "Area 3" },
        { xPct: 0,    yPct: 0.6, wPct: 0.5, hPct: 0.4, label: "Area 4" },
        { xPct: 0.5,  yPct: 0.6, wPct: 0.5, hPct: 0.4, label: "Area 5" },
      ],
    }],
  },

  // ── E-commerce: Large ────────────────────────────────────────────────────────
  {
    id: "large-ecommerce-6",
    name: "E-commerce",
    description: "Product catalog, cart, orders, promotions, support, contact",
    useCaseGuide:
      "Designed for online shops on LINE OA. The 6 buttons cover the full purchase journey: " +
      "Products → browse catalog or LIFF shop, Cart → deep-link to shopping cart, Orders → order tracking, " +
      "Promotions → current deals & coupons, Support → live chat or FAQ, Contact → phone/store location. " +
      "Connect each button to your LINE LIFF app or a URL for maximum conversion.",
    category: "ecommerce",
    sizeType: "large",
    chatBarText: "Shop Menu",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Products" },
        { xPct: 1/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Cart" },
        { xPct: 2/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Orders" },
        { xPct: 0,    yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Promotions" },
        { xPct: 1/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Support" },
        { xPct: 2/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Contact" },
      ],
    }],
  },

  // ── Restaurant: Large ────────────────────────────────────────────────────────
  {
    id: "large-restaurant-6",
    name: "Restaurant",
    description: "Menu, order online, reservations, promotions, location, contact",
    useCaseGuide:
      "Built for food & beverage businesses. " +
      "Menu → link to digital menu (PDF or LIFF), Order Now → online delivery/takeaway, " +
      "Reserve → table reservation form, Promotions → today's specials or discount coupons, " +
      "Location → Google Maps or in-app map, Contact → phone number or line chat. " +
      "Pair with a visually rich background image of your signature dish for maximum appetite appeal.",
    category: "restaurant",
    sizeType: "large",
    chatBarText: "Restaurant Menu",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Menu" },
        { xPct: 1/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Order Now" },
        { xPct: 2/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Reserve" },
        { xPct: 0,    yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Promotions" },
        { xPct: 1/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Location" },
        { xPct: 2/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Contact" },
      ],
    }],
  },

  // ── Services / Appointments: Large ──────────────────────────────────────────
  {
    id: "large-services-6",
    name: "Appointments",
    description: "Book now, my appointments, services, promotions, FAQ, contact",
    useCaseGuide:
      "Ideal for clinics, salons, spas, tutoring centres, and any appointment-based business. " +
      "Book Now → LIFF booking form, My Appointments → view/cancel bookings, Services → service catalog with pricing, " +
      "Promotions → package deals & seasonal offers, FAQ → common questions, Contact → address & phone. " +
      "Tip: connect 'Book Now' to a LIFF form so customers can book without leaving LINE.",
    category: "services",
    sizeType: "large",
    chatBarText: "Book & Services",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Book Now" },
        { xPct: 1/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "My Appts" },
        { xPct: 2/3,  yPct: 0,   wPct: 1/3, hPct: 0.5, label: "Services" },
        { xPct: 0,    yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Promotions" },
        { xPct: 1/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "FAQ" },
        { xPct: 2/3,  yPct: 0.5, wPct: 1/3, hPct: 0.5, label: "Contact" },
      ],
    }],
  },

  // ── Support: Large ───────────────────────────────────────────────────────────
  {
    id: "large-support-4",
    name: "Support Center",
    description: "FAQ, live chat, order status, contact — clean 4-button layout",
    useCaseGuide:
      "For brands where most followers need post-purchase support. " +
      "FAQ → self-service knowledge base, Live Chat → triggers a live agent conversation, " +
      "Order Status → order tracking LIFF or URL, Contact → all contact channels. " +
      "The 4-block layout gives each action breathing room, reducing the chance of tapping the wrong button when frustrated.",
    category: "support",
    sizeType: "large",
    chatBarText: "Support",
    pages: [{
      areas: [
        { xPct: 0,   yPct: 0,   wPct: 0.5, hPct: 0.5, label: "FAQ" },
        { xPct: 0.5, yPct: 0,   wPct: 0.5, hPct: 0.5, label: "Live Chat" },
        { xPct: 0,   yPct: 0.5, wPct: 0.5, hPct: 0.5, label: "Order Status" },
        { xPct: 0.5, yPct: 0.5, wPct: 0.5, hPct: 0.5, label: "Contact" },
      ],
    }],
  },

  // ── Blank: Large ─────────────────────────────────────────────────────────────
  {
    id: "large-blank",
    name: "Blank Canvas",
    description: "Start from scratch with a large (2500×1686) canvas",
    useCaseGuide:
      "Choose this if you have a custom design in mind and want to draw areas freely. " +
      "Upload your background image first, then use 'Draw Area' or the Quick Start panel in the builder to place tap zones exactly where you need them.",
    category: "blank",
    sizeType: "large",
    chatBarText: "Menu",
    pages: [{ areas: [] }],
  },

  // ── General: Compact ─────────────────────────────────────────────────────────
  {
    id: "compact-3block",
    name: "3 Blocks",
    description: "Classic compact layout — 3 equal buttons in one row",
    useCaseGuide:
      "The standard compact rich menu: half the height of large (843 px), so it takes less screen space in the chat. " +
      "Three equal buttons give a clean, uncluttered look. Best when you have exactly 3 key actions and want to leave more room for the chat conversation.",
    category: "general",
    sizeType: "compact",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0, wPct: 1/3, hPct: 1, label: "Area 1" },
        { xPct: 1/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Area 2" },
        { xPct: 2/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Area 3" },
      ],
    }],
  },
  {
    id: "compact-2block",
    name: "2 Blocks",
    description: "Two wide buttons — simple and highly visible",
    useCaseGuide:
      "Two large compact buttons are ideal for driving a single clear decision. " +
      "Use this when you have one primary action and one secondary: e.g. 'Shop Now' and 'Get Support'. " +
      "The compact height keeps the chat conversation visible above the menu.",
    category: "general",
    sizeType: "compact",
    chatBarText: "Menu",
    pages: [{
      areas: [
        { xPct: 0,   yPct: 0, wPct: 0.5, hPct: 1, label: "Area 1" },
        { xPct: 0.5, yPct: 0, wPct: 0.5, hPct: 1, label: "Area 2" },
      ],
    }],
  },
  {
    id: "compact-1block",
    name: "Full Width",
    description: "Single full-width compact button — one unmissable CTA",
    useCaseGuide:
      "Maximum emphasis on one action without the full height of a large menu. " +
      "Great for campaign-specific menus where every follower should tap one thing: " +
      "e.g. 'Register for our event', 'Claim your coupon', or 'View today's flash sale'.",
    category: "general",
    sizeType: "compact",
    chatBarText: "Tap here",
    pages: [{
      areas: [
        { xPct: 0, yPct: 0, wPct: 1, hPct: 1, label: "Area 1" },
      ],
    }],
  },

  // ── E-commerce: Compact ──────────────────────────────────────────────────────
  {
    id: "compact-ecommerce-3",
    name: "E-commerce",
    description: "Shop, cart, and orders in a compact 3-button layout",
    useCaseGuide:
      "A compact 3-button shop menu keeps the essential purchase journey accessible without dominating the chat screen. " +
      "Shop → product catalog or LIFF store, Cart → shopping cart, Orders → order tracking. " +
      "Ideal for stores where customers frequently check back on their orders mid-conversation.",
    category: "ecommerce",
    sizeType: "compact",
    chatBarText: "Shop",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0, wPct: 1/3, hPct: 1, label: "Shop" },
        { xPct: 1/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Cart" },
        { xPct: 2/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Orders" },
      ],
    }],
  },

  // ── Restaurant: Compact ──────────────────────────────────────────────────────
  {
    id: "compact-restaurant-3",
    name: "Restaurant",
    description: "Menu, order online, and location in compact 3-button layout",
    useCaseGuide:
      "A focused compact menu for food businesses. " +
      "Menu → digital menu PDF or LIFF, Order → online order/delivery, Location → map to the restaurant. " +
      "Works well as a secondary menu for customers who are already in a conversation with staff.",
    category: "restaurant",
    sizeType: "compact",
    chatBarText: "Order & Info",
    pages: [{
      areas: [
        { xPct: 0,    yPct: 0, wPct: 1/3, hPct: 1, label: "Menu" },
        { xPct: 1/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Order" },
        { xPct: 2/3,  yPct: 0, wPct: 1/3, hPct: 1, label: "Location" },
      ],
    }],
  },

  // ── Blank: Compact ───────────────────────────────────────────────────────────
  {
    id: "compact-blank",
    name: "Blank Canvas",
    description: "Start from scratch with a compact (2500×843) canvas",
    useCaseGuide:
      "Choose this for a half-height menu with complete design freedom. " +
      "The compact canvas shows less of the menu in chat, giving more visible space to the conversation. " +
      "Upload your image and draw areas freely in the builder.",
    category: "blank",
    sizeType: "compact",
    chatBarText: "Menu",
    pages: [{ areas: [] }],
  },
];

export const PRESET_CATEGORIES: { value: PresetCategory | "all"; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "general",    label: "General" },
  { value: "ecommerce",  label: "E-commerce" },
  { value: "restaurant", label: "Restaurant" },
  { value: "services",   label: "Services" },
  { value: "support",    label: "Support" },
  { value: "blank",      label: "Blank" },
];
