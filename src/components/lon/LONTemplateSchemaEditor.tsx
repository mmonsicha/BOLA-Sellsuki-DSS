import { useState, useCallback, useMemo, useEffect } from "react";
import { Trash2, ChevronDown, ChevronRight, CheckCircle2, Plus, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeAtPath,
  updateNodeAtPath,
  insertChildAtPath,
  removeNodeAtPath,
  moveChildInParent,
  setNodeAtPath,
} from "@/utils/flexJsonPath";
import { COMPONENT_META } from "@/utils/flexComponentMeta";
import { ComponentTree } from "@/pages/flex-messages/builder/ComponentTree";
import { PropertyEditor } from "@/pages/flex-messages/builder/PropertyEditor";
import { AddComponentMenu } from "@/pages/flex-messages/builder/AddComponentMenu";
import { LONInteractivePreview } from "./LONInteractivePreview";

export interface SchemaDraft {
  _id: string;
  path: string;
  type: "text" | "url" | "button_label";
  label: string;
  max_len: string;
}

export interface LONTemplateSchemaEditorProps {
  jsonBody: Record<string, unknown>;
  editableSchema: SchemaDraft[];
  exampleVars: Record<string, string>;
  onJsonBodyChange: (body: Record<string, unknown>) => void;
  onSchemaChange: (schema: SchemaDraft[]) => void;
  onExampleVarsChange: (vars: Record<string, string>) => void;
  previewWrapperRef?: React.RefObject<HTMLDivElement>;
}

interface SuggestedField {
  path: string;
  type: "text" | "url" | "button_label";
  hint: string;
}

interface AddMenuTarget {
  parentPath: string;
  parentType: string;
  index: number;
}

const TYPE_BADGE_COLORS: Record<SchemaDraft["type"], string> = {
  text: "bg-blue-100 text-blue-700",
  url: "bg-amber-100 text-amber-700",
  button_label: "bg-purple-100 text-purple-700",
};

function getSuggestedFields(jsonBody: Record<string, unknown>, path: string): SuggestedField[] {
  const node = getNodeAtPath(jsonBody, path);
  if (!node || typeof node !== "object" || Array.isArray(node)) return [];
  const n = node as Record<string, unknown>;
  const type = n.type as string;

  const fields: SuggestedField[] = [];

  if (type === "text" && n.text !== undefined) {
    fields.push({ path: `${path}.text`, type: "text", hint: "Text content" });
  }

  if (type === "image" && n.url !== undefined) {
    fields.push({ path: `${path}.url`, type: "url", hint: "Image URL" });
  }

  if (type === "button" || type === "uri") {
    const action = n.action as Record<string, unknown> | undefined;
    if (action?.label !== undefined) {
      fields.push({ path: `${path}.action.label`, type: "button_label", hint: "Button label" });
    }
    if (action?.uri !== undefined) {
      fields.push({ path: `${path}.action.uri`, type: "url", hint: "Button URL" });
    }
  }

  // Also check action directly on button-type components
  if (n.action && fields.length === 0) {
    const a = n.action as Record<string, unknown>;
    if (a.label !== undefined) {
      fields.push({ path: `${path}.action.label`, type: "button_label", hint: "Button label" });
    }
    if (a.uri !== undefined) {
      fields.push({ path: `${path}.action.uri`, type: "url", hint: "Button URL" });
    }
  }

  return fields;
}

function getDefaultLabel(type: SuggestedField["type"]): string {
  if (type === "text") return "Text";
  if (type === "button_label") return "Button Label";
  if (type === "url") return "URL";
  return "Field";
}

/** Header and footer sections are locked — cannot add/edit/delete in LON templates */
function isLockedPath(path: string | null): boolean {
  if (!path) return false;
  return /^(header|footer)(\..*)?$/.test(path);
}

export function LONTemplateSchemaEditor({
  jsonBody,
  editableSchema,
  exampleVars,
  onJsonBodyChange,
  onSchemaChange,
  onExampleVarsChange,
  previewWrapperRef,
}: LONTemplateSchemaEditorProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [jsonAccordionOpen, setJsonAccordionOpen] = useState(false);
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [jsonParseError, setJsonParseError] = useState("");
  const [addMenuTarget, setAddMenuTarget] = useState<AddMenuTarget | null>(null);
  const [rightTab, setRightTab] = useState<"properties" | "schema">("schema");

  // String form of jsonBody for FlexBuilder components (they expect content: string)
  const jsonBodyStr = useMemo(() => JSON.stringify(jsonBody), [jsonBody]);

  const editablePaths = editableSchema.map((f) => f.path);

  // Derive suggested fields for the selected element
  const suggestedFields: SuggestedField[] = selectedPath
    ? getSuggestedFields(jsonBody, selectedPath)
    : [];

  const selectedNode = selectedPath ? getNodeAtPath(jsonBody, selectedPath) : undefined;
  const selectedType = selectedNode && typeof selectedNode === "object" && !Array.isArray(selectedNode)
    ? (selectedNode as Record<string, unknown>).type as string | undefined
    : undefined;

  // Auto-switch to Properties tab when a component is selected
  useEffect(() => {
    if (selectedPath) {
      setRightTab("properties");
    } else {
      setRightTab("schema");
    }
  }, [selectedPath]);

  // ── Layout editing helpers (mirror FlexBuilder) ────────────────────────────

  const applyChange = useCallback((updater: (parsed: unknown) => unknown) => {
    const updated = updater(jsonBody);
    onJsonBodyChange(updated as Record<string, unknown>);
  }, [jsonBody, onJsonBodyChange]);

  const handleUpdateProperty = useCallback((path: string, updates: Record<string, unknown>) => {
    if (isLockedPath(path)) return;
    applyChange((parsed) => updateNodeAtPath(parsed, path, updates));
  }, [applyChange]);

  const handleAddComponent = useCallback((parentPath: string, index: number, component: Record<string, unknown>) => {
    if (isLockedPath(parentPath)) return;
    applyChange((parsed) => {
      const result = insertChildAtPath(parsed, parentPath, component, index);
      setSelectedPath(`${parentPath}.contents[${index}]`);
      return result;
    });
    setAddMenuTarget(null);
  }, [applyChange]);

  const handleRemoveComponent = useCallback((path: string) => {
    if (isLockedPath(path)) return;
    applyChange((parsed) => removeNodeAtPath(parsed, path));
    if (selectedPath === path) setSelectedPath(null);
  }, [applyChange, selectedPath]);

  const handleMoveComponent = useCallback((parentPath: string, fromIndex: number, toIndex: number) => {
    if (isLockedPath(parentPath)) return;
    applyChange((parsed) => moveChildInParent(parsed, parentPath, fromIndex, toIndex));
    if (selectedPath === `${parentPath}.contents[${fromIndex}]`) {
      setSelectedPath(`${parentPath}.contents[${toIndex}]`);
    }
  }, [applyChange, selectedPath]);

  const handleRequestAdd = useCallback((parentPath: string, index: number) => {
    // Handle bubble section creation (same logic as FlexBuilder)
    if (parentPath.includes("__section_")) {
      const match = parentPath.match(/__section_(header|hero|body|footer)$/);
      if (match) {
        const section = match[1];
        // Block adding locked sections
        if (section === "header" || section === "footer") return;
        const bubblePath = parentPath.replace(/\.?__section_\w+$/, "");
        applyChange((parsed) => {
          if (section === "hero") {
            const defaultImage = structuredClone(COMPONENT_META.image.defaultProps);
            return setNodeAtPath(parsed, bubblePath ? `${bubblePath}.hero` : "hero", defaultImage);
          }
          const defaultBox = { type: "box", layout: "vertical", contents: [] };
          return setNodeAtPath(parsed, bubblePath ? `${bubblePath}.${section}` : section, defaultBox);
        });
        return;
      }
    }

    if (isLockedPath(parentPath)) return;

    // Determine parent type for AddComponentMenu
    let parentType = "box";
    try {
      const parent = getNodeAtPath(jsonBody, parentPath) as Record<string, unknown> | null;
      if (parent?.type) parentType = parent.type as string;
    } catch { /* ignore */ }

    setAddMenuTarget({ parentPath, parentType, index });
  }, [applyChange, jsonBody]);

  // ── Schema editing helpers ─────────────────────────────────────────────────

  function handleAddField(suggested: SuggestedField) {
    const newField: SchemaDraft = {
      _id: Math.random().toString(36).slice(2),
      path: suggested.path,
      type: suggested.type,
      label: getDefaultLabel(suggested.type),
      max_len: "",
    };
    onSchemaChange([...editableSchema, newField]);
  }

  function handleRemoveField(idx: number) {
    const removed = editableSchema[idx];
    const next = editableSchema.filter((_, i) => i !== idx);
    onSchemaChange(next);
    if (removed.path) {
      const nextVars = { ...exampleVars };
      delete nextVars[removed.path];
      onExampleVarsChange(nextVars);
    }
  }

  function handleUpdateLabel(idx: number, label: string) {
    const next = [...editableSchema];
    next[idx] = { ...next[idx], label };
    onSchemaChange(next);
  }

  function handleUpdateType(idx: number, type: SchemaDraft["type"]) {
    const next = [...editableSchema];
    next[idx] = { ...next[idx], type };
    onSchemaChange(next);
  }

  function handleExampleVarChange(path: string, value: string) {
    onExampleVarsChange({ ...exampleVars, [path]: value });
  }

  function handleJsonTextChange(text: string) {
    setJsonText(text);
    setJsonParseError("");
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      onJsonBodyChange(parsed);
    } catch {
      setJsonParseError("Invalid JSON");
    }
  }

  // Sync jsonText with external jsonBody when accordion first opens
  function handleAccordionToggle() {
    if (!jsonAccordionOpen) {
      setJsonText(JSON.stringify(jsonBody, null, 2));
      setJsonParseError("");
    }
    setJsonAccordionOpen((v) => !v);
  }

  const hasNoSuggestions =
    selectedPath !== null &&
    suggestedFields.length === 0 &&
    selectedType !== undefined &&
    !["text", "image", "button", "uri"].includes(selectedType ?? "");

  // ── Schema panel content (moved into "Editable Fields" tab) ───────────────

  const schemaPanelContent = (
    <div className="p-3 space-y-4">
      {/* Section A: Selected Element */}
      {selectedPath && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <p className="text-xs font-semibold text-foreground">Selected Element</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5" title={selectedPath}>
              {selectedPath}
            </p>
            {selectedType && (
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                {selectedType}
              </span>
            )}
          </div>

          <div className="p-3 space-y-2">
            {suggestedFields.length > 0 ? (
              suggestedFields.map((sf) => {
                const alreadyAdded = editableSchema.some((f) => f.path === sf.path);
                return (
                  <div
                    key={sf.path}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{sf.hint}</span>
                      <span
                        className={cn(
                          "ml-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded font-medium",
                          TYPE_BADGE_COLORS[sf.type]
                        )}
                      >
                        {sf.type}
                      </span>
                    </div>
                    {alreadyAdded ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium flex-shrink-0">
                        <CheckCircle2 size={10} />
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddField(sf)}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex-shrink-0 font-medium"
                      >
                        <Plus size={10} />
                        Add
                      </button>
                    )}
                  </div>
                );
              })
            ) : hasNoSuggestions ? (
              <p className="text-[11px] text-muted-foreground italic">
                This element has no editable fields. Try clicking a text or button.
              </p>
            ) : selectedType === undefined ? (
              <p className="text-[11px] text-muted-foreground italic">
                Could not determine element type.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                No editable fields available for this element.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section B: Editable Fields list */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold">Editable Fields</p>
          {editableSchema.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {editableSchema.length}
            </span>
          )}
        </div>

        {editableSchema.length === 0 && selectedPath === null ? (
          <div className="text-center py-6 px-2">
            <Sparkles size={20} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground italic">
              Click on any text or button in the card preview to mark it as editable
            </p>
          </div>
        ) : editableSchema.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1">
            No editable fields yet. Use the suggestions above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {editableSchema.map((f, idx) => (
              <div key={f._id} className="border rounded-lg p-2.5 space-y-2">
                {/* Label + type row */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => handleUpdateLabel(idx, e.target.value)}
                    placeholder="Field label"
                    className="flex-1 min-w-0 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => handleUpdateType(idx, e.target.value as SchemaDraft["type"])}
                    className={cn(
                      "border rounded px-1.5 py-1 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-ring",
                      TYPE_BADGE_COLORS[f.type]
                    )}
                  >
                    <option value="text">text</option>
                    <option value="url">url</option>
                    <option value="button_label">button_label</option>
                  </select>
                  <button
                    onClick={() => handleRemoveField(idx)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    title="Remove field"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Path (read-only, monospace) */}
                <p
                  className="text-[10px] font-mono text-muted-foreground truncate px-0.5"
                  title={f.path}
                >
                  {f.path}
                </p>

                {/* Example value */}
                <input
                  type={f.type === "url" ? "url" : "text"}
                  value={exampleVars[f.path] ?? ""}
                  onChange={(e) => handleExampleVarChange(f.path, e.target.value)}
                  placeholder={
                    f.type === "url"
                      ? "https://example.com"
                      : f.type === "button_label"
                      ? "Button text"
                      : "Example value…"
                  }
                  className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section C: Advanced JSON accordion */}
      <div className="border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
          onClick={handleAccordionToggle}
        >
          <span className="flex items-center gap-1.5 text-muted-foreground">
            Advanced — Edit Raw JSON
          </span>
          {jsonAccordionOpen ? (
            <ChevronDown size={13} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={13} className="text-muted-foreground" />
          )}
        </button>
        {jsonAccordionOpen && (
          <div className="border-t p-2 space-y-1">
            <textarea
              value={jsonText ?? JSON.stringify(jsonBody, null, 2)}
              onChange={(e) => handleJsonTextChange(e.target.value)}
              className="w-full font-mono text-[10px] border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              style={{ height: "200px" }}
              spellCheck={false}
            />
            {jsonParseError && (
              <p className="text-[10px] text-destructive">{jsonParseError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Left: Component Tree */}
        <div className="w-56 border-r flex flex-col overflow-hidden bg-muted/20 flex-shrink-0">
          <ComponentTree
            content={jsonBodyStr}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
            onRemoveComponent={handleRemoveComponent}
            onMoveComponent={handleMoveComponent}
            onRequestAdd={handleRequestAdd}
          />
        </div>

        {/* Center: Interactive preview */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col" ref={previewWrapperRef}>
          <LONInteractivePreview
            jsonBody={jsonBody}
            selectedPath={selectedPath}
            editablePaths={editablePaths}
            onSelectPath={setSelectedPath}
          />
        </div>

        {/* Right: Tabbed panel */}
        <div className="w-72 flex-shrink-0 border-l flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b flex-shrink-0">
            <button
              onClick={() => setRightTab("properties")}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition-colors",
                rightTab === "properties"
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground bg-muted/20 hover:text-foreground"
              )}
            >
              Properties
            </button>
            <button
              onClick={() => setRightTab("schema")}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                rightTab === "schema"
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground bg-muted/20 hover:text-foreground"
              )}
            >
              Editable Fields
              {editableSchema.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {editableSchema.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === "properties" ? (
              isLockedPath(selectedPath) ? (
                <div className="p-6 flex flex-col items-center gap-3 text-center">
                  <Lock size={24} className="text-amber-500" />
                  <p className="text-xs font-semibold text-foreground">
                    {selectedPath?.startsWith("header") ? "Header" : "Footer"} is locked
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Header and footer sections cannot be edited in LON templates.
                  </p>
                </div>
              ) : (
                <PropertyEditor
                  content={jsonBodyStr}
                  selectedPath={selectedPath}
                  onUpdateProperty={handleUpdateProperty}
                  variables={[]}
                />
              )
            ) : (
              schemaPanelContent
            )}
          </div>
        </div>
      </div>

      {/* Add Component Menu — floating overlay outside the flex layout */}
      {addMenuTarget && (
        <AddComponentMenu
          parentPath={addMenuTarget.parentPath}
          parentType={addMenuTarget.parentType}
          insertIndex={addMenuTarget.index}
          onAdd={handleAddComponent}
          onClose={() => setAddMenuTarget(null)}
        />
      )}
    </>
  );
}
