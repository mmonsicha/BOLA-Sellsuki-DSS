import { SizeSelect } from "./shared/SizeSelect";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ASPECT_RATIO_PRESETS } from "@/utils/flexComponentMeta";
import { FieldInsertButton } from "./shared/FieldInsertButton";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;

interface IconPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function IconProperties({ node, onChange, variables = [] }: IconPropertiesProps) {
  const urlValue = (node.url as string) || "";
  const showPreview = urlValue && !urlValue.includes("{");

  return (
    <div className="space-y-3">
      {/* URL */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">URL</label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => onChange({ url: urlValue + `{${name}}` })}
          />
        </div>
        <input
          type="text"
          value={urlValue}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://example.com/icon.png or {icon_url}"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {showPreview && (
          <img
            src={urlValue}
            alt="Icon preview"
            className="h-10 w-10 object-contain rounded border bg-muted/30"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        {urlValue && !showPreview && (
          <p className="text-xs text-muted-foreground italic">
            Preview not available for dynamic URLs
          </p>
        )}
      </div>

      <SizeSelect value={node.size as string} onChange={(v) => onChange({ size: v })} label="Size" />

      {/* Aspect Ratio */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
        <div className="flex gap-1 flex-wrap">
          {ASPECT_RATIO_PRESETS.map((r) => (
            <button
              key={r}
              onClick={() => onChange({ aspectRatio: r })}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                (node.aspectRatio || "1:1") === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={(node.aspectRatio as string) || ""}
          onChange={(e) => onChange({ aspectRatio: e.target.value })}
          placeholder="1:1"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <SpacingSelect value={node.margin as string} onChange={(v) => onChange({ margin: v })} label="Margin" />
    </div>
  );
}
