import { useEffect, useRef } from "react";
import { COMPONENT_META, getAllowedChildren } from "@/utils/flexComponentMeta";

interface AddComponentMenuProps {
  parentPath: string;
  parentType: string;
  insertIndex: number;
  onAdd: (parentPath: string, index: number, component: Record<string, unknown>) => void;
  onClose: () => void;
}

export function AddComponentMenu({ parentPath, parentType, insertIndex, onAdd, onClose }: AddComponentMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const allowedTypes = getAllowedChildren(parentType);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (allowedTypes.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background border rounded-lg shadow-lg p-2 w-56 max-h-80 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
          Add Component
        </p>
        {allowedTypes.map((type) => {
          const meta = COMPONENT_META[type];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <button
              key={type}
              onClick={() => {
                onAdd(parentPath, insertIndex, structuredClone(meta.defaultProps));
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors text-left"
            >
              <Icon size={14} className="text-muted-foreground shrink-0" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
