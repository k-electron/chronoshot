import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import { Arena } from "./Arena";
import { createProjectile } from "./Projectile";

describe("Combat Arena & Room Loop", () => {
  it("initializes arena with player, tactical obstacles, enemies, and HUDs", () => {
    const arena = new Arena();

    expect(arena.player.isAlive).toBe(true);
    expect(arena.player.weapon.getAmmo()).toBe(6);
    expect(arena.enemies.length).toBeGreaterThanOrEqual(2);
    expect(arena.obstacles.length).toBeGreaterThan(0);
    expect(arena.status).toBe("playing");
  });

  it("handles player firing and reload bursts through TimeGovernor", () => {
    const arena = new Arena();

    // Shoot weapon
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: true,
      reload: false,
      restart: false,
    });

    expect(arena.projectiles.length).toBe(1);
    expect(arena.projectiles[0].owner).toBe("player");
    expect(arena.player.weapon.getAmmo()).toBe(5);

    // Drain ticks and step again
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    // Execute reload
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: true,
      restart: false,
    });

    expect(arena.player.weapon.getAmmo()).toBe(6);
  });

  it("enforces 1-hit lethality when an enemy projectile strikes the player", () => {
    const arena = new Arena();

    // Spawn an enemy bullet 20px in front of player heading directly at player
    const lethalBullet = createProjectile(
      "lethal-enemy-shot",
      vec2(arena.player.position.x + 20, arena.player.position.y),
      Math.PI, // heading left towards player
      600,
      "enemy"
    );
    arena.projectiles.push(lethalBullet);

    // Step simulation: player moving triggers real-time scale
    arena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    expect(arena.player.isAlive).toBe(false);
    expect(arena.status).toBe("defeat");
    expect(arena.particles.getCount()).toBeGreaterThan(0);
  });

  it("instant room restart on key 'R' restores player, enemies, and clears battlefield", () => {
    const arena = new Arena();

    // Kill player to enter defeat
    arena.player.kill();
    arena.status = "defeat";
    arena.particles.emitShatter(vec2(100, 100), 20);
    expect(arena.status).toBe("defeat");
    expect(arena.particles.getCount()).toBe(20);

    // User presses 'R' to restart
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: true,
    });

    expect(arena.status).toBe("playing");
    expect(arena.player.isAlive).toBe(true);
    expect(arena.player.weapon.getAmmo()).toBe(6);
    expect(arena.enemies.every((e) => e.isAlive)).toBe(true);
    expect(arena.projectiles).toHaveLength(0);
    expect(arena.particles.getCount()).toBe(0);
  });

  it("triggers victory state when all enemies in the room are eliminated", () => {
    const arena = new Arena();

    // Eliminate all enemies
    for (const enemy of arena.enemies) {
      enemy.kill();
    }

    // Step simulation
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    // Check victory condition
    // In our Arena class, victory check is performed on enemy death
    // Let's spawn a player bullet hitting a last alive enemy
    const testArena = new Arena();
    // Kill all but one
    for (let i = 1; i < testArena.enemies.length; i++) {
      testArena.enemies[i].kill();
    }
    const lastEnemy = testArena.enemies[0];
    lastEnemy.position = vec2(300, 300);

    // Player bullet directly hitting lastEnemy
    const killShot = createProjectile(
      "kill-shot",
      vec2(280, 300),
      0, // heading right
      1000,
      "player"
    );
    testArena.projectiles.push(killShot);

    testArena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    expect(lastEnemy.isAlive).toBe(false);
    expect(testArena.status).toBe("victory");
  });

  it("integrates RoomManager: unlocks exit on enemy wipe and advances to next room upon entering portal", async () => {
    const { RoomManager } = await import("../levels/RoomManager");
    const roomManager = new RoomManager();
    const arena = new Arena(960, 640, roomManager);

    // Initial state: Room 1 loaded (1 grunt, 1 pillar, exit locked)
    expect(arena.roomManager?.getCurrentRoomIndex()).toBe(0);
    expect(arena.enemies).toHaveLength(1);
    expect(arena.roomManager?.isExitUnlocked()).toBe(false);

    // Destroy the grunt in Room 1
    arena.enemies[0].kill();

    // Step arena: enemy state updates, exit portal unlocks
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    expect(arena.roomManager?.isExitUnlocked()).toBe(true);
    expect(arena.status).toBe("playing"); // Remains playing until stepping into portal

    // Move player directly into exit portal
    const portal = arena.roomManager!.getCurrentRoom().exitPortal;
    arena.player.position = vec2(portal.x, portal.y);

    // Step simulation: triggers portal enter and loads Room 2
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    // Successfully transitioned to Room 2!
    expect(arena.roomManager?.getCurrentRoomIndex()).toBe(1);
    expect(arena.enemies).toHaveLength(2); // Room 2 has 2 grunts
    expect(arena.roomManager?.isExitUnlocked()).toBe(false); // Locked for Room 2
  });

  it("triggers procedural audio synthesis on shooting, dry-fire, and reload", async () => {
    const { vi } = await import("vitest");
    const mockSynth = {
      playFire: vi.fn(),
      playDryClick: vi.fn(),
      playReload: vi.fn(),
      playImpact: vi.fn(),
      playShatter: vi.fn(),
      playVictory: vi.fn(),
      resume: vi.fn(),
      setMuted: vi.fn(),
      calculatePitch: vi.fn(),
      calculateDuration: vi.fn(),
      isAvailable: vi.fn().mockReturnValue(true),
    };

    const arena = new Arena(960, 640, undefined, mockSynth as any);

    // Shoot weapon -> triggers playFire
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: true,
      reload: false,
      restart: false,
    });
    expect(mockSynth.playFire).toHaveBeenCalled();

    // Deplete remaining ammo
    for (let i = 0; i < 5; i++) {
      arena.player.weapon.update(10);
      arena.step(0.016, {
        moveDir: vec2(0, 0),
        mousePos: vec2(500, 320),
        shoot: true,
        reload: false,
        restart: false,
      });
    }

    // Now empty: dry fire trigger
    arena.player.weapon.update(10);
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: true,
      reload: false,
      restart: false,
    });
    expect(mockSynth.playDryClick).toHaveBeenCalled();

    // Reload trigger
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: true,
      restart: false,
    });
    expect(mockSynth.playReload).toHaveBeenCalled();
  });

  it("supports toggleable pause state halting simulation updates", () => {
    const arena = new Arena();
    expect(arena.isPaused).toBe(false);

    // Toggle pause on
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
      togglePause: true,
    });
    expect(arena.isPaused).toBe(true);

    // Movement while paused does not advance player or time
    const initialPos = { ...arena.player.position };
    arena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });
    expect(arena.player.position.x).toBe(initialPos.x);

    // Click / shoot resumes from pause
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: true,
      reload: false,
      restart: false,
    });
    expect(arena.isPaused).toBe(false);
  });

  it("renders pause overlay and modern overlays without throwing", () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setLineDash: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const arena = new Arena();

    // Active gameplay render with corner hint
    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith("[ESC] PAUSE", 936, 46);

    // Paused state render
    arena.isPaused = true;
    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "// TACTICAL SIMULATION PAUSED",
      480,
      expect.any(Number)
    );

    // Defeat state render
    arena.isPaused = false;
    arena.status = "defeat";
    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "PROTOCOL TERMINATED",
      480,
      expect.any(Number)
    );

    // Victory state render
    arena.status = "victory";
    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "AREA NEUTRALIZED",
      480,
      expect.any(Number)
    );
  });

  it("handles player bullet hitting shielded enemy with deflection and break effects", () => {
    const arena = new Arena();
    // Replace enemies with 1 shielded Shotgun Guard (1 shield)
    const guard = new (arena.enemies[0].constructor as any)({
      id: "test-guard",
      type: "shotgun",
      x: 300,
      y: 320,
    });
    arena.enemies = [guard];

    // Spawn player bullet targeting guard (guard boundary is at x = 300 - 16 = 284)
    const bullet1 = createProjectile(
      "p-shot-1",
      vec2(275, 320),
      0,
      600,
      "player"
    );
    arena.projectiles = [bullet1];

    // Step physics with sufficient delta time to ensure discrete physics ticks execute
    arena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    // Guard should still be alive with 0 shields remaining (absorbed)
    expect(guard.isAlive).toBe(true);
    expect(guard.shields).toBe(0);
    expect(arena.status).toBe("playing");

    // Second bullet: lethal kill
    const bullet2 = createProjectile(
      "p-shot-2",
      vec2(275, 320),
      0,
      600,
      "player"
    );
    arena.projectiles = [bullet2];

    arena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    expect(guard.isAlive).toBe(false);
    expect(arena.status).toBe("victory");
  });

  it("renders Stalker, Aegis Warden, and Marksman archetypes with shield rings and lasers without throwing", () => {
    const mockCtx = {
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
      closePath: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const arena = new Arena();
    arena.enemies = [
      new (arena.enemies[0].constructor as any)({
        id: "stalker",
        type: "stalker",
        x: 400,
        y: 200,
      }),
      new (arena.enemies[0].constructor as any)({
        id: "warden",
        type: "warden",
        x: 500,
        y: 200,
        maxShields: 2,
      }),
      new (arena.enemies[0].constructor as any)({
        id: "marksman",
        type: "marksman",
        x: 600,
        y: 200,
      }),
    ];

    // Flag marksman laser charging
    arena.enemies[2].isChargingLaser = true;

    expect(() => arena.render(mockCtx, 0.016)).not.toThrow();
  });

  it("renders Boss Telemetry HUD when active boss is present", async () => {
    const { Enemy } = await import("./Enemy");
    const mockCtx = {
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
      closePath: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    } as unknown as CanvasRenderingContext2D;

    const arena = new Arena();
    const boss = new Enemy({
      id: "goliath",
      type: "boss",
      x: 700,
      y: 320,
      maxShields: 4,
      bossName: "GOLIATH-01: AEGIS COLOSSUS",
    });
    arena.enemies = [boss];

    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "GOLIATH-01: AEGIS COLOSSUS",
      expect.any(Number),
      expect.any(Number)
    );

    // When enraged: displays enraged warning
    boss.isEnraged = true;
    arena.render(mockCtx, 0.016);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "CORE VULNERABLE // ENRAGED",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("triggers freeze-frame upgrade selection overlay when boss is destroyed and applies upgrade on choice", async () => {
    const { RoomManager } = await import("../levels/RoomManager");
    const roomManager = new RoomManager();
    const arena = new Arena(960, 640, roomManager);

    // Advance directly to Room 5 (Sector 1 Boss)
    while (arena.roomManager?.getCurrentRoomIndex() !== 4) {
      arena.roomManager?.advanceRoom();
    }
    arena.loadRoom(arena.roomManager.getCurrentRoom());
    expect(arena.roomManager.getCurrentRoom().roomNumber).toBe(5);

    // Find the boss enemy in Room 5
    const boss = arena.enemies.find((e) => e.isBoss);
    expect(boss).toBeDefined();

    // Crack all 4 shields of Goliath
    boss!.takeDamage(4);
    expect(boss!.shields).toBe(0);
    expect(boss!.isEnraged).toBe(true);

    // Deliver lethal 5th hit from outside boss radius (boss radius is 24)
    const lethalShot = createProjectile(
      "lethal-boss-shot",
      vec2(boss!.position.x - 45, boss!.position.y),
      0,
      1000,
      "player"
    );
    arena.projectiles.push(lethalShot);

    arena.step(0.05, {
      moveDir: vec2(1, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
    });

    expect(boss!.isAlive).toBe(false);
    expect(arena.isUpgradeDraftActive).toBe(true);

    // Selecting upgrade [1] (Extended Cylinder)
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: false,
      upgradeChoice: 1,
    });

    expect(arena.isUpgradeDraftActive).toBe(false);
    expect(arena.player.getAugmentations().extendedCylinder).toBe(true);
    expect(arena.player.weapon.getMagSize()).toBe(8);
    // Successfully advanced to Room 6 (Zone 2 Baseline)
    expect(arena.roomManager.getCurrentRoomIndex()).toBe(5);
    expect(arena.roomManager.getCurrentRoom().roomNumber).toBe(6);
  });

  it("supports upgrade selection via mouse click inside card boundaries", async () => {
    const { RoomManager } = await import("../levels/RoomManager");
    const roomManager = new RoomManager();
    const arena = new Arena(960, 640, roomManager);

    // Simulate active upgrade draft
    arena.isUpgradeDraftActive = true;

    // Click inside Card 2 bounds (Speed Loader: x: 350..610, y: 170..460)
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(480, 250),
      shoot: true,
      reload: false,
      restart: false,
    });

    expect(arena.isUpgradeDraftActive).toBe(false);
    expect(arena.player.getAugmentations().speedLoader).toBe(true);
  });

  it("enforces pure permadeath run reset back to Room 1 on defeat and clears augmentations", async () => {
    const { RoomManager } = await import("../levels/RoomManager");
    const roomManager = new RoomManager();
    const arena = new Arena(960, 640, roomManager);

    // Advance to Room 7 with an augmentation
    while (arena.roomManager?.getCurrentRoomIndex() !== 6) {
      arena.roomManager?.advanceRoom();
    }
    arena.loadRoom(arena.roomManager.getCurrentRoom());
    arena.player.setAugmentation("speedLoader", true);
    expect(arena.roomManager.getCurrentRoom().roomNumber).toBe(7);
    expect(arena.player.getAugmentations().speedLoader).toBe(true);

    // Player dies in Room 7
    arena.player.kill();
    arena.status = "defeat";

    // Player presses [R] to restart
    arena.step(0.016, {
      moveDir: vec2(0, 0),
      mousePos: vec2(500, 320),
      shoot: false,
      reload: false,
      restart: true,
    });

    // Permadeath: back to Room 1, augmentations wiped!
    expect(arena.roomManager.getCurrentRoomIndex()).toBe(0);
    expect(arena.roomManager.getCurrentRoom().roomNumber).toBe(1);
    expect(arena.player.getAugmentations().speedLoader).toBeUndefined();
    expect(arena.status).toBe("playing");
    expect(arena.player.isAlive).toBe(true);
  });
});
