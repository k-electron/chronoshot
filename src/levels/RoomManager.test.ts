import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import {
  createRoom1,
  createRoom2,
  createRoom3,
  createRoom4,
  createRoom5,
} from "./Room";
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

    const pillars = room1.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(1);
    expect(pillars[0].id).toBe("pillar-center");
    expect(room1.exitPortal).toBeDefined();
    expect(room1.exitPortal.radius).toBeGreaterThan(0);
  });

  it("constructs Room 2 as Armored Breach with 1 Shotgun Guard and 1 Pistol Grunt", () => {
    const room2 = createRoom2();
    expect(room2.roomNumber).toBe(2);
    expect(room2.enemies).toHaveLength(2);
    expect(room2.enemies.some((e) => e.type === "shotgun")).toBe(true);
    expect(room2.enemies.some((e) => e.type === "grunt")).toBe(true);

    const pillars = room2.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(2);
    expect(room2.exitPortal).toBeDefined();
  });

  it("constructs Room 3 as Infiltration with 1 Stalker and 1 Pistol Grunt in corridor", () => {
    const room3 = createRoom3();
    expect(room3.roomNumber).toBe(3);
    expect(room3.enemies).toHaveLength(2);

    const stalkerEnemies = room3.enemies.filter((e) => e.type === "stalker");
    const gruntEnemies = room3.enemies.filter((e) => e.type === "grunt");
    expect(stalkerEnemies).toHaveLength(1);
    expect(gruntEnemies).toHaveLength(1);

    const barriers = room3.obstacles.filter((o) => o.id.includes("barrier"));
    expect(barriers.length).toBeGreaterThanOrEqual(2);
    expect(room3.exitPortal).toBeDefined();
  });

  it("constructs Room 4 as Line of Fire with Marksman sniper and Shotgun Guard", () => {
    const room4 = createRoom4();
    expect(room4.roomNumber).toBe(4);
    expect(room4.enemies).toHaveLength(2);

    const marksman = room4.enemies.find((e) => e.type === "marksman");
    const shotgun = room4.enemies.find((e) => e.type === "shotgun");
    expect(marksman).toBeDefined();
    expect(shotgun).toBeDefined();

    const bunkers = room4.obstacles.filter((o) => o.id.includes("bunker"));
    expect(bunkers.length).toBeGreaterThanOrEqual(2);
    expect(room4.exitPortal).toBeDefined();
  });

  it("constructs Room 5 as Tactical Gauntlet with Aegis Warden, Stalker, and Grunt", () => {
    const room5 = createRoom5();
    expect(room5.roomNumber).toBe(5);
    expect(room5.enemies).toHaveLength(3);

    const warden = room5.enemies.find((e) => e.type === "warden");
    const stalker = room5.enemies.find((e) => e.type === "stalker");
    const grunt = room5.enemies.find((e) => e.type === "grunt");

    expect(warden).toBeDefined();
    expect(warden?.maxShields).toBe(2);
    expect(stalker).toBeDefined();
    expect(grunt).toBeDefined();
    expect(room5.exitPortal).toBeDefined();
  });
});

describe("RoomManager Tactical Puzzle Progression", () => {
  it("initializes at Room 1 with locked exit portal and incomplete game status", () => {
    const manager = new RoomManager();

    expect(manager.getRoomCount()).toBe(5);
    expect(manager.getCurrentRoomIndex()).toBe(0);
    expect(manager.getCurrentRoom().roomNumber).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);
    expect(manager.hasNextRoom()).toBe(true);
  });

  it("unlocks exit portal only when all active enemies in room are destroyed", () => {
    const manager = new RoomManager();

    const enemies = [{ isAlive: true }];
    const unlockedFirst = manager.updateEnemyState(enemies);
    expect(unlockedFirst).toBe(false);
    expect(manager.isExitUnlocked()).toBe(false);

    enemies[0].isAlive = false;
    const unlockedSecond = manager.updateEnemyState(enemies);
    expect(unlockedSecond).toBe(true);
    expect(manager.isExitUnlocked()).toBe(true);

    const unlockedThird = manager.updateEnemyState(enemies);
    expect(unlockedThird).toBe(false);
    expect(manager.isExitUnlocked()).toBe(true);
  });

  it("detects player entering the exit portal only when unlocked", () => {
    const manager = new RoomManager();
    const portal = manager.getCurrentRoom().exitPortal;
    const portalPos = vec2(portal.x, portal.y);
    const farPos = vec2(100, 100);

    expect(manager.isPlayerInExitPortal(portalPos)).toBe(false);

    manager.setExitUnlocked(true);
    expect(manager.isPlayerInExitPortal(farPos)).toBe(false);
    expect(manager.isPlayerInExitPortal(portalPos)).toBe(true);

    const edgePos = vec2(portal.x + portal.radius + 10, portal.y);
    expect(manager.isPlayerInExitPortal(edgePos, 14)).toBe(true);

    const outsidePos = vec2(portal.x + portal.radius + 20, portal.y);
    expect(manager.isPlayerInExitPortal(outsidePos, 14)).toBe(false);
  });

  it("advances sequentially across 5 rooms and triggers game completion", () => {
    const manager = new RoomManager();

    // Rooms 1 -> 2 -> 3 -> 4 -> 5
    for (let i = 1; i <= 4; i++) {
      manager.setExitUnlocked(true);
      expect(manager.advanceRoom()).toBe(true);
      expect(manager.getCurrentRoomIndex()).toBe(i);
      expect(manager.getCurrentRoom().roomNumber).toBe(i + 1);
      expect(manager.isExitUnlocked()).toBe(false);
      expect(manager.isGameCompleted()).toBe(false);
    }

    expect(manager.hasNextRoom()).toBe(false);

    // Final room -> Game completion
    manager.setExitUnlocked(true);
    const advancedPastEnd = manager.advanceRoom();
    expect(advancedPastEnd).toBe(false);
    expect(manager.isGameCompleted()).toBe(true);
  });

  it("supports restarting current room or full game sequence", () => {
    const manager = new RoomManager();

    manager.setExitUnlocked(true);
    manager.advanceRoom();
    manager.setExitUnlocked(true);
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(true);

    manager.restartCurrentRoom();
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);

    // Advance to room 5 then complete
    manager.advanceRoom(); // to room 3
    manager.advanceRoom(); // to room 4
    manager.advanceRoom(); // to room 5
    manager.advanceRoom(); // finish game
    expect(manager.isGameCompleted()).toBe(true);

    manager.restartGame();
    expect(manager.getCurrentRoomIndex()).toBe(0);
    expect(manager.getCurrentRoom().roomNumber).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);
  });

  it("renders portal, header, and victory overlay without errors", () => {
    const manager = new RoomManager();
    const ctx = createMockContext();

    expect(() => manager.renderPortal(ctx, 0.016)).not.toThrow();

    manager.setExitUnlocked(true);
    expect(() => manager.renderPortal(ctx, 0.016)).not.toThrow();

    expect(() => manager.renderRoomHeader(ctx, 960)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("ROOM 01: BASIC COVER"),
      24,
      20
    );

    expect(() => manager.renderGameVictory(ctx, 960, 640)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith(
      "MISSION ACCOMPLISHED",
      480,
      245
    );
  });
});
