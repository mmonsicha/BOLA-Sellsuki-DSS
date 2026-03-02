export interface FlexSnippet {
  label: string;
  description: string;
  json: object;
}

export const flexMessageSnippets: Record<string, FlexSnippet> = {
  text: {
    label: "Text",
    description: "A line of text",
    json: {
      type: "text",
      text: "Your text here",
      size: "md",
      color: "#333333",
      wrap: true,
    },
  },
  button: {
    label: "Button",
    description: "Tappable button with link",
    json: {
      type: "button",
      action: {
        type: "uri",
        label: "Click Me",
        uri: "https://example.com",
      },
      style: "primary",
    },
  },
  image: {
    label: "Image",
    description: "An image block",
    json: {
      type: "image",
      url: "https://via.placeholder.com/400x200?text=Image",
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
  },
  separator: {
    label: "Separator",
    description: "Horizontal divider line",
    json: {
      type: "separator",
      margin: "md",
    },
  },
  box: {
    label: "Box",
    description: "Container to group elements",
    json: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      margin: "md",
      contents: [],
    },
  },
  video: {
    label: "Video",
    description: "Video with preview image",
    json: {
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
  },
};

/**
 * Insert a snippet into the body.contents array of a bubble JSON.
 * Returns the updated JSON string, or appends the snippet raw if invalid.
 */
export function insertSnippetIntoContent(currentContent: string, snippet: object): string {
  try {
    const parsed = JSON.parse(currentContent);

    if (parsed.type === "bubble" && parsed.body?.contents && Array.isArray(parsed.body.contents)) {
      // Insert into body.contents
      parsed.body.contents.push(snippet);
      return JSON.stringify(parsed, null, 2);
    }

    if (parsed.type === "carousel" && Array.isArray(parsed.contents) && parsed.contents.length > 0) {
      // Insert into last bubble's body.contents
      const last = parsed.contents[parsed.contents.length - 1];
      if (last?.body?.contents && Array.isArray(last.body.contents)) {
        last.body.contents.push(snippet);
        return JSON.stringify(parsed, null, 2);
      }
    }
  } catch {
    // Invalid JSON — just append the snippet as a comment at the end
  }

  // Fallback: append as a pretty-printed snippet below the current content
  return currentContent + "\n\n// Snippet (copy into your contents array):\n" + JSON.stringify(snippet, null, 2);
}
