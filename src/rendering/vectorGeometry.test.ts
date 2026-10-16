import { describe, expect, it, vi } from "vitest";
import {
  computeOctagonVertices,
  cutOctagonalAperture,
  drawDashedCircle,
  drawDashedLine,
} from "./vectorGeometry";

describe("vectorGeometry", () => {
  describe("drawDashedLine", () => {
    it("emits alternating moveTo and lineTo segments for a horizontal line", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      };

      // 100px line with 10px dash and 10px gap
      drawDashedLine(g, 0, 0, 100, 0, 10, 10);

      // Total pattern = 20px, so 5 dashes:
      // Dash 0: 0 -> 10
      // Dash 1: 20 -> 30
      // Dash 2: 40 -> 50
      // Dash 3: 60 -> 70
      // Dash 4: 80 -> 90
      expect(g.moveTo).toHaveBeenCalledTimes(5);
      expect(g.lineTo).toHaveBeenCalledTimes(5);

      expect(g.moveTo).toHaveBeenNthCalledWith(1, 0, 0);
      expect(g.lineTo).toHaveBeenNthCalledWith(1, 10, 0);

      expect(g.moveTo).toHaveBeenNthCalledWith(2, 20, 0);
      expect(g.lineTo).toHaveBeenNthCalledWith(2, 30, 0);

      expect(g.moveTo).toHaveBeenNthCalledWith(5, 80, 0);
      expect(g.lineTo).toHaveBeenNthCalledWith(5, 90, 0);
    });

    it("handles zero length without throwing or emitting calls", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      };

      drawDashedLine(g, 50, 50, 50, 50, 10, 5);
      expect(g.moveTo).not.toHaveBeenCalled();
      expect(g.lineTo).not.toHaveBeenCalled();
    });

    it("clamps final dash length to line endpoint", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      };

      // 25px line: dash 0 is 0..10, gap 10..20, dash 1 is 20..25 (clamped)
      drawDashedLine(g, 0, 0, 25, 0, 10, 10);
      expect(g.moveTo).toHaveBeenCalledTimes(2);
      expect(g.lineTo).toHaveBeenNthCalledWith(2, 25, 0);
    });
  });

  describe("drawDashedCircle", () => {
    it("emits multiple dashed arc segments around circumference", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      };

      drawDashedCircle(g, 100, 100, 50, 8, 4, 2);
      expect(g.moveTo).toHaveBeenCalled();
      expect(g.lineTo).toHaveBeenCalled();
      expect(g.moveTo.mock.calls.length).toBeGreaterThan(5);
    });

    it("handles zero radius gracefully", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      };

      drawDashedCircle(g, 100, 100, 0);
      expect(g.moveTo).not.toHaveBeenCalled();
    });
  });

  describe("computeOctagonVertices & cutOctagonalAperture", () => {
    it("computes 8 equidistant vertices around center", () => {
      const vertices = computeOctagonVertices(480, 320, 100);
      expect(vertices).toHaveLength(8);

      // Vertex 0 at angle 0: (580, 320)
      expect(vertices[0].x).toBeCloseTo(580, 2);
      expect(vertices[0].y).toBeCloseTo(320, 2);

      // Vertex 2 at angle PI/2: (480, 420)
      expect(vertices[2].x).toBeCloseTo(480, 2);
      expect(vertices[2].y).toBeCloseTo(420, 2);
    });

    it("cuts octagonal aperture using poly and cut", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        poly: vi.fn(),
        cut: vi.fn(),
      };

      cutOctagonalAperture(g, 960, 640, 480, 320, 100);

      expect(g.rect).toHaveBeenCalledWith(0, 0, 960, 640);
      expect(g.fill).toHaveBeenCalled();
      expect(g.poly).toHaveBeenCalledWith(expect.any(Array));
      expect(g.cut).toHaveBeenCalled();
    });

    it("skips cut when radius is zero", () => {
      const g = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        poly: vi.fn(),
        cut: vi.fn(),
      };

      cutOctagonalAperture(g, 960, 640, 480, 320, 0);
      expect(g.rect).toHaveBeenCalledWith(0, 0, 960, 640);
      expect(g.fill).toHaveBeenCalled();
      expect(g.cut).not.toHaveBeenCalled();
    });
  });
});
