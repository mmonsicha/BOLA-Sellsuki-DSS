export interface FlexTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  containerType: "bubble" | "carousel";
  content: string;
}

export const flexMessageTemplates: FlexTemplate[] = [
  {
    id: "blank",
    name: "Blank Bubble",
    description: "Start from scratch",
    icon: "📄",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "Hello, World!", size: "xl", weight: "bold" },
        ],
      },
    }, null, 2),
  },
  {
    id: "notification",
    name: "Notification",
    description: "Alert or info message with a button",
    icon: "🔔",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🔔", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  { type: "text", text: "Notification Title", weight: "bold", size: "lg" },
                  {
                    type: "text",
                    text: "This is the notification message. Add more details here.",
                    size: "sm",
                    color: "#666666",
                    wrap: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "View Details", uri: "https://example.com" },
            style: "primary",
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "product-card",
    name: "Product Card",
    description: "E-commerce product with image & price",
    icon: "🛍️",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      hero: {
        type: "image",
        url: "https://via.placeholder.com/800x400?text=Product+Image",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "Product Name", weight: "bold", size: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              { type: "text", text: "⭐⭐⭐⭐⭐", size: "sm", flex: 0 },
              { type: "text", text: "4.9 (120 reviews)", size: "sm", color: "#999999", margin: "sm" },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "Price", size: "sm", color: "#555555" },
                  { type: "text", text: "฿ 1,299", size: "sm", color: "#111111", align: "end", weight: "bold" },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "Add to Cart", uri: "https://example.com/cart" },
            style: "primary",
          },
          {
            type: "button",
            action: { type: "uri", label: "View More", uri: "https://example.com/product" },
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "receipt",
    name: "Receipt",
    description: "Order confirmation with itemized list",
    icon: "🧾",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "Order Confirmation", weight: "bold", color: "#1DB446", size: "sm" },
          { type: "text", text: "Order #12345", weight: "bold", size: "xxl", margin: "md" },
          { type: "separator", margin: "xxl" },
          {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "Item A × 1", size: "sm", color: "#555555", flex: 0 },
                  { type: "text", text: "฿ 499", size: "sm", color: "#111111", align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "Item B × 2", size: "sm", color: "#555555", flex: 0 },
                  { type: "text", text: "฿ 799", size: "sm", color: "#111111", align: "end" },
                ],
              },
              { type: "separator" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "Total", size: "sm", color: "#555555", flex: 0 },
                  { type: "text", text: "฿ 1,298", size: "sm", color: "#111111", align: "end", weight: "bold" },
                ],
              },
            ],
          },
          { type: "separator", margin: "xxl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "text", text: "Payment", size: "xs", color: "#aaaaaa", flex: 0 },
              { type: "text", text: "Credit Card ****1234", color: "#aaaaaa", size: "xs", align: "end" },
            ],
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "event",
    name: "Event Invitation",
    description: "Event card with date, time & location",
    icon: "🎉",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      hero: {
        type: "image",
        url: "https://via.placeholder.com/800x400?text=Event+Banner",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "🎉 You're Invited!", weight: "bold", size: "xl" },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  { type: "text", text: "📅", flex: 0 },
                  { type: "text", text: "March 15, 2026", color: "#555555", size: "sm" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  { type: "text", text: "🕐", flex: 0 },
                  { type: "text", text: "6:00 PM – 10:00 PM", color: "#555555", size: "sm" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  { type: "text", text: "📍", flex: 0 },
                  { type: "text", text: "Grand Ballroom, Bangkok", color: "#555555", size: "sm" },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "RSVP Now", uri: "https://example.com/rsvp" },
            style: "primary",
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "profile",
    name: "Profile Card",
    description: "Contact card with avatar & social links",
    icon: "👤",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "image",
                url: "https://via.placeholder.com/100x100?text=Photo",
                flex: 0,
                size: "lg",
                aspectRatio: "1:1",
                aspectMode: "cover",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Somporn Rungsi", weight: "bold", size: "lg" },
                  { type: "text", text: "Senior Product Manager", size: "sm", color: "#777777" },
                  { type: "text", text: "Sellsuki Co., Ltd.", size: "xs", color: "#aaaaaa" },
                ],
              },
            ],
          },
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                flex: 1,
                action: { type: "uri", label: "LINE", uri: "https://line.me" },
                style: "primary",
                height: "sm",
              },
              {
                type: "button",
                flex: 1,
                action: { type: "uri", label: "Email", uri: "mailto:hello@example.com" },
                height: "sm",
              },
            ],
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "promo",
    name: "Promotional Banner",
    description: "Discount offer with bold highlight color",
    icon: "🎁",
    containerType: "bubble",
    content: JSON.stringify({
      type: "bubble",
      styles: {
        header: { backgroundColor: "#FF6B6B" },
        body: { backgroundColor: "#FFF5F5" },
      },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "LIMITED TIME OFFER", weight: "bold", size: "sm", color: "#ffffff" },
          { type: "text", text: "50% OFF", weight: "bold", size: "5xl", color: "#ffffff" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "Use code: SAVE50", size: "xl", weight: "bold", color: "#FF6B6B" },
          {
            type: "text",
            text: "Valid until March 31, 2026. Min. purchase ฿500.",
            size: "sm",
            color: "#888888",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "Shop Now", uri: "https://example.com/shop" },
            style: "primary",
            color: "#FF6B6B",
          },
        ],
      },
    }, null, 2),
  },
  {
    id: "carousel",
    name: "Carousel",
    description: "Multiple swipeable slides",
    icon: "🎠",
    containerType: "carousel",
    content: JSON.stringify({
      type: "carousel",
      contents: [
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/400x200?text=Slide+1",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "Slide 1", weight: "bold", size: "xl" },
              { type: "text", text: "Description for slide 1.", size: "sm", color: "#777777", wrap: true },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "uri", label: "Learn More", uri: "https://example.com/1" },
                style: "primary",
              },
            ],
          },
        },
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/400x200?text=Slide+2",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "Slide 2", weight: "bold", size: "xl" },
              { type: "text", text: "Description for slide 2.", size: "sm", color: "#777777", wrap: true },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "uri", label: "Learn More", uri: "https://example.com/2" },
                style: "primary",
              },
            ],
          },
        },
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/400x200?text=Slide+3",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "Slide 3", weight: "bold", size: "xl" },
              { type: "text", text: "Description for slide 3.", size: "sm", color: "#777777", wrap: true },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "uri", label: "Learn More", uri: "https://example.com/3" },
                style: "primary",
              },
            ],
          },
        },
      ],
    }, null, 2),
  },
];
