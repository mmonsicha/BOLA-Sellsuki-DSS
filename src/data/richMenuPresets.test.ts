import { describe, it, expect } from "vitest";
import { pctToLineArea, richMenuPresets, PRESET_CATEGORIES } from "./richMenuPresets";

describe("pctToLineArea", () => {
  it("converts large full-canvas area correctly", () => {
    const result = pctToLineArea({ xPct: 0, yPct: 0, wPct: 1, hPct: 1, label: "All" }, "large");
    expect(result).toEqual({ x: 0, y: 0, width: 2500, height: 1686 });
  });

  it("converts compact full-canvas area correctly", () => {
    const result = pctToLineArea({ xPct: 0, yPct: 0, wPct: 1, hPct: 1, label: "All" }, "compact");
    expect(result).toEqual({ x: 0, y: 0, width: 2500, height: 843 });
  });

  it("converts a fractional area to rounded pixel coords", () => {
    const result = pctToLineArea({ xPct: 0, yPct: 0, wPct: 1 / 3, hPct: 0.5, label: "A" }, "large");
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(Math.round(2500 / 3));
    expect(result.height).toBe(Math.round(1686 * 0.5));
  });

  it("returns integers (LINE API requirement)", () => {
    const result = pctToLineArea({ xPct: 1 / 3, yPct: 1 / 3, wPct: 1 / 3, hPct: 1 / 3, label: "X" }, "large");
    expect(Number.isInteger(result.x)).toBe(true);
    expect(Number.isInteger(result.y)).toBe(true);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });
});

describe("richMenuPresets", () => {
  it("has at least one preset", () => {
    expect(richMenuPresets.length).toBeGreaterThan(0);
  });

  it("every preset has a unique id", () => {
    const ids = richMenuPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every preset has required fields", () => {
    for (const p of richMenuPresets) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.useCaseGuide).toBeTruthy();
      expect(["large", "compact"]).toContain(p.sizeType);
      expect(p.pages.length).toBeGreaterThan(0);
    }
  });

  it("all preset areas have valid percentage coordinates (0–1)", () => {
    for (const p of richMenuPresets) {
      for (const page of p.pages) {
        for (const a of page.areas) {
          expect(a.xPct).toBeGreaterThanOrEqual(0);
          expect(a.yPct).toBeGreaterThanOrEqual(0);
          expect(a.wPct).toBeGreaterThan(0);
          expect(a.hPct).toBeGreaterThan(0);
          expect(a.xPct + a.wPct).toBeLessThanOrEqual(1.01); // allow 1px rounding
          expect(a.yPct + a.hPct).toBeLessThanOrEqual(1.01);
        }
      }
    }
  });

  it("includes both large and compact presets", () => {
    const sizes = new Set(richMenuPresets.map((p) => p.sizeType));
    expect(sizes.has("large")).toBe(true);
    expect(sizes.has("compact")).toBe(true);
  });
});

describe("PRESET_CATEGORIES", () => {
  it("contains an 'all' category first", () => {
    expect(PRESET_CATEGORIES[0].value).toBe("all");
  });

  it("all categories have value and label", () => {
    for (const cat of PRESET_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
    }
  });
});
