import { describe, expect, it } from "vitest";
import { GridPathfinder } from "../../../engine/GridPathfinder";
import { vec2, vecLength } from "../../../math/vector";
import { createObstacle } from "../../Obstacle";
import { CombatUnit } from "../../Projectile";
import { DirectAdvanceBehavior } from "./DirectAdvanceBehavior";
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
    position: vec2(100, 100),
    previousPosition: vec2(100, 100),
    velocity: vec2(0, 0),
    radius: 15,
    speed: 120,
    aimAngle: 0,
    hasLineOfSight: true,
    ...overrides,
  };
}

describe("DirectAdvanceBehavior", () => {
  it("steers directly toward target along line-of-sight vector at ctx.speed", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(100, 100),
      speed: 120,
      hasLineOfSight: true,
    });
    const target = createMockTarget(200, 100); // 100px to the right

    const vel = behavior.update(ctx, target, [], 1);

    expect(vel.x).toBeCloseTo(120);
    expect(vel.y).toBeCloseTo(0);
    expect(vecLength(vel)).toBeCloseTo(120);
    expect(behavior.currentPath).toHaveLength(0);
  });

  it("steers diagonally toward target with normalized magnitude equal to ctx.speed", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(100, 100),
      speed: 100,
      hasLineOfSight: true,
    });
    const target = createMockTarget(200, 200); // 45 degrees down-right

    const vel = behavior.update(ctx, target, [], 1);

    const expectedComponent = 100 * Math.SQRT1_2; // ~70.71
    expect(vel.x).toBeCloseTo(expectedComponent);
    expect(vel.y).toBeCloseTo(expectedComponent);
    expect(vecLength(vel)).toBeCloseTo(100);
  });

  it("halts velocity when target is not alive or speed is zero", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({ speed: 120, hasLineOfSight: true });
    const deadTarget = createMockTarget(200, 100, false);

    const velDead = behavior.update(ctx, deadTarget, [], 1);
    expect(velDead.x).toBe(0);
    expect(velDead.y).toBe(0);

    const zeroSpeedCtx = createMockContext({ speed: 0, hasLineOfSight: true });
    const aliveTarget = createMockTarget(200, 100, true);
    const velZero = behavior.update(zeroSpeedCtx, aliveTarget, [], 1);
    expect(velZero.x).toBe(0);
    expect(velZero.y).toBe(0);
  });

  it("halts velocity when already exactly at target position", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(200, 200),
      speed: 120,
      hasLineOfSight: true,
    });
    const target = createMockTarget(200, 200);

    const vel = behavior.update(ctx, target, [], 1);
    expect(vel.x).toBe(0);
    expect(vel.y).toBe(0);
  });

  it("navigates around obstacles using A* when line-of-sight is blocked", () => {
    const behavior = new DirectAdvanceBehavior();
    const wall = createObstacle("blocking-wall", 250, 100, 40, 200);
    const pathfinder = new GridPathfinder(960, 640, 40);
    pathfinder.updateObstacles([wall], 15);

    const ctx = createMockContext({
      position: vec2(400, 200),
      radius: 15,
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(100, 200);

    const vel = behavior.update(ctx, target, [wall], 1, 1 / 60, pathfinder);

    expect(behavior.currentPath.length).toBeGreaterThan(0);
    // Steering around the wall must have active non-zero velocity
    expect(vecLength(vel)).toBeCloseTo(120);
    // Cooldown reset to repathIntervalTicks (20)
    expect(behavior.repathCooldownTicks).toBe(20);
  });

  it("advances waypoint index upon arriving within 18px waypoint arrival radius", () => {
    const behavior = new DirectAdvanceBehavior(18, 20);
    const pathfinder = new GridPathfinder(960, 640, 40);

    // Provide pre-set path waypoints
    behavior.currentPath = [vec2(105, 100), vec2(150, 100), vec2(200, 100)];
    behavior.currentWaypointIndex = 0;
    behavior.repathCooldownTicks = 15; // Not yet time to repath

    const ctx = createMockContext({
      position: vec2(100, 100), // Distance to waypoint 0 is 5px (< 18px radius)
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(200, 100);

    behavior.update(ctx, target, [], 1, 1 / 60, pathfinder);

    // Waypoint index should have advanced to 1 because distance 5 < 18
    expect(behavior.currentWaypointIndex).toBe(1);
  });

  it("decrements repath cooldown ticks and recalculates path when cooldown reaches zero", () => {
    const behavior = new DirectAdvanceBehavior(18, 20);
    const wall = createObstacle("wall-repath", 200, 50, 40, 200);
    const pathfinder = new GridPathfinder(960, 640, 40);
    pathfinder.updateObstacles([wall], 15);

    const ctx = createMockContext({
      position: vec2(300, 150),
      radius: 15,
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(100, 150);

    // First update triggers initial pathing and sets cooldown to 20
    behavior.update(ctx, target, [wall], 1, 1 / 60, pathfinder);
    expect(behavior.repathCooldownTicks).toBe(20);

    // Step 5 ticks
    behavior.update(ctx, target, [wall], 5, 5 / 60, pathfinder);
    expect(behavior.repathCooldownTicks).toBe(15);

    // Step 15 ticks to trigger cooldown expiration and repath
    behavior.update(ctx, target, [wall], 15, 15 / 60, pathfinder);
    expect(behavior.repathCooldownTicks).toBe(20);
  });

  it("resets internal path, waypoint index, and cooldown on reset()", () => {
    const behavior = new DirectAdvanceBehavior();
    behavior.currentPath = [vec2(50, 50), vec2(100, 100)];
    behavior.currentWaypointIndex = 1;
    behavior.repathCooldownTicks = 14;

    behavior.reset();

    expect(behavior.currentPath).toEqual([]);
    expect(behavior.currentWaypointIndex).toBe(0);
    expect(behavior.repathCooldownTicks).toBe(0);
  });

  it("clears path when sightline is regained (hasLineOfSight transitions to true)", () => {
    const behavior = new DirectAdvanceBehavior();
    behavior.currentPath = [vec2(200, 200), vec2(300, 300)];
    behavior.currentWaypointIndex = 1;

    const ctx = createMockContext({
      position: vec2(100, 100),
      speed: 120,
      hasLineOfSight: true,
    });
    const target = createMockTarget(200, 100);

    behavior.update(ctx, target, [], 1);

    expect(behavior.currentPath).toHaveLength(0);
    expect(behavior.currentWaypointIndex).toBe(0);
  });

  it("creates a default pathfinder if none is provided when LOS is blocked", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(100, 100),
      radius: 15,
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(300, 100);

    const vel = behavior.update(ctx, target, [], 1);
    expect(behavior.currentPath.length).toBeGreaterThan(0);
    expect(vecLength(vel)).toBeCloseTo(120);
  });

  it("generates a valid escape path and non-zero velocity when starting in an impassable clearance cell", () => {
    const behavior = new DirectAdvanceBehavior();
    const pillar = createObstacle("pillar", 200, 200, 80, 80);
    const pathfinder = new GridPathfinder(960, 640, 40);
    pathfinder.updateObstacles([pillar], 16);

    // Position (185, 220) is in cell (4, 5) which is marked impassable due to 16px clearance inflation
    const ctx = createMockContext({
      position: vec2(185, 220),
      radius: 16,
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(500, 220);

    const vel = behavior.update(ctx, target, [pillar], 1, 1 / 60, pathfinder);

    expect(behavior.currentPath.length).toBeGreaterThan(0);
    expect(vecLength(vel)).toBeCloseTo(120);
  });

  it("remains on A* waypoints when optical line-of-sight is true but physical clearance around corner is obstructed", () => {
    const behavior = new DirectAdvanceBehavior();
    const pillar = createObstacle("pillar", 200, 200, 80, 80);

    const waypoint1 = vec2(160, 160);
    const waypoint2 = vec2(240, 160);
    behavior.currentPath = [waypoint1, waypoint2];
    behavior.currentWaypointIndex = 0;
    behavior.repathCooldownTicks = 15;

    // Optical ray from (180, 195) to (320, 195) has y=195 < 200 (clears pillar optically)
    // But with radius 16, y + radius = 211 > 200 (intersects pillar corner physically)
    const ctx = createMockContext({
      position: vec2(180, 195),
      radius: 16,
      speed: 120,
      hasLineOfSight: true,
    });
    const target = createMockTarget(320, 195);

    const vel = behavior.update(ctx, target, [pillar], 1);

    // Because physical clearance is blocked, path should NOT be aborted
    expect(behavior.currentPath.length).toBe(2);
    expect(behavior.currentWaypointIndex).toBe(0);
    expect(vecLength(vel)).toBeCloseTo(120);
  });
});
