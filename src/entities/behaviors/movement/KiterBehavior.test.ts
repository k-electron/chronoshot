import { describe, expect, it } from "vitest";
import { GridPathfinder } from "../../../engine/GridPathfinder";
import { vec2, vecLength } from "../../../math/vector";
import { createObstacle } from "../../Obstacle";
import { CombatUnit } from "../../Projectile";
import { KiterBehavior } from "./KiterBehavior";
import { MovementContext } from "./MovementBehavior";

function createMockTarget(x: number, y: number, isAlive: boolean = true): CombatUnit {
  return {
    id: "target-unit",
    position: vec2(x, y),
    radius: 12,
    isAlive,
    kill: () => {},
  };
}

function createMockContext(overrides?: Partial<MovementContext>): MovementContext {
  return {
    position: vec2(200, 200),
    previousPosition: vec2(200, 200),
    velocity: vec2(0, 0),
    radius: 14,
    speed: 80,
    aimAngle: 0,
    hasLineOfSight: true,
    ...overrides,
  };
}

describe("KiterBehavior", () => {
  it("initializes with default standoff distance parameters (340 min, 520 max)", () => {
    const kiter = new KiterBehavior();
    expect(kiter.minDist).toBe(340);
    expect(kiter.maxDist).toBe(520);
    expect(kiter.arrivalRadius).toBe(18);
    expect(kiter.repathIntervalTicks).toBe(20);
  });

  it("supports configurable minDist and maxDist via constructor arguments or config object", () => {
    const kiter1 = new KiterBehavior(300, 450);
    expect(kiter1.minDist).toBe(300);
    expect(kiter1.maxDist).toBe(450);

    const kiter2 = new KiterBehavior({ minDist: 250, maxDist: 400 });
    expect(kiter2.minDist).toBe(250);
    expect(kiter2.maxDist).toBe(400);
  });

  describe("when line-of-sight is clear (hasLineOfSight = true)", () => {
    it("retreats away from target at ctx.speed when distance is less than minDist", () => {
      const kiter = new KiterBehavior(340, 520);
      // Unit at (300, 200), target at (200, 200) -> distance is 100 (< 340)
      // Vector from target to unit is (+100, 0), so retreat direction is to the right (+X)
      const ctx = createMockContext({
        position: vec2(300, 200),
        speed: 80,
        hasLineOfSight: true,
      });
      const target = createMockTarget(200, 200);

      const vel = kiter.update(ctx, target, [], 1);

      expect(vel.x).toBeCloseTo(80);
      expect(vel.y).toBeCloseTo(0);
      expect(vecLength(vel)).toBeCloseTo(80);
      expect(kiter.currentPath).toHaveLength(0);
    });

    it("advances toward target at ctx.speed when distance is greater than maxDist", () => {
      const kiter = new KiterBehavior(340, 520);
      // Unit at (800, 200), target at (200, 200) -> distance is 600 (> 520)
      // Vector from unit to target is (-600, 0), so advance direction is to the left (-X)
      const ctx = createMockContext({
        position: vec2(800, 200),
        speed: 80,
        hasLineOfSight: true,
      });
      const target = createMockTarget(200, 200);

      const vel = kiter.update(ctx, target, [], 1);

      expect(vel.x).toBeCloseTo(-80);
      expect(vel.y).toBeCloseTo(0);
      expect(vecLength(vel)).toBeCloseTo(80);
      expect(kiter.currentPath).toHaveLength(0);
    });

    it("holds position (0, 0) when within sweet spot (minDist <= dist <= maxDist)", () => {
      const kiter = new KiterBehavior(340, 520);
      // Unit at (600, 200), target at (200, 200) -> distance is 400 (between 340 and 520)
      const ctx = createMockContext({
        position: vec2(600, 200),
        speed: 80,
        hasLineOfSight: true,
      });
      const target = createMockTarget(200, 200);

      const vel = kiter.update(ctx, target, [], 1);

      expect(vel.x).toBe(0);
      expect(vel.y).toBe(0);
    });

    it("holds position exactly at boundary thresholds (dist = 340 and dist = 520)", () => {
      const kiter = new KiterBehavior(340, 520);
      const target = createMockTarget(200, 200);

      // Distance exactly 340
      const ctxAtMin = createMockContext({
        position: vec2(540, 200),
        speed: 80,
        hasLineOfSight: true,
      });
      const velMin = kiter.update(ctxAtMin, target, [], 1);
      expect(velMin.x).toBe(0);
      expect(velMin.y).toBe(0);

      // Distance exactly 520
      const ctxAtMax = createMockContext({
        position: vec2(720, 200),
        speed: 80,
        hasLineOfSight: true,
      });
      const velMax = kiter.update(ctxAtMax, target, [], 1);
      expect(velMax.x).toBe(0);
      expect(velMax.y).toBe(0);
    });

    it("retreats backward when unit is on top of target (dist = 0)", () => {
      const kiter = new KiterBehavior(340, 520);
      const ctx = createMockContext({
        position: vec2(200, 200),
        speed: 80,
        aimAngle: 0, // Facing right
        hasLineOfSight: true,
      });
      const target = createMockTarget(200, 200);

      const vel = kiter.update(ctx, target, [], 1);
      // Facing right (0 rad), backward is left (Math.PI rad) -> vel.x is negative
      expect(vel.x).toBeCloseTo(-80);
      expect(vel.y).toBeCloseTo(0);
    });

    it("halts immediately if target is dead or speed is 0", () => {
      const kiter = new KiterBehavior();
      const deadTarget = createMockTarget(200, 200, false);
      const ctx = createMockContext({ speed: 80, hasLineOfSight: true });

      const vel1 = kiter.update(ctx, deadTarget, [], 1);
      expect(vel1.x).toBe(0);
      expect(vel1.y).toBe(0);

      const zeroSpeedCtx = createMockContext({ speed: 0, hasLineOfSight: true });
      const aliveTarget = createMockTarget(200, 200, true);
      const vel2 = kiter.update(zeroSpeedCtx, aliveTarget, [], 1);
      expect(vel2.x).toBe(0);
      expect(vel2.y).toBe(0);
    });
  });

  describe("when line-of-sight is obstructed (hasLineOfSight = false)", () => {
    it("pathfinds toward target via GridPathfinder when sightline is blocked", () => {
      const kiter = new KiterBehavior();
      const wall = createObstacle("wall-blocking", 250, 100, 40, 200);
      const pathfinder = new GridPathfinder(960, 640, 40);
      pathfinder.updateObstacles([wall], 14);

      const ctx = createMockContext({
        position: vec2(400, 200),
        radius: 14,
        speed: 80,
        hasLineOfSight: false,
      });
      const target = createMockTarget(100, 200);

      const vel = kiter.update(ctx, target, [wall], 1, 1 / 60, pathfinder);

      expect(kiter.currentPath.length).toBeGreaterThan(0);
      expect(vecLength(vel)).toBeCloseTo(80);
      expect(kiter.repathCooldownTicks).toBe(20);
    });

    it("advances waypoint index upon reaching within 18px of active waypoint", () => {
      const kiter = new KiterBehavior();
      kiter.currentPath = [vec2(208, 200), vec2(260, 200)];
      kiter.currentWaypointIndex = 0;
      kiter.repathCooldownTicks = 15;

      const ctx = createMockContext({
        position: vec2(200, 200), // Distance 8px (< 18px radius)
        speed: 80,
        hasLineOfSight: false,
      });
      const target = createMockTarget(300, 200);

      kiter.update(ctx, target, [], 1);
      expect(kiter.currentWaypointIndex).toBe(1);
    });

    it("resets internal path, waypoint index, and cooldown on reset()", () => {
      const kiter = new KiterBehavior();
      kiter.currentPath = [vec2(100, 100), vec2(200, 200)];
      kiter.currentWaypointIndex = 1;
      kiter.repathCooldownTicks = 12;

      kiter.reset();

      expect(kiter.currentPath).toEqual([]);
      expect(kiter.currentWaypointIndex).toBe(0);
      expect(kiter.repathCooldownTicks).toBe(0);
    });

    it("generates a valid escape path and non-zero velocity when starting in an impassable clearance cell", () => {
      const kiter = new KiterBehavior();
      const pillar = createObstacle("pillar", 200, 200, 80, 80);
      const pathfinder = new GridPathfinder(960, 640, 40);
      pathfinder.updateObstacles([pillar], 14);

      const ctx = createMockContext({
        position: vec2(185, 220),
        radius: 14,
        speed: 80,
        hasLineOfSight: false,
      });
      const target = createMockTarget(500, 220);

      const vel = kiter.update(ctx, target, [pillar], 1, 1 / 60, pathfinder);

      expect(kiter.currentPath.length).toBeGreaterThan(0);
      expect(vecLength(vel)).toBeCloseTo(80);
    });

    it("holds position instead of driving backwards into an obstacle when retreat path is obstructed", () => {
      const kiter = new KiterBehavior(300, 500);
      const wall = createObstacle("wall-behind", 50, 180, 40, 40);

      // Target at (200, 200). Unit at (105, 200). Dist = 95 < minDist (300).
      // Retreat vector points left (-1, 0) directly towards wall at x=50..90.
      const ctx = createMockContext({
        position: vec2(105, 200),
        radius: 14,
        speed: 80,
        hasLineOfSight: true,
      });
      const target = createMockTarget(200, 200);

      const vel = kiter.update(ctx, target, [wall], 1);

      expect(vel.x).toBe(0);
      expect(vel.y).toBe(0);
    });
  });
});
