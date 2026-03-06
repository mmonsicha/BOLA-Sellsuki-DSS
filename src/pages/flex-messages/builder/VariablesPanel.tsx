import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FlexMessageVariable } from "@/api/flexMessage";

interface VariablesPanelProps {
  variables: FlexMessageVariable[];
  onChange: (vars: FlexMessageVariable[]) => void;
  disabled?: boolean;
}

const FIELD_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function VariablesPanel({ variables, onChange, disabled }: VariablesPanelProps) {
  const [expanded, setExpanded] = useState(variables.length > 0);

  const handleAdd = () => {
    onChange([...variables, { name: "", description: "", required: false }]);
    setExpanded(true);
  };

  const handleRemove = (idx: number) => {
    onChange(variables.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: keyof FlexMessageVariable, value: string | boolean) => {
    const updated = variables.map((v, i) =>
      i === idx ? { ...v, [field]: value } : v
    );
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="py-2.5 px-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground text-foreground/80 transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <CardTitle className="text-sm font-medium">
              Webhook Variables
              {variables.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({variables.length} field{variables.length !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Plus size={12} />
            Add Variable
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-4">
          {variables.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Define webhook field variables to insert dynamic values (e.g. <code className="font-mono text-blue-600">{"{customer_name}"}</code>) in text, image URLs, and button URLs.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground pb-1 border-b">
                <span>Field Name</span>
                <span>Description</span>
                <span className="text-center">Req.</span>
                <span />
              </div>
              {variables.map((v, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-2 items-center">
                  <div>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleChange(idx, "name", e.target.value)}
                      disabled={disabled}
                      placeholder="field_name"
                      className={`w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono ${
                        v.name && !FIELD_NAME_REGEX.test(v.name)
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={v.description}
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. Customer full name"
                      className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) => handleChange(idx, "required", e.target.checked)}
                      disabled={disabled}
                      className="w-3.5 h-3.5 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Use <code className="font-mono text-blue-600">{"{field_name}"}</code> in text content, image URLs, and button URLs. Values are replaced when the message is sent via webhook.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
