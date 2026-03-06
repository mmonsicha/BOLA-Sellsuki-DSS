import { FieldInsertButton } from "./shared/FieldInsertButton";
import type { FlexMessageVariable } from "@/api/flexMessage";

interface ActionEditorProps {
  value: Record<string, unknown> | undefined;
  onChange: (action: Record<string, unknown> | undefined) => void;
  variables?: FlexMessageVariable[];
}

const ACTION_TYPES = [
  { value: "", label: "None" },
  { value: "uri", label: "Open URL" },
  { value: "message", label: "Send Message" },
  { value: "postback", label: "Postback" },
] as const;

export function ActionEditor({ value, onChange, variables = [] }: ActionEditorProps) {
  const actionType = (value?.type as string) || "";

  const handleTypeChange = (type: string) => {
    if (!type) {
      onChange(undefined);
      return;
    }
    const base: Record<string, unknown> = { type, label: (value?.label as string) || "Action" };
    if (type === "uri") base.uri = (value?.uri as string) || "https://example.com";
    if (type === "message") base.text = (value?.text as string) || "Hello";
    if (type === "postback") {
      base.data = (value?.data as string) || "action=tap";
      base.displayText = (value?.displayText as string) || "";
    }
    onChange(base);
  };

  const handleField = (field: string, val: string) => {
    if (!value) return;
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Action</label>
      <select
        value={actionType}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {ACTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {actionType && (
        <div className="space-y-2 pl-2 border-l-2 border-muted">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              type="text"
              value={(value?.label as string) || ""}
              onChange={(e) => handleField("label", e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {actionType === "uri" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">URL</label>
                <FieldInsertButton
                  variables={variables}
                  onInsert={(name) => handleField("uri", ((value?.uri as string) || "") + `{${name}}`)}
                />
              </div>
              <input
                type="text"
                value={(value?.uri as string) || ""}
                onChange={(e) => handleField("uri", e.target.value)}
                placeholder="https://example.com or https://shop.com/order/{order_id}"
                className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {actionType === "message" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Message Text</label>
                <FieldInsertButton
                  variables={variables}
                  onInsert={(name) => handleField("text", ((value?.text as string) || "") + `{${name}}`)}
                />
              </div>
              <input
                type="text"
                value={(value?.text as string) || ""}
                onChange={(e) => handleField("text", e.target.value)}
                placeholder="Hello"
                className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {actionType === "postback" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Data</label>
                <input
                  type="text"
                  value={(value?.data as string) || ""}
                  onChange={(e) => handleField("data", e.target.value)}
                  placeholder="action=tap"
                  className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Display Text</label>
                <input
                  type="text"
                  value={(value?.displayText as string) || ""}
                  onChange={(e) => handleField("displayText", e.target.value)}
                  className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
