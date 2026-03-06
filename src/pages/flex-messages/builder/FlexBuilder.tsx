import { useState, useCallback } from "react";
import { ComponentTree } from "./ComponentTree";
import { InteractivePreview } from "./InteractivePreview";
import { PropertyEditor } from "./PropertyEditor";
import { AddComponentMenu } from "./AddComponentMenu";
import {
  updateNodeAtPath,
  insertChildAtPath,
  removeNodeAtPath,
  moveChildInParent,
  getNodeAtPath,
  setNodeAtPath,
  getContainerInfo,
} from "@/utils/flexJsonPath";
import { COMPONENT_META } from "@/utils/flexComponentMeta";
import type { FlexMessageVariable } from "@/api/flexMessage";

interface FlexBuilderProps {
  content: string;
  onContentChange: (content: string) => void;
  variables?: FlexMessageVariable[];
}

interface AddMenuTarget {
  parentPath: string;
  parentType: string;
  index: number;
}

export function FlexBuilder({ content, onContentChange, variables = [] }: FlexBuilderProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [addMenuTarget, setAddMenuTarget] = useState<AddMenuTarget | null>(null);
  const [mobileTab, setMobileTab] = useState<"tree" | "preview" | "properties">("preview");

  const applyChange = useCallback((updater: (parsed: unknown) => unknown) => {
    try {
      const parsed = JSON.parse(content);
      const updated = updater(parsed);
      onContentChange(JSON.stringify(updated, null, 2));
    } catch {
      // Invalid JSON — ignore
    }
  }, [content, onContentChange]);

  const handleSelectPath = useCallback((path: string | null) => {
    setSelectedPath(path);
  }, []);

  const handleUpdateProperty = useCallback((path: string, updates: Record<string, unknown>) => {
    applyChange((parsed) => updateNodeAtPath(parsed, path, updates));
  }, [applyChange]);

  const handleAddComponent = useCallback((parentPath: string, index: number, component: Record<string, unknown>) => {
    applyChange((parsed) => {
      const result = insertChildAtPath(parsed, parentPath, component, index);
      // Select the newly added component
      setSelectedPath(`${parentPath}.contents[${index}]`);
      return result;
    });
  }, [applyChange]);

  const handleRemoveComponent = useCallback((path: string) => {
    applyChange((parsed) => {
      const result = removeNodeAtPath(parsed, path);
      if (selectedPath === path) setSelectedPath(null);
      return result;
    });
  }, [applyChange, selectedPath]);

  const handleMoveComponent = useCallback((parentPath: string, fromIndex: number, toIndex: number) => {
    applyChange((parsed) => {
      const result = moveChildInParent(parsed, parentPath, fromIndex, toIndex);
      // Update selected path to follow the moved component
      if (selectedPath === `${parentPath}.contents[${fromIndex}]`) {
        setSelectedPath(`${parentPath}.contents[${toIndex}]`);
      }
      return result;
    });
  }, [applyChange, selectedPath]);

  const handleRequestAdd = useCallback((parentPath: string, index: number) => {
    // Handle special bubble section creation
    if (parentPath.includes("__section_")) {
      const match = parentPath.match(/__section_(header|hero|body|footer)$/);
      if (match) {
        const section = match[1];
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

    // Handle adding bubble to carousel
    try {
      const parsed = JSON.parse(content);
      const parent = getNodeAtPath(parsed, parentPath);
      if (parent && typeof parent === "object" && (parent as Record<string, unknown>).type === "carousel") {
        const newBubble = structuredClone(COMPONENT_META.bubble.defaultProps);
        applyChange((p) => insertChildAtPath(p, parentPath, newBubble, index));
        return;
      }
    } catch { /* ignore */ }

    // Determine parent type for the add menu
    let parentType = "box";
    try {
      const parsed = JSON.parse(content);
      const parent = getNodeAtPath(parsed, parentPath) as Record<string, unknown>;
      if (parent?.type === "box") parentType = "box";
      // Check if it's a bubble section
      const containerInfo = getContainerInfo(parentPath + ".contents[0]");
      if (containerInfo) {
        const containerNode = getNodeAtPath(parsed, containerInfo.containerPath) as Record<string, unknown>;
        if (containerNode?.type === "box") parentType = "box";
      }
    } catch { /* ignore */ }

    setAddMenuTarget({ parentPath, parentType, index });
  }, [content, applyChange]);

  const treePanel = (
    <ComponentTree
      content={content}
      selectedPath={selectedPath}
      onSelectPath={handleSelectPath}
      onRemoveComponent={handleRemoveComponent}
      onMoveComponent={handleMoveComponent}
      onRequestAdd={handleRequestAdd}
    />
  );

  const previewPanel = (
    <InteractivePreview
      content={content}
      selectedPath={selectedPath}
      onSelectPath={handleSelectPath}
    />
  );

  const propertyPanel = (
    <PropertyEditor
      content={content}
      selectedPath={selectedPath}
      onUpdateProperty={handleUpdateProperty}
      variables={variables}
    />
  );

  return (
    <>
      {/* Desktop: three-panel layout */}
      <div className="hidden lg:flex border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
        {/* Left: Component Tree */}
        <div className="w-56 border-r overflow-y-auto bg-muted/20 shrink-0">
          {treePanel}
        </div>

        {/* Center: Interactive Preview */}
        <div className="flex-1 overflow-y-auto bg-[#C6D0D9] p-4">
          {previewPanel}
        </div>

        {/* Right: Property Editor */}
        <div className="w-72 border-l overflow-y-auto shrink-0">
          {propertyPanel}
        </div>
      </div>

      {/* Mobile: tabbed layout */}
      <div className="lg:hidden space-y-2">
        {/* Tab bar */}
        <div className="flex border rounded-lg overflow-hidden">
          {(["tree", "preview", "properties"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors capitalize ${
                mobileTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="border rounded-lg overflow-hidden" style={{ minHeight: "400px", maxHeight: "60vh", overflowY: "auto" }}>
          {mobileTab === "tree" && <div className="bg-muted/20">{treePanel}</div>}
          {mobileTab === "preview" && <div className="bg-[#C6D0D9] p-4">{previewPanel}</div>}
          {mobileTab === "properties" && propertyPanel}
        </div>
      </div>

      {/* Add Component Menu */}
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
