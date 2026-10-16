import { describe, expect, it } from "vitest";
import { interpolateAngle, interpolatePosition } from "./RenderInterpolator";

describe("RenderInterpolator", () => {
  it("interpolates position accurately across alpha ranges", () => {
    const prev = { x: 100, y: 200 };
    const curr = { x: 200, y: 300 };

    expect(interpolatePosition(prev, curr, 0)).toEqual({ x: 100, y: 200 });
    expect(interpolatePosition(prev, curr, 0.5)).toEqual({ x: 150, y: 250 });
    expect(interpolatePosition(prev, curr, 1)).toEqual({ x: 200, y: 300 });
  });

  it("clamps alpha strictly to [0, 1] range", () => {
    const prev = { x: 10, y: 20 };
    const curr = { x: 30, y: 40 };

    expect(interpolatePosition(prev, curr, -0.5)).toEqual({ x: 10, y: 20 });
    expect(interpolatePosition(prev, curr, 1.5)).toEqual({ x: 30, y: 40 });
  });

  it("interpolates angles taking shortest rotational path across 2PI boundary", () => {
    const prevAngle = 0.1;
    const currAngle = Math.PI * 2 - 0.1; // -0.1 equivalent

    const mid = interpolateAngle(prevAngle, currAngle, 0.5);
    // Shortest path goes through 0
    expect(Math.abs(mid)).toBeCloseTo(0, 4);
  });
});
