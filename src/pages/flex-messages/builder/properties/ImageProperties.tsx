import { SizeSelect } from "./shared/SizeSelect";
import { SpacingSelect } from "./shared/SpacingSelect";
import { ActionEditor } from "./ActionEditor";
import { FieldInsertButton } from "./shared/FieldInsertButton";
import { ASPECT_RATIO_PRESETS } from "@/utils/flexComponentMeta";
import type { FlexMessageVariable } from "@/api/flexMessage";
import { Link } from "lucide-react";

const BOLA_PNP_LIFF_MARKER = "__BOLA_PNP_LIFF__";

type Node = Record<string, unknown>;

interface ImagePropertiesProps {
  node: Node;
  onChange: (updates: Record<string, unknown>) => void;
  variables?: FlexMessageVariable[];
}

export function ImageProperties({ node, onChange, variables = [] }: ImagePropertiesProps) {
  const urlValue = (node.url as string) || "";
  // Only show image preview if URL looks like a real URL (not a placeholder)
  const showPreview = urlValue && !urlValue.includes("{");

  // Link URL shortcut: read/write action.uri when action type is plain uri
  const currentAction = node.action as Record<string, unknown> | undefined;
  const isPlainUri = currentAction?.type === "uri" && currentAction?.uri !== BOLA_PNP_LIFF_MARKER;
  const linkUrlValue = isPlainUri ? (currentAction?.uri as string) || "" : "";

  const handleLinkUrlChange = (val: string) => {
    if (!val) {
      // Clear action only if it was a plain uri (don't clear LIFF actions)
      if (isPlainUri) onChange({ action: undefined });
    } else {
      onChange({
        action: {
          type: "uri",
          uri: val,
          label: (currentAction?.label as string) || "Image",
        },
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* URL */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Image URL</label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => onChange({ url: urlValue + `{${name}}` })}
          />
        </div>
        <input
          type="text"
          value={urlValue}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://example.com/image.jpg or {image_url}"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {showPreview && (
          <div className="mt-1 rounded border overflow-hidden bg-muted/30">
            <img
              src={urlValue}
              alt="Preview"
              className="w-full h-20 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        {urlValue && !showPreview && (
          <p className="text-xs text-muted-foreground italic">
            Preview not available for dynamic URLs
          </p>
        )}
      </div>

      {/* Link URL — shortcut for action.uri */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Link size={10} />
            Link URL <span className="text-muted-foreground/60">(tap image)</span>
          </label>
          <FieldInsertButton
            variables={variables}
            onInsert={(name) => handleLinkUrlChange(linkUrlValue + `{${name}}`)}
          />
        </div>
        <input
          type="text"
          value={linkUrlValue}
          onChange={(e) => handleLinkUrlChange(e.target.value)}
          placeholder="https://example.com"
          className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {linkUrlValue && (
          <p className="text-[10px] text-muted-foreground">กดรูปใน LINE จะเปิด URL นี้</p>
        )}
      </div>

      <SizeSelect value={node.size as string} onChange={(v) => onChange({ size: v })} label="Size" allowFull />

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
              onClick={() => onChange({ aspectMode: m })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                (node.aspectMode || "cover") === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Align */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Align</label>
        <div className="flex gap-1">
          {(["start", "center", "end"] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                (node.align || "center") === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              {a}
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

      {/* Show full ActionEditor only for non-URI actions (message, postback, LIFF) — URI is handled by Link URL above */}
      {(!currentAction || !isPlainUri) && (
        <ActionEditor value={node.action as Record<string, unknown>} onChange={(v) => onChange({ action: v })} variables={variables} />
      )}
      {isPlainUri && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <select
            value="uri"
            onChange={(e) => {
              if (e.target.value === "") onChange({ action: undefined });
            }}
            className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">None</option>
            <option value="uri">Open URL ✓</option>
          </select>
          <p className="text-[10px] text-muted-foreground pl-1">URL ตั้งไว้แล้วใน Link URL ด้านบน</p>
        </div>
      )}
    </div>
  );
}
