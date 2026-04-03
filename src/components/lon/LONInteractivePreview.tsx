import { useRef, useEffect, useMemo, useCallback } from "react";
import { render as renderFlexMessage } from "flex-render";
import "flex-render/css";
import { MousePointerClick } from "lucide-react";

export interface LONInteractivePreviewProps {
  jsonBody: Record<string, unknown>;
  selectedPath: string | null;
  editablePaths: string[];
  onSelectPath: (path: string | null) => void;
}

type FlexNode = Record<string, unknown>;

/**
 * Map the flex-render DOM structure to JSON paths.
 * Adapted from InteractivePreview.tsx but uses jsonBody (object) instead of content (string),
 * and applies LON-specific outline styling (green for editable, blue for selected).
 */
function mapDomToPaths(
  container: HTMLElement,
  json: FlexNode,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
  editablePaths: string[],
) {
  if (json.type === "bubble") {
    mapBubbleDom(container, json, "", onClickPath, selectedPath, editablePaths);
  } else if (json.type === "carousel") {
    const bubbles = json.contents as FlexNode[];
    if (!bubbles) return;
    const sliderInner = container.querySelector(".lyInner");
    if (!sliderInner) return;
    const bubbleEls = sliderInner.children;
    for (let i = 0; i < Math.min(bubbles.length, bubbleEls.length); i++) {
      const bubblePath = `contents[${i}]`;
      attachClickHandler(bubbleEls[i] as HTMLElement, bubblePath, onClickPath, selectedPath, editablePaths);
      mapBubbleDom(bubbleEls[i] as HTMLElement, bubbles[i], bubblePath, onClickPath, selectedPath, editablePaths);
    }
  }
}

function mapBubbleDom(
  el: HTMLElement,
  bubble: FlexNode,
  basePath: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
  editablePaths: string[],
) {
  const sectionMap: Record<string, string> = {
    t1Header: "header",
    t1Hero: "hero",
    t1Body: "body",
    t1Footer: "footer",
  };

  for (const [className, sectionName] of Object.entries(sectionMap)) {
    const sectionEl = el.querySelector(`:scope > .${className}`);
    if (!sectionEl) continue;
    const sectionNode = bubble[sectionName] as FlexNode | undefined;
    if (!sectionNode) continue;

    const sectionPath = basePath ? `${basePath}.${sectionName}` : sectionName;
    attachClickHandler(sectionEl as HTMLElement, sectionPath, onClickPath, selectedPath, editablePaths);

    if (sectionNode.type === "box" && Array.isArray(sectionNode.contents)) {
      mapBoxChildrenDom(sectionEl as HTMLElement, sectionNode.contents as FlexNode[], sectionPath, onClickPath, selectedPath, editablePaths);
    }
  }
}

function mapBoxChildrenDom(
  parentEl: HTMLElement,
  children: FlexNode[],
  parentPath: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
  editablePaths: string[],
) {
  const componentEls = findComponentChildren(parentEl);

  for (let i = 0; i < Math.min(children.length, componentEls.length); i++) {
    const childPath = `${parentPath}.contents[${i}]`;
    const childNode = children[i];
    const childEl = componentEls[i];

    attachClickHandler(childEl, childPath, onClickPath, selectedPath, editablePaths);

    if (childNode.type === "box" && Array.isArray(childNode.contents)) {
      mapBoxChildrenDom(childEl, childNode.contents as FlexNode[], childPath, onClickPath, selectedPath, editablePaths);
    }
  }
}

function findComponentChildren(el: HTMLElement): HTMLElement[] {
  const results: HTMLElement[] = [];
  const componentClasses = ["MdBx", "MdTxt", "MdBtn", "MdImg", "MdSep", "MdIco", "MdVid", "mdBx", "mdTxt"];

  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement;
    const isComponent = componentClasses.some((cls) => child.classList.contains(cls));
    if (isComponent) {
      results.push(child);
    } else {
      for (let j = 0; j < child.children.length; j++) {
        const grandchild = child.children[j] as HTMLElement;
        const isGrandComponent = componentClasses.some((cls) => grandchild.classList.contains(cls));
        if (isGrandComponent) {
          results.push(grandchild);
        }
      }
    }
  }
  return results;
}

/** Check if a path (or its sub-fields) is covered by editablePaths */
function isPathEditable(path: string, editablePaths: string[]): boolean {
  return editablePaths.some(
    (ep) =>
      ep === path ||
      ep.startsWith(`${path}.`) ||
      ep.startsWith(`${path}[`)
  );
}

function attachClickHandler(
  el: HTMLElement,
  path: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
  editablePaths: string[],
) {
  el.setAttribute("data-lon-path", path);
  el.style.cursor = "pointer";
  el.style.transition = "outline 0.15s ease";

  const editable = isPathEditable(path, editablePaths);

  // Apply outline: selected (blue) > editable (green) > default (none)
  if (path === selectedPath) {
    el.style.outline = "2px solid #3b82f6";
    el.style.outlineOffset = "-1px";
    el.style.borderRadius = "2px";
  } else if (editable) {
    el.style.outline = "2px dashed #22c55e";
    el.style.outlineOffset = "-1px";
    el.style.borderRadius = "2px";
  } else {
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.borderRadius = "";
  }

  // Remove old listeners
  const old = (el as unknown as Record<string, unknown>).__lonClickHandler as EventListener | undefined;
  if (old) el.removeEventListener("click", old);
  const oldEnter = (el as unknown as Record<string, unknown>).__lonEnterHandler as EventListener | undefined;
  if (oldEnter) el.removeEventListener("mouseenter", oldEnter);
  const oldLeave = (el as unknown as Record<string, unknown>).__lonLeaveHandler as EventListener | undefined;
  if (oldLeave) el.removeEventListener("mouseleave", oldLeave);

  const handler = (e: Event) => {
    e.stopPropagation();
    onClickPath(path);
  };
  (el as unknown as Record<string, unknown>).__lonClickHandler = handler;
  el.addEventListener("click", handler);

  // Hover outline — gray dotted when not selected
  const enterHandler = () => {
    if (path !== selectedPath) {
      el.style.outline = "1px dotted #94a3b8";
      el.style.outlineOffset = "-1px";
    }
  };
  const leaveHandler = () => {
    if (path === selectedPath) {
      el.style.outline = "2px solid #3b82f6";
    } else if (editable) {
      el.style.outline = "2px dashed #22c55e";
    } else {
      el.style.outline = "";
      el.style.outlineOffset = "";
    }
  };

  (el as unknown as Record<string, unknown>).__lonEnterHandler = enterHandler;
  (el as unknown as Record<string, unknown>).__lonLeaveHandler = leaveHandler;
  el.addEventListener("mouseenter", enterHandler);
  el.addEventListener("mouseleave", leaveHandler);
}

export function LONInteractivePreview({
  jsonBody,
  selectedPath,
  editablePaths,
  onSelectPath,
}: LONInteractivePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return renderFlexMessage(jsonBody as any);
    } catch {
      return null;
    }
  }, [jsonBody]);

  const handleClick = useCallback((path: string) => {
    onSelectPath(path);
  }, [onSelectPath]);

  useEffect(() => {
    if (!previewRef.current || !html) return;
    const timer = setTimeout(() => {
      if (previewRef.current) {
        mapDomToPaths(previewRef.current, jsonBody, handleClick, selectedPath, editablePaths);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [html, jsonBody, selectedPath, editablePaths, handleClick]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 p-4 flex flex-col items-start gap-2 overflow-auto"
        style={{ backgroundColor: "#C6D0D9" }}
        onClick={() => onSelectPath(null)}
      >
        {html ? (
          <div
            ref={previewRef}
            className="w-full max-w-xs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="w-full text-center py-8 text-sm italic" style={{ color: "#888" }}>
            Enter valid JSON to see preview
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/70 text-center py-1.5 flex items-center justify-center gap-1">
        <MousePointerClick size={10} />
        Click elements to define editable fields
      </p>
    </div>
  );
}
