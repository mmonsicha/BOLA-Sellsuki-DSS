import { FieldInsertButton } from "./shared/FieldInsertButton";
import type { FlexMessageVariable } from "@/api/flexMessage";

interface ActionEditorProps {
  value: Record<string, unknown> | undefined;
  onChange: (action: Record<string, unknown> | undefined) => void;
  variables?: FlexMessageVariable[];
}

/** Sentinel URI value stored internally to mark a LIFF Track & Greet button. */
const BOLA_PNP_LIFF_MARKER = "__BOLA_PNP_LIFF__";

const ACTION_TYPES = [
  { value: "", label: "None" },
  { value: "uri", label: "Open URL" },
  { value: "message", label: "Send Message" },
  { value: "postback", label: "Postback" },
  { value: "liff_greeting", label: "LIFF Track & Greet 🎯" },
] as const;

/** Derive the display action type from the stored action value. */
function deriveDisplayType(value: Record<string, unknown> | undefined): string {
  if (!value) return "";
  if (value.type === "uri" && value.uri === BOLA_PNP_LIFF_MARKER) return "liff_greeting";
  return (value.type as string) || "";
}

export function ActionEditor({ value, onChange, variables = [] }: ActionEditorProps) {
  // Displayed action type (may differ from stored type for liff_greeting)
  const displayActionType = deriveDisplayType(value);

  const handleTypeChange = (type: string) => {
    if (!type) {
      onChange(undefined);
      return;
    }
    if (type === "liff_greeting") {
      onChange({
        type: "uri",
        uri: BOLA_PNP_LIFF_MARKER,
        label: (value?.label as string) || "ดูข้อมูลพิเศษสำหรับคุณ",
      });
      return;
    }
    const base: Record<string, unknown> = { type, label: (value?.label as string) || "Action" };
    if (type === "uri") base.uri = (value?.uri as string && value.uri !== BOLA_PNP_LIFF_MARKER ? value.uri : "https://example.com");
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
        value={displayActionType}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {ACTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {displayActionType && (
        <div className="space-y-2 pl-2 border-l-2 border-muted">
          {/* Label field — shown for all action types including liff_greeting */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              type="text"
              value={(value?.label as string) || ""}
              onChange={(e) => handleField("label", e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* LIFF Track & Greet info panel */}
          {displayActionType === "liff_greeting" && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 space-y-1">
              <p className="text-xs font-medium text-blue-700">LIFF Track & Greet</p>
              <p className="text-xs text-blue-600">
                BOLA จะ inject LIFF URL อัตโนมัติเมื่อส่ง PNP
              </p>
              <p className="text-xs text-muted-foreground">
                หมายเหตุ: greeting_template_id กำหนดที่ระดับ Template
              </p>
            </div>
          )}

          {/* Standard URI input — only for plain uri type (not liff_greeting) */}
          {displayActionType === "uri" && (
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

          {displayActionType === "message" && (
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

          {displayActionType === "postback" && (
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
