import { useState, useEffect, useRef, RefObject } from "react";

// ─── Session limit ───────────────────────────────────────────────────────────

const SESSION_COUNT_KEY = "cm_session_count";
const SESSION_MAX = 3;

function getSessionCount(): number {
  return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) ?? "0", 10);
}

function incrementSessionCount(): void {
  sessionStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoachMarkProps {
  /** localStorage key — marks this coach mark as seen when dismissed */
  storageKey: string;
  title: string;
  body: string;
  /** Label for the action button */
  actionLabel: string;
  /** URL the action button navigates to */
  actionHref: string;
  /** Ref of the DOM element to point at (use this OR elementSelector) */
  targetRef?: RefObject<HTMLElement | null>;
  /** CSS selector for elements outside the component tree (e.g. sidebar links) */
  elementSelector?: string;
  /** Which side of the target the tooltip appears on */
  position?: "top" | "bottom" | "left" | "right";
  onDismiss?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CoachMark({
  storageKey,
  title,
  body,
  actionLabel,
  actionHref,
  targetRef,
  elementSelector,
  position = "bottom",
  onDismiss,
}: CoachMarkProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Already seen — skip
    if (localStorage.getItem(storageKey)) return;
    // Session cap
    if (getSessionCount() >= SESSION_MAX) return;

    // Wait one frame so the target element has rendered and has a valid rect
    const frame = requestAnimationFrame(() => {
      const el: HTMLElement | null =
        targetRef?.current ?? (elementSelector ? document.querySelector<HTMLElement>(elementSelector) : null);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const GAP = 12;
      const TOOLTIP_W = 288; // w-72
      const TOOLTIP_H = 180; // approx height
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // getBoundingClientRect() returns viewport-relative coords.
      // position:fixed uses viewport coords — do NOT add scrollX/scrollY.
      // If target is off-screen, clamp to a visible edge.
      const clampedRect = {
        top: Math.max(0, Math.min(rect.top, vh - 1)),
        bottom: Math.max(0, Math.min(rect.bottom, vh - 1)),
        left: Math.max(0, Math.min(rect.left, vw - 1)),
        right: Math.max(0, Math.min(rect.right, vw - 1)),
        width: rect.width,
        height: rect.height,
      };

      let top = 0;
      let left = 0;

      if (position === "bottom") {
        top = clampedRect.bottom + GAP;
        left = clampedRect.left + clampedRect.width / 2;
      } else if (position === "top") {
        top = clampedRect.top - GAP - TOOLTIP_H;
        left = clampedRect.left + clampedRect.width / 2;
      } else if (position === "right") {
        top = clampedRect.top + clampedRect.height / 2;
        left = clampedRect.right + GAP;
      } else {
        top = clampedRect.top + clampedRect.height / 2;
        left = clampedRect.left - GAP - TOOLTIP_W;
      }

      // Clamp tooltip within viewport
      top = Math.max(8, Math.min(top, vh - TOOLTIP_H - 8));
      left = Math.max(8, Math.min(left, vw - TOOLTIP_W - 8));

      setCoords({ top, left });
      setVisible(true);
      incrementSessionCount();
    });

    return () => cancelAnimationFrame(frame);
  // targetRef.current and elementSelector are intentionally not in deps —
  // we only want this to run once on mount after data has loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
    onDismiss?.();
  }

  if (!visible) return null;

  // Arrow CSS classes per position
  const arrowClasses: Record<string, string> = {
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent",
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent",
  };

  const translateClasses: Record<string, string> = {
    bottom: "-translate-x-1/2",
    top: "-translate-x-1/2 -translate-y-full",
    right: "-translate-y-1/2",
    left: "-translate-x-full -translate-y-1/2",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[9900]"
        onClick={dismiss}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[9910] w-72 bg-gray-900 text-white rounded-2xl shadow-2xl ring-2 ring-green-500 p-4 ${translateClasses[position]}`}
        style={{ top: coords.top, left: coords.left }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
        />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400 text-base">🎯</span>
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Pro Tip</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-sm mb-1">{title}</p>

        {/* Body */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4">{body}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={dismiss}
            className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Got it
          </button>
          <a
            href={actionHref}
            onClick={dismiss}
            className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium text-center transition-colors"
          >
            {actionLabel} →
          </a>
        </div>
      </div>
    </>
  );
}
