import { ColorPicker } from "./shared/ColorPicker";
import { SpacingSelect } from "./shared/SpacingSelect";

type Node = Record<string, unknown>;

interface SeparatorPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
}

export function SeparatorProperties({ node, onChange }: SeparatorPropertiesProps) {
  return (
    <div className="space-y-3">
      <SpacingSelect value={node.margin as string} onChange={(v) => onChange({ margin: v })} label="Margin" />
      <ColorPicker
        value={(node.color as string) || ""}
        onChange={(v) => onChange({ color: v || undefined })}
        label="Color"
      />
    </div>
  );
}
