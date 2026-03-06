import { ColorPicker } from "./shared/ColorPicker";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ActionEditor } from "./ActionEditor";

type Node = Record<string, unknown>;

interface BoxPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
}

export function BoxProperties({ node, onChange }: BoxPropertiesProps) {
  return (
    <div className="space-y-3">
      {/* Layout */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Layout</label>
        <div className="flex gap-1">
          {(["vertical", "horizontal", "baseline"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onChange({ layout: l })}
              className={`flex-1 px-1.5 py-1 text-xs rounded border transition-colors capitalize ${
                (node.layout || "vertical") === l
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {l === "horizontal" ? "Horiz" : l === "baseline" ? "Base" : "Vert"}
            </button>
          ))}
        </div>
      </div>

      <SpacingSelect value={node.spacing as string} onChange={(v) => onChange({ spacing: v })} label="Spacing" />
      <SpacingSelect value={node.paddingAll as string} onChange={(v) => onChange({ paddingAll: v })} label="Padding" />
      <SpacingSelect value={node.margin as string} onChange={(v) => onChange({ margin: v })} label="Margin" />

      <ColorPicker
        value={(node.backgroundColor as string) || ""}
        onChange={(v) => onChange({ backgroundColor: v || undefined })}
        label="Background Color"
      />

      {/* Corner Radius */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Corner Radius</label>
        <input
          type="text"
          value={(node.cornerRadius as string) || ""}
          onChange={(e) => onChange({ cornerRadius: e.target.value || undefined })}
          placeholder="none, md, lg, xl, xxl"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Justify Content */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Justify Content</label>
        <select
          value={(node.justifyContent as string) || ""}
          onChange={(e) => onChange({ justifyContent: e.target.value || undefined })}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Default</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
          <option value="space-around">Space Around</option>
          <option value="space-evenly">Space Evenly</option>
        </select>
      </div>

      {/* Align Items */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Align Items</label>
        <select
          value={(node.alignItems as string) || ""}
          onChange={(e) => onChange({ alignItems: e.target.value || undefined })}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Default</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
        </select>
      </div>

      {/* Flex */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Flex</label>
        <input
          type="number"
          value={node.flex != null ? (node.flex as number) : ""}
          onChange={(e) => onChange({ flex: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Auto"
          min={0}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <ActionEditor value={node.action as Record<string, unknown>} onChange={(v) => onChange({ action: v })} />
    </div>
  );
}
