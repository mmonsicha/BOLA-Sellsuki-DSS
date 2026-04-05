import { ColorPicker } from "./shared/ColorPicker";
import { SizeSelect } from "./shared/SizeSelect";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ActionEditor } from "./ActionEditor";
import { FieldInsertButton } from "./shared/FieldInsertButton";
import { Plus, Trash2, Type } from "lucide-react";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;
type SpanNode = {
  type: "span";
  text: string;
  color?: string;
  size?: string;
  weight?: string;
  decoration?: string;
  style?: string;
};

interface TextPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function TextProperties({ node, onChange, variables = [] }: TextPropertiesProps) {
  const isSpanBased = node.text === undefined && Array.isArray(node.contents);
  const spans = isSpanBased ? (node.contents as SpanNode[]) : [];
  const textValue = isSpanBased ? "" : (node.text as string) || "";

  // ── Span helpers ──────────────────────────────────────────────────────────
  function updateSpan(index: number, updates: Partial<SpanNode>) {
    const next = spans.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    );
    onChange({ contents: next });
  }

  function addSpan() {
    onChange({ contents: [...spans, { type: "span", text: "New text" }] });
  }

  function removeSpan(index: number) {
    const next = spans.filter((_, i) => i !== index);
    onChange({ contents: next });
  }

  function convertToPlain() {
    const joined = spans.map((s) => s.text || "").join("");
    const { contents: _c, ...rest } = node;
    void _c;
    onChange({ ...rest, text: joined, contents: undefined });
  }

  function convertToSpans() {
    const { text: _t, ...rest } = node;
    void _t;
    onChange({
      ...rest,
      text: undefined,
      contents: [{ type: "span", text: textValue || "Your text here" }],
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Span-based editor ──────────────────────────────────────────── */}
      {isSpanBased ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Spans ({spans.length})
            </label>
            <button
              onClick={convertToPlain}
              className="text-xs text-muted-foreground hover:text-foreground underline"
              title="Merge all spans into plain text"
            >
              Convert to plain
            </button>
          </div>

          {spans.map((span, i) => (
            <div key={i} className="border rounded p-2 space-y-2 bg-muted/20">
              {/* Span header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Span {i + 1}
                </span>
                <button
                  onClick={() => removeSpan(i)}
                  className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
                  title="Remove span"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Text</label>
                  <FieldInsertButton
                    variables={variables}
                    onInsert={(name) =>
                      updateSpan(i, { text: (span.text || "") + `{${name}}` })
                    }
                  />
                </div>
                <input
                  type="text"
                  value={span.text || ""}
                  onChange={(e) => updateSpan(i, { text: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Color */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={span.color || "#333333"}
                    onChange={(e) => updateSpan(i, { color: e.target.value })}
                    className="w-7 h-7 rounded border cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={span.color || ""}
                    onChange={(e) =>
                      updateSpan(i, { color: e.target.value || undefined })
                    }
                    placeholder="inherit"
                    className="flex-1 border rounded px-2 py-1 text-xs font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Size + Weight row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Size</label>
                  <select
                    value={span.size || ""}
                    onChange={(e) =>
                      updateSpan(i, { size: e.target.value || undefined })
                    }
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Inherit</option>
                    {["xxs","xs","sm","md","lg","xl","xxl","3xl","4xl","5xl"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Weight</label>
                  <select
                    value={span.weight || ""}
                    onChange={(e) =>
                      updateSpan(i, { weight: e.target.value || undefined })
                    }
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Inherit</option>
                    <option value="regular">Regular</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              {/* Decoration + Style row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Decoration</label>
                  <select
                    value={span.decoration || ""}
                    onChange={(e) =>
                      updateSpan(i, { decoration: e.target.value || undefined })
                    }
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">None</option>
                    <option value="underline">Underline</option>
                    <option value="line-through">Strikethrough</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Style</label>
                  <select
                    value={span.style || ""}
                    onChange={(e) =>
                      updateSpan(i, { style: e.target.value || undefined })
                    }
                    className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Add span */}
          <button
            onClick={addSpan}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs border border-dashed rounded hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} />
            Add span
          </button>
        </div>
      ) : (
        /* ── Plain text editor ──────────────────────────────────────────── */
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Text Content
            </label>
            <div className="flex items-center gap-2">
              <FieldInsertButton
                variables={variables}
                onInsert={(name) => onChange({ text: textValue + `{${name}}` })}
              />
              <button
                onClick={convertToSpans}
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                title="Convert to span-based rich text"
              >
                <Type size={11} />
                Rich
              </button>
            </div>
          </div>
          <textarea
            value={textValue}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-y"
          />
        </div>
      )}

      {/* ── Common text node properties (apply to both modes) ───────────── */}
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
