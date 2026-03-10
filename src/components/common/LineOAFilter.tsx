import { cn } from "@/lib/utils";
import { oaLabel } from "@/lib/lineOAUtils";
import type { LineOA } from "@/types";

interface LineOAFilterProps {
  lineOAs: LineOA[];
  selectedId: string; // "" = All (only when showAll is true)
  onChange: (id: string) => void;
  showAll?: boolean; // default true — set false when API requires a specific OA
  className?: string;
}

export function LineOAFilter({ lineOAs, selectedId, onChange, showAll = true, className }: LineOAFilterProps) {
  if (lineOAs.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {showAll && (
        <button
          onClick={() => onChange("")}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            selectedId === ""
              ? "bg-line text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
      )}
      {lineOAs.map((oa) => (
        <button
          key={oa.id}
          onClick={() => onChange(oa.id)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            selectedId === oa.id
              ? "bg-line text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {oaLabel(oa)}
        </button>
      ))}
    </div>
  );
}
