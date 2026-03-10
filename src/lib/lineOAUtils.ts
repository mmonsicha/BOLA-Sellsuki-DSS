import type { LineOA } from "@/types";

export function oaLabel(oa: LineOA): string {
  if (oa.name) return oa.basic_id ? `${oa.name} (${oa.basic_id})` : oa.name;
  return oa.basic_id || oa.id.slice(0, 12);
}
