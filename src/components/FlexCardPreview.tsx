import { useMemo, useRef } from "react";
import { render as renderFlexMessage } from "flex-render";
import "flex-render/css";
import { patchFlexHtml, useBrokenImageFallback } from "@/utils/flexPreviewUtils";
import { cn } from "@/lib/utils";

interface FlexCardPreviewProps {
  content: string;
  /** Height in pixels. Defaults to 320 (portrait-friendly for list cards). */
  height?: number;
  /**
   * When true the container becomes overflow-y-auto (scrollable) using height as
   * max-height, and the bottom gradient fade is removed.  Use this in editor modals
   * where the full card should be accessible.
   */
  scrollable?: boolean;
}

/**
 * Renders a LINE Flex Message JSON string as a visual preview inside a
 * fixed-height container that mimics the LINE chat background. Broken or
 * unavailable image URLs are replaced with a gray placeholder.
 */
export function FlexCardPreview({ content, height = 320, scrollable = false }: FlexCardPreviewProps) {
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
      className={cn(
        "relative rounded-md bg-[#C6D0D9] p-2",
        scrollable ? "overflow-y-auto" : "overflow-hidden"
      )}
      style={scrollable ? { maxHeight: `${height}px` } : { height: `${height}px` }}
    >
      <div
        ref={containerRef}
        style={{ pointerEvents: "none" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Gradient fade — only when clipping (non-scrollable mode) */}
      {!scrollable && (
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #C6D0D9)" }}
        />
      )}
    </div>
  );
}
