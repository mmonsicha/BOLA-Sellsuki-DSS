import { useEffect } from "react";
import type { RefObject } from "react";

export const FLEX_PLACEHOLDER_URL = "/flex-preview-placeholder.svg";

// Matches `background-image:url(...)` with or without quotes around the URL.
const BROKEN_URL_RE = /background-image:url\(['"]?([^'"()]*?)['"]?\)/g;

/**
 * Pre-render patch: scan the flex-render HTML string and replace known-bad
 * image URLs with a local placeholder before the HTML is inserted into the DOM.
 *
 * Catches: webhook paths, localhost, relative paths, and empty URLs.
 * These fail immediately at render time with no flicker.
 */
export function patchFlexHtml(html: string): string {
  return html.replace(BROKEN_URL_RE, (_match, url: string) => {
    const trimmed = url.trim();
    const isBroken =
      !trimmed ||
      trimmed.startsWith("/webhook") ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../") ||
      /^https?:\/\/(localhost|127\.0\.0\.1)/.test(trimmed) ||
      (!trimmed.startsWith("http://") &&
        !trimmed.startsWith("https://") &&
        !trimmed.startsWith("/flex-preview-placeholder"));
    return isBroken
      ? `background-image:url(${FLEX_PLACEHOLDER_URL})`
      : `background-image:url(${trimmed})`;
  });
}

const INLINE_BG_RE = /url\(['"]?([^'"()]+)['"]?\)/;

/**
 * Post-render probe hook: after the HTML is in the DOM, probe each
 * background-image URL using a hidden Image object. If the load fails
 * (404, CORS, network error), swap the element's background-image to the
 * placeholder SVG.
 *
 * Runs whenever `html` changes. Cleans up in-flight probes on unmount.
 */
export function useBrokenImageFallback(
  containerRef: RefObject<HTMLElement | null>,
  html: string | null
) {
  useEffect(() => {
    if (!containerRef.current || !html) return;

    const probes: HTMLImageElement[] = [];
    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      "[style*='background-image']"
    );

    elements.forEach((el) => {
      const match = el.style.backgroundImage.match(INLINE_BG_RE);
      if (!match) return;
      const url = match[1];
      // Skip URLs already pointing at the placeholder
      if (url.includes("flex-preview-placeholder")) return;

      const probe = new Image();
      probe.onerror = () => {
        el.style.backgroundImage = `url('${FLEX_PLACEHOLDER_URL}')`;
      };
      probe.src = url;
      probes.push(probe);
    });

    // Cancel in-flight loads if the component unmounts or html changes
    return () => {
      probes.forEach((p) => {
        p.src = "";
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);
}
