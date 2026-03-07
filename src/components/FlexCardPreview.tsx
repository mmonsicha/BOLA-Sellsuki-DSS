import { useMemo, useRef } from "react";
import { render as renderFlexMessage } from "flex-render";
import "flex-render/css";
import { patchFlexHtml, useBrokenImageFallback } from "@/utils/flexPreviewUtils";

interface FlexCardPreviewProps {
  content: string;
  /** Height in pixels. Defaults to 320 (portrait-friendly for list cards). */
  height?: number;
}

/**
 * Renders a LINE Flex Message JSON string as a visual preview inside a
 * fixed-height container that mimics the LINE chat background. Broken or
 * unavailable image URLs are replaced with a gray placeholder.
 */
export function FlexCardPreview({ content, height = 320 }: FlexCardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = renderFlexMessage(JSON.parse(content) as any);
      return patchFlexHtml(raw);
    } catch {
      return null;
    }
  }, [content]);

  useBrokenImageFallback(containerRef, html);

  if (!html) {
    return (
      <div className="bg-muted rounded-md flex items-center justify-center h-36 text-xs text-muted-foreground italic">
        Preview unavailable
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-md bg-[#C6D0D9] p-2"
      style={{ height: `${height}px` }}
    >
      <div
        ref={containerRef}
        style={{ pointerEvents: "none" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Gradient fade at bottom — hides the hard crop gracefully */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #C6D0D9)" }}
      />
    </div>
  );
}
