import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  /** Width class, default "w-64" */
  width?: string;
  /** Position: "right" (default) or "left" */
  side?: "right" | "left";
  size?: number;
}

/**
 * Small inline help icon that shows a tooltip on hover.
 * Uses pure CSS – no Radix dependency.
 */
export function InfoTooltip({ text, width = "w-64", side = "right", size = 13 }: InfoTooltipProps) {
  const positionClass =
    side === "left"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : "left-full ml-2 top-1/2 -translate-y-1/2";

  return (
    <span className="relative group inline-flex items-center">
      <HelpCircle size={size} className="text-muted-foreground cursor-help" />
      <span
        className={`pointer-events-none absolute ${positionClass} ${width} rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 leading-relaxed`}
      >
        {text}
      </span>
    </span>
  );
}
