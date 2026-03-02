import { useState } from "react";

export function MessageTemplateEditor({
  value,
  onChange,
  disabled,
  webhookVariables,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  webhookVariables?: Array<{ name: string; description: string; required?: boolean }>;
}) {
  const [isPreview, setIsPreview] = useState(false);
  const [showFieldGuide, setShowFieldGuide] = useState(false);

  const exampleValues: Record<string, string> = {};
  if (webhookVariables && Array.isArray(webhookVariables)) {
    webhookVariables.forEach((variable: any) => {
      exampleValues[variable.name] = `example_${variable.name}`;
    });
  }

  const getPreviewContent = () => {
    let preview = value;
    Object.entries(exampleValues).forEach(([field, exampleValue]) => {
      preview = preview.replace(new RegExp(`\\{${field}\\}`, "g"), exampleValue);
    });
    return preview;
  };

  return (
    <div className="space-y-2">
      <div className="w-full border rounded-md bg-background overflow-hidden">
        {/* Editor Tabs */}
        <div className="flex gap-0 border-b bg-muted">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              !isPreview
                ? "bg-background text-foreground border-b-2 border-blue-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            HTML Editor
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isPreview
                ? "bg-background text-foreground border-b-2 border-blue-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setShowFieldGuide(!showFieldGuide)}
            className="ml-auto px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Show available fields"
          >
            {showFieldGuide ? "✓ " : ""}Fields
          </button>
        </div>

        <div className="relative">
          {!isPreview ? (
            <>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={
                  "Example:\nHello <b>{customer_name}</b>,\nYour order #{order_id} has been confirmed.\nTotal: ${order_total}"
                }
                className="w-full h-64 p-3 font-mono text-sm bg-background text-foreground border-0 focus:outline-none resize-none"
                spellCheck={false}
              />
              <div className="absolute bottom-3 left-3 text-xs text-muted-foreground pointer-events-none">
                <span className="inline-block bg-blue-500/20 text-blue-600 px-2 py-1 rounded">
                  Tip: Use {"{field_name}"} for placeholders
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-full h-64 p-3 overflow-auto bg-background border-0 text-sm"
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
              />
              <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
                <span className="inline-block bg-green-500/20 text-green-600 px-2 py-1 rounded">
                  Preview with example values
                </span>
              </div>
            </>
          )}

          {showFieldGuide && webhookVariables && webhookVariables.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-muted rounded-md border border-input text-xs z-10">
              <div className="font-semibold mb-2">Available Fields:</div>
              <div className="space-y-1">
                {webhookVariables.map((variable: any) => (
                  <div key={variable.name} className="flex items-start gap-2">
                    <code className="bg-background px-1.5 py-0.5 rounded font-mono text-blue-600 flex-shrink-0">
                      {"{" + variable.name + "}"}
                    </code>
                    <span className="text-muted-foreground flex-1">
                      {variable.description || variable.name}
                    </span>
                    {variable.required && (
                      <span className="text-destructive flex-shrink-0">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
