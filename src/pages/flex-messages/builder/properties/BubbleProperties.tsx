import { ColorPicker } from "./shared/ColorPicker";
import { BUBBLE_SIZE_OPTIONS } from "@/utils/flexComponentMeta";

type Node = Record<string, unknown>;

interface BubblePropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
}

export function BubbleProperties({ node, onChange }: BubblePropertiesProps) {
  const styles = (node.styles as Record<string, Record<string, unknown>>) || {};

  const handleStyleChange = (section: string, field: string, value: string | undefined) => {
    const currentStyles = { ...styles };
    if (!value) {
      if (currentStyles[section]) {
        const sectionStyle = { ...currentStyles[section] };
        delete sectionStyle[field];
        if (Object.keys(sectionStyle).length === 0) {
          delete currentStyles[section];
        } else {
          currentStyles[section] = sectionStyle;
        }
      }
    } else {
      currentStyles[section] = { ...(currentStyles[section] || {}), [field]: value };
    }
    onChange({ styles: Object.keys(currentStyles).length > 0 ? currentStyles : undefined });
  };

  return (
    <div className="space-y-3">
      {/* Size */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Bubble Size</label>
        <select
          value={(node.size as string) || "mega"}
          onChange={(e) => onChange({ size: e.target.value === "mega" ? undefined : e.target.value })}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {BUBBLE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}{s === "mega" ? " (default)" : ""}</option>
          ))}
        </select>
      </div>

      {/* Direction */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Direction</label>
        <div className="flex gap-1">
          {(["ltr", "rtl"] as const).map((d) => (
            <button
              key={d}
              onClick={() => onChange({ direction: d === "ltr" ? undefined : d })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors uppercase ${
                (node.direction || "ltr") === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Section Background Colors */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Section Backgrounds</label>
        <div className="space-y-2 pl-2 border-l-2 border-muted">
          {(["header", "hero", "body", "footer"] as const).map((section) => (
            <ColorPicker
              key={section}
              value={(styles[section]?.backgroundColor as string) || ""}
              onChange={(v) => handleStyleChange(section, "backgroundColor", v || undefined)}
              label={`${section.charAt(0).toUpperCase() + section.slice(1)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
