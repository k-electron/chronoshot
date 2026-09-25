import { describe, expect, it } from "vitest";
import {
  applyInelasticCircleImpulse,
  circleIntersectsSegment,
  closestPointOnSegment,
  hasNavigationClearance,
  rayIntersectsAABB,
  rayIntersectsCircle,
  rayIntersectsSegment,
  resolveCircleCircleCollision,
  testCircleAABB,
  testCircleCircle,
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

  describe("hasNavigationClearance", () => {
    const obstacle = {
      bounds: {
        min: vec2(100, 100),
        max: vec2(200, 200),
      },
    };

    it("returns true when corridor is completely clear with ample margin", () => {
      const from = vec2(50, 50);
      const to = vec2(250, 50);
      // Corridor y=50 is 50px away from obstacle y=100..200
      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(true);
    });

    it("returns false when optical sightline clears corner but unit radius collides with obstacle edge", () => {
      // Ray from (50, 95) to (250, 95) has y=95, which is outside [100, 200]
      // Optical 0-width raycast would NOT hit the obstacle
      const from = vec2(50, 95);
      const to = vec2(250, 95);

      // With radius 16, bottom of unit reaches 95 + 16 = 111 > 100 (collides!)
      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(false);

      // With radius 2, bottom of unit reaches 95 + 2 = 97 < 100 (clears!)
      expect(hasNavigationClearance(from, to, 2, [obstacle])).toBe(true);
    });

    it("returns false when diagonal trajectory cuts across an obstacle corner", () => {
      // Trajectory passing near top-left corner (100, 100)
      // Line from (80, 120) to (120, 80) passes right over (100, 100)
      const from = vec2(70, 130);
      const to = vec2(130, 70);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(false);
    });

    it("returns true when in contact with obstacle but moving away from it into open space", () => {
      // Unit center at (90, 150) with radius 16 touches/overlaps wall at x=100, but moves left to (50, 150)
      const from = vec2(90, 150);
      const to = vec2(50, 150);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(true);
    });

    it("returns false when in contact with obstacle and moving into it", () => {
      // Unit center at (90, 150) with radius 16 touches wall at x=100 and moves right toward (150, 150)
      const from = vec2(90, 150);
      const to = vec2(150, 150);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(false);
    });

    it("returns true when in contact with obstacle and moving parallel along its tangent", () => {
      // Unit center at (84, 150) with radius 16 touches wall at x=100 and moves down along tangent to (84, 250)
      const from = vec2(84, 150);
      const to = vec2(84, 250);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(true);
    });

    it("returns false when entity center is strictly inside the obstacle box", () => {
      // Unit center at (150, 150) is strictly inside obstacle [100, 200] x [100, 200]
      const from = vec2(150, 150);
      const to = vec2(50, 150);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(false);
    });

    it("returns true when distance to target is negligible", () => {
      const from = vec2(50, 50);
      const to = vec2(50, 50);

      expect(hasNavigationClearance(from, to, 16, [obstacle])).toBe(true);
    });
  });

  describe("testCircleCircle", () => {
    it("returns null when circles are completely separated", () => {
      const c1 = vec2(0, 0);
      const r1 = 10;
      const c2 = vec2(30, 0);
      const r2 = 10;

      expect(testCircleCircle(c1, r1, c2, r2)).toBeNull();
    });

    it("returns null when circles are exactly touching at their perimeter", () => {
      const c1 = vec2(0, 0);
      const r1 = 10;
      const c2 = vec2(20, 0);
      const r2 = 10;

      // Distance is exactly r1 + r2 = 20, no overlap
      expect(testCircleCircle(c1, r1, c2, r2)).toBeNull();
    });

    it("detects horizontal overlap and computes correct depth, normal, and contact point", () => {
      // c1 is at x=16, c2 is at x=0. Distance is 16.
      // r1 = 10, r2 = 10, minSpacing = 20. Overlap depth = 4.
      const c1 = vec2(16, 0);
      const r1 = 10;
      const c2 = vec2(0, 0);
      const r2 = 10;

      const hit = testCircleCircle(c1, r1, c2, r2);
      expect(hit).not.toBeNull();
      expect(hit!.collided).toBe(true);
      expect(hit!.depth).toBeCloseTo(4);
      // Normal points from c2 to c1 (away from c2)
      expect(hit!.normal.x).toBeCloseTo(1);
      expect(hit!.normal.y).toBeCloseTo(0);
      // Overlap region spans x=6 to x=10, midpoint is x=8
      expect(hit!.contactPoint.x).toBeCloseTo(8);
      expect(hit!.contactPoint.y).toBeCloseTo(0);
    });

    it("detects vertical overlap with unequal radii", () => {
      // c1 is at (0, 14), r1 = 8. Surface extends from y=6 to y=22.
      // c2 is at (0, 0), r2 = 12. Surface extends from y=-12 to y=12.
      // Overlap region spans y=6 to y=12, midpoint is y=9.
      const c1 = vec2(0, 14);
      const r1 = 8;
      const c2 = vec2(0, 0);
      const r2 = 12;

      const hit = testCircleCircle(c1, r1, c2, r2);
      expect(hit).not.toBeNull();
      expect(hit!.collided).toBe(true);
      expect(hit!.depth).toBeCloseTo(6); // (8 + 12) - 14 = 6
      expect(hit!.normal.x).toBeCloseTo(0);
      expect(hit!.normal.y).toBeCloseTo(1);
      expect(hit!.contactPoint.x).toBeCloseTo(0);
      expect(hit!.contactPoint.y).toBeCloseTo(9);
    });

    it("detects diagonal overlap and normal orientation", () => {
      // 3-4-5 triangle: dx = 30, dy = 40, dist = 50
      // r1 = 30, r2 = 30, minSpacing = 60, depth = 10
      const c1 = vec2(30, 40);
      const r1 = 30;
      const c2 = vec2(0, 0);
      const r2 = 30;

      const hit = testCircleCircle(c1, r1, c2, r2);
      expect(hit).not.toBeNull();
      expect(hit!.collided).toBe(true);
      expect(hit!.depth).toBeCloseTo(10);
      expect(hit!.normal.x).toBeCloseTo(0.6);
      expect(hit!.normal.y).toBeCloseTo(0.8);
      // Midpoint along normal: (0, 0) + (0.6, 0.8) * (30 - 5) = (15, 20)
      expect(hit!.contactPoint.x).toBeCloseTo(15);
      expect(hit!.contactPoint.y).toBeCloseTo(20);
    });

    it("resolves coincident circles deterministically without NaN", () => {
      // Identical coordinates
      const c1 = vec2(100, 200);
      const r1 = 15;
      const c2 = vec2(100, 200);
      const r2 = 25;

      const hit = testCircleCircle(c1, r1, c2, r2);
      expect(hit).not.toBeNull();
      expect(hit!.collided).toBe(true);
      expect(hit!.depth).toBeCloseTo(40);
      expect(Number.isNaN(hit!.depth)).toBe(false);
      expect(Number.isNaN(hit!.normal.x)).toBe(false);
      expect(Number.isNaN(hit!.normal.y)).toBe(false);
      expect(Number.isNaN(hit!.contactPoint.x)).toBe(false);
      expect(Number.isNaN(hit!.contactPoint.y)).toBe(false);
      expect(hit!.normal.x).toBe(1);
      expect(hit!.normal.y).toBe(0);
    });

    it("handles nearly coincident centers below epsilon smoothly", () => {
      const c1 = vec2(100 + 1e-7, 100);
      const r1 = 10;
      const c2 = vec2(100, 100);
      const r2 = 10;

      const hit = testCircleCircle(c1, r1, c2, r2);
      expect(hit).not.toBeNull();
      expect(hit!.collided).toBe(true);
      expect(hit!.normal.x).toBe(1);
      expect(hit!.normal.y).toBe(0);
      expect(hit!.depth).toBeCloseTo(20);
      expect(Number.isNaN(hit!.contactPoint.x)).toBe(false);
    });
  });

  describe("resolveCircleCircleCollision", () => {
    it("returns null when circles do not collide", () => {
      const posA = vec2(0, 0);
      const posB = vec2(100, 0);
      expect(resolveCircleCircleCollision(posA, 10, 0.5, posB, 10, 0.5)).toBeNull();
    });

    it("applies equal mass distribution (0.5 / 0.5)", () => {
      const posA = vec2(16, 0);
      const posB = vec2(0, 0);
      const rA = 10;
      const rB = 10;
      // Overlap depth = 4, normal points from B to A: (1, 0)
      const res = resolveCircleCircleCollision(posA, rA, 0.5, posB, rB, 0.5);

      expect(res).not.toBeNull();
      expect(res!.depth).toBeCloseTo(4);
      expect(res!.normal.x).toBeCloseTo(1);
      expect(res!.normal.y).toBeCloseTo(0);

      // displacementA = normal * depth * 0.5 = (2, 0)
      expect(res!.displacementA.x).toBeCloseTo(2);
      expect(res!.displacementA.y).toBeCloseTo(0);

      // displacementB = -normal * depth * 0.5 = (-2, 0)
      expect(res!.displacementB.x).toBeCloseTo(-2);
      expect(res!.displacementB.y).toBeCloseTo(0);

      // Verify separated positions have distance >= minSpacing (18 - (-2) = 20)
      const newPosA = { x: posA.x + res!.displacementA.x, y: posA.y + res!.displacementA.y };
      const newPosB = { x: posB.x + res!.displacementB.x, y: posB.y + res!.displacementB.y };
      const dist = Math.hypot(newPosA.x - newPosB.x, newPosA.y - newPosB.y);
      expect(dist).toBeCloseTo(20);
    });

    it("handles immovable entity A (0 / 1.0)", () => {
      const posA = vec2(16, 0);
      const posB = vec2(0, 0);
      const rA = 10;
      const rB = 10;
      const res = resolveCircleCircleCollision(posA, rA, 0.0, posB, rB, 1.0);

      expect(res).not.toBeNull();
      // Entity A takes 0 displacement
      expect(res!.displacementA.x).toBeCloseTo(0);
      expect(res!.displacementA.y).toBeCloseTo(0);

      // Entity B takes 100% displacement away from A
      expect(res!.displacementB.x).toBeCloseTo(-4);
      expect(res!.displacementB.y).toBeCloseTo(0);

      const newPosA = { x: posA.x + res!.displacementA.x, y: posA.y + res!.displacementA.y };
      const newPosB = { x: posB.x + res!.displacementB.x, y: posB.y + res!.displacementB.y };
      expect(newPosA.x).toBeCloseTo(16);
      expect(newPosB.x).toBeCloseTo(-4);
      expect(newPosA.x - newPosB.x).toBeCloseTo(20);
    });

    it("handles immovable entity B (1.0 / 0)", () => {
      const posA = vec2(16, 0);
      const posB = vec2(0, 0);
      const rA = 10;
      const rB = 10;
      const res = resolveCircleCircleCollision(posA, rA, 1.0, posB, rB, 0.0);

      expect(res).not.toBeNull();
      // Entity A takes 100% displacement away from B
      expect(res!.displacementA.x).toBeCloseTo(4);
      expect(res!.displacementA.y).toBeCloseTo(0);

      // Entity B takes 0 displacement
      expect(res!.displacementB.x).toBeCloseTo(0);
      expect(res!.displacementB.y).toBeCloseTo(0);

      const newPosA = { x: posA.x + res!.displacementA.x, y: posA.y + res!.displacementA.y };
      const newPosB = { x: posB.x + res!.displacementB.x, y: posB.y + res!.displacementB.y };
      expect(newPosA.x).toBeCloseTo(20);
      expect(newPosB.x).toBeCloseTo(0);
      expect(newPosA.x - newPosB.x).toBeCloseTo(20);
    });
  });

  describe("applyInelasticCircleImpulse", () => {
    it("cancels inward relative normal velocity for equal masses", () => {
      // Normal points from B to A: (1, 0)
      const normal = vec2(1, 0);
      const velA = vec2(-10, 0); // Moving left (toward B)
      const velB = vec2(10, 0);  // Moving right (toward A)

      applyInelasticCircleImpulse(velA, 0.5, velB, 0.5, normal);

      expect(velA.x).toBeCloseTo(0);
      expect(velA.y).toBeCloseTo(0);
      expect(velB.x).toBeCloseTo(0);
      expect(velB.y).toBeCloseTo(0);
    });

    it("preserves tangential sliding velocity completely", () => {
      const normal = vec2(1, 0);
      const velA = vec2(-10, 25);
      const velB = vec2(10, -15);

      applyInelasticCircleImpulse(velA, 0.5, velB, 0.5, normal);

      // Normal components (x) canceled
      expect(velA.x).toBeCloseTo(0);
      expect(velB.x).toBeCloseTo(0);
      // Tangential components (y) preserved
      expect(velA.y).toBeCloseTo(25);
      expect(velB.y).toBeCloseTo(-15);
    });

    it("cancels relative velocity into an immovable entity A (0 / 1.0)", () => {
      const normal = vec2(1, 0);
      const velA = vec2(0, 0);
      const velB = vec2(20, 10); // B moving into A

      applyInelasticCircleImpulse(velA, 0, velB, 1.0, normal);

      expect(velA.x).toBeCloseTo(0);
      expect(velA.y).toBeCloseTo(0);
      expect(velB.x).toBeCloseTo(0);
      expect(velB.y).toBeCloseTo(10); // Tangential preserved
    });

    it("cancels relative velocity into an immovable entity B (1.0 / 0)", () => {
      const normal = vec2(1, 0);
      const velA = vec2(-20, 15); // A moving into B
      const velB = vec2(0, 0);

      applyInelasticCircleImpulse(velA, 1.0, velB, 0, normal);

      expect(velA.x).toBeCloseTo(0);
      expect(velA.y).toBeCloseTo(15); // Tangential preserved
      expect(velB.x).toBeCloseTo(0);
      expect(velB.y).toBeCloseTo(0);
    });

    it("ignores separating velocities where velAlongNormal > 0", () => {
      const normal = vec2(1, 0);
      const velA = vec2(15, 5);  // A moving right (away from B)
      const velB = vec2(-10, -5); // B moving left (away from A)

      applyInelasticCircleImpulse(velA, 0.5, velB, 0.5, normal);

      // Velocities should remain completely unchanged
      expect(velA.x).toBeCloseTo(15);
      expect(velA.y).toBeCloseTo(5);
      expect(velB.x).toBeCloseTo(-10);
      expect(velB.y).toBeCloseTo(-5);
    });

    it("ignores parallel tangential motion where velAlongNormal == 0", () => {
      const normal = vec2(1, 0);
      const velA = vec2(0, 20);
      const velB = vec2(0, -20);

      applyInelasticCircleImpulse(velA, 0.5, velB, 0.5, normal);

      expect(velA.x).toBeCloseTo(0);
      expect(velA.y).toBeCloseTo(20);
      expect(velB.x).toBeCloseTo(0);
      expect(velB.y).toBeCloseTo(-20);
    });
  });
});
