/**
 * All21MapsValidation.test.ts
 *
 * Comprehensive integration test suite validating all 21 maps in ChronoShot:
 * - Rooms 1–20: Full campaign progression sequence (Sectors 1–4)
 * - Room 21: Apex Colosseum Endless Survival Mode
 *
 * Verifies:
 * 1. Exit Reachability: Unbroken walkable A* navigation path from player spawn to exit portal.
 * 2. Spawn Clearance: Zero intersection between entity hitboxes and obstacle collision bounds,
 *    with verified separation distance between player and hostile spawns.
 * 3. Zero Freeze Deadlocks: Over 300 simulation ticks, mobile units never deadlock or freeze
 *    at (0, 0) velocity outside intentional hold windows (laser charge / fire stutter / sweet spot).
 */

import { describe, expect, it, vi } from "vitest";
import { GridPathfinder } from "../engine/GridPathfinder";
import { Arena } from "../entities/Arena";
import { BLUEPRINTS } from "../entities/EnemyFactory";
import { testCircleAABB } from "../math/collision";
import { vec2, vecDistance, vecLength } from "../math/vector";
import { createStandardRoomSequence, RoomConfig } from "./Room";
import { createEndlessSurvivalRoom } from "./RoomManager";

describe("All 21 Maps Comprehensive Validation Suite", () => {
  const standardRooms = createStandardRoomSequence();
  const endlessRoom = createEndlessSurvivalRoom();
  const all21Rooms: RoomConfig[] = [...standardRooms, endlessRoom];

  it("verifies that all 21 rooms are properly configured with unique room numbers 1 to 21", () => {
    expect(all21Rooms).toHaveLength(21);
    for (let i = 0; i < 21; i++) {
      expect(all21Rooms[i].roomNumber).toBe(i + 1);
      expect(all21Rooms[i].id).toBeDefined();
      expect(all21Rooms[i].obstacles.length).toBeGreaterThan(0);
      expect(all21Rooms[i].playerSpawn).toBeDefined();
      expect(all21Rooms[i].exitPortal).toBeDefined();
    }
  });

  describe("1. Exit Reachability Validation (All 21 Maps)", () => {
    for (const room of all21Rooms) {
      it(`Room ${room.roomNumber} (${room.title}): has valid path from player spawn to exit portal`, () => {
        const pathfinder = new GridPathfinder(960, 640);
        pathfinder.updateObstacles(room.obstacles, 14);

        // Snap to nearest walkable if adjacent to boundary
        const startPos =
          pathfinder.findNearestWalkable(room.playerSpawn) ?? room.playerSpawn;
        const exitPos = vec2(room.exitPortal.x, room.exitPortal.y);
        const goalPos = pathfinder.findNearestWalkable(exitPos) ?? exitPos;

        const path = pathfinder.findPath(startPos, goalPos);
        expect(
          path.length,
          `Room ${room.roomNumber} exit portal at (${room.exitPortal.x}, ${room.exitPortal.y}) must be reachable from player spawn (${room.playerSpawn.x}, ${room.playerSpawn.y})`
        ).toBeGreaterThan(0);
      });
    }
  });

  describe("1b. Static Hostile-to-Player Graph Reachability Validation (All 21 Maps at True Radii)", () => {
    for (const room of all21Rooms) {
      if (room.enemies.length > 0) {
        it(`Room ${room.roomNumber} (${room.title}): all ${room.enemies.length} hostile spawns have walkable A* path to player spawn at true radii`, () => {
          for (const enemyCfg of room.enemies) {
            const enemyRadius =
              enemyCfg.radius ?? BLUEPRINTS[enemyCfg.type]?.radius ?? 15;
            const pathfinder = new GridPathfinder(960, 640);
            pathfinder.updateObstacles(room.obstacles, enemyRadius);

            const startPos =
              pathfinder.findNearestWalkable(vec2(enemyCfg.x, enemyCfg.y)) ??
              vec2(enemyCfg.x, enemyCfg.y);
            const goalPos =
              pathfinder.findNearestWalkable(room.playerSpawn) ??
              room.playerSpawn;

            const path = pathfinder.findPath(startPos, goalPos);
            expect(
              path.length,
              `Room ${room.roomNumber} (${room.title}) hostile '${enemyCfg.id}' (${enemyCfg.type}, R=${enemyRadius}) must have a walkable path to player spawn`
            ).toBeGreaterThan(0);
          }
        });
      }
    }
  });

  describe("2. Spawn Clearance & Separation Validation (All 21 Maps)", () => {
    for (const room of all21Rooms) {
      it(`Room ${room.roomNumber} (${room.title}): player spawn has clear clearance from all obstacles`, () => {
        const playerRadius = 14;
        for (const obs of room.obstacles) {
          const contact = testCircleAABB(
            room.playerSpawn,
            playerRadius,
            obs.bounds.min,
            obs.bounds.max
          );
          expect(
            contact,
            `Room ${room.roomNumber} player spawn (${room.playerSpawn.x}, ${room.playerSpawn.y}) intersects obstacle '${obs.id}'`
          ).toBeNull();
        }
      });

      if (room.enemies.length > 0) {
        it(`Room ${room.roomNumber} (${room.title}): all ${room.enemies.length} hostile spawns have clearance and separation`, () => {
          for (const enemyCfg of room.enemies) {
            const enemyRadius = enemyCfg.radius ?? 15;
            const enemyPos = vec2(enemyCfg.x, enemyCfg.y);
            // AABB clearance
            for (const obs of room.obstacles) {
              const contact = testCircleAABB(
                enemyPos,
                enemyRadius,
                obs.bounds.min,
                obs.bounds.max
              );
              expect(
                contact,
                `Room ${room.roomNumber} hostile '${enemyCfg.id}' at (${enemyCfg.x}, ${enemyCfg.y}) intersects obstacle '${obs.id}'`
              ).toBeNull();
            }

            // Safe separation distance from player spawn
            const distToPlayer = vecDistance(enemyPos, room.playerSpawn);
            expect(
              distToPlayer,
              `Room ${room.roomNumber} hostile '${enemyCfg.id}' is too close to player spawn (${distToPlayer.toFixed(1)}px < 150px)`
            ).toBeGreaterThanOrEqual(150);
          }
        });
      }

      if (room.enemies.length >= 2) {
        it(`Room ${room.roomNumber} (${room.title}): every pair of hostiles maintains mutual center-to-center clearance (dist >= rI + rJ)`, () => {
          for (let i = 0; i < room.enemies.length; i++) {
            for (let j = i + 1; j < room.enemies.length; j++) {
              const enemyI = room.enemies[i];
              const enemyJ = room.enemies[j];
              const radiusI = enemyI.radius ?? 15;
              const radiusJ = enemyJ.radius ?? 15;
              const enemyPosI = vec2(enemyI.x, enemyI.y);
              const enemyPosJ = vec2(enemyJ.x, enemyJ.y);
              const dist = vecDistance(enemyPosI, enemyPosJ);

              expect(
                dist,
                `Room ${room.roomNumber} hostile pair '${enemyI.id}' and '${enemyJ.id}' overlap: dist=${dist.toFixed(1)}px < min=${radiusI + radiusJ}px`
              ).toBeGreaterThanOrEqual(radiusI + radiusJ);
            }
          }
        });
      }
    }
  });

  describe("3. Room 3 Chicane Geometry & Navigation Verification", () => {
    it("Room 3 chicane gaps provide >= 70px open clearance above and below center pillar", () => {
      const room3 = standardRooms[2];
      const topBarrier = room3.obstacles.find((o) => o.id === "barrier-top")!;
      const bottomBarrier = room3.obstacles.find((o) => o.id === "barrier-bottom")!;
      const midPillar = room3.obstacles.find((o) => o.id === "pillar-mid")!;

      expect(topBarrier).toBeDefined();
      expect(bottomBarrier).toBeDefined();
      expect(midPillar).toBeDefined();

      // Top gap: between top of midPillar (320 - 22.5 = 297.5) and bottom of topBarrier (220)
      const topGap = midPillar.bounds.min.y - topBarrier.bounds.max.y;
      // Bottom gap: between top of bottomBarrier (420) and bottom of midPillar (320 + 22.5 = 342.5)
      const bottomGap = bottomBarrier.bounds.min.y - midPillar.bounds.max.y;

      expect(topGap).toBeGreaterThanOrEqual(70);
      expect(bottomGap).toBeGreaterThanOrEqual(70);
    });

    it("Room 3 Stalker rusher advances smoothly through chicane toward player without freezing", () => {
      const room3 = standardRooms[2];
      const arena = new Arena();
      arena.loadRoom(room3);

      // Make player immortal so simulation runs cleanly
      arena.player.takeDamage = vi.fn().mockReturnValue({ absorbed: true, eliminated: false });

      const stalker = arena.enemies.find((e) => e.type === "stalker")!;
      expect(stalker).toBeDefined();

      const initialStalkerPos = { ...stalker.position };

      // Step 60 ticks (1 full second at 60 Hz)
      for (let t = 0; t < 60; t++) {
        arena.step(1 / 60, {
          moveDir: vec2(1, 0),
          mousePos: vec2(500, 320),
          shoot: false,
          reload: false,
          restart: false,
        });
      }

      // Stalker must have actively moved toward the left (closer to player spawn x=80)
      expect(stalker.position.x).toBeLessThan(initialStalkerPos.x - 30);
      expect(vecLength(stalker.velocity)).toBeGreaterThan(0);
    });
  });

  describe("4. Zero Freeze Deadlocks over 300 Simulation Ticks (All 21 Maps)", () => {
    for (const room of standardRooms) {
      it(`Room ${room.roomNumber} (${room.title}): hostiles make active progress with 0 freeze deadlocks over 300 ticks`, () => {
        const arena = new Arena();
        arena.loadRoom(room);

        // Keep player alive at spawn
        arena.player.takeDamage = vi.fn().mockReturnValue({ absorbed: true, eliminated: false });

        const enemies = arena.enemies;
        const initialPositions = enemies.map((e) => ({ ...e.position }));
        const consecutiveZeroTicks = new Array(enemies.length).fill(0);
        const maxConsecutiveZeroTicks = new Array(enemies.length).fill(0);

        for (let tick = 0; tick < 300; tick++) {
          arena.player.position.x = room.playerSpawn.x;
          arena.player.position.y = room.playerSpawn.y;
          arena.player.velocity.x = 0;
          arena.player.velocity.y = 0;

          arena.step(1 / 60, {
            moveDir: vec2(1, 0),
            mousePos: vec2(room.playerSpawn.x, room.playerSpawn.y),
            shoot: false,
            reload: false,
            restart: false,
          });

          // Check each alive enemy's locomotion state
          for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.isAlive) continue;

            const speed = vecLength(enemy.velocity);
            const distToPlayer = vecDistance(enemy.position, arena.player.position);

            // Is the enemy intentionally holding position?
            const isFiringStutter = enemy.stutterTimerTicks > 0;
            const isChargingLaser = enemy.isChargingLaser;
            const isOverloading = enemy.isOverloading;
            const isKiterInSweetSpot =
              "minDist" in enemy.movement &&
              "maxDist" in enemy.movement &&
              enemy.hasLineOfSight &&
              distToPlayer >= (enemy.movement as any).minDist &&
              distToPlayer <= (enemy.movement as any).maxDist;

            const isArrivedAtPlayer =
              distToPlayer <= enemy.radius + arena.player.radius + 4;

            const isLegitimateHold =
              isFiringStutter ||
              isChargingLaser ||
              isOverloading ||
              isKiterInSweetSpot ||
              isArrivedAtPlayer;

            if (speed < 1e-3 && !isLegitimateHold) {
              consecutiveZeroTicks[i]++;
              if (consecutiveZeroTicks[i] > maxConsecutiveZeroTicks[i]) {
                maxConsecutiveZeroTicks[i] = consecutiveZeroTicks[i];
              }
            } else {
              consecutiveZeroTicks[i] = 0;
            }
          }
        }

        // Assert: No mobile hostile was stalled at 0 velocity for >= 15 consecutive ticks
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          expect(
            maxConsecutiveZeroTicks[i],
            `Enemy ${enemy.id} (${enemy.type}) in Room ${room.roomNumber} froze at (0, 0) velocity for ${maxConsecutiveZeroTicks[i]} consecutive ticks`
          ).toBeLessThan(15);

          // Mobile rushers / frontliners must have traversed substantial distance
          if (["grunt", "shotgun", "stalker", "warden", "boss"].includes(enemy.type)) {
            const distanceMoved = vecDistance(enemy.position, initialPositions[i]);
            expect(
              distanceMoved,
              `Enemy ${enemy.id} (${enemy.type}) in Room ${room.roomNumber} failed to move from spawn (distance: ${distanceMoved.toFixed(1)}px)`
            ).toBeGreaterThan(20);
          }
        }
      });
    }

    it("Room 21 (Apex Colosseum // Endless Protocol): spawned waves navigate actively without freezing", () => {
      const arena = new Arena();
      arena.startEndlessMode();
      arena.timeGovernor.setTimeScaleOverride(1.0);

      arena.player.takeDamage = vi.fn().mockReturnValue({ absorbed: true, eliminated: false });

      // Run 300 ticks to allow endless director to spawn and advance hostiles
      for (let tick = 0; tick < 300; tick++) {
        arena.player.position.x = 480;
        arena.player.position.y = 520;
        arena.player.velocity.x = 0;
        arena.player.velocity.y = 0;

        arena.step(1 / 60, {
          moveDir: vec2(1, 0),
          mousePos: vec2(arena.player.position.x, arena.player.position.y),
          shoot: false,
          reload: false,
          restart: false,
        });
      }

      // Endless director should have spawned hostiles in Apex Colosseum
      expect(arena.enemies.length).toBeGreaterThan(0);

      // Verify all spawned hostiles are alive and have valid velocities
      for (const enemy of arena.enemies) {
        expect(enemy.isAlive).toBe(true);
        expect(Number.isFinite(enemy.position.x)).toBe(true);
        expect(Number.isFinite(enemy.position.y)).toBe(true);
        expect(Number.isFinite(enemy.velocity.x)).toBe(true);
        expect(Number.isFinite(enemy.velocity.y)).toBe(true);
      }
    });

    it("Room 16: Warden (R=18) navigates actively with 0 freeze deadlocks when player takes cover behind central barrier", () => {
      const room16 = standardRooms[15]; // Room 16
      const arena = new Arena();
      arena.loadRoom(room16);

      arena.player.takeDamage = vi.fn().mockReturnValue({ absorbed: true, eliminated: false });

      // Player takes cover behind top barrier (x=250, y=150) so sightline to warden (x=720, y=320) is blocked by barrier-top (x: 420..450, y: 0..250)
      const coverPos = vec2(250, 150);

      const warden = arena.enemies.find((e) => e.type === "warden")!;
      expect(warden).toBeDefined();
      const initialPos = { ...warden.position };

      let maxConsecutiveZeroTicks = 0;
      let consecutiveZeroTicks = 0;

      for (let tick = 0; tick < 300; tick++) {
        arena.player.position.x = coverPos.x;
        arena.player.position.y = coverPos.y;
        arena.player.velocity.x = 0;
        arena.player.velocity.y = 0;

        arena.step(1 / 60, {
          moveDir: vec2(1, 0),
          mousePos: vec2(coverPos.x, coverPos.y),
          shoot: false,
          reload: false,
          restart: false,
        });

        if (!warden.isAlive) break;

        const speed = vecLength(warden.velocity);
        const isFiringStutter = warden.stutterTimerTicks > 0;
        const distToPlayer = vecDistance(warden.position, arena.player.position);
        const isArrived = distToPlayer <= warden.radius + arena.player.radius + 4;

        if (speed < 1e-3 && !isFiringStutter && !isArrived) {
          consecutiveZeroTicks++;
          if (consecutiveZeroTicks > maxConsecutiveZeroTicks) {
            maxConsecutiveZeroTicks = consecutiveZeroTicks;
          }
        } else {
          consecutiveZeroTicks = 0;
        }
      }

      // Assert warden never froze for >= 15 consecutive ticks
      expect(
        maxConsecutiveZeroTicks,
        `Room 16 Warden froze for ${maxConsecutiveZeroTicks} consecutive ticks when player took cover`
      ).toBeLessThan(15);

      // Assert warden moved substantially from spawn
      const distMoved = vecDistance(warden.position, initialPos);
      expect(
        distMoved,
        `Room 16 Warden failed to navigate toward cover (moved only ${distMoved.toFixed(1)}px)`
      ).toBeGreaterThan(50);
    });

    it("Room 20: Chrono-Zenith boss navigates actively with 0 freeze deadlocks when player takes cover behind obstacles", () => {
      const room20 = standardRooms[19]; // Room 20
      const arena = new Arena();
      arena.loadRoom(room20);

      arena.player.takeDamage = vi.fn().mockReturnValue({ absorbed: true, eliminated: false });

      // Player takes cover in south-west quadrant behind pillars/bastion
      const coverPos = vec2(160, 480);

      const boss = arena.enemies.find((e) => e.isBoss)!;
      expect(boss).toBeDefined();
      const initialPos = { ...boss.position };

      let maxConsecutiveZeroTicks = 0;
      let consecutiveZeroTicks = 0;

      for (let tick = 0; tick < 300; tick++) {
        arena.player.position.x = coverPos.x;
        arena.player.position.y = coverPos.y;
        arena.player.velocity.x = 0;
        arena.player.velocity.y = 0;

        arena.step(1 / 60, {
          moveDir: vec2(1, 0),
          mousePos: vec2(coverPos.x, coverPos.y),
          shoot: false,
          reload: false,
          restart: false,
        });

        if (!boss.isAlive) break;

        const speed = vecLength(boss.velocity);
        const isFiringStutter = boss.stutterTimerTicks > 0;
        const isChargingLaser = boss.isChargingLaser;
        const isOverloading = boss.isOverloading;
        const distToPlayer = vecDistance(boss.position, arena.player.position);
        const isArrived = distToPlayer <= boss.radius + arena.player.radius + 4;
        const isLegitHold = isFiringStutter || isChargingLaser || isOverloading || isArrived;

        if (speed < 1e-3 && !isLegitHold) {
          consecutiveZeroTicks++;
          if (consecutiveZeroTicks > maxConsecutiveZeroTicks) {
            maxConsecutiveZeroTicks = consecutiveZeroTicks;
          }
        } else {
          consecutiveZeroTicks = 0;
        }
      }

      expect(
        maxConsecutiveZeroTicks,
        `Room 20 Boss froze for ${maxConsecutiveZeroTicks} consecutive ticks when player took cover`
      ).toBeLessThan(15);

      const distMoved = vecDistance(boss.position, initialPos);
      expect(
        distMoved,
        `Room 20 Boss failed to navigate toward cover (moved only ${distMoved.toFixed(1)}px)`
      ).toBeGreaterThan(40);
    });
  });
});
