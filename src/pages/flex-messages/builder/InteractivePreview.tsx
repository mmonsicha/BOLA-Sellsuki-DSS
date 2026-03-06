import { useRef, useEffect, useMemo, useCallback } from "react";
import { render as renderFlexMessage } from "flex-render";
import "flex-render/css";
import { Eye } from "lucide-react";

interface InteractivePreviewProps {
  content: string;
  selectedPath: string | null;
  onSelectPath: (path: string | null) => void;
}

type Node = Record<string, unknown>;

/**
 * Map the flex-render DOM structure to JSON paths.
 * flex-render uses specific CSS classes:
 * - .T1 = bubble container
 * - .LySlider = carousel
 * - .t1Header, .t1Hero, .t1Body, .t1Footer = sections
 * - .MdBx = box, .MdTxt = text, .MdBtn = button, .MdImg = image, .MdSep = separator, .MdIco = icon
 */
function mapDomToPaths(
  container: HTMLElement,
  json: Node,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
) {
  // Clear all previous event listeners by cloning
  // (We rely on re-render via useEffect to re-attach)

  if (json.type === "bubble") {
    mapBubbleDom(container, json, "", onClickPath, selectedPath);
  } else if (json.type === "carousel") {
    const bubbles = json.contents as Node[];
    if (!bubbles) return;
    // Carousel renders bubbles inside .LySlider > .lyInner children
    const sliderInner = container.querySelector(".lyInner");
    if (!sliderInner) return;
    const bubbleEls = sliderInner.children;
    for (let i = 0; i < Math.min(bubbles.length, bubbleEls.length); i++) {
      const bubblePath = `contents[${i}]`;
      attachClickHandler(bubbleEls[i] as HTMLElement, bubblePath, onClickPath, selectedPath);
      mapBubbleDom(bubbleEls[i] as HTMLElement, bubbles[i], bubblePath, onClickPath, selectedPath);
    }
  }
}

function mapBubbleDom(
  el: HTMLElement,
  bubble: Node,
  basePath: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
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
    const sectionNode = bubble[sectionName] as Node | undefined;
    if (!sectionNode) continue;

    const sectionPath = basePath ? `${basePath}.${sectionName}` : sectionName;
    attachClickHandler(sectionEl as HTMLElement, sectionPath, onClickPath, selectedPath);

    // Map children within the section
    if (sectionNode.type === "box" && Array.isArray(sectionNode.contents)) {
      mapBoxChildrenDom(sectionEl as HTMLElement, sectionNode.contents as Node[], sectionPath, onClickPath, selectedPath);
    }
  }
}

function mapBoxChildrenDom(
  parentEl: HTMLElement,
  children: Node[],
  parentPath: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
) {
  // Find direct component children within this box
  const componentEls = findComponentChildren(parentEl);

  for (let i = 0; i < Math.min(children.length, componentEls.length); i++) {
    const childPath = `${parentPath}.contents[${i}]`;
    const childNode = children[i];
    const childEl = componentEls[i];

    attachClickHandler(childEl, childPath, onClickPath, selectedPath);

    // Recurse into boxes
    if (childNode.type === "box" && Array.isArray(childNode.contents)) {
      mapBoxChildrenDom(childEl, childNode.contents as Node[], childPath, onClickPath, selectedPath);
    }
  }
}

/** Find direct component-level child elements (MdBx, MdTxt, MdBtn, MdImg, MdSep, MdIco, MdVid, MdFiller) */
function findComponentChildren(el: HTMLElement): HTMLElement[] {
  const results: HTMLElement[] = [];
  const componentClasses = ["MdBx", "MdTxt", "MdBtn", "MdImg", "MdSep", "MdIco", "MdVid", "mdBx", "mdTxt"];

  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement;
    const isComponent = componentClasses.some((cls) => child.classList.contains(cls));
    if (isComponent) {
      results.push(child);
    } else {
      // Some wrappers may exist; check one level deeper
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

function attachClickHandler(
  el: HTMLElement,
  path: string,
  onClickPath: (path: string) => void,
  selectedPath: string | null,
) {
  el.setAttribute("data-flex-path", path);
  el.style.cursor = "pointer";
  el.style.transition = "outline 0.15s ease";

  if (path === selectedPath) {
    el.style.outline = "2px dashed #3b82f6";
    el.style.outlineOffset = "-1px";
    el.style.borderRadius = "2px";
  } else {
    el.style.outline = "";
    el.style.outlineOffset = "";
  }

  // Remove old listener
  const oldHandler = (el as unknown as Record<string, unknown>).__flexClickHandler as EventListener;
  if (oldHandler) el.removeEventListener("click", oldHandler);

  const handler = (e: Event) => {
    e.stopPropagation();
    onClickPath(path);
  };
  (el as unknown as Record<string, unknown>).__flexClickHandler = handler;
  el.addEventListener("click", handler);
}

export function InteractivePreview({ content, selectedPath, onSelectPath }: InteractivePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return renderFlexMessage(parsed);
    } catch {
      return null;
    }
  }, [content]);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(content) as Node;
    } catch {
      return null;
    }
  }, [content]);

  const handleClick = useCallback((path: string) => {
    onSelectPath(path);
  }, [onSelectPath]);

  // Post-process DOM after render to add click handlers
  useEffect(() => {
    if (!previewRef.current || !parsed || !html) return;
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      if (previewRef.current) {
        mapDomToPaths(previewRef.current, parsed, handleClick, selectedPath);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [html, parsed, selectedPath, handleClick]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Eye size={12} className="text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Preview
        </span>
      </div>
      <div
        className="min-h-48 p-4 rounded-lg flex flex-col items-start gap-2 overflow-auto"
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
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Click elements to select
      </p>
    </div>
  );
}
