import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import { ChronoAnchorRenderer } from "./ChronoAnchorRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("ChronoAnchorRenderer", () => {
  it("does not render when isReloading is false", () => {
    const ctx = createMockContext();
    ChronoAnchorRenderer.render(ctx, {
      position: vec2(200, 200),
      radius: 14,
      progress: 0,
      isReloading: false,
    });

    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.translate).not.toHaveBeenCalled();
  });

  it("renders ground anchor clamps and progress sweep when isReloading is true", () => {
    const ctx = createMockContext();
    ChronoAnchorRenderer.render(ctx, {
      position: vec2(200, 200),
      radius: 14,
      progress: 0.5,
      isReloading: true,
    });

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalledWith(200, 200);
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("handles progress clamping from 0 to 1", () => {
    const ctx = createMockContext();
    expect(() =>
      ChronoAnchorRenderer.render(ctx, {
        position: vec2(200, 200),
        radius: 14,
        progress: 1.5,
        isReloading: true,
      })
    ).not.toThrow();

    expect(() =>
      ChronoAnchorRenderer.render(ctx, {
        position: vec2(200, 200),
        radius: 14,
        progress: -0.2,
        isReloading: true,
      })
    ).not.toThrow();
  });
});
