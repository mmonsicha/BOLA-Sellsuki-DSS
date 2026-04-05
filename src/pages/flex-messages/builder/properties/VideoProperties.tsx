import { ASPECT_RATIO_PRESETS } from "@/utils/flexComponentMeta";
import { ActionEditor } from "./ActionEditor";
import { FieldInsertButton } from "./shared/FieldInsertButton";
import { SpacingSelect } from "./shared/SpacingSelect";
import type { FlexMessageVariable } from "@/api/flexMessage";

type Node = Record<string, unknown>;

interface VideoPropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function VideoProperties({ node, onChange, variables = [] }: VideoPropertiesProps) {
  const altContent = (node.altContent as Record<string, unknown>) || {};
  const previewUrl = (node.previewUrl as string) || "";
  const showPreview = previewUrl && !previewUrl.includes("{");

  const urlValue = (node.url as string) || "";

  return (
    <div className="space-y-3">
      {/* Video URL */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Video URL</label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => onChange({ url: urlValue + `{${name}}` })}
          />
        </div>
        <input
          type="text"
          value={urlValue}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://example.com/video.mp4"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Preview Image URL */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Preview Image URL</label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => {
              const val = previewUrl + `{${name}}`;
              const currentAlt = (node.altContent as Record<string, unknown>) || {};
              onChange({ previewUrl: val, altContent: { ...currentAlt, url: val } });
            }}
          />
        </div>
        <input
          type="text"
          value={previewUrl}
          onChange={(e) => {
            const val = e.target.value;
            const currentAlt = (node.altContent as Record<string, unknown>) || {};
            onChange({ previewUrl: val, altContent: { ...currentAlt, url: val } });
          }}
          placeholder="https://example.com/preview.jpg"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {showPreview && (
          <div className="mt-1 rounded border overflow-hidden bg-muted/30">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-20 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        {previewUrl && !showPreview && (
          <p className="text-xs text-muted-foreground italic">
            Preview not available for dynamic URLs
          </p>
        )}
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
        <div className="flex gap-1 flex-wrap">
          {ASPECT_RATIO_PRESETS.map((r) => (
            <button
              key={r}
              onClick={() => {
                const currentAlt = (node.altContent as Record<string, unknown>) || {};
                onChange({ altContent: { ...currentAlt, aspectRatio: r } });
              }}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                (altContent.aspectRatio || "20:13") === r
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
          value={(altContent.aspectRatio as string) || ""}
          onChange={(e) => {
            const currentAlt = (node.altContent as Record<string, unknown>) || {};
            onChange({ altContent: { ...currentAlt, aspectRatio: e.target.value } });
          }}
          placeholder="20:13"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Aspect Mode */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Aspect Mode</label>
        <div className="flex gap-1">
          {(["cover", "fit"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                const currentAlt = (node.altContent as Record<string, unknown>) || {};
                onChange({ altContent: { ...currentAlt, aspectMode: m } });
              }}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                (altContent.aspectMode || "cover") === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <ActionEditor
        value={node.action as Record<string, unknown>}
        onChange={(v) => onChange({ action: v })}
        variables={variables}
      />

      <SpacingSelect value={node.margin as string} onChange={(v) => onChange({ margin: v })} label="Margin" />
    </div>
  );
}
