import { ColorPicker } from "./shared/ColorPicker";
import { SizeSelect } from "./shared/SizeSelect";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ActionEditor } from "./ActionEditor";
import { FieldInsertButton } from "./shared/FieldInsertButton";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;

interface TextPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function TextProperties({ node, onChange, variables = [] }: TextPropertiesProps) {
  // Text nodes may use span-based rich text (contents: [{type:"span", text:"..."}])
  // instead of a plain text field. In that case, read/write the first span's text.
  const isSpanBased = node.text === undefined && Array.isArray(node.contents);
  const textValue = isSpanBased
    ? (node.contents as Array<{ text?: string }>).map((s) => s.text || "").join("")
    : (node.text as string) || "";

  function handleTextChange(newText: string) {
    if (isSpanBased) {
      const contents = (node.contents as Array<Record<string, unknown>>).map((span, idx) =>
        idx === 0 ? { ...span, text: newText } : span
      );
      onChange({ contents });
    } else {
      onChange({ text: newText });
    }
  }

  return (
    <div className="space-y-3">
      {/* Text content */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Text Content</label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => handleTextChange(textValue + `{${name}}`)}
          />
        </div>
        <textarea
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={3}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-y"
        />
      </div>

      <SizeSelect value={node.size as string} onChange={(v) => onChange({ size: v })} label="Size" />

      {/* Weight */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Weight</label>
        <div className="flex gap-1">
          {(["regular", "bold"] as const).map((w) => (
            <button
              key={w}
              onClick={() => onChange({ weight: w })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                (node.weight || "regular") === w
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {w === "bold" ? <strong>Bold</strong> : "Regular"}
            </button>
          ))}
        </div>
      </div>

      <ColorPicker value={(node.color as string) || "#333333"} onChange={(v) => onChange({ color: v })} label="Color" />

      {/* Align */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Align</label>
        <div className="flex gap-1">
          {(["start", "center", "end"] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                (node.align || "start") === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Wrap */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Word Wrap</label>
        <button
          onClick={() => onChange({ wrap: !node.wrap })}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            node.wrap ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              node.wrap ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      {/* Max Lines */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Max Lines</label>
        <input
          type="number"
          value={(node.maxLines as number) || ""}
          onChange={(e) => onChange({ maxLines: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Unlimited"
          min={1}
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
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

      <ActionEditor value={node.action as Record<string, unknown>} onChange={(v) => onChange({ action: v })} variables={variables} />
    </div>
  );
}
