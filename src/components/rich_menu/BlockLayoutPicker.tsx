import { Crosshair } from "lucide-react";
import { richMenuPresets, pctToLineArea } from "@/data/richMenuPresets";
import type { RichMenuPreset, PresetSizeType } from "@/data/richMenuPresets";

// ---- Public Types ────────────────────────────────────────────────────────────

export interface ApplyAreaDef {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

// ---- Quick Layout Configuration ─────────────────────────────────────────────

interface QuickLayout {
  presetId: string;
  label: string;
}

const LARGE_LAYOUTS: QuickLayout[] = [
  { presetId: "large-6block",      label: "6 Blocks" },
  { presetId: "large-4block",      label: "4 Blocks" },
  { presetId: "large-wide-3",      label: "3 Wide" },
  { presetId: "large-2block",      label: "2 Blocks" },
  { presetId: "large-1block",      label: "Full Width" },
  { presetId: "large-3top-2bottom", label: "3+2 Mixed" },
];

const COMPACT_LAYOUTS: QuickLayout[] = [
  { presetId: "compact-3block", label: "3 Blocks" },
  { presetId: "compact-2block", label: "2 Blocks" },
  { presetId: "compact-1block", label: "Full Width" },
];

// ---- SVG Mini Thumbnail ──────────────────────────────────────────────────────

const LINE_LARGE_W = 2500;
const LINE_LARGE_H = 1686;
const LINE_COMPACT_H = 843;
const THUMB_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function MiniThumb({ preset, size = 64 }: { preset: RichMenuPreset; size?: number }) {
  const lineH = preset.sizeType === "compact" ? LINE_COMPACT_H : LINE_LARGE_H;
  const svgH = Math.round(size / (LINE_LARGE_W / lineH));
  const areas = preset.pages[0]?.areas ?? [];

  return (
    <svg
      width={size}
      height={svgH}
      viewBox={`0 0 ${LINE_LARGE_W} ${lineH}`}
      className="rounded border bg-gray-100"
      style={{ display: "block" }}
    >
      <rect width={LINE_LARGE_W} height={lineH} fill="#f3f4f6" />
      {areas.map((a, i) => {
        const coords = pctToLineArea(a, preset.sizeType);
        const color = THUMB_COLORS[i % THUMB_COLORS.length];
        return (
          <rect
            key={i}
            x={coords.x + 20}
            y={coords.y + 20}
            width={coords.width - 40}
            height={coords.height - 40}
            fill={color + "44"}
            stroke={color}
            strokeWidth={30}
            rx={40}
          />
        );
      })}
    </svg>
  );
}

// ---- Block Layout Picker ─────────────────────────────────────────────────────

interface BlockLayoutPickerProps {
  sizeType: PresetSizeType;
  /** Called with the resolved LINE-pixel area definitions when the user picks a layout */
  onApply: (areas: ApplyAreaDef[]) => void;
  /** Called when the user clicks "Custom" — should activate draw mode in the builder */
  onDrawCustom: () => void;
  disabled?: boolean;
}

export function BlockLayoutPicker({
  sizeType,
  onApply,
  onDrawCustom,
  disabled = false,
}: BlockLayoutPickerProps) {
  const layouts = sizeType === "compact" ? COMPACT_LAYOUTS : LARGE_LAYOUTS;

  function handleApply(presetId: string) {
    const preset = richMenuPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const areas: ApplyAreaDef[] = preset.pages[0].areas.map((a) => {
      const coords = pctToLineArea(a, preset.sizeType);
      return { ...coords, label: a.label };
    });
    onApply(areas);
  }

  return (
    <div className="mt-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-foreground">Quick Start</h3>
        <p className="text-xs text-muted-foreground">
          Choose a block layout to auto-fill areas — then edit each action in the panel on the right
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {layouts.map((layout) => {
          const preset = richMenuPresets.find((p) => p.id === layout.presetId);
          if (!preset) return null;
          return (
            <button
              key={layout.presetId}
              disabled={disabled}
              onClick={() => handleApply(layout.presetId)}
              className="flex flex-col items-center gap-1.5 p-2 rounded border bg-background hover:bg-primary/10 hover:border-primary transition-all group w-20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              title={`Apply ${layout.label} layout`}
            >
              <MiniThumb preset={preset} size={64} />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                {layout.label}
              </span>
            </button>
          );
        })}

        {/* Custom / draw mode button */}
        <button
          disabled={disabled}
          onClick={onDrawCustom}
          className="flex flex-col items-center gap-1.5 p-2 rounded border bg-background hover:bg-primary/10 hover:border-primary transition-all group w-20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
          title="Draw custom areas"
        >
          <div
            className="rounded border-2 border-dashed border-muted-foreground group-hover:border-primary flex items-center justify-center"
            style={{ width: 64, height: sizeType === "compact" ? 22 : 43 }}
          >
            <Crosshair className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Custom
          </span>
        </button>
      </div>
    </div>
  );
}
