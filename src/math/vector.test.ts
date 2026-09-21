import { describe, it, expect } from "vitest";
import {
  vec2,
  vecAdd,
  vecSub,
  vecScale,
  vecLength,
  vecLengthSq,
  vecDistance,
  vecDistanceSq,
  vecNormalize,
  vecDot,
  vecCross,
  vecRotate,
  vecLerp,
  vecAngle,
  vecFromAngle,
} from "./vector";
import {
  rayIntersectsSegment,
  segmentIntersectsSegment,
  rayIntersectsCircle,
  rayIntersectsAABB,
  circleIntersectsSegment,
} from "./collision";

describe("Vector2D Math Utilities", () => {
  it("computes exact vector translation for entity movement", () => {
    const position = vec2(100, 150);
    const velocity = vec2(15, -25);
    const updated = vecAdd(position, velocity);

    expect(updated.x).toBe(115);
    expect(updated.y).toBe(125);

    const diff = vecSub(updated, position);
    expect(diff.x).toBe(15);
    expect(diff.y).toBe(-25);

    const scaled = vecScale(velocity, 2);
    expect(scaled.x).toBe(30);
    expect(scaled.y).toBe(-50);

    const interpolated = vecLerp(position, updated, 0.5);
    expect(interpolated.x).toBe(107.5);
    expect(interpolated.y).toBe(137.5);
  });

  it("calculates Euclidean distance matching 3-4-5 Pythagorean triangle", () => {
    const p1 = vec2(10, 20);
    const p2 = vec2(40, 60);

    expect(vecDistanceSq(p1, p2)).toBe(2500);
    expect(vecDistance(p1, p2)).toBe(50);
    expect(vecLengthSq(vec2(3, 4))).toBe(25);
  });

  it("normalizes arbitrary vectors to unit length and safeguards zero vector", () => {
    const v = vec2(3, 4);
    const norm = vecNormalize(v);

    expect(vecLength(norm)).toBeCloseTo(1.0, 6);
    expect(norm.x).toBeCloseTo(0.6, 6);
    expect(norm.y).toBeCloseTo(0.8, 6);

    const zero = vec2(0, 0);
    const zeroNorm = vecNormalize(zero);
    expect(zeroNorm).toEqual({ x: 0, y: 0 });
  });

  it("computes dot product identifying orthogonal and opposite vectors", () => {
    const right = vec2(1, 0);
    const up = vec2(0, 1);
    const left = vec2(-1, 0);

    // Orthogonal sightlines
    expect(vecDot(right, up)).toBe(0);
    // Opposing sightlines
    expect(vecDot(right, left)).toBe(-1);
    // Parallel identical
    expect(vecDot(right, right)).toBe(1);
  });

  it("computes 2D perp-dot cross product for orientation check", () => {
    const v1 = vec2(1, 0);
    const v2 = vec2(0, 1);

    expect(vecCross(v1, v2)).toBe(1);
    expect(vecCross(v2, v1)).toBe(-1);
  });

  it("rotates vectors accurately around origin", () => {
    const v = vec2(10, 0);
    // 90 degrees counter-clockwise rotation (pi / 2)
    const rotated = vecRotate(v, Math.PI / 2);

    expect(rotated.x).toBeCloseTo(0, 6);
    expect(rotated.y).toBeCloseTo(10, 6);
  });

  it("constructs and measures angles accurately", () => {
    const angle = Math.PI / 4; // 45 degrees
    const dir = vecFromAngle(angle, 10);

    expect(vecLength(dir)).toBeCloseTo(10, 6);
    expect(vecAngle(dir)).toBeCloseTo(angle, 6);
  });
});

describe("Collision and Raycasting Utilities", () => {
  it("detects ray intersection with vertical wall at exact distance and normal", () => {
    const rayOrigin = vec2(0, 50);
    const rayDir = vec2(1, 0); // pointing right

    // Vertical wall from (100, 0) to (100, 100)
    const wallStart = vec2(100, 0);
    const wallEnd = vec2(100, 100);

    const hit = rayIntersectsSegment(rayOrigin, rayDir, wallStart, wallEnd);

    expect(hit).not.toBeNull();
    expect(hit!.distance).toBe(100);
    expect(hit!.point.x).toBe(100);
    expect(hit!.point.y).toBe(50);
    // Surface normal should face incoming ray (-1, 0)
    expect(hit!.normal.x).toBeCloseTo(-1, 5);
    expect(hit!.normal.y).toBeCloseTo(0, 5);
  });

  it("returns null when ray points away or misses segment", () => {
    const rayOrigin = vec2(0, 50);
    const rayDirAway = vec2(-1, 0); // pointing left away from wall
    const wallStart = vec2(100, 0);
    const wallEnd = vec2(100, 100);

    const hitAway = rayIntersectsSegment(rayOrigin, rayDirAway, wallStart, wallEnd);
    expect(hitAway).toBeNull();

    // Ray pointing right but wall is behind ray path (y = 200..300)
    const wallMiss = rayIntersectsSegment(rayOrigin, vec2(1, 0), vec2(100, 200), vec2(100, 300));
    expect(wallMiss).toBeNull();
  });

  it("honors maxDistance parameter for short-range checks", () => {
    const rayOrigin = vec2(0, 50);
    const rayDir = vec2(1, 0);
    const wallStart = vec2(100, 0);
    const wallEnd = vec2(100, 100);

    // Wall is 100 units away, ray max distance is 80 units
    const hit = rayIntersectsSegment(rayOrigin, rayDir, wallStart, wallEnd, 80);
    expect(hit).toBeNull();

    // With 120 max distance, wall is reached
    const hitReachable = rayIntersectsSegment(rayOrigin, rayDir, wallStart, wallEnd, 120);
    expect(hitReachable).not.toBeNull();
    expect(hitReachable!.distance).toBe(100);
  });

  it("detects line segment crossing at precise intersection point", () => {
    // Two diagonal lines crossing at (50, 50)
    const seg1A = vec2(0, 0);
    const seg1B = vec2(100, 100);

    const seg2A = vec2(0, 100);
    const seg2B = vec2(100, 0);

    const intersection = segmentIntersectsSegment(seg1A, seg1B, seg2A, seg2B);
    expect(intersection).not.toBeNull();
    expect(intersection!.x).toBeCloseTo(50, 5);
    expect(intersection!.y).toBeCloseTo(50, 5);
  });

  it("calculates raycast against circular enemy hitboxes", () => {
    const rayOrigin = vec2(0, 100);
    const rayDir = vec2(1, 0);
    const enemyCenter = vec2(200, 100);
    const enemyRadius = 15;

    const hit = rayIntersectsCircle(rayOrigin, rayDir, enemyCenter, enemyRadius);

    expect(hit).not.toBeNull();
    // Distance to perimeter = 200 - 15 = 185
    expect(hit!.distance).toBeCloseTo(185, 5);
    expect(hit!.point.x).toBeCloseTo(185, 5);
    expect(hit!.point.y).toBeCloseTo(100, 5);
    expect(hit!.normal.x).toBeCloseTo(-1, 5);
    expect(hit!.normal.y).toBeCloseTo(0, 5);
  });

  it("detects raycast impact against rectangular cover obstacles (AABB)", () => {
    const rayOrigin = vec2(50, 150);
    const rayDir = vec2(1, 0);
    const pillarMin = vec2(200, 100);
    const pillarMax = vec2(250, 200);

    const hit = rayIntersectsAABB(rayOrigin, rayDir, pillarMin, pillarMax);

    expect(hit).not.toBeNull();
    expect(hit!.distance).toBe(150);
    expect(hit!.point.x).toBe(200);
    expect(hit!.point.y).toBe(150);
    expect(hit!.normal.x).toBe(-1);
    expect(hit!.normal.y).toBe(0);
  });

  it("determines if circle overlaps or clears line segments", () => {
    const wallStart = vec2(100, 0);
    const wallEnd = vec2(100, 100);

    // Circle centered at (95, 50) with radius 10 penetrates wall at x=100
    expect(circleIntersectsSegment(vec2(95, 50), 10, wallStart, wallEnd)).toBe(true);

    // Circle centered at (80, 50) with radius 10 does not touch wall
    expect(circleIntersectsSegment(vec2(80, 50), 10, wallStart, wallEnd)).toBe(false);
  });
});
