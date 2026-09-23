import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../../math/vector";
import { BossPhaseConfig, BossPhaseController, BossTransitionContext } from "./BossPhaseController";
import {
  combineTransitionActions,
  createAudioCue,
  createMinionEscortSpawn,
  createShockwavePulse,
  generateRadialParticleConfigs,
  resolveEscortDefinitions,
} from "./BossTransitionAction";

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
});
