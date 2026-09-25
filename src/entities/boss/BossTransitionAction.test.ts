import { describe, expect, it, vi } from "vitest";
import { vec2, vecDistance } from "../../math/vector";
import { testCircleAABB } from "../../math/collision";
import { createObstacle } from "../Obstacle";
import { BossPhaseConfig, BossPhaseController, BossTransitionContext } from "./BossPhaseController";
import {
  combineTransitionActions,
  createAudioCue,
  createCataclysmPulse,
  createMinionEscortSpawn,
  createShockwavePulse,
  generateRadialParticleConfigs,
  resolveEscortDefinitions,
  resolveSafeSpawnPosition,
  testLineOfSightOcclusion,
} from "./BossTransitionAction";
import { CombatUnit } from "../Projectile";

describe("BossTransitionAction", () => {
  describe("generateRadialParticleConfigs", () => {
    it("generates evenly spaced 360-degree particle radial burst", () => {
      const origin = vec2(100, 200);
      const particles = generateRadialParticleConfigs(origin, 4, 100, "#00f0ff");

      expect(particles).toHaveLength(4);

      // Angle 0: pointing right (100, 0)
      expect(particles[0].angle).toBeCloseTo(0);
      expect(particles[0].velocity.x).toBeCloseTo(100);
      expect(particles[0].velocity.y).toBeCloseTo(0);
      expect(particles[0].position).toEqual({ x: 100, y: 200 });
      expect(particles[0].color).toBe("#00f0ff");

      // Angle PI/2: pointing down (0, 100)
      expect(particles[1].angle).toBeCloseTo(Math.PI / 2);
      expect(particles[1].velocity.x).toBeCloseTo(0);
      expect(particles[1].velocity.y).toBeCloseTo(100);

      // Angle PI: pointing left (-100, 0)
      expect(particles[2].angle).toBeCloseTo(Math.PI);
      expect(particles[2].velocity.x).toBeCloseTo(-100);
      expect(particles[2].velocity.y).toBeCloseTo(0);

      // Angle 3*PI/2: pointing up (0, -100)
      expect(particles[3].angle).toBeCloseTo((3 * Math.PI) / 2);
      expect(particles[3].velocity.x).toBeCloseTo(0);
      expect(particles[3].velocity.y).toBeCloseTo(-100);
    });

    it("returns empty array when particleCount <= 0", () => {
      const particles = generateRadialParticleConfigs(vec2(0, 0), 0, 100, "#fff");
      expect(particles).toEqual([]);
    });
  });

  describe("createShockwavePulse", () => {
    it("initializes with default telemetry parameters", () => {
      const pulse = createShockwavePulse();

      expect(pulse.type).toBe("shockwave_pulse");
      expect(pulse.particleCount).toBe(24);
      expect(pulse.speed).toBe(280);
      expect(pulse.color).toBe("#00f0ff");
      expect(pulse.config).toEqual({
        particleCount: 24,
        speed: 280,
        color: "#00f0ff",
      });
    });

    it("accepts custom particle count, speed, and color", () => {
      const pulse = createShockwavePulse(12, 400, "#ff2a44");

      expect(pulse.particleCount).toBe(12);
      expect(pulse.speed).toBe(400);
      expect(pulse.color).toBe("#ff2a44");

      const configs = pulse.createParticleConfigs(vec2(50, 50));
      expect(configs).toHaveLength(12);
      expect(configs[0].speed).toBe(400);
      expect(configs[0].color).toBe("#ff2a44");
    });

    it("executes side-effects on context particles and audio synthesizer when available", () => {
      const pulse = createShockwavePulse(16, 320, "#ff2a44");

      const emitShatterSpy = vi.fn();
      const playShieldBreakSpy = vi.fn();

      const ctx: BossTransitionContext = {
        bossPosition: vec2(250, 350),
        currentPhase: 0,
        nextPhase: 1,
        particles: { emitShatter: emitShatterSpy } as any,
        soundSynth: { playShieldBreak: playShieldBreakSpy } as any,
      };

      const result = pulse(ctx);

      expect(result).toHaveLength(16);
      expect(emitShatterSpy).toHaveBeenCalledWith(
        vec2(250, 350),
        16,
        "#ff2a44",
        320
      );
      expect(playShieldBreakSpy).toHaveBeenCalledWith(1.0);
    });

    it("executes safely when particles and audio context are omitted", () => {
      const pulse = createShockwavePulse(8, 200);

      const ctx: BossTransitionContext = {
        bossPosition: vec2(100, 100),
        currentPhase: 0,
        nextPhase: 1,
      };

      expect(() => pulse(ctx)).not.toThrow();
      const result = pulse.execute(ctx);
      expect(result).toHaveLength(8);
    });
  });

  describe("createMinionEscortSpawn", () => {
    it("initializes with configuration definitions", () => {
      const minionDefs = [
        { type: "stalker", offsetX: -50, offsetY: 0 },
        { type: "stalker", offsetX: 50, offsetY: 0 },
      ];
      const spawnAction = createMinionEscortSpawn(minionDefs);

      expect(spawnAction.type).toBe("minion_escort_spawn");
      expect(spawnAction.minionConfigs).toHaveLength(2);
      expect(spawnAction.config.minionConfigs).toHaveLength(2);
    });

    it("resolves spawn definitions relative to boss position", () => {
      const minionDefs = [
        { type: "stalker", offsetX: -60, offsetY: -30 },
        { type: "warden", offsetX: 60, offsetY: 30 },
        { type: "grunt", x: 500, y: 400 }, // Absolute position without offsets
      ];

      const resolved = resolveEscortDefinitions(vec2(200, 100), minionDefs);

      expect(resolved).toHaveLength(3);

      expect(resolved[0].x).toBe(140); // 200 - 60
      expect(resolved[0].y).toBe(70);  // 100 - 30
      expect(resolved[0].type).toBe("stalker");
      expect(resolved[0].id).toBeDefined();

      expect(resolved[1].x).toBe(260); // 200 + 60
      expect(resolved[1].y).toBe(130); // 100 + 30
      expect(resolved[1].type).toBe("warden");

      expect(resolved[2].x).toBe(500); // Kept absolute position
      expect(resolved[2].y).toBe(400);
      expect(resolved[2].type).toBe("grunt");
    });

    it("spawns reinforcements into arena.enemies array when available", () => {
      const minionDefs = [
        { type: "stalker", offsetX: -40, offsetY: 0 },
        { type: "grunt", offsetX: 40, offsetY: 0 },
      ];
      const spawnAction = createMinionEscortSpawn(minionDefs);

      const arenaEnemies: any[] = [];
      const ctx: BossTransitionContext = {
        bossPosition: vec2(300, 200),
        currentPhase: 0,
        nextPhase: 1,
        arena: { enemies: arenaEnemies },
      };

      const spawned = spawnAction(ctx);

      expect(spawned).toHaveLength(2);
      expect(arenaEnemies).toHaveLength(2);
      expect(arenaEnemies[0].x).toBe(260);
      expect(arenaEnemies[1].x).toBe(340);
    });

    it("calls arena.spawnEnemy when arena provides a dedicated method", () => {
      const minionDefs = [{ type: "warden", offsetX: 0, offsetY: -50 }];
      const spawnAction = createMinionEscortSpawn(minionDefs);

      const spawnEnemySpy = vi.fn();
      const ctx: BossTransitionContext = {
        bossPosition: vec2(200, 200),
        currentPhase: 0,
        nextPhase: 1,
        arena: { spawnEnemy: spawnEnemySpy },
      };

      spawnAction(ctx);
      expect(spawnEnemySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warden",
          x: 200,
          y: 150,
        })
      );
    });

    it("calls ctx.spawnMinion when provided in context", () => {
      const minionDefs = [{ type: "grunt", offsetX: 20, offsetY: 20 }];
      const spawnAction = createMinionEscortSpawn(minionDefs);

      const spawnMinionSpy = vi.fn();
      const ctx: BossTransitionContext = {
        bossPosition: vec2(100, 100),
        currentPhase: 0,
        nextPhase: 1,
        spawnMinion: spawnMinionSpy,
      };

      spawnAction(ctx);
      expect(spawnMinionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "grunt",
          x: 120,
          y: 120,
        })
      );
    });

    it("spawns escort minions safely in open space when boss is against a wall without clipping into wall or player", () => {
      // Wall obstacle on the left: x: 50..150, y: 200..400
      const wall = createObstacle("west-wall", 50, 200, 100, 200);
      const player: CombatUnit = {
        id: "player",
        position: vec2(230, 300),
        radius: 14,
        isAlive: true,
        kill: vi.fn(),
      };
      const bossEnemy: any = {
        id: "boss",
        position: vec2(170, 300),
        radius: 24,
        isAlive: true,
        isBoss: true,
      };

      // Minion def with negative X offset (-40), which would put it at x = 130 (inside the wall [50..150])
      const minionDefs = [{ type: "stalker", offsetX: -40, offsetY: 0, radius: 14 }];
      const spawnAction = createMinionEscortSpawn(minionDefs);

      const arenaEnemies: any[] = [bossEnemy];
      const ctx: BossTransitionContext = {
        bossPosition: vec2(170, 300),
        currentPhase: 0,
        nextPhase: 1,
        arena: {
          obstacles: [wall],
          player,
          enemies: arenaEnemies,
          width: 960,
          height: 640,
        },
      };

      const spawned = spawnAction(ctx);
      expect(spawned).toHaveLength(1);
      const minionPos = { x: spawned[0].x, y: spawned[0].y };

      // 1. Minion position has full obstacle clearance from the wall (+2px safety margin)
      const wallHit = testCircleAABB(minionPos, 14 + 2, wall.bounds.min, wall.bounds.max);
      expect(wallHit).toBeNull();

      // 2. Minion does not overlap with the player
      const distToPlayer = vecDistance(minionPos, player.position);
      expect(distToPlayer).toBeGreaterThanOrEqual(14 + player.radius);

      // 3. Minion does not overlap with the boss
      const distToBoss = vecDistance(minionPos, bossEnemy.position);
      expect(distToBoss).toBeGreaterThanOrEqual(14 + bossEnemy.radius);

      // 4. Minion was added to arena.enemies with the safe position
      expect(arenaEnemies).toHaveLength(2);
      expect(arenaEnemies[1].position.x).toBe(minionPos.x);
      expect(arenaEnemies[1].position.y).toBe(minionPos.y);
    });
  });

  describe("resolveSafeSpawnPosition", () => {
    const bounds = { width: 960, height: 640 };

    it("returns clear candidate unchanged when position is in open space", () => {
      const candidate = vec2(400, 300);
      const radius = 15;
      const safePos = resolveSafeSpawnPosition(candidate, radius, [], [], bounds);

      expect(safePos.x).toBe(400);
      expect(safePos.y).toBe(300);
    });

    it("redirects candidate overlapping an obstacle to a nearby clear position with full obstacle and unit clearance", () => {
      // Obstacle at x: 400..500, y: 250..350
      const obstacle = createObstacle("center-block", 400, 250, 100, 100);
      const candidate = vec2(450, 300); // Dead center of obstacle
      const radius = 15;

      const safePos = resolveSafeSpawnPosition(candidate, radius, [obstacle], [], bounds);

      // Position should be moved outside the obstacle
      expect(safePos).not.toEqual(candidate);
      // Verify no collision with obstacle (+2px margin)
      const hit = testCircleAABB(safePos, radius + 2, obstacle.bounds.min, obstacle.bounds.max);
      expect(hit).toBeNull();
      // Verify within bounds
      expect(safePos.x).toBeGreaterThanOrEqual(radius);
      expect(safePos.x).toBeLessThanOrEqual(bounds.width - radius);
      expect(safePos.y).toBeGreaterThanOrEqual(radius);
      expect(safePos.y).toBeLessThanOrEqual(bounds.height - radius);
    });

    it("redirects candidate overlapping another unit to a nearby position without overlapping that unit", () => {
      const existingUnit: CombatUnit = {
        id: "unit-1",
        position: vec2(500, 300),
        radius: 20,
        isAlive: true,
        kill: vi.fn(),
      };
      const candidate = vec2(505, 300); // Overlapping by 30px (min dist = 35)
      const radius = 15;

      const safePos = resolveSafeSpawnPosition(candidate, radius, [], [existingUnit], bounds);

      // Position should be moved away from existing unit
      expect(safePos).not.toEqual(candidate);
      const dist = vecDistance(safePos, existingUnit.position);
      expect(dist).toBeGreaterThanOrEqual(radius + existingUnit.radius);
    });

    it("redirects candidate blocked by both obstacle and existing unit into clear space", () => {
      const obstacle = createObstacle("wall", 400, 250, 80, 80);
      const existingUnit: CombatUnit = {
        id: "hostile-near-wall",
        position: vec2(495, 290),
        radius: 25,
        isAlive: true,
        kill: vi.fn(),
      };
      const candidate = vec2(430, 290); // Inside obstacle
      const radius = 15;

      const safePos = resolveSafeSpawnPosition(
        candidate,
        radius,
        [obstacle],
        [existingUnit],
        bounds
      );

      const hit = testCircleAABB(safePos, radius + 2, obstacle.bounds.min, obstacle.bounds.max);
      expect(hit).toBeNull();
      const dist = vecDistance(safePos, existingUnit.position);
      expect(dist).toBeGreaterThanOrEqual(radius + existingUnit.radius);
    });

    it("clamps candidate to arena bounds when all probes fail or candidate is far outside bounds", () => {
      const candidate = vec2(-100, -100);
      const radius = 15;
      const safePos = resolveSafeSpawnPosition(candidate, radius, [], [], bounds);

      expect(safePos.x).toBe(radius);
      expect(safePos.y).toBe(radius);
    });
  });

  describe("createAudioCue", () => {
    it("triggers correct Web Audio synthesis methods", () => {
      const playDeflectSpy = vi.fn();
      const playBreakSpy = vi.fn();
      const playBossDefeatSpy = vi.fn();
      const playShatterSpy = vi.fn();

      const soundSynth = {
        playShieldDeflect: playDeflectSpy,
        playShieldBreak: playBreakSpy,
        playBossDefeat: playBossDefeatSpy,
        playShatter: playShatterSpy,
      } as any;

      const ctx: BossTransitionContext = {
        bossPosition: vec2(0, 0),
        currentPhase: 0,
        nextPhase: 1,
        soundSynth,
      };

      createAudioCue("shieldBreak")(ctx);
      expect(playBreakSpy).toHaveBeenCalledWith(1.0);

      createAudioCue("shieldDeflect")(ctx);
      expect(playDeflectSpy).toHaveBeenCalledWith(1.0);

      createAudioCue("bossDefeat")(ctx);
      expect(playBossDefeatSpy).toHaveBeenCalledWith(1.0);

      createAudioCue("shatter")(ctx);
      expect(playShatterSpy).toHaveBeenCalledWith(1.0);
    });
  });

  describe("combineTransitionActions", () => {
    it("executes multiple transition actions in sequence", () => {
      const step1 = vi.fn();
      const step2 = vi.fn();
      const step3 = vi.fn();

      const composite = combineTransitionActions(step1, step2, step3);

      const ctx: BossTransitionContext = {
        bossPosition: vec2(150, 150),
        currentPhase: 0,
        nextPhase: 1,
      };

      composite(ctx);

      expect(step1).toHaveBeenCalledWith(ctx);
      expect(step2).toHaveBeenCalledWith(ctx);
      expect(step3).toHaveBeenCalledWith(ctx);
    });
  });

  describe("Integration: BossPhaseController and BossTransitionAction", () => {
    it("executes composed shockwave and minion spawn actions on phase transition", () => {
      const emitShatterSpy = vi.fn();
      const playBreakSpy = vi.fn();
      const spawnedMinions: any[] = [];

      const p0: BossPhaseConfig = {
        phaseIndex: 0,
        phaseTitle: "PHASE 1",
        maxShields: 1,
        speed: 80,
        movement: () => ({ update: () => vec2(0, 0), reset: () => {} }),
        attack: () => ({
          fireCadenceTicks: 30,
          fireCooldownTicks: 30,
          isChargingLaser: false,
          stutterTimerTicks: 0,
          update: () => [],
          discharge: () => [],
          reset: () => {},
        }),
        transitionTrigger: (c) => c.shields <= 0,
        onPhaseExit: combineTransitionActions(
          createShockwavePulse(18, 300, "#ff2a44"),
          createMinionEscortSpawn([{ type: "stalker", offsetX: 50, offsetY: 0 }])
        ),
      };

      const p1: BossPhaseConfig = {
        phaseIndex: 1,
        phaseTitle: "PHASE 2",
        maxShields: 0,
        speed: 120,
        movement: () => ({ update: () => vec2(0, 0), reset: () => {} }),
        attack: () => ({
          fireCadenceTicks: 30,
          fireCooldownTicks: 30,
          isChargingLaser: false,
          stutterTimerTicks: 0,
          update: () => [],
          discharge: () => [],
          reset: () => {},
        }),
        transitionTrigger: () => false,
      };

      const controller = new BossPhaseController([p0, p1], vec2(400, 300));
      controller.transitionContextExtras = {
        particles: { emitShatter: emitShatterSpy },
        soundSynth: { playShieldBreak: playBreakSpy },
        arena: { enemies: spawnedMinions },
      };

      const damageResult = controller.takeDamage(1, 1);
      expect(damageResult.transitioned).toBe(true);

      // Verify shockwave pulse was emitted at boss position
      expect(emitShatterSpy).toHaveBeenCalledWith(
        vec2(400, 300),
        18,
        "#ff2a44",
        300
      );
      expect(playBreakSpy).toHaveBeenCalledWith(1.0);

      // Verify escort minion was spawned
      expect(spawnedMinions).toHaveLength(1);
      expect(spawnedMinions[0].x).toBe(450); // 400 + 50
      expect(spawnedMinions[0].y).toBe(300);
      expect(spawnedMinions[0].type).toBe("stalker");
    });
  });

  describe("testLineOfSightOcclusion and createCataclysmPulse", () => {
    it("reports clear sightline when no obstacles are between boss and player", () => {
      const bossPos = vec2(700, 320);
      const playerPos = vec2(200, 320);
      const obstacles = [
        createObstacle("obs-top", 400, 50, 40, 40),
        createObstacle("obs-bottom", 400, 500, 40, 40),
      ];

      const res = testLineOfSightOcclusion(bossPos, playerPos, obstacles);
      expect(res.occluded).toBe(false);
      expect(res.obstacle).toBeUndefined();
    });

    it("detects obstacle occlusion when cover blocks the sightline", () => {
      const bossPos = vec2(700, 320);
      const playerPos = vec2(200, 320);
      const pillar = createObstacle("pillar-center", 450, 280, 80, 80);

      const res = testLineOfSightOcclusion(bossPos, playerPos, [pillar]);
      expect(res.occluded).toBe(true);
      expect(res.obstacle?.id).toBe("pillar-center");
    });

    it("delivers zero damage and triggers deflection audio/particles when player is behind cover", () => {
      const pulse = createCataclysmPulse({ particleCount: 20, damage: 1 });
      const takeDamageSpy = vi.fn();
      const emitSparksSpy = vi.fn();
      const playDeflectSpy = vi.fn();

      const pillar = createObstacle("cover-wall", 400, 250, 60, 140);
      const ctx: BossTransitionContext = {
        bossPosition: vec2(700, 320),
        currentPhase: 0,
        nextPhase: 1,
        player: { position: vec2(150, 320), isAlive: true, takeDamage: takeDamageSpy } as any,
        obstacles: [pillar],
        particles: { emitImpactSparks: emitSparksSpy, emitShatter: vi.fn() } as any,
        soundSynth: { playShieldDeflect: playDeflectSpy, playShieldBreak: vi.fn() } as any,
      };

      const result = pulse(ctx);
      expect(result.occluded).toBe(true);
      expect(result.damageDealt).toBe(0);
      expect(takeDamageSpy).not.toHaveBeenCalled();
      expect(playDeflectSpy).toHaveBeenCalledWith(1.0);
      expect(emitSparksSpy).toHaveBeenCalled();
    });

    it("inflicts damage when player is in clear line-of-sight during detonation", () => {
      const pulse = createCataclysmPulse({ particleCount: 20, damage: 1 });
      const takeDamageSpy = vi.fn();

      const ctx: BossTransitionContext = {
        bossPosition: vec2(700, 320),
        currentPhase: 0,
        nextPhase: 1,
        player: { position: vec2(150, 320), isAlive: true, takeDamage: takeDamageSpy } as any,
        obstacles: [],
        particles: { emitImpactSparks: vi.fn(), emitShatter: vi.fn() } as any,
        soundSynth: { playShieldDeflect: vi.fn(), playShieldBreak: vi.fn() } as any,
      };

      const result = pulse(ctx);
      expect(result.occluded).toBe(false);
      expect(result.damageDealt).toBe(1);
      expect(takeDamageSpy).toHaveBeenCalledWith(1);
    });

    it("triggers arena defeat state and shatter feedback when Cataclysm Pulse deals lethal damage", () => {
      const pulse = createCataclysmPulse({ particleCount: 20, damage: 1 });
      const emitShatterSpy = vi.fn();
      const playShatterSpy = vi.fn();
      const mockArena: any = { status: "playing" };
      let playerAlive = true;
      const mockPlayer: any = {
        position: vec2(150, 320),
        get isAlive() {
          return playerAlive;
        },
        takeDamage: vi.fn().mockImplementation(() => {
          playerAlive = false;
          return { absorbed: false, eliminated: true, remainingShields: 0 };
        }),
      };

      const ctx: BossTransitionContext = {
        bossPosition: vec2(700, 320),
        currentPhase: 0,
        nextPhase: 1,
        player: mockPlayer,
        arena: mockArena,
        obstacles: [],
        particles: { emitShatter: emitShatterSpy } as any,
        soundSynth: { playShatter: playShatterSpy } as any,
      };

      const result = pulse(ctx);
      expect(result.occluded).toBe(false);
      expect(result.damageDealt).toBe(1);
      expect(mockArena.status).toBe("defeat");
      expect(emitShatterSpy).toHaveBeenCalledWith(mockPlayer.position, 22, "#00f0ff", 240);
      expect(playShatterSpy).toHaveBeenCalledWith(1.0);
    });

    it("triggers shield deflection/break feedback when player absorbs Cataclysm Pulse", () => {
      const pulse = createCataclysmPulse({ particleCount: 20, damage: 1 });
      const emitShieldBreakSpy = vi.fn();
      const playShieldBreakSpy = vi.fn();
      const mockPlayer: any = {
        position: vec2(150, 320),
        isAlive: true,
        takeDamage: vi.fn().mockReturnValue({ absorbed: true, eliminated: false, remainingShields: 0 }),
      };

      const ctx: BossTransitionContext = {
        bossPosition: vec2(700, 320),
        currentPhase: 0,
        nextPhase: 1,
        player: mockPlayer,
        obstacles: [],
        particles: { emitShieldBreak: emitShieldBreakSpy, emitShatter: vi.fn() } as any,
        soundSynth: { playShieldBreak: playShieldBreakSpy } as any,
      };

      pulse(ctx);
      expect(emitShieldBreakSpy).toHaveBeenCalledWith(mockPlayer.position, 16);
      expect(playShieldBreakSpy).toHaveBeenCalledWith(1.0);
    });
  });
});
