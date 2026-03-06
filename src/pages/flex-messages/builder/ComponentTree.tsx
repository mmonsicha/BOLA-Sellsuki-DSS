import { useMemo } from "react";
import { ComponentTreeNode } from "./ComponentTreeNode";
import { TreePine } from "lucide-react";

type Node = Record<string, unknown>;

interface ComponentTreeProps {
  content: string;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  onRemoveComponent: (path: string) => void;
  onMoveComponent: (parentPath: string, fromIndex: number, toIndex: number) => void;
  onRequestAdd: (parentPath: string, index: number) => void;
}

export function ComponentTree({
  content,
  selectedPath,
  onSelectPath,
  onRemoveComponent,
  onMoveComponent,
  onRequestAdd,
}: ComponentTreeProps) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(content) as Node;
    } catch {
      return null;
    }
  }, [content]);

  if (!parsed) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-3 text-center">
        <TreePine size={24} className="text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">Invalid JSON</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="px-2 py-1 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Structure
        </span>
      </div>
      <ComponentTreeNode
        node={parsed}
        path=""
        depth={0}
        selectedPath={selectedPath}
        onSelectPath={onSelectPath}
        onRemoveComponent={onRemoveComponent}
        onMoveComponent={onMoveComponent}
        onRequestAdd={onRequestAdd}
      />
    </div>
  );
}
