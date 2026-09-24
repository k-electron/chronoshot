import { describe, expect, it, vi } from "vitest";
import { measureTextWidth, truncateText, wrapTextLines } from "./textUtils";

function createMockContext(charWidth = 7): CanvasRenderingContext2D {
  return {
    measureText: vi.fn((text: string) => ({ width: text.length * charWidth })),
  } as unknown as CanvasRenderingContext2D;
}

function createUnmockedContext(): CanvasRenderingContext2D {
  return {} as unknown as CanvasRenderingContext2D;
}

describe("textUtils", () => {
  describe("measureTextWidth", () => {
    it("returns 0 for empty or null strings", () => {
      const ctx = createMockContext();
      expect(measureTextWidth(ctx, "")).toBe(0);
      expect(measureTextWidth(ctx, null as any)).toBe(0);
    });

    it("uses ctx.measureText when available", () => {
      const ctx = createMockContext(10);
      expect(measureTextWidth(ctx, "hello")).toBe(50);
    });

    it("falls back to 7px per character estimation when measureText is missing", () => {
      const ctx = createUnmockedContext();
      expect(measureTextWidth(ctx, "CHRONO")).toBe(6 * 7);
    });
  });

  describe("truncateText", () => {
    it("returns original text if it fits within maxWidth", () => {
      const ctx = createMockContext(7);
      expect(truncateText(ctx, "TACTICAL", 100)).toBe("TACTICAL");
    });

    it("truncates with ellipsis if text exceeds maxWidth", () => {
      const ctx = createMockContext(7);
      // "TACTICAL // BURST LOCOMOTION" is 28 chars = 196px. Max width 70px fits 10 chars (9 chars + '…').
      const result = truncateText(ctx, "TACTICAL // BURST LOCOMOTION", 70);
      expect(result.endsWith("…")).toBe(true);
      expect(measureTextWidth(ctx, result)).toBeLessThanOrEqual(70);
    });

    it("returns empty string if maxWidth <= 0 or text is empty", () => {
      const ctx = createMockContext(7);
      expect(truncateText(ctx, "TACTICAL", 0)).toBe("");
      expect(truncateText(ctx, "", 100)).toBe("");
    });
  });

  describe("wrapTextLines", () => {
    it("wraps words onto multiple lines when exceeding maxWidth", () => {
      const ctx = createMockContext(7);
      const text = "Overclocks kinetic thrusters to execute an on-demand phase dash.";
      // max width 140px fits ~20 chars per line
      const lines = wrapTextLines(ctx, text, 140);
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        expect(measureTextWidth(ctx, line)).toBeLessThanOrEqual(140);
      }
    });

    it("respects maxLines budget and truncates the final line with ellipsis", () => {
      const ctx = createMockContext(7);
      const longText =
        "Deploys a kinetic deflection barrier that absorbs 1 lethal projectile impact per room before shattering. Crucial for permadeath runs and long-range sniper crossfires.";
      const lines = wrapTextLines(ctx, longText, 140, 3);
      expect(lines.length).toBe(3);
      expect(lines[2].endsWith("…")).toBe(true);
      expect(measureTextWidth(ctx, lines[2])).toBeLessThanOrEqual(140);
    });

    it("handles single-word text and empty strings gracefully", () => {
      const ctx = createMockContext(7);
      expect(wrapTextLines(ctx, "", 100)).toEqual([]);
      expect(wrapTextLines(ctx, "SUPERSONIC", 100)).toEqual(["SUPERSONIC"]);
    });
  });
});
