import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import {
  createRoom1,
  createRoom2,
  createRoom3,
  createRoom4,
  createRoom5,
  createRoom6,
  createRoom7,
  createRoom8,
  createRoom9,
  createStandardRoomSequence,
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

  it("constructs Room 5 as Sector 1 Boss with Goliath Colossus and Grunt escorts", () => {
    const room5 = createRoom5();
    expect(room5.id).toBe("room-5");
    expect(room5.roomNumber).toBe(5);
    expect(room5.title).toBe("ROOM 05: SECTOR 1 BOSS");
    expect(room5.subtitle).toBe("Goliath-01 Aegis Colossus");
    expect(room5.tacticalTip).toBe(
      "Eliminate Goliath's 4 energy shields before targeting its exposed core! Watch for flanking grunts."
    );
    expect(room5.enemies).toHaveLength(3);

    const boss = room5.enemies.find((e) => e.id === "goliath-boss");
    expect(boss).toBeDefined();
    expect(boss?.type).toBe("boss");
    expect(boss?.maxShields).toBe(4);
    expect(boss?.fireCadenceTicks).toBe(60);
    expect(boss?.initialDelayTicks).toBe(25);

    const escorts = room5.enemies.filter((e) => e.type === "grunt");
    expect(escorts).toHaveLength(2);
    expect(room5.enemies.some((e) => e.id === "grunt-escort-top")).toBe(true);
    expect(room5.enemies.some((e) => e.id === "grunt-escort-bottom")).toBe(true);

    const leftPillar = room5.obstacles.find((o) => o.id === "pillar-bunker-left");
    const rightPillar = room5.obstacles.find((o) => o.id === "pillar-bunker-right");
    const divider = room5.obstacles.find((o) => o.id === "divider-block");
    expect(leftPillar).toBeDefined();
    expect(rightPillar).toBeDefined();
    expect(divider).toBeDefined();
    expect(room5.exitPortal).toBeDefined();
  });

  it("constructs Room 6 as Breach Protocol with dual Stalkers and Shotgun Guard", () => {
    const room6 = createRoom6();
    expect(room6.id).toBe("room-6");
    expect(room6.roomNumber).toBe(6);
    expect(room6.title).toBe("ROOM 06: BREACH PROTOCOL");
    expect(room6.subtitle).toBe("Dual Stalker Pincer");
    expect(room6.tacticalTip).toContain("Zone 2 hostiles attack without hesitation");
    expect(room6.enemies).toHaveLength(3);

    const stalkers = room6.enemies.filter((e) => e.type === "stalker");
    const guards = room6.enemies.filter((e) => e.type === "shotgun");
    expect(stalkers).toHaveLength(2);
    expect(guards).toHaveLength(1);
    expect(room6.enemies.some((e) => e.id === "stalker-north")).toBe(true);
    expect(room6.enemies.some((e) => e.id === "stalker-south")).toBe(true);
    expect(room6.enemies.some((e) => e.id === "guard-center")).toBe(true);

    const barriers = room6.obstacles.filter((o) => o.id.includes("barrier"));
    expect(barriers.length).toBeGreaterThanOrEqual(2);
    expect(room6.exitPortal).toBeDefined();
  });

  it("constructs Room 7 as Crossfire Corridor with crisscrossing Snipers and Warden", () => {
    const room7 = createRoom7();
    expect(room7.id).toBe("room-7");
    expect(room7.roomNumber).toBe(7);
    expect(room7.title).toBe("ROOM 07: CROSSFIRE CORRIDOR");
    expect(room7.subtitle).toBe("Crisscrossing Sniper Sightlines");
    expect(room7.enemies).toHaveLength(3);

    const snipers = room7.enemies.filter((e) => e.type === "marksman");
    const wardens = room7.enemies.filter((e) => e.type === "warden");
    expect(snipers).toHaveLength(2);
    expect(wardens).toHaveLength(1);
    expect(wardens[0].maxShields).toBe(2);
    expect(room7.enemies.some((e) => e.id === "sniper-top")).toBe(true);
    expect(room7.enemies.some((e) => e.id === "sniper-bottom")).toBe(true);
    expect(room7.enemies.some((e) => e.id === "warden-advance")).toBe(true);

    const bunkers = room7.obstacles.filter((o) => o.id.includes("bunker"));
    expect(bunkers.length).toBeGreaterThanOrEqual(3);
    expect(room7.exitPortal).toBeDefined();
  });

  it("constructs Room 8 as Killbox Enclosure with shotgun guards, grunts, and stalker", () => {
    const room8 = createRoom8();
    expect(room8.id).toBe("room-8");
    expect(room8.roomNumber).toBe(8);
    expect(room8.title).toBe("ROOM 08: KILLBOX ENCLOSURE");
    expect(room8.subtitle).toBe("Close-Quarters Shotgun Suppression");
    expect(room8.enemies).toHaveLength(5);

    const guards = room8.enemies.filter((e) => e.type === "shotgun");
    const grunts = room8.enemies.filter((e) => e.type === "grunt");
    const stalkers = room8.enemies.filter((e) => e.type === "stalker");
    expect(guards).toHaveLength(2);
    expect(guards.every((g) => g.maxShields === 1)).toBe(true);
    expect(grunts).toHaveLength(2);
    expect(stalkers).toHaveLength(1);

    const pillars = room8.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(4);
    expect(room8.exitPortal).toBeDefined();
  });

  it("constructs Room 9 as The Iron Gate with dual Wardens, sniper, and stalker", () => {
    const room9 = createRoom9();
    expect(room9.id).toBe("room-9");
    expect(room9.roomNumber).toBe(9);
    expect(room9.title).toBe("ROOM 09: THE IRON GATE");
    expect(room9.subtitle).toBe("Zone 2 Final Defense");
    expect(room9.tacticalTip).toContain("6 enemy shield hits to break");
    expect(room9.enemies).toHaveLength(4);

    const wardens = room9.enemies.filter((e) => e.type === "warden");
    const snipers = room9.enemies.filter((e) => e.type === "marksman");
    const stalkers = room9.enemies.filter((e) => e.type === "stalker");
    expect(wardens).toHaveLength(2);
    expect(wardens.every((w) => w.maxShields === 2)).toBe(true);
    expect(snipers).toHaveLength(1);
    expect(stalkers).toHaveLength(1);

    const divider = room9.obstacles.find((o) => o.id.includes("divider"));
    const pillars = room9.obstacles.filter((o) => o.id.includes("pillar"));
    expect(divider).toBeDefined();
    expect(pillars).toHaveLength(2);
    expect(room9.exitPortal).toBeDefined();
  });

  it("constructs standard room sequence containing all 20 rooms", () => {
    const sequence = createStandardRoomSequence();
    expect(sequence).toHaveLength(20);
    sequence.forEach((room, index) => {
      expect(room.roomNumber).toBe(index + 1);
      expect(room.id).toBe(`room-${index + 1}`);
      expect(room.obstacles.length).toBeGreaterThan(0);
      expect(room.enemies.length).toBeGreaterThan(0);
      expect(room.exitPortal).toBeDefined();
    });
  });
});

describe("RoomManager Tactical Puzzle Progression", () => {
  it("initializes at Room 1 with locked exit portal and incomplete game status", () => {
    const manager = new RoomManager();

    expect(manager.getRoomCount()).toBe(20);
    expect(manager.getCurrentRoomIndex()).toBe(0);
    expect(manager.getCurrentRoom().roomNumber).toBe(1);
    expect(manager.isBossRoom()).toBe(false);
    expect(manager.isExitUnlocked()).toBe(false);
    expect(manager.isGameCompleted()).toBe(false);
    expect(manager.hasNextRoom()).toBe(true);
  });

  it("correctly identifies boss room via isBossRoom()", () => {
    const manager = new RoomManager();

    // Rooms 1 to 4 are not boss rooms
    for (let i = 0; i < 4; i++) {
      expect(manager.isBossRoom()).toBe(false);
      manager.setExitUnlocked(true);
      manager.advanceRoom();
    }

    // Room 5 is the Sector 1 Boss room
    expect(manager.getCurrentRoom().roomNumber).toBe(5);
    expect(manager.isBossRoom()).toBe(true);

    // Rooms 6 to 9 are not boss rooms
    for (let i = 5; i < 9; i++) {
      manager.setExitUnlocked(true);
      manager.advanceRoom();
      expect(manager.isBossRoom()).toBe(false);
    }

    // Room 10 is the Milestone Boss 2 (Chrono-Weaver) room
    manager.setExitUnlocked(true);
    manager.advanceRoom();
    expect(manager.getCurrentRoom().roomNumber).toBe(10);
    expect(manager.isBossRoom()).toBe(true);

    // Rooms 11 to 14 are not boss rooms
    for (let i = 10; i < 14; i++) {
      manager.setExitUnlocked(true);
      manager.advanceRoom();
      expect(manager.isBossRoom()).toBe(false);
    }

    // Room 15 is Milestone Boss 3 (Vektor-Prime) room
    manager.setExitUnlocked(true);
    manager.advanceRoom();
    expect(manager.getCurrentRoom().roomNumber).toBe(15);
    expect(manager.isBossRoom()).toBe(true);

    // Rooms 16 to 19 are not boss rooms
    for (let i = 15; i < 19; i++) {
      manager.setExitUnlocked(true);
      manager.advanceRoom();
      expect(manager.isBossRoom()).toBe(false);
    }

    // Room 20 is Milestone Final Boss (Chrono-Zenith) room
    manager.setExitUnlocked(true);
    manager.advanceRoom();
    expect(manager.getCurrentRoom().roomNumber).toBe(20);
    expect(manager.isBossRoom()).toBe(true);

    // Custom room with boss enemy is also detected
    const customBossManager = new RoomManager([
      {
        id: "custom-boss",
        roomNumber: 1,
        title: "CUSTOM BOSS",
        subtitle: "Test Boss",
        tacticalTip: "Fight the boss",
        playerSpawn: vec2(100, 100),
        obstacles: [],
        enemies: [
          {
            id: "test-boss",
            type: "boss" as unknown as any,
            x: 200,
            y: 200,
          },
        ],
        exitPortal: { x: 300, y: 300, radius: 20 },
      },
    ]);
    expect(customBossManager.isBossRoom()).toBe(true);
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

  it("advances sequentially across 20 rooms and triggers game completion", () => {
    const manager = new RoomManager();

    // Rooms 1 -> 2 -> ... -> 20
    for (let i = 1; i <= 19; i++) {
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

  it("supports restarting current room or full game sequence back to room index 0", () => {
    const manager = new RoomManager();

    manager.setExitUnlocked(true);
    manager.advanceRoom();
    manager.setExitUnlocked(true);
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(true);

    manager.restartCurrentRoom();
    expect(manager.getCurrentRoomIndex()).toBe(1);
    expect(manager.isExitUnlocked()).toBe(false);

    // Advance to room 20 then complete
    for (let i = 2; i <= 20; i++) {
      manager.advanceRoom();
    }
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
      115
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "ALL 20 TACTICAL PROTOCOLS CONQUERED",
      480,
      150
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "✓ Goliath-01 Defeated    |    ✓ Chrono-Weaver Neutralized",
      480,
      200
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "✓ Vektor-Prime Obliterated    |    ✓ Chrono-Zenith Overthrown",
      480,
      224
    );
  });

  describe("Boss Room & Endless Portal Suppression", () => {
    it("suppresses floor portal rendering in all boss rooms (Rooms 5, 10, 15, 20) and endless mode", async () => {
      const manager = new RoomManager();

      // Standard room (Room 1): portal renders
      const ctx1 = createMockContext();
      manager.renderPortal(ctx1, 0.016);
      expect(ctx1.beginPath).toHaveBeenCalled();

      // Advance to Room 5 (Goliath-01)
      for (let i = 1; i <= 4; i++) {
        manager.advanceRoom();
      }
      expect(manager.getCurrentRoom().roomNumber).toBe(5);
      expect(manager.isBossRoom()).toBe(true);

      const ctxBoss5 = createMockContext();
      manager.renderPortal(ctxBoss5, 0.016);
      expect(ctxBoss5.beginPath).not.toHaveBeenCalled();

      // Advance to Room 20 (Chrono-Zenith)
      for (let i = 5; i <= 19; i++) {
        manager.advanceRoom();
      }
      expect(manager.getCurrentRoom().roomNumber).toBe(20);
      expect(manager.isBossRoom()).toBe(true);

      const ctxBoss20 = createMockContext();
      manager.setExitUnlocked(true);
      manager.renderPortal(ctxBoss20, 0.016);
      expect(ctxBoss20.beginPath).not.toHaveBeenCalled();
      expect(ctxBoss20.fillText).not.toHaveBeenCalled();

      // In Endless Mode: portal is also suppressed
      manager.startEndlessMode();
      expect(manager.isEndlessMode()).toBe(true);
      const ctxEndless = createMockContext();
      manager.renderPortal(ctxEndless, 0.016);
      expect(ctxEndless.beginPath).not.toHaveBeenCalled();

      // In procedural seeded campaign non-boss room: portal renders normally
      const { LevelDirector } = await import("./LevelDirector");
      const proceduralManager = new RoomManager(new LevelDirector({ seed: 123 }));
      expect(proceduralManager.getCurrentRoom().roomNumber).toBe(1);
      expect(proceduralManager.isBossRoom()).toBe(false);
      const ctxProcedural = createMockContext();
      proceduralManager.setExitUnlocked(true);
      proceduralManager.renderPortal(ctxProcedural, 0.016);
      expect(ctxProcedural.beginPath).toHaveBeenCalled();
    });

    it("transitions seamlessly into Endless Survival Mode via startEndlessMode()", () => {
      const manager = new RoomManager();
      for (let i = 1; i <= 19; i++) {
        manager.advanceRoom();
      }
      expect(manager.getCurrentRoom().roomNumber).toBe(20);

      const endlessRoom = manager.startEndlessMode();
      expect(endlessRoom.id).toBe("endless-colosseum");
      expect(manager.isEndlessMode()).toBe(true);
      expect(manager.hasNextRoom()).toBe(true);
      expect(manager.isGameCompleted()).toBe(false);
      expect(manager.endlessDirector).toBeDefined();

      const ctx = createMockContext();
      expect(() => manager.renderRoomHeader(ctx, 960)).not.toThrow();
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining("APEX COLOSSEUM // ENDLESS PROTOCOL"),
        24,
        20
      );
    });
  });

  describe("LevelDirector & Endless Mode Integration", () => {
    it("initializes in endless mode when supplied with a LevelDirector", async () => {
      const { LevelDirector } = await import("./LevelDirector");
      const director = new LevelDirector({ seed: 42 });
      const manager = new RoomManager(director);

      expect(manager.isEndlessMode()).toBe(true);
      expect(manager.levelDirector).toBe(director);
      expect(manager.getCurrentRoomIndex()).toBe(0);
      expect(manager.getCurrentRoom().roomNumber).toBe(1);
      expect(manager.getCurrentRoom().id).toContain("procedural-room-1");
      expect(manager.hasNextRoom()).toBe(true);
    });

    it("generates rooms dynamically on demand beyond room 1", async () => {
      const { LevelDirector } = await import("./LevelDirector");
      const director = new LevelDirector({ seed: 99 });
      const manager = new RoomManager(director);

      // Advance through 5 rooms
      for (let i = 1; i <= 4; i++) {
        expect(manager.hasNextRoom()).toBe(true);
        const advanced = manager.advanceRoom();
        expect(advanced).toBe(true);
        expect(manager.getCurrentRoom().roomNumber).toBe(i + 1);
      }

      // Room 5 is reached: milestone boss room!
      expect(manager.getCurrentRoomIndex()).toBe(4);
      expect(manager.getCurrentRoom().roomNumber).toBe(5);
      expect(manager.isBossRoom()).toBe(true);
      expect(manager.getCurrentRoom().enemies.some((e) => e.type === "boss")).toBe(true);

      // Endless mode never halts: can continue past room 5 to room 6
      expect(manager.hasNextRoom()).toBe(true);
      manager.advanceRoom();
      expect(manager.getCurrentRoomIndex()).toBe(5);
      expect(manager.getCurrentRoom().roomNumber).toBe(6);
      expect(manager.isBossRoom()).toBe(false);
    });

    it("resets dynamic endless progression back to Room 1 on restartGame()", async () => {
      const { LevelDirector } = await import("./LevelDirector");
      const director = new LevelDirector({ seed: 101 });
      const manager = new RoomManager(director);

      manager.advanceRoom();
      manager.advanceRoom();
      expect(manager.getCurrentRoomIndex()).toBe(2);

      manager.restartGame();
      expect(manager.getCurrentRoomIndex()).toBe(0);
      expect(manager.getCurrentRoom().roomNumber).toBe(1);
      expect(manager.getRoomCount()).toBe(1);
    });
  });

  describe("Rollback Checkpoint Mechanics", () => {
    it("computes rollback target for standard campaign rooms", () => {
      const manager = new RoomManager();
      // Room 1 (Sector 1) -> Room 1
      expect(manager.getRollbackTarget().roomNumber).toBe(1);

      // Advance to Room 5 (Sector 1 Boss) -> Room 1
      for (let i = 0; i < 4; i++) manager.advanceRoom();
      expect(manager.getCurrentRoom().roomNumber).toBe(5);
      expect(manager.getRollbackTarget().roomNumber).toBe(1);

      // Advance to Room 7 (Sector 2) -> Room 5 (Goliath-01)
      manager.advanceRoom(); // R6
      manager.advanceRoom(); // R7
      expect(manager.getCurrentRoom().roomNumber).toBe(7);
      expect(manager.getRollbackTarget().roomNumber).toBe(5);
      expect(manager.getRollbackTarget().bossName).toBe("GOLIATH-01");

      // Advance to Room 10 (Sector 2 Boss) -> Room 5
      manager.advanceRoom(); // R8
      manager.advanceRoom(); // R9
      manager.advanceRoom(); // R10
      expect(manager.getCurrentRoom().roomNumber).toBe(10);
      expect(manager.getRollbackTarget().roomNumber).toBe(5);

      // Advance to Room 11 (Sector 3) -> Room 10 (Chrono-Weaver)
      manager.advanceRoom(); // R11
      expect(manager.getCurrentRoom().roomNumber).toBe(11);
      expect(manager.getRollbackTarget().roomNumber).toBe(10);
      expect(manager.getRollbackTarget().bossName).toBe("CHRONO-WEAVER");

      // Advance to Room 16 (Sector 4) -> Room 15 (Vektor-Prime)
      for (let i = 0; i < 5; i++) manager.advanceRoom(); // R12, 13, 14, 15, 16
      expect(manager.getCurrentRoom().roomNumber).toBe(16);
      expect(manager.getRollbackTarget().roomNumber).toBe(15);
      expect(manager.getRollbackTarget().bossName).toBe("VEKTOR-PRIME");
    });

    it("rolls back room manager progression to target room index", () => {
      const manager = new RoomManager();
      // Advance to Room 8
      for (let i = 0; i < 7; i++) manager.advanceRoom();
      expect(manager.getCurrentRoom().roomNumber).toBe(8);

      const target = manager.rollbackToCheckpoint();
      expect(target.roomNumber).toBe(5);
      expect(manager.getCurrentRoomIndex()).toBe(4);
      expect(manager.getCurrentRoom().roomNumber).toBe(5);
      expect(manager.isExitUnlocked()).toBe(false);
    });

    it("rolls back Endless Mode to Room 20", () => {
      const manager = new RoomManager();
      manager.startEndlessMode();
      expect(manager.isEndlessMode()).toBe(true);

      const target = manager.rollbackToCheckpoint();
      expect(target.roomNumber).toBe(20);
      expect(manager.getCurrentRoomIndex()).toBe(19);
      expect(manager.getCurrentRoom().roomNumber).toBe(20);
      expect(manager.endlessDirector).toBeUndefined();
    });

    it("rolls back dynamic LevelDirector sequence cleanly", async () => {
      const { LevelDirector } = await import("./LevelDirector");
      const director = new LevelDirector({ seed: 777 });
      const manager = new RoomManager(director);

      // Advance to Room 12
      for (let i = 0; i < 11; i++) manager.advanceRoom();
      expect(manager.getCurrentRoom().roomNumber).toBe(12);

      const target = manager.rollbackToCheckpoint();
      expect(target.roomNumber).toBe(10);
      expect(manager.getCurrentRoomIndex()).toBe(9);
      expect(manager.getCurrentRoom().roomNumber).toBe(10);
    });
  });
});

