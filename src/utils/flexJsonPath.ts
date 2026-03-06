/**
 * Pure utility functions to manipulate Flex Message JSON by path.
 * Path format: "body.contents[0].contents[2]" (dot notation + brackets)
 * All functions are immutable — they return new objects.
 */

type JsonNode = Record<string, unknown>;

/** Parse a path string into segments: "body.contents[0]" → ["body", "contents", 0] */
function parsePath(path: string): (string | number)[] {
  if (!path) return [];
  const segments: (string | number)[] = [];
  for (const part of path.split(".")) {
    const match = part.match(/^([^[]+)(?:\[(\d+)\])?$/);
    if (match) {
      segments.push(match[1]);
      if (match[2] !== undefined) {
        segments.push(parseInt(match[2], 10));
      }
    }
  }
  return segments;
}

/** Get a node at a given path */
export function getNodeAtPath(root: unknown, path: string): unknown {
  if (!path) return root;
  const segments = parsePath(path);
  let current: unknown = root;
  for (const seg of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[seg];
  }
  return current;
}

/** Set (replace) a node at a given path with a new value. Returns new root. */
export function setNodeAtPath(root: unknown, path: string, value: unknown): unknown {
  if (!path) return value;
  const clone = structuredClone(root);
  const segments = parsePath(path);
  let current: unknown = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    if (current == null || typeof current !== "object") return clone;
    current = (current as Record<string | number, unknown>)[segments[i]];
  }
  if (current != null && typeof current === "object") {
    (current as Record<string | number, unknown>)[segments[segments.length - 1]] = value;
  }
  return clone;
}

/** Update specific properties of a node at a path (shallow merge). Returns new root. */
export function updateNodeAtPath(root: unknown, path: string, updates: Record<string, unknown>): unknown {
  const node = getNodeAtPath(root, path);
  if (node == null || typeof node !== "object" || Array.isArray(node)) return root;
  const updated = { ...(node as JsonNode), ...updates };
  // Remove keys set to undefined
  for (const key of Object.keys(updated)) {
    if (updated[key] === undefined) delete updated[key];
  }
  return setNodeAtPath(root, path, updated);
}

/** Insert a new child into a container's contents array at a given index. Returns new root. */
export function insertChildAtPath(root: unknown, parentPath: string, child: unknown, index: number): unknown {
  const clone = structuredClone(root);
  const parent = getNodeAtPath(clone, parentPath) as JsonNode | undefined;
  if (!parent || typeof parent !== "object") return clone;

  // For bubble sections that don't exist yet (header, hero, body, footer),
  // we need to create them on the container
  const contents = parent.contents;
  if (Array.isArray(contents)) {
    const i = Math.max(0, Math.min(index, contents.length));
    contents.splice(i, 0, child);
    return setNodeAtPath(root, parentPath, parent);
  }
  return clone;
}

/** Remove a node at a given path. Returns new root. */
export function removeNodeAtPath(root: unknown, path: string): unknown {
  if (!path) return root;
  const clone = structuredClone(root);
  const segments = parsePath(path);
  const lastSeg = segments[segments.length - 1];
  const parentSegments = segments.slice(0, -1);

  // Navigate to parent
  let parent: unknown = clone;
  for (const seg of parentSegments) {
    if (parent == null || typeof parent !== "object") return clone;
    parent = (parent as Record<string | number, unknown>)[seg];
  }

  if (parent == null || typeof parent !== "object") return clone;

  if (typeof lastSeg === "number" && Array.isArray(parent)) {
    parent.splice(lastSeg, 1);
  } else if (typeof lastSeg === "string") {
    delete (parent as Record<string, unknown>)[lastSeg];
  }

  return clone;
}

/** Move a child from one index to another within the same parent's contents array. Returns new root. */
export function moveChildInParent(root: unknown, parentPath: string, fromIndex: number, toIndex: number): unknown {
  const clone = structuredClone(root);
  const parent = getNodeAtPath(clone, parentPath);
  if (!parent || typeof parent !== "object") return clone;
  const contents = (parent as JsonNode).contents;
  if (!Array.isArray(contents)) return clone;
  if (fromIndex < 0 || fromIndex >= contents.length) return clone;
  if (toIndex < 0 || toIndex >= contents.length) return clone;

  const [item] = contents.splice(fromIndex, 1);
  contents.splice(toIndex, 0, item);
  return setNodeAtPath(root, parentPath, parent);
}

/** Get the parent path from a child path. Returns null for root-level paths. */
export function getParentPath(path: string): string | null {
  if (!path) return null;
  // Handle array index: "body.contents[0]" → "body"
  const bracketMatch = path.match(/^(.+)\.\w+\[\d+\]$/);
  if (bracketMatch) return bracketMatch[1];
  // Handle dot segment: "body.contents" → "body"
  const dotMatch = path.match(/^(.+)\.[^.]+$/);
  if (dotMatch) return dotMatch[1];
  // Handle top-level bracket: "contents[0]" → ""
  if (path.match(/^\w+\[\d+\]$/)) return "";
  return null;
}

/** Get the container path (the path to the node's parent contents array) and index */
export function getContainerInfo(path: string): { containerPath: string; index: number } | null {
  // Match patterns like "body.contents[2]" or "contents[0].body.contents[1]"
  const match = path.match(/^(.+?)\.contents\[(\d+)\]$/);
  if (match) {
    return { containerPath: match[1], index: parseInt(match[2], 10) };
  }
  // Match top-level "contents[0]" for carousel bubbles
  const topMatch = path.match(/^contents\[(\d+)\]$/);
  if (topMatch) {
    return { containerPath: "", index: parseInt(topMatch[1], 10) };
  }
  return null;
}

/** Build a path for a child at a given index within a parent */
export function buildChildPath(parentPath: string, index: number): string {
  if (!parentPath) return `contents[${index}]`;
  return `${parentPath}.contents[${index}]`;
}

/** Get the component type string at a path */
export function getComponentType(root: unknown, path: string): string {
  const node = getNodeAtPath(root, path);
  if (node && typeof node === "object" && "type" in (node as JsonNode)) {
    return (node as JsonNode).type as string;
  }
  return "unknown";
}

/** Initialize a bubble section (header/body/footer) with a default box if it doesn't exist */
export function initBubbleSection(
  root: unknown,
  bubblePath: string,
  section: "header" | "body" | "footer"
): unknown {
  const sectionPath = bubblePath ? `${bubblePath}.${section}` : section;
  const existing = getNodeAtPath(root, sectionPath);
  if (existing) return root;
  const defaultBox = { type: "box", layout: "vertical", contents: [] };
  return setNodeAtPath(root, sectionPath, defaultBox);
}

/** Initialize a bubble hero section with a default image if it doesn't exist */
export function initBubbleHero(root: unknown, bubblePath: string): unknown {
  const heroPath = bubblePath ? `${bubblePath}.hero` : "hero";
  const existing = getNodeAtPath(root, heroPath);
  if (existing) return root;
  const defaultImage = {
    type: "image",
    url: "https://via.placeholder.com/800x400?text=Hero+Image",
    size: "full",
    aspectRatio: "20:13",
    aspectMode: "cover",
  };
  return setNodeAtPath(root, heroPath, defaultImage);
}

/** Remove a bubble section */
export function removeBubbleSection(root: unknown, bubblePath: string, section: string): unknown {
  const clone = structuredClone(root);
  const bubble = getNodeAtPath(clone, bubblePath || "");
  if (bubble && typeof bubble === "object") {
    delete (bubble as Record<string, unknown>)[section];
  }
  return bubblePath ? setNodeAtPath(root, bubblePath, bubble) : clone;
}
