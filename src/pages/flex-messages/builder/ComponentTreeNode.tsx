import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { COMPONENT_META, BUBBLE_SECTIONS } from "@/utils/flexComponentMeta";

type Node = Record<string, unknown>;

interface ComponentTreeNodeProps {
  node: Node;
  path: string;
  depth: number;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  onRemoveComponent: (path: string) => void;
  onMoveComponent: (parentPath: string, fromIndex: number, toIndex: number) => void;
  onRequestAdd: (parentPath: string, index: number) => void;
  siblingCount?: number;
  siblingIndex?: number;
  parentContentsPath?: string;
}

export function ComponentTreeNode({
  node,
  path,
  depth,
  selectedPath,
  onSelectPath,
  onRemoveComponent,
  onMoveComponent,
  onRequestAdd,
  siblingCount = 0,
  siblingIndex = 0,
  parentContentsPath,
}: ComponentTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 3);
  const nodeType = (node.type as string) || "unknown";
  const meta = COMPONENT_META[nodeType];
  const Icon = meta?.icon;
  const label = meta?.getLabel(node) || nodeType;
  const isSelected = path === selectedPath;
  const hasContents = Array.isArray(node.contents) && (node.contents as Node[]).length > 0;
  const isBubble = nodeType === "bubble";
  const isCarousel = nodeType === "carousel";

  // Determine if this node is expandable
  const isExpandable = hasContents || isBubble;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex < siblingCount - 1;

  return (
    <div>
      {/* This node's row */}
      <div
        onClick={() => onSelectPath(path)}
        className={`group flex items-center gap-1 py-1 px-1 cursor-pointer transition-colors text-xs ${
          isSelected
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "hover:bg-muted/50 border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/collapse */}
        {isExpandable ? (
          <button onClick={handleToggle} className="p-0.5 hover:bg-muted rounded shrink-0">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Icon */}
        {Icon && <Icon size={12} className="shrink-0 text-muted-foreground" />}

        {/* Label */}
        <span className="truncate flex-1 select-none">{label}</span>

        {/* Hover actions (not for root bubble/carousel) */}
        {depth > 0 && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {canMoveUp && parentContentsPath && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveComponent(parentContentsPath, siblingIndex, siblingIndex - 1); }}
                className="p-0.5 hover:bg-muted rounded"
                title="Move up"
              >
                <ArrowUp size={10} />
              </button>
            )}
            {canMoveDown && parentContentsPath && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveComponent(parentContentsPath, siblingIndex, siblingIndex + 1); }}
                className="p-0.5 hover:bg-muted rounded"
                title="Move down"
              >
                <ArrowDown size={10} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveComponent(path); }}
              className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
              title="Delete"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && isBubble && (
        <div>
          {BUBBLE_SECTIONS.map((section) => {
            const sectionNode = node[section] as Node | undefined;
            const sectionPath = path ? `${path}.${section}` : section;

            if (!sectionNode) {
              // Show "add section" placeholder
              return (
                <div
                  key={section}
                  className="flex items-center gap-1 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
                  onClick={() => onRequestAdd(`${path ? path + "." : ""}__section_${section}`, 0)}
                >
                  <Plus size={10} />
                  <span className="italic">Add {section}</span>
                </div>
              );
            }

            // Section exists — render it
            return (
              <BubbleSectionNode
                key={section}
                sectionName={section}
                node={sectionNode}
                path={sectionPath}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelectPath={onSelectPath}
                onRemoveComponent={onRemoveComponent}
                onMoveComponent={onMoveComponent}
                onRequestAdd={onRequestAdd}
              />
            );
          })}
        </div>
      )}

      {expanded && isCarousel && Array.isArray(node.contents) && (
        <div>
          {(node.contents as Node[]).map((bubble, i) => (
            <ComponentTreeNode
              key={i}
              node={bubble}
              path={`${path ? path + "." : ""}contents[${i}]`}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onRemoveComponent={onRemoveComponent}
              onMoveComponent={onMoveComponent}
              onRequestAdd={onRequestAdd}
              siblingCount={(node.contents as Node[]).length}
              siblingIndex={i}
              parentContentsPath={path}
            />
          ))}
          {/* Add bubble button */}
          <div
            className="flex items-center gap-1 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onClick={() => onRequestAdd(path, (node.contents as Node[]).length)}
          >
            <Plus size={10} />
            <span className="italic">Add Bubble</span>
          </div>
        </div>
      )}

      {expanded && !isBubble && !isCarousel && hasContents && (
        <div>
          {(node.contents as Node[]).map((child, i) => (
            <ComponentTreeNode
              key={i}
              node={child}
              path={`${path}.contents[${i}]`}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onRemoveComponent={onRemoveComponent}
              onMoveComponent={onMoveComponent}
              onRequestAdd={onRequestAdd}
              siblingCount={(node.contents as Node[]).length}
              siblingIndex={i}
              parentContentsPath={path}
            />
          ))}
          {/* Add child button */}
          <div
            className="flex items-center gap-1 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onClick={() => onRequestAdd(path, (node.contents as Node[]).length)}
          >
            <Plus size={10} />
            <span className="italic">Add component</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders a bubble section (header/hero/body/footer) */
function BubbleSectionNode({
  sectionName,
  node,
  path,
  depth,
  selectedPath,
  onSelectPath,
  onRemoveComponent,
  onMoveComponent,
  onRequestAdd,
}: {
  sectionName: string;
  node: Node;
  path: string;
  depth: number;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  onRemoveComponent: (path: string) => void;
  onMoveComponent: (parentPath: string, fromIndex: number, toIndex: number) => void;
  onRequestAdd: (parentPath: string, index: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = path === selectedPath;
  const nodeType = (node.type as string) || "";
  const hasContents = nodeType === "box" && Array.isArray(node.contents);

  return (
    <div>
      <div
        onClick={() => onSelectPath(path)}
        className={`group flex items-center gap-1 py-1 px-1 cursor-pointer transition-colors text-xs ${
          isSelected
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "hover:bg-muted/50 border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasContents ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5 hover:bg-muted rounded shrink-0">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <span className="truncate flex-1 select-none text-muted-foreground font-medium capitalize">
          {sectionName}
        </span>
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveComponent(path); }}
            className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
            title={`Remove ${sectionName}`}
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {expanded && hasContents && (
        <div>
          {(node.contents as Node[]).map((child, i) => (
            <ComponentTreeNode
              key={i}
              node={child}
              path={`${path}.contents[${i}]`}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onRemoveComponent={onRemoveComponent}
              onMoveComponent={onMoveComponent}
              onRequestAdd={onRequestAdd}
              siblingCount={(node.contents as Node[]).length}
              siblingIndex={i}
              parentContentsPath={path}
            />
          ))}
          <div
            className="flex items-center gap-1 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onClick={() => onRequestAdd(path, (node.contents as Node[]).length)}
          >
            <Plus size={10} />
            <span className="italic">Add component</span>
          </div>
        </div>
      )}
    </div>
  );
}
