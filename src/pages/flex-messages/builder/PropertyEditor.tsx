import { useMemo } from "react";
import { getNodeAtPath } from "@/utils/flexJsonPath";
import { COMPONENT_META } from "@/utils/flexComponentMeta";
import { TextProperties } from "./properties/TextProperties";
import { ButtonProperties } from "./properties/ButtonProperties";
import { ImageProperties } from "./properties/ImageProperties";
import { BoxProperties } from "./properties/BoxProperties";
import { SeparatorProperties } from "./properties/SeparatorProperties";
import { BubbleProperties } from "./properties/BubbleProperties";
import { Settings2 } from "lucide-react";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;

interface PropertyEditorProps {
  content: string;
  selectedPath: string | null;
  onUpdateProperty: (path: string, updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
  showGreetingConfig?: boolean;
}

export function PropertyEditor({ content, selectedPath, onUpdateProperty, variables = [], showGreetingConfig }: PropertyEditorProps) {
  const { node, nodeType } = useMemo(() => {
    if (!selectedPath) return { node: null, nodeType: "" };
    try {
      const parsed = JSON.parse(content);
      const n = getNodeAtPath(parsed, selectedPath) as Node | null;
      return { node: n, nodeType: (n?.type as string) || "" };
    } catch {
      return { node: null, nodeType: "" };
    }
  }, [content, selectedPath]);

  if (!selectedPath || !node) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <Settings2 size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a component to edit its properties
        </p>
      </div>
    );
  }

  const meta = COMPONENT_META[nodeType];
  const handleChange = (updates: Record<string, unknown>) => {
    onUpdateProperty(selectedPath, updates);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        {meta && <meta.icon size={14} className="text-muted-foreground" />}
        <span className="text-sm font-medium capitalize">{meta?.label || nodeType}</span>
      </div>

      {/* Type-specific form */}
      {nodeType === "text" && <TextProperties node={node} onChange={handleChange} variables={variables} />}
      {nodeType === "button" && <ButtonProperties node={node} onChange={handleChange} variables={variables} showGreetingConfig={showGreetingConfig} />}
      {nodeType === "image" && <ImageProperties node={node} onChange={handleChange} variables={variables} />}
      {nodeType === "box" && <BoxProperties node={node} onChange={handleChange} />}
      {nodeType === "separator" && <SeparatorProperties node={node} onChange={handleChange} />}
      {nodeType === "bubble" && <BubbleProperties node={node} onChange={handleChange} />}

      {/* Fallback for unknown types */}
      {!["text", "button", "image", "box", "separator", "bubble"].includes(nodeType) && (
        <p className="text-xs text-muted-foreground italic">
          No visual editor for "{nodeType}" type. Use Code mode to edit.
        </p>
      )}
    </div>
  );
}
