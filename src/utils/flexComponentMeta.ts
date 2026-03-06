/**
 * Component metadata for the visual Flex Message builder.
 * Defines icons, labels, defaults, and insertion rules for each component type.
 */
import {
  Type, MousePointerClick, Image, Box, Minus, Play,
  Circle, Maximize2, LayoutTemplate, Columns,
} from "lucide-react";
import type { ElementType } from "react";

export interface ComponentMeta {
  type: string;
  label: string;
  icon: ElementType;
  canHaveChildren: boolean;
  defaultProps: Record<string, unknown>;
  getLabel: (node: Record<string, unknown>) => string;
}

function truncate(s: string, max = 25): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

export const COMPONENT_META: Record<string, ComponentMeta> = {
  bubble: {
    type: "bubble",
    label: "Bubble",
    icon: LayoutTemplate,
    canHaveChildren: false, // sections are handled specially
    defaultProps: {
      type: "bubble",
      body: { type: "box", layout: "vertical", contents: [] },
    },
    getLabel: () => "Bubble",
  },
  carousel: {
    type: "carousel",
    label: "Carousel",
    icon: Columns,
    canHaveChildren: false,
    defaultProps: { type: "carousel", contents: [] },
    getLabel: () => "Carousel",
  },
  box: {
    type: "box",
    label: "Box",
    icon: Box,
    canHaveChildren: true,
    defaultProps: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [],
    },
    getLabel: (node) => {
      const layout = (node.layout as string) || "vertical";
      return `Box (${layout})`;
    },
  },
  text: {
    type: "text",
    label: "Text",
    icon: Type,
    canHaveChildren: false,
    defaultProps: {
      type: "text",
      text: "Your text here",
      size: "md",
      color: "#333333",
      wrap: true,
    },
    getLabel: (node) => {
      const text = (node.text as string) || "";
      return text ? truncate(text) : "Text";
    },
  },
  button: {
    type: "button",
    label: "Button",
    icon: MousePointerClick,
    canHaveChildren: false,
    defaultProps: {
      type: "button",
      action: { type: "uri", label: "Click Me", uri: "https://example.com" },
      style: "primary",
    },
    getLabel: (node) => {
      const action = node.action as Record<string, unknown> | undefined;
      const label = action?.label as string;
      return label ? truncate(label) : "Button";
    },
  },
  image: {
    type: "image",
    label: "Image",
    icon: Image,
    canHaveChildren: false,
    defaultProps: {
      type: "image",
      url: "https://via.placeholder.com/400x200?text=Image",
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    getLabel: () => "Image",
  },
  separator: {
    type: "separator",
    label: "Separator",
    icon: Minus,
    canHaveChildren: false,
    defaultProps: { type: "separator", margin: "md" },
    getLabel: () => "Separator",
  },
  icon: {
    type: "icon",
    label: "Icon",
    icon: Circle,
    canHaveChildren: false,
    defaultProps: {
      type: "icon",
      url: "https://via.placeholder.com/24x24?text=*",
      size: "md",
    },
    getLabel: () => "Icon",
  },
  filler: {
    type: "filler",
    label: "Filler",
    icon: Maximize2,
    canHaveChildren: false,
    defaultProps: { type: "filler" },
    getLabel: () => "Filler",
  },
  video: {
    type: "video",
    label: "Video",
    icon: Play,
    canHaveChildren: false,
    defaultProps: {
      type: "video",
      url: "https://example.com/video.mp4",
      previewUrl: "https://via.placeholder.com/400x200?text=Video+Preview",
      altContent: {
        type: "image",
        url: "https://via.placeholder.com/400x200?text=Video+Preview",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
    },
    getLabel: () => "Video",
  },
};

/** What component types can be added as children to a given parent type */
export const INSERTION_RULES: Record<string, string[]> = {
  box: ["text", "button", "image", "box", "separator", "icon", "filler", "video"],
  // Bubble sections — header/body/footer must contain a box
  bubble_header: ["box"],
  bubble_body: ["box"],
  bubble_footer: ["box"],
  // Hero can be image, video, or box
  bubble_hero: ["image", "video", "box"],
  // Inside a box within a section, allow all component types
  section_box: ["text", "button", "image", "box", "separator", "icon", "filler", "video"],
};

/** Get allowed child types for a given context */
export function getAllowedChildren(parentType: string): string[] {
  return INSERTION_RULES[parentType] || INSERTION_RULES.box || [];
}

/** Bubble sections in display order */
export const BUBBLE_SECTIONS = ["header", "hero", "body", "footer"] as const;
export type BubbleSection = (typeof BUBBLE_SECTIONS)[number];

/** LINE size values for text, icons, etc. */
export const SIZE_OPTIONS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"] as const;

/** LINE spacing/margin values */
export const SPACING_OPTIONS = ["none", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/** Common aspect ratio presets */
export const ASPECT_RATIO_PRESETS = ["1:1", "4:3", "3:2", "16:9", "20:13", "2:1"] as const;

/** Bubble size options */
export const BUBBLE_SIZE_OPTIONS = ["nano", "micro", "deca", "hecto", "kilo", "mega", "giga"] as const;
