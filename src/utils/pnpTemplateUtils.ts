import type { PNPTemplateEditableField } from "@/types";

/**
 * Navigates a deep-copied object along a dot-notation path (with array index support)
 * and sets the final value. If any intermediate node is missing or wrong type, silently skips.
 *
 * Path format: "body.contents[0].contents[1].text"
 */
function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: string
): void {
  try {
    const segments = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const idx = parseInt(arrayMatch[2], 10);
        if (current[key] == null || !Array.isArray(current[key])) return;
        current = current[key][idx];
      } else {
        if (current[segment] == null) return;
        current = current[segment];
      }
      if (current == null || typeof current !== "object") return;
    }

    const lastSegment = segments[segments.length - 1];
    const arrayMatch = lastSegment.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const idx = parseInt(arrayMatch[2], 10);
      if (!Array.isArray(current[key])) return;
      current[key][idx] = value;
    } else {
      current[lastSegment] = value;
    }
  } catch {
    // Silently skip on any navigation error
  }
}

/**
 * Deep-copies jsonBody and patches editable fields with provided variable values.
 * Mirrors backend applyTemplateVariables logic.
 * Path format: dot-notation with array indices — e.g. "body.contents[0].contents[1].text"
 */
export function applyTemplateVariables(
  jsonBody: Record<string, unknown>,
  schema: PNPTemplateEditableField[],
  vars: Record<string, string>
): Record<string, unknown> {
  const copy = JSON.parse(JSON.stringify(jsonBody)) as Record<string, unknown>;

  for (const field of schema) {
    const value = vars[field.path];
    if (typeof value === "string" && value !== "") {
      setAtPath(copy, field.path, value);
    }
  }

  return copy;
}
