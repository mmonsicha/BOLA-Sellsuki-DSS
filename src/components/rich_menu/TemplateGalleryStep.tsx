import { useState } from "react";
import { Check, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  richMenuPresets,
  pctToLineArea,
  PRESET_CATEGORIES,
} from "@/data/richMenuPresets";
import type { RichMenuPreset, PresetCategory } from "@/data/richMenuPresets";

// LINE canvas dimensions (used for SVG viewport scaling)
const LINE_LARGE_W = 2500;
const LINE_LARGE_H = 1686;
const LINE_COMPACT_H = 843;

// Area colours matching the builder's AREA_COLORS / AREA_BORDER_COLORS
const THUMB_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ---- SVG Thumbnail ─────────────────────────────────────────────────────────

interface ThumbProps {
  preset: RichMenuPreset;
  /** Display width in CSS pixels */
  size?: number;
}

function PresetSvgThumbnail({ preset, size = 120 }: ThumbProps) {
  const lineH = preset.sizeType === "compact" ? LINE_COMPACT_H : LINE_LARGE_H;
  const svgH = Math.round(size / (LINE_LARGE_W / lineH));
  const areas = preset.pages[0]?.areas ?? [];

  return (
    <svg
      width={size}
      height={svgH}
      viewBox={`0 0 ${LINE_LARGE_W} ${lineH}`}
      className="w-full rounded border bg-gray-100"
      style={{ display: "block" }}
    >
      <rect width={LINE_LARGE_W} height={lineH} fill="#f3f4f6" />
      {areas.map((a, i) => {
        const coords = pctToLineArea(a, preset.sizeType);
        const color = THUMB_COLORS[i % THUMB_COLORS.length];
        return (
          <g key={i}>
            <rect
              x={coords.x + 16}
              y={coords.y + 16}
              width={coords.width - 32}
              height={coords.height - 32}
              fill={color + "33"}
              stroke={color}
              strokeWidth={20}
              rx={30}
            />
            <text
              x={coords.x + coords.width / 2}
              y={coords.y + coords.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(coords.width, coords.height) * 0.22}
              fill={color}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              {a.label}
            </text>
          </g>
        );
      })}
      {areas.length === 0 && (
        <text
          x={LINE_LARGE_W / 2}
          y={lineH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={200}
          fill="#9ca3af"
          fontFamily="system-ui, sans-serif"
        >
          Custom
        </text>
      )}
    </svg>
  );
}

// ---- Gallery Step Component ─────────────────────────────────────────────────

interface TemplateGalleryStepProps {
  selectedId: string | null;
  onSelect: (preset: RichMenuPreset | null) => void;
}

export function TemplateGalleryStep({ selectedId, onSelect }: TemplateGalleryStepProps) {
  const [activeCategory, setActiveCategory] = useState<PresetCategory | "all">("all");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? richMenuPresets
      : richMenuPresets.filter((p) => p.category === activeCategory);

  function toggleGuide(id: string) {
    setExpandedGuide((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
      {/* Category filter pills — scrollable row on mobile, wrapping on sm+ */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((preset) => {
          const isSelected = selectedId === preset.id;
          const isGuideOpen = expandedGuide === preset.id;
          const areaCount = preset.pages[0]?.areas.length ?? 0;

          return (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelect(preset)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(preset)}
              className={`relative rounded-lg border-2 cursor-pointer p-3 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              {/* Thumbnail */}
              <PresetSvgThumbnail preset={preset} size={120} />

              {/* Meta */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold truncate">{preset.name}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                    {preset.sizeType}
                  </Badge>
                  {areaCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {areaCount} area{areaCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  {preset.description}
                </p>
              </div>

              {/* Use case guide toggle — larger touch target for mobile */}
              <button
                className="absolute top-2 right-2 p-2 rounded text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); toggleGuide(preset.id); }}
                title="Show use case guide"
                aria-label="Show use case guide"
              >
                <HelpCircle className={`h-4 w-4 ${isGuideOpen ? "text-blue-500" : ""}`} />
              </button>

              {/* Expanded guide */}
              {isGuideOpen && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 leading-relaxed">
                  {preset.useCaseGuide}
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shadow">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
