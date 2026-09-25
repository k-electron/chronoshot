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

  it("falls back to direct pursuit when sightline is clear but A* returns empty path", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(100, 100),
      speed: 120,
      hasLineOfSight: true,
    });
    const target = createMockTarget(200, 100);

    const mockPf = new GridPathfinder(960, 640, 40);
    mockPf.findPath = () => [];

    // Simulate an obstacle blocking physical clearance so it invokes pathfinder
    const obstacle = createObstacle("blocking", 140, 90, 20, 20);
    const vel = behavior.update(ctx, target, [obstacle], 1, 1 / 60, mockPf);

    // Direct vector fallback toward target (+X)
    expect(vel.x).toBeCloseTo(120);
    expect(vel.y).toBeCloseTo(0);
  });

  it("falls back to nearest walkable cell when sightline is blocked and A* returns empty path", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(400, 200),
      speed: 120,
      hasLineOfSight: false,
    });
    const target = createMockTarget(100, 200);

    const mockPf = new GridPathfinder(960, 640, 40);
    mockPf.findPath = () => [];
    mockPf.findNearestWalkable = () => vec2(200, 200);

    const vel = behavior.update(ctx, target, [], 1, 1 / 60, mockPf);

    // Nearest walkable fallback toward (200, 200) which is left (-X)
    expect(vel.x).toBeCloseTo(-120);
    expect(vel.y).toBeCloseTo(0);
  });

  it("halts forward velocity when at or within surface arrival distance (radius_self + radius_target + 2px)", () => {
    const behavior = new DirectAdvanceBehavior();
    const ctx = createMockContext({
      position: vec2(100, 100),
      radius: 15,
      speed: 120,
      hasLineOfSight: true,
    });
    // Target radius = 12. arrivalDist = 15 + 12 + 2 = 29px
    const targetAtArrival = createMockTarget(129, 100); // distance = 29px exactly
    const velAtArrival = behavior.update(ctx, targetAtArrival, [], 1);
    expect(velAtArrival.x).toBe(0);
    expect(velAtArrival.y).toBe(0);

    const targetInsideArrival = createMockTarget(120, 100); // distance = 20px (< 29px)
    const velInsideArrival = behavior.update(ctx, targetInsideArrival, [], 1);
    expect(velInsideArrival.x).toBe(0);
    expect(velInsideArrival.y).toBe(0);

    const targetOutsideArrival = createMockTarget(135, 100); // distance = 35px (> 29px)
    const velOutsideArrival = behavior.update(ctx, targetOutsideArrival, [], 1);
    expect(velOutsideArrival.x).toBeCloseTo(120);
    expect(velOutsideArrival.y).toBeCloseTo(0);
  });

  it("fans out laterally instead of collapsing into a single line when two units advance toward the same target", () => {
    const behavior1 = new DirectAdvanceBehavior();
    const behavior2 = new DirectAdvanceBehavior();

    const target = createMockTarget(300, 200);

    // Two units positioned 10px apart vertically (dist = 10 < R_sep = 64px)
    const unit1: CombatUnit = {
      id: "unit-1",
      position: vec2(100, 195),
      radius: 14,
      isAlive: true,
      velocity: vec2(0, 0),
      kill: () => {},
    };
    const unit2: CombatUnit = {
      id: "unit-2",
      position: vec2(100, 205),
      radius: 14,
      isAlive: true,
      velocity: vec2(0, 0),
      kill: () => {},
    };

    const ctx1 = createMockContext({
      position: unit1.position,
      radius: 14,
      speed: 100,
      hasLineOfSight: true,
    });
    const ctx2 = createMockContext({
      position: unit2.position,
      radius: 14,
      speed: 100,
      hasLineOfSight: true,
    });

    // Without neighbors: both would converge toward y=200
    const vel1NoFlock = behavior1.update(ctx1, target, [], 1);
    const vel2NoFlock = behavior2.update(ctx2, target, [], 1);
    expect(vel1NoFlock.y).toBeGreaterThan(0);
    expect(vel2NoFlock.y).toBeLessThan(0);

    // With neighbors: mutual repulsion pushes unit1 upward (-Y) and unit2 downward (+Y)
    const vel1 = behavior1.update(ctx1, target, [], 1, 1 / 60, undefined, [unit2]);
    const vel2 = behavior2.update(ctx2, target, [], 1, 1 / 60, undefined, [unit1]);

    expect(vel1.y).toBeLessThan(0);
    expect(vel2.y).toBeGreaterThan(0);
    expect(vel2.y - vel1.y).toBeGreaterThan(20);
    expect(vecLength(vel1)).toBeCloseTo(100);
    expect(vecLength(vel2)).toBeCloseTo(100);
  });

  it("smoothly queues behind a lead unit without jittering into walls in a narrow corridor", () => {
    const behavior = new DirectAdvanceBehavior();

    // Horizontal corridor between y=180 and y=220 (40px wide corridor)
    const wallTop = createObstacle("wall-top", 0, 140, 500, 40); // y: 140..180
    const wallBottom = createObstacle("wall-bottom", 0, 220, 500, 40); // y: 220..260
    const obstacles = [wallTop, wallBottom];

    const target = createMockTarget(400, 200);

    // Trailing unit at (100, 200), radius 15, speed 100
    const ctx = createMockContext({
      position: vec2(100, 200),
      radius: 15,
      speed: 100,
      hasLineOfSight: true,
    });

    // 1. Stationary lead unit at standoff distance (dist = 36px <= r1 + r2 + 6 = 36px)
    const stationaryLeadAtStandoff: CombatUnit = {
      id: "lead-stationary",
      position: vec2(136, 200),
      radius: 15,
      isAlive: true,
      velocity: vec2(0, 0),
      kill: () => {},
    };

    const velStandoff = behavior.update(
      ctx,
      target,
      obstacles,
      1,
      1 / 60,
      undefined,
      [stationaryLeadAtStandoff]
    );

    // Should come to a complete stop: zero forward and zero lateral velocity
    expect(velStandoff.x).toBe(0);
    expect(velStandoff.y).toBe(0);

    // 2. Slower moving lead unit ahead (moving at 30 px/s) at standoff distance
    const movingLeadAtStandoff: CombatUnit = {
      id: "lead-moving",
      position: vec2(136, 200),
      radius: 15,
      isAlive: true,
      velocity: vec2(30, 0),
      kill: () => {},
    };

    const velMovingStandoff = behavior.update(
      ctx,
      target,
      obstacles,
      1,
      1 / 60,
      undefined,
      [movingLeadAtStandoff]
    );

    // Should clamp forward velocity to match lead unit's 30 px/s with 0 lateral jitter
    expect(velMovingStandoff.x).toBeCloseTo(30);
    expect(velMovingStandoff.y).toBe(0);

    // 3. Lead unit slightly further ahead (dist = 42px > standoff 36px but < trigger 46px)
    const movingLeadApproaching: CombatUnit = {
      id: "lead-approaching",
      position: vec2(142, 200),
      radius: 15,
      isAlive: true,
      velocity: vec2(20, 0),
      kill: () => {},
    };

    const velDecelerating = behavior.update(
      ctx,
      target,
      obstacles,
      1,
      1 / 60,
      undefined,
      [movingLeadApproaching]
    );

    // Should smoothly decelerate between lead speed (20) and max speed (100) with zero lateral jitter
    expect(velDecelerating.x).toBeGreaterThan(20);
    expect(velDecelerating.x).toBeLessThan(100);
    expect(velDecelerating.y).toBe(0);
  });

  describe("Anti-Grind Tangent Fallback & Movement Watchdog", () => {
    it("deflects velocity along goal-aligned obstacle tangent when optical LOS is blocked and A* yields no path", () => {
      const behavior = new DirectAdvanceBehavior();
      // Wall directly beneath unit at y in [115, 200]
      const wall = createObstacle("wall-south", 50, 115, 200, 85);
      const mockPf = new GridPathfinder(960, 640, 20);
      mockPf.findPath = () => []; // No path found

      // Unit at (100, 100), radius 15. Distance to wall top (115) is 15px (in contact)
      const ctx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
      });
      // Target at (300, 200) -> goal direction has positive X (+200) and positive Y (+100)
      const target = createMockTarget(300, 200);

      const vel = behavior.update(ctx, target, [wall], 1, 1 / 60, mockPf);

      // Contact normal is (0, -1). Tangents: (+1, 0) and (-1, 0).
      // Goal direction has dx > 0, so goal-aligned tangent is (+1, 0).
      // Unit must slide along +X at speed 100 with 0 Y velocity!
      expect(vel.x).toBeCloseTo(100);
      expect(vel.y).toBeCloseTo(0);
    });

    it("applies directional hysteresis and switches tangents when active tangent is obstructed ahead", () => {
      const behavior = new DirectAdvanceBehavior();
      // Horizontal wall at bottom
      const wallBottom = createObstacle("wall-bottom", 50, 115, 200, 85);
      // Blocking obstacle directly ahead along +X (at x = 125..160)
      const wallEast = createObstacle("wall-east", 125, 50, 40, 65);

      const mockPf = new GridPathfinder(960, 640, 20);
      mockPf.findPath = () => [];

      const ctx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
      });
      // Target to the right (+X)
      const target = createMockTarget(300, 100);

      const vel = behavior.update(
        ctx,
        target,
        [wallBottom, wallEast],
        1,
        1 / 60,
        mockPf
      );

      // Even though target is to the east (+X), wallEast obstructs +X ahead.
      // Unit must deflect along the open reverse tangent (-X)
      expect(vel.x).toBeCloseTo(-100);
      expect(vel.y).toBeCloseTo(0);
    });

    it("detects movement stalls when displacement < 1.5px over 12 ticks during commanded velocity", () => {
      const behavior = new DirectAdvanceBehavior();
      const wall = createObstacle("blocking-wall", 120, 50, 40, 100);
      const mockPf = new GridPathfinder(960, 640, 20);
      mockPf.findPath = () => [];

      const ctx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
      });
      const target = createMockTarget(300, 100);

      // Tick 1: Initialize watchdog
      behavior.update(ctx, target, [wall], 1, 1 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);

      // Simulate 10 ticks without displacement (total 10 ticks < 12)
      for (let t = 0; t < 10; t++) {
        behavior.update(ctx, target, [wall], 1, 1 / 60, mockPf);
      }
      expect(behavior.stallTicks).toBe(10);

      // Advance 2 more ticks (total 12 ticks) -> triggers stall detection and resets stallTicks
      behavior.update(ctx, target, [wall], 2, 2 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);
      expect(behavior.repathCooldownTicks).toBe(20); // Forced repath occurred
    });

    it("resets watchdog stall counter during intentional pauses (laser charge, fire stutter, overload, zero speed)", () => {
      const behavior = new DirectAdvanceBehavior();
      const wall = createObstacle("wall", 120, 50, 40, 100);
      const mockPf = new GridPathfinder(960, 640, 20);
      mockPf.findPath = () => [];

      const target = createMockTarget(300, 100);

      // Accumulate 8 stall ticks
      const movingCtx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
      });
      behavior.update(movingCtx, target, [wall], 1, 1 / 60, mockPf);
      for (let t = 0; t < 7; t++) {
        behavior.update(movingCtx, target, [wall], 1, 1 / 60, mockPf);
      }
      expect(behavior.stallTicks).toBe(7);

      // 1. Weapon fire stutter pause: stallTicks must reset to 0
      const stutterCtx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
        stutterTimerTicks: 6,
      });
      behavior.update(stutterCtx, target, [wall], 1, 1 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);

      // 2. Laser charge pause: stallTicks must remain 0
      const laserCtx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
        isChargingLaser: true,
      });
      behavior.update(laserCtx, target, [wall], 1, 1 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);

      // 3. Cataclysm Overload pause: stallTicks must remain 0
      const overloadCtx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 100,
        hasLineOfSight: false,
        isOverloading: true,
      });
      behavior.update(overloadCtx, target, [wall], 1, 1 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);

      // 4. Zero speed: stallTicks must remain 0
      const zeroSpeedCtx = createMockContext({
        position: vec2(100, 100),
        radius: 15,
        speed: 0,
        hasLineOfSight: false,
      });
      behavior.update(zeroSpeedCtx, target, [wall], 1, 1 / 60, mockPf);
      expect(behavior.stallTicks).toBe(0);
    });
  });
});
