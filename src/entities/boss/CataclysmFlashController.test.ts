import { describe, expect, it, vi } from "vitest";
import {
  CATACLYSM_FLASH_COLORS,
  CataclysmFlashController,
  computeVisibilityPolygon,
  hexToRgba,
  isPointIlluminated,
  isPointInPolygon,
} from "./CataclysmFlashController";
import { createObstacle, createPillar } from "../Obstacle";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  } as unknown as CanvasRenderingContext2D;
}

describe("CataclysmFlashController", () => {
  describe("State Transitions & Asymmetric Timing", () => {
    it("starts in idle state with 0 alpha", () => {
      const controller = new CataclysmFlashController();
      expect(controller.getStatus()).toBe("idle");
      expect(controller.isActive()).toBe(false);
      expect(controller.isAtApex()).toBe(false);
      expect(controller.getAlpha()).toBe(0);
      expect(controller.rampUpDuration).toBe(0.25);
      expect(controller.rampDownDuration).toBe(0.07);
    });

    it("transitions through idle -> ramping_up -> apex -> ramping_down -> idle", () => {
      const controller = new CataclysmFlashController({
        rampUpDuration: 0.25,
        rampDownDuration: 0.07,
      });

      // 1. Trigger ramp-up
      controller.triggerRampUp({ x: 480, y: 320 }, CATACLYSM_FLASH_COLORS.CYAN);
      expect(controller.getStatus()).toBe("ramping_up");
      expect(controller.isActive()).toBe(true);
      expect(controller.isAtApex()).toBe(false);
      expect(controller.getOrigin()).toEqual({ x: 480, y: 320 });
      expect(controller.getColor()).toBe("#00f0ff");

      // 2. Advance 100ms in wall time
      controller.update(0.1);
      expect(controller.getStatus()).toBe("ramping_up");
      expect(controller.isAtApex()).toBe(false);

      // 3. Advance another 150ms (total 250ms == rampUpDuration) -> reaches apex
      controller.update(0.15);
      expect(controller.getStatus()).toBe("apex");
      expect(controller.isAtApex()).toBe(true);
      expect(controller.isActive()).toBe(true);

      // 4. Update while at apex stays at apex
      controller.update(0.05);
      expect(controller.getStatus()).toBe("apex");
      expect(controller.isAtApex()).toBe(true);

      // 5. Trigger ramp-down (starts 70ms dissipation)
      controller.triggerRampDown();
      expect(controller.getStatus()).toBe("ramping_down");
      expect(controller.isAtApex()).toBe(false);
      expect(controller.isActive()).toBe(true);

      // 6. Advance 35ms (half of ramp-down)
      controller.update(0.035);
      expect(controller.getStatus()).toBe("ramping_down");
      expect(controller.isActive()).toBe(true);

      // 7. Advance remaining 35ms (total 70ms == rampDownDuration) -> returns to idle
      controller.update(0.035);
      expect(controller.getStatus()).toBe("idle");
      expect(controller.isActive()).toBe(false);
      expect(controller.isAtApex()).toBe(false);
      expect(controller.getAlpha()).toBe(0);
    });

    it("verifies asymmetric timing: ramp-up is ~250ms and ramp-down is ~70ms", () => {
      const controller = new CataclysmFlashController();
      controller.triggerRampUp({ x: 100, y: 100 });

      // After 240ms, still ramping up (not yet apex)
      controller.update(0.24);
      expect(controller.getStatus()).toBe("ramping_up");
      expect(controller.isAtApex()).toBe(false);

      // Additional 10ms (total 250ms) triggers apex
      controller.update(0.01);
      expect(controller.getStatus()).toBe("apex");
      expect(controller.isAtApex()).toBe(true);

      // Trigger ramp-down: after 60ms, still ramping down
      controller.triggerRampDown();
      controller.update(0.06);
      expect(controller.getStatus()).toBe("ramping_down");
      expect(controller.isActive()).toBe(true);

      // Additional 10ms (total 70ms) finishes ramp-down
      controller.update(0.01);
      expect(controller.getStatus()).toBe("idle");
      expect(controller.isActive()).toBe(false);
    });

    it("resets cleanly from any state to idle", () => {
      const controller = new CataclysmFlashController();
      controller.triggerRampUp({ x: 200, y: 200 });
      controller.update(0.1);
      expect(controller.isActive()).toBe(true);

      controller.reset();
      expect(controller.getStatus()).toBe("idle");
      expect(controller.isActive()).toBe(false);
      expect(controller.getAlpha()).toBe(0);
    });

    it("supports triggerApex() to transition immediately to apex", () => {
      const controller = new CataclysmFlashController();
      controller.triggerRampUp({ x: 300, y: 300 });
      controller.triggerApex();

      expect(controller.getStatus()).toBe("apex");
      expect(controller.isAtApex()).toBe(true);
      expect(controller.getAlpha()).toBe(0.9);
    });

    it("supports trigger() alias for triggerRampUp", () => {
      const controller = new CataclysmFlashController();
      controller.trigger({ x: 400, y: 400 }, CATACLYSM_FLASH_COLORS.PURPLE, 0.3);

      expect(controller.getStatus()).toBe("ramping_up");
      expect(controller.getColor()).toBe(CATACLYSM_FLASH_COLORS.PURPLE);
      expect(controller.rampUpDuration).toBe(0.3);
    });
  });

  describe("Alpha Progression & Ease Curves", () => {
    it("follows a smooth ease-in curve during ramp-up and reaches ~0.9 at apex", () => {
      const controller = new CataclysmFlashController({
        rampUpDuration: 0.25,
        peakAlpha: 0.9,
      });

      controller.triggerRampUp({ x: 100, y: 100 });
      expect(controller.getAlpha()).toBe(0);

      // At t = 0.125s (progress = 0.5): alpha = 0.5^2 * 0.9 = 0.225
      controller.update(0.125);
      expect(controller.getAlpha()).toBeCloseTo(0.225, 3);

      // At t = 0.25s (progress = 1.0): alpha reaches peak 0.9
      controller.update(0.125);
      expect(controller.getAlpha()).toBeCloseTo(0.9, 3);
      expect(controller.isAtApex()).toBe(true);

      // Alpha remains at 0.9 during apex
      controller.update(0.1);
      expect(controller.getAlpha()).toBeCloseTo(0.9, 3);
    });

    it("follows snappy dissipation during ramp-down to 0", () => {
      const controller = new CataclysmFlashController({
        rampUpDuration: 0.25,
        rampDownDuration: 0.07,
        peakAlpha: 0.9,
      });

      controller.triggerRampUp({ x: 100, y: 100 });
      controller.update(0.25); // At apex

      controller.triggerRampDown();
      expect(controller.getAlpha()).toBeCloseTo(0.9, 3);

      // At halfway (0.035s): alpha = 0.5 * 0.9 = 0.45
      controller.update(0.035);
      expect(controller.getAlpha()).toBeCloseTo(0.45, 3);

      // At finish (0.07s): alpha drops to 0
      controller.update(0.035);
      expect(controller.getAlpha()).toBe(0);
      expect(controller.getStatus()).toBe("idle");
    });

    it("smoothly dissipates from partial alpha if interrupted during ramp-up", () => {
      const controller = new CataclysmFlashController({
        rampUpDuration: 0.25,
        rampDownDuration: 0.07,
        peakAlpha: 0.9,
      });

      controller.triggerRampUp({ x: 100, y: 100 });
      controller.update(0.125); // Halfway through ramp-up -> alpha = 0.225
      expect(controller.getAlpha()).toBeCloseTo(0.225, 3);

      // Interrupted: trigger ramp-down immediately
      controller.triggerRampDown();
      expect(controller.getAlpha()).toBeCloseTo(0.225, 3);

      // Halfway through ramp-down: alpha drops to 0.5 * 0.225 = 0.1125
      controller.update(0.035);
      expect(controller.getAlpha()).toBeCloseTo(0.1125, 4);

      // Completed ramp-down
      controller.update(0.035);
      expect(controller.getAlpha()).toBe(0);
    });
  });

  describe("Color Palettes & hexToRgba", () => {
    it("converts hex colors to rgba correctly", () => {
      expect(hexToRgba("#00f0ff", 0.9)).toBe("rgba(0, 240, 255, 0.900)");
      expect(hexToRgba("#ff1744", 0.5)).toBe("rgba(255, 23, 68, 0.500)");
      expect(hexToRgba("#a855f7", 0.25)).toBe("rgba(168, 85, 247, 0.250)");
      expect(hexToRgba("#fff", 1.0)).toBe("rgba(255, 255, 255, 1.000)");
    });

    it("handles rgb strings and clamps alpha to [0, 1]", () => {
      expect(hexToRgba("rgb(10, 20, 30)", 0.8)).toBe("rgba(10, 20, 30, 0.800)");
      expect(hexToRgba("#00f0ff", 1.5)).toBe("rgba(0, 240, 255, 1.000)");
      expect(hexToRgba("#00f0ff", -0.5)).toBe("rgba(0, 240, 255, 0.000)");
    });

    it("supports phase-specific color palettes", () => {
      const controller = new CataclysmFlashController();

      controller.triggerRampUp({ x: 0, y: 0 }, CATACLYSM_FLASH_COLORS.PURPLE);
      expect(controller.getColor()).toBe("#a855f7");

      controller.triggerRampUp({ x: 0, y: 0 }, CATACLYSM_FLASH_COLORS.CRIMSON);
      expect(controller.getColor()).toBe("#ff1744");

      controller.triggerRampUp({ x: 0, y: 0 }, CATACLYSM_FLASH_COLORS.AMBER);
      expect(controller.getColor()).toBe("#ffab00");
    });
  });

  describe("2D Visibility Polygon & Shadow Occlusion Geometry", () => {
    it("generates a closed polygon enclosing the full arena when no obstacles exist", () => {
      const origin = { x: 480, y: 320 };
      const polygon = computeVisibilityPolygon(origin, [], 960, 640);

      expect(polygon.length).toBeGreaterThanOrEqual(4);
      // All interior points must be illuminated and inside the polygon
      expect(isPointInPolygon({ x: 100, y: 100 }, polygon)).toBe(true);
      expect(isPointInPolygon({ x: 800, y: 500 }, polygon)).toBe(true);
      expect(isPointIlluminated({ x: 800, y: 500 }, origin, [])).toBe(true);
    });

    it("excludes points behind a central pillar from illumination and polygon", () => {
      const origin = { x: 100, y: 320 };
      const pillar = createPillar("center-pillar", 480, 320, 40); // bounds x: [460, 500], y: [300, 340]
      const obstacles = [pillar];

      const polygon = computeVisibilityPolygon(origin, obstacles, 960, 640);
      expect(polygon.length).toBeGreaterThan(0);

      // Point in front of pillar (between origin and pillar) -> Illuminated
      const inFront = { x: 300, y: 320 };
      expect(isPointIlluminated(inFront, origin, obstacles)).toBe(true);
      expect(isPointInPolygon(inFront, polygon)).toBe(true);

      // Point directly behind pillar (blocked line of sight) -> Occluded / Not Illuminated
      const behind = { x: 800, y: 320 };
      expect(isPointIlluminated(behind, origin, obstacles)).toBe(false);
      expect(isPointInPolygon(behind, polygon)).toBe(false);

      // Point with diagonal line-of-sight clearing the pillar -> Illuminated
      const diagonalClear = { x: 800, y: 100 };
      expect(isPointIlluminated(diagonalClear, origin, obstacles)).toBe(true);
      expect(isPointInPolygon(diagonalClear, polygon)).toBe(true);
    });

    it("controller instance helper methods correctly evaluate illumination and visibility polygon", () => {
      const controller = new CataclysmFlashController();
      controller.triggerRampUp({ x: 100, y: 320 });

      const pillar = createPillar("pillar-1", 480, 320, 50);
      const obstacles = [pillar];

      expect(controller.isPointIlluminated({ x: 300, y: 320 }, obstacles)).toBe(true);
      expect(controller.isPointIlluminated({ x: 800, y: 320 }, obstacles)).toBe(false);

      const poly = controller.computeVisibilityPolygon(controller.getOrigin(), obstacles, 960, 640);
      expect(isPointInPolygon({ x: 300, y: 320 }, poly)).toBe(true);
      expect(isPointInPolygon({ x: 800, y: 320 }, poly)).toBe(false);
    });

    it("supports multiple obstacles casting distinct shadow cones", () => {
      const origin = { x: 480, y: 320 };
      const obsLeft = createObstacle("obs-left", 200, 300, 40, 40);
      const obsRight = createObstacle("obs-right", 700, 300, 40, 40);
      const obstacles = [obsLeft, obsRight];

      const polygon = computeVisibilityPolygon(origin, obstacles, 960, 640);

      // Points behind obsLeft and obsRight are occluded
      expect(isPointIlluminated({ x: 100, y: 320 }, origin, obstacles)).toBe(false);
      expect(isPointInPolygon({ x: 100, y: 320 }, polygon)).toBe(false);

      expect(isPointIlluminated({ x: 850, y: 320 }, origin, obstacles)).toBe(false);
      expect(isPointInPolygon({ x: 850, y: 320 }, polygon)).toBe(false);

      // Open vertical corridors are illuminated
      expect(isPointIlluminated({ x: 480, y: 100 }, origin, obstacles)).toBe(true);
      expect(isPointInPolygon({ x: 480, y: 100 }, polygon)).toBe(true);
      expect(isPointIlluminated({ x: 480, y: 550 }, origin, obstacles)).toBe(true);
      expect(isPointInPolygon({ x: 480, y: 550 }, polygon)).toBe(true);
    });

    it("handles boundary edge cases like non-positive dimensions cleanly", () => {
      expect(computeVisibilityPolygon({ x: 0, y: 0 }, [], 0, 0)).toEqual([]);
      expect(computeVisibilityPolygon({ x: 0, y: 0 }, [], -10, 640)).toEqual([]);
    });
  });

  describe("Canvas 2D Rendering", () => {
    it("does not render when idle or alpha is 0", () => {
      const controller = new CataclysmFlashController();
      const ctx = createMockContext();

      controller.render(ctx, [], 960, 640);
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("renders visibility polygon with radial gradient bloom during active flash", () => {
      const controller = new CataclysmFlashController();
      controller.triggerRampUp({ x: 480, y: 320 }, CATACLYSM_FLASH_COLORS.CYAN);
      controller.update(0.25); // At apex (alpha = 0.9)

      const ctx = createMockContext();
      const pillar = createPillar("pillar", 200, 200, 40);

      controller.render(ctx, [pillar], 960, 640);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.createRadialGradient).toHaveBeenCalledWith(480, 320, 0, 480, 320, 960);
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it("falls back to flat rgba fill if useGradient is false or createRadialGradient is unavailable", () => {
      const controller = new CataclysmFlashController({ useGradient: false });
      controller.triggerRampUp({ x: 480, y: 320 }, CATACLYSM_FLASH_COLORS.CRIMSON);
      controller.update(0.25);

      const ctx = createMockContext();
      controller.render(ctx, [], 960, 640);

      expect(ctx.createRadialGradient).not.toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("rgba(255, 23, 68, 0.900)");
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });
  });
});
