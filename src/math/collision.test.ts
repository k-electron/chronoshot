import { describe, expect, it } from "vitest";
import {
  circleIntersectsSegment,
  closestPointOnSegment,
  rayIntersectsAABB,
  rayIntersectsCircle,
  rayIntersectsSegment,
  testCircleAABB,
} from "./collision";
import { vec2 } from "./vector";

describe("Collision Mathematics", () => {
  describe("rayIntersectsAABB", () => {
    const min = vec2(100, 100);
    const max = vec2(200, 200);

    it("detects ray penetrating AABB from the left", () => {
      const origin = vec2(50, 150);
      const dir = vec2(1, 0);
      const hit = rayIntersectsAABB(origin, dir, min, max, 300);

      expect(hit).not.toBeNull();
      expect(hit!.point.x).toBeCloseTo(100);
      expect(hit!.point.y).toBeCloseTo(150);
      expect(hit!.normal.x).toBe(-1);
      expect(hit!.normal.y).toBe(0);
      expect(hit!.distance).toBeCloseTo(50);
    });

    it("returns null when ray points away or misses", () => {
      const origin = vec2(50, 150);
      const dirAway = vec2(-1, 0);
      expect(rayIntersectsAABB(origin, dirAway, min, max, 300)).toBeNull();

      const dirMiss = vec2(0, 1);
      expect(rayIntersectsAABB(origin, dirMiss, min, max, 300)).toBeNull();
    });

    it("respects maxDistance limit", () => {
      const origin = vec2(50, 150);
      const dir = vec2(1, 0);
      // Distance to wall is 50, so maxDistance 30 should not hit
      expect(rayIntersectsAABB(origin, dir, min, max, 30)).toBeNull();
    });
  });

  describe("rayIntersectsCircle", () => {
    const center = vec2(100, 100);
    const radius = 20;

    it("detects direct raycast hit on circle", () => {
      const origin = vec2(0, 100);
      const dir = vec2(1, 0);
      const hit = rayIntersectsCircle(origin, dir, center, radius);

      expect(hit).not.toBeNull();
      expect(hit!.point.x).toBeCloseTo(80); // 100 - 20
      expect(hit!.point.y).toBeCloseTo(100);
      expect(hit!.distance).toBeCloseTo(80);
      expect(hit!.normal.x).toBeCloseTo(-1);
      expect(hit!.normal.y).toBeCloseTo(0);
    });

    it("returns null when ray misses circle", () => {
      const origin = vec2(0, 150);
      const dir = vec2(1, 0);
      expect(rayIntersectsCircle(origin, dir, center, radius)).toBeNull();
    });
  });

  describe("testCircleAABB", () => {
    const min = vec2(100, 100);
    const max = vec2(200, 200);

    it("detects circle overlapping box edge and provides separation normal", () => {
      const center = vec2(90, 150);
      const radius = 15; // overlaps by 5px (100 - 90 = 10, radius 15)
      const col = testCircleAABB(center, radius, min, max);

      expect(col).not.toBeNull();
      expect(col!.collided).toBe(true);
      expect(col!.normal.x).toBeCloseTo(-1);
      expect(col!.normal.y).toBeCloseTo(0);
      expect(col!.depth).toBeCloseTo(5);
    });

    it("returns null when circle is separated from box", () => {
      const center = vec2(70, 150);
      const radius = 15;
      expect(testCircleAABB(center, radius, min, max)).toBeNull();
    });
  });

  describe("rayIntersectsSegment", () => {
    it("detects intersection with segment", () => {
      const origin = vec2(0, 50);
      const dir = vec2(1, 0);
      const segStart = vec2(50, 0);
      const segEnd = vec2(50, 100);

      const hit = rayIntersectsSegment(origin, dir, segStart, segEnd);
      expect(hit).not.toBeNull();
      expect(hit!.point.x).toBeCloseTo(50);
      expect(hit!.point.y).toBeCloseTo(50);
      expect(hit!.distance).toBeCloseTo(50);
    });
  });

  describe("circleIntersectsSegment & closestPointOnSegment", () => {
    it("finds closest point and checks circle intersection", () => {
      const segStart = vec2(0, 0);
      const segEnd = vec2(100, 0);
      const point = vec2(50, 20);

      const closest = closestPointOnSegment(point, segStart, segEnd);
      expect(closest.x).toBeCloseTo(50);
      expect(closest.y).toBeCloseTo(0);

      expect(circleIntersectsSegment(point, 25, segStart, segEnd)).toBe(true);
      expect(circleIntersectsSegment(point, 15, segStart, segEnd)).toBe(false);
    });
  });
});
