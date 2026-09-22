import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import { createRoom1, createRoom2, createRoom3 } from "./Room";
import { RoomManager } from "./RoomManager";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setLineDash: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  } as unknown as CanvasRenderingContext2D;
}

describe("Room Configuration & Sequence Schema", () => {
  it("constructs Room 1 as 1v1 basic cover with 1 Pistol Grunt and 1 central pillar", () => {
    const room1 = createRoom1();
    expect(room1.roomNumber).toBe(1);
    expect(room1.enemies).toHaveLength(1);
    expect(room1.enemies[0].type).toBe("grunt");

    // Central pillar + perimeter walls
    const pillars = room1.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(1);
    expect(pillars[0].id).toBe("pillar-center");
    expect(room1.exitPortal).toBeDefined();
    expect(room1.exitPortal.radius).toBeGreaterThan(0);
  });

  it("constructs Room 2 as 2v1 crossfire with 2 Pistol Grunts and 2 pillars", () => {
    const room2 = createRoom2();
    expect(room2.roomNumber).toBe(2);
    expect(room2.enemies).toHaveLength(2);
    expect(room2.enemies.every((e) => e.type === "grunt")).toBe(true);

    const pillars = room2.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(2);
    expect(room2.exitPortal).toBeDefined();
  });

  it("constructs Room 3 as Shotgun Guard + Pistol Grunt pressure with tactical cover", () => {
    const room3 = createRoom3();
    expect(room3.roomNumber).toBe(3);
    expect(room3.enemies).toHaveLength(2);

    const shotgunEnemies = room3.enemies.filter((e) => e.type === "shotgun");
    const gruntEnemies = room3.enemies.filter((e) => e.type === "grunt");
    expect(shotgunEnemies).toHaveLength(1);
    expect(gruntEnemies).toHaveLength(1);

    const coverObstacles = room3.obstacles.filter((o) => !o.id.startsWith("wall"));
    expect(coverObstacles.length).toBeGreaterThanOrEqual(2);
    expect(room3.exitPortal).toBeDefined();
  });
});

describe("RoomManager Tactical Puzzle Progression", () => {
  it("initializes at Room 1 with locked exit portal and incomplete game status", () => {
    const manager = new RoomManager();

    expect(manager.getRoomCount()).toBe(3);
    expect(manager.getCurrentRoomIndex()).toBe(0);
    expect(manager.getCurrentRoom().roomNumber).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);
    expect(manager.hasNextRoom()).toBe(true);
  });

  it("unlocks exit portal only when all active enemies in room are destroyed", () => {
    const manager = new RoomManager();

    // While enemy is alive, portal remains locked
    const enemies = [{ isAlive: true }];
    const unlockedFirst = manager.updateEnemyState(enemies);
    expect(unlockedFirst).toBe(false);
    expect(manager.isExitUnlocked()).toBe(false);

    // Enemy destroyed
    enemies[0].isAlive = false;
    const unlockedSecond = manager.updateEnemyState(enemies);
    expect(unlockedSecond).toBe(true);
    expect(manager.isExitUnlocked()).toBe(true);

    // Subsequent updates when already unlocked return false
    const unlockedThird = manager.updateEnemyState(enemies);
    expect(unlockedThird).toBe(false);
    expect(manager.isExitUnlocked()).toBe(true);
  });

  it("detects player entering the exit portal only when unlocked", () => {
    const manager = new RoomManager();
    const portal = manager.getCurrentRoom().exitPortal;
    const portalPos = vec2(portal.x, portal.y);
    const farPos = vec2(100, 100);

    // Player at portal position, but portal is locked
    expect(manager.isPlayerInExitPortal(portalPos)).toBe(false);

    // Unlock portal
    manager.setExitUnlocked(true);

    // Far away player
    expect(manager.isPlayerInExitPortal(farPos)).toBe(false);

    // Player inside portal radius
    expect(manager.isPlayerInExitPortal(portalPos)).toBe(true);

    // Player within contact boundary (portal.radius + player.radius)
    const edgePos = vec2(portal.x + portal.radius + 10, portal.y);
    expect(manager.isPlayerInExitPortal(edgePos, 14)).toBe(true);

    // Player beyond contact boundary
    const outsidePos = vec2(portal.x + portal.radius + 20, portal.y);
    expect(manager.isPlayerInExitPortal(outsidePos, 14)).toBe(false);
  });

  it("advances sequentially across 3 rooms and triggers game completion", () => {
    const manager = new RoomManager();

    // Room 1 -> Room 2
    manager.setExitUnlocked(true);
    expect(manager.advanceRoom()).toBe(true);
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.getCurrentRoom().roomNumber).toBe(2);
    expect(manager.isExitUnlocked()).toBe(false); // Relocks for next room
    expect(manager.isGameCompleted()).toBe(false);

    // Room 2 -> Room 3
    manager.setExitUnlocked(true);
    expect(manager.advanceRoom()).toBe(true);
    expect(manager.getCurrentRoomIndex()).toBe(2);
    expect(manager.getCurrentRoom().roomNumber).toBe(3);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.hasNextRoom()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);

    // Room 3 -> Game Completion
    manager.setExitUnlocked(true);
    const advancedPastEnd = manager.advanceRoom();
    expect(advancedPastEnd).toBe(false);
    expect(manager.isGameCompleted()).toBe(true);
  });

  it("supports restarting current room or full game sequence", () => {
    const manager = new RoomManager();

    // Advance to Room 2 and unlock portal
    manager.setExitUnlocked(true);
    manager.advanceRoom();
    manager.setExitUnlocked(true);
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(true);

    // Restart current room: index stays at 1, exit relocks
    manager.restartCurrentRoom();
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);

    // Advance to completion
    manager.advanceRoom(); // to room 3
    manager.advanceRoom(); // finish game
    expect(manager.isGameCompleted()).toBe(true);

    // Full game restart resets back to Room 1
    manager.restartGame();
    expect(manager.getCurrentRoomIndex()).toBe(0);
    expect(manager.getCurrentRoom().roomNumber).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);
  });

  it("renders portal, header, and victory overlay without errors", () => {
    const manager = new RoomManager();
    const ctx = createMockContext();

    // Locked portal render
    expect(() => manager.renderPortal(ctx, 0.016)).not.toThrow();

    // Unlocked portal render
    manager.setExitUnlocked(true);
    expect(() => manager.renderPortal(ctx, 0.016)).not.toThrow();

    // Room header render
    expect(() => manager.renderRoomHeader(ctx, 960)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith(
       expect.stringContaining("ROOM 01: BASIC COVER"),
       24,
       20
     );

    // Game victory overlay
    expect(() => manager.renderGameVictory(ctx, 960, 640)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith(
      "MISSION ACCOMPLISHED",
      480,
      245
    );
  });
});
