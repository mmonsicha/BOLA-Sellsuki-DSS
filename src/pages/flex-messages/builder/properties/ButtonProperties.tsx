import { ColorPicker } from "./shared/ColorPicker";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ActionEditor } from "./ActionEditor";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;

interface ButtonPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function ButtonProperties({ node, onChange, variables = [] }: ButtonPropertiesProps) {
  return (
    <div className="space-y-3">
      {/* Action (primary for buttons) */}
      <ActionEditor value={node.action as Record<string, unknown>} onChange={(v) => onChange({ action: v })} variables={variables} />

      {/* Style */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Style</label>
        <div className="flex gap-1">
          {(["primary", "secondary", "link"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChange({ style: s })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                (node.style || "primary") === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ColorPicker value={(node.color as string) || ""} onChange={(v) => onChange({ color: v || undefined })} label="Color" />

      {/* Height */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Height</label>
        <div className="flex gap-1">
          {(["md", "sm"] as const).map((h) => (
            <button
              key={h}
              onClick={() => onChange({ height: h })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                (node.height || "md") === h
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {h === "md" ? "Medium" : "Small"}
            </button>
          ))}
        </div>
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

      <SpacingSelect value={node.margin as string} onChange={(v) => onChange({ margin: v })} label="Margin" />
    </div>
  );
}
