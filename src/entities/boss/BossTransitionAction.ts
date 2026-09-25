/**
 * Boss Phase Transition Actions for ChronoShot.
 *
 * Provides composable action helpers for phase lifecycle hooks:
 * - Radial particle shockwave pulse emissions
 * - Audio synthesis sound cues
 * - Escort minion reinforcement summons
 * - Combinators for chaining multiple transition effects
 */

import { rayIntersectsAABB, testCircleAABB } from "../../math/collision";
import { vecDistance, vecScale, vecSub, Vector2D } from "../../math/vector";
import { Obstacle } from "../Obstacle";
import { Enemy } from "../Enemy";
import { CombatUnit } from "../Projectile";
import { BossTransitionContext } from "./BossPhaseController";

/**
 * Definition for an individual particle emitted during a radial shockwave pulse.
 */
export interface ShockwaveParticleConfig {
  angle: number;
  speed: number;
  color: string;
  position: Vector2D;
  velocity: Vector2D;
}

/**
 * Callable action that triggers a radial shockwave pulse and provides configuration telemetry.
 */
export interface ShockwavePulseAction {
  (ctx: BossTransitionContext): ShockwaveParticleConfig[];
  readonly type: "shockwave_pulse";
  readonly particleCount: number;
  readonly speed: number;
  readonly color: string;
  readonly config: {
    particleCount: number;
    speed: number;
    color: string;
  };
  execute(ctx: BossTransitionContext): ShockwaveParticleConfig[];
  createParticleConfigs(origin: Vector2D): ShockwaveParticleConfig[];
}

/**
 * Generates an array of radial shockwave particle configurations radiating evenly around 360 degrees.
 */
export function generateRadialParticleConfigs(
  origin: Vector2D,
  particleCount: number,
  speed: number,
  color: string
): ShockwaveParticleConfig[] {
  const configs: ShockwaveParticleConfig[] = [];
  if (particleCount <= 0) {
    return configs;
  }

  const angleStep = (Math.PI * 2) / particleCount;

  for (let i = 0; i < particleCount; i++) {
    const angle = i * angleStep;
    configs.push({
      angle,
      speed,
      color,
      position: { x: origin.x, y: origin.y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
    });
  }

  return configs;
}

/**
 * Creates a composable shockwave pulse transition action.
 * Emits radial crystalline shard bursts upon phase transition.
 *
 * @param particleCount Number of radial shards (default: 24).
 * @param speed Radial expansion speed in pixels/sec (default: 280).
 * @param color Hex/CSS color code (default: "#00f0ff").
 */
export function createShockwavePulse(
  particleCount: number = 24,
  speed: number = 280,
  color: string = "#00f0ff"
): ShockwavePulseAction {
  const action = ((ctx: BossTransitionContext): ShockwaveParticleConfig[] => {
    const particles = generateRadialParticleConfigs(
      ctx.bossPosition,
      particleCount,
      speed,
      color
    );

    if (ctx.particles && typeof ctx.particles.emitShatter === "function") {
      ctx.particles.emitShatter(ctx.bossPosition, particleCount, color, speed);
    }

    if (ctx.soundSynth && typeof ctx.soundSynth.playShieldBreak === "function") {
      ctx.soundSynth.playShieldBreak(1.0);
    }

    return particles;
  }) as ShockwavePulseAction;

  const fn = action as any;
  fn.type = "shockwave_pulse";
  fn.particleCount = particleCount;
  fn.speed = speed;
  fn.color = color;
  fn.config = { particleCount, speed, color };
  fn.execute = (ctx: BossTransitionContext) => action(ctx);
  fn.createParticleConfigs = (origin: Vector2D) =>
    generateRadialParticleConfigs(origin, particleCount, speed, color);

  return action;
}

let minionIdCounter = 0;

/**
 * Configuration definition for an escort reinforcement unit.
 */
export interface EscortMinionDefinition {
  type?: string;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  id?: string;
  speed?: number;
  maxShields?: number;
  [key: string]: any;
}

/**
 * Callable action that spawns escort minions and provides reinforcement definitions.
 */
export interface MinionEscortSpawnAction {
  (ctx: BossTransitionContext): any[];
  readonly type: "minion_escort_spawn";
  readonly minionConfigs: any[];
  readonly config: { minionConfigs: any[] };
  execute(ctx: BossTransitionContext): any[];
  resolveDefinitions(bossPos: Vector2D): any[];
}

/**
 * Resolves escort minion definitions relative to the boss's position.
 */
export function resolveEscortDefinitions(
  bossPos: Vector2D,
  minionConfigs: any[]
): any[] {
  return minionConfigs.map((cfg, idx) => {
    const type = cfg.type ?? "grunt";
    const offsetX = cfg.offsetX ?? 0;
    const offsetY = cfg.offsetY ?? 0;
    const x = cfg.x !== undefined ? cfg.x : bossPos.x + offsetX;
    const y = cfg.y !== undefined ? cfg.y : bossPos.y + offsetY;
    const id = cfg.id ?? `escort-${type}-${Date.now()}-${minionIdCounter++}-${idx}`;

    return {
      ...cfg,
      id,
      type,
      x,
      y,
      offsetX,
      offsetY,
    };
  });
}

const DEFAULT_ENEMY_RADII: Record<string, number> = {
  grunt: 15,
  shotgun: 16,
  stalker: 14,
  warden: 16,
  marksman: 14,
  sniper: 14,
  boss: 26,
};

function isPositionClear(
  pos: Vector2D,
  radius: number,
  obstacles: readonly Obstacle[],
  existingUnits: readonly CombatUnit[],
  bounds: { width: number; height: number }
): boolean {
  const width = bounds?.width ?? 960;
  const height = bounds?.height ?? 640;

  if (
    pos.x < radius ||
    pos.x > width - radius ||
    pos.y < radius ||
    pos.y > height - radius
  ) {
    return false;
  }

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (testCircleAABB(pos, radius + 2, obs.bounds.min, obs.bounds.max) !== null) {
      return false;
    }
  }

  for (let i = 0; i < existingUnits.length; i++) {
    const unit = existingUnits[i];
    if (!unit || unit.isAlive === false || !unit.position) continue;
    const unitRadius = unit.radius ?? 15;
    if (vecDistance(pos, unit.position) < radius + unitRadius) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves a safe dynamic spawn position for a combat unit.
 *
 * Validates arena bounds, obstacle clearance (+2px margin), and active unit separation.
 * If the candidate position is obstructed, performs a concentric radial search
 * (radii 24, 48, 72, 96, 120 px across 16 angular increments) to locate the closest
 * clear candidate. Falls back to bounds-clamped position if all candidates are blocked.
 *
 * @param candidate Proposed candidate coordinate
 * @param radius Unit collision radius
 * @param obstacles Arena solid obstacles
 * @param existingUnits Active combat units
 * @param bounds Arena dimensions
 */
export function resolveSafeSpawnPosition(
  candidate: Vector2D,
  radius: number,
  obstacles: readonly Obstacle[] = [],
  existingUnits: readonly CombatUnit[] = [],
  bounds: { width: number; height: number } = { width: 960, height: 640 }
): Vector2D {
  const width = bounds?.width ?? 960;
  const height = bounds?.height ?? 640;
  const arenaBounds = { width, height };

  if (isPositionClear(candidate, radius, obstacles, existingUnits, arenaBounds)) {
    return { ...candidate };
  }

  const searchRadii = [24, 48, 72, 96, 120];
  const angleIncrements = 16;
  const angleStep = (Math.PI * 2) / angleIncrements;

  for (const r of searchRadii) {
    for (let k = 0; k < angleIncrements; k++) {
      const angle = k * angleStep;
      const probe: Vector2D = {
        x: candidate.x + Math.cos(angle) * r,
        y: candidate.y + Math.sin(angle) * r,
      };

      if (isPositionClear(probe, radius, obstacles, existingUnits, arenaBounds)) {
        return probe;
      }
    }
  }

  return {
    x: Math.max(radius, Math.min(candidate.x, width - radius)),
    y: Math.max(radius, Math.min(candidate.y, height - radius)),
  };
}

/**
 * Creates a composable escort minion spawn transition action.
 *
 * @param minionConfigs Array of minion configurations or relative offsets.
 */
export function createMinionEscortSpawn(
  minionConfigs: any[]
): MinionEscortSpawnAction {
  const action = ((ctx: BossTransitionContext): any[] => {
    const resolved = resolveEscortDefinitions(ctx.bossPosition, minionConfigs);

    if (ctx.arena) {
      const obstacles: readonly Obstacle[] = ctx.arena.obstacles ?? [];
      const arenaBounds = {
        width: ctx.arena.width ?? 960,
        height: ctx.arena.height ?? 640,
      };

      for (const item of resolved) {
        const radius = item.radius ?? (DEFAULT_ENEMY_RADII[item.type] ?? 15);
        const existingUnits: CombatUnit[] = [];
        if (ctx.arena.player) {
          existingUnits.push(ctx.arena.player);
        }
        if (Array.isArray(ctx.arena.enemies)) {
          existingUnits.push(...ctx.arena.enemies);
        }

        const safePos = resolveSafeSpawnPosition(
          { x: item.x, y: item.y },
          radius,
          obstacles,
          existingUnits,
          arenaBounds
        );
        item.x = safePos.x;
        item.y = safePos.y;

        if (typeof ctx.arena.spawnEnemy === "function") {
          ctx.arena.spawnEnemy(item);
        } else if (Array.isArray(ctx.arena.enemies)) {
          const enemy = item instanceof Enemy ? item : new Enemy(item);
          ctx.arena.enemies.push(enemy);
        }
      }
    }

    if (typeof ctx.spawnMinion === "function") {
      for (const item of resolved) {
        ctx.spawnMinion(item);
      }
    }

    return resolved;
  }) as MinionEscortSpawnAction;

  const fn = action as any;
  fn.type = "minion_escort_spawn";
  fn.minionConfigs = [...minionConfigs];
  fn.config = { minionConfigs: [...minionConfigs] };
  fn.execute = (ctx: BossTransitionContext) => action(ctx);
  fn.resolveDefinitions = (bossPos: Vector2D) =>
    resolveEscortDefinitions(bossPos, minionConfigs);

  return action;
}

/**
 * Creates an audio cue transition action playing procedural audio on phase transition.
 */
export function createAudioCue(
  cue: "shieldBreak" | "shatter" | "shieldDeflect" | "bossDefeat" | string = "shieldBreak"
) {
  const action = (ctx: BossTransitionContext): void => {
    if (!ctx.soundSynth) return;

    if (cue === "shieldBreak" && typeof ctx.soundSynth.playShieldBreak === "function") {
      ctx.soundSynth.playShieldBreak(1.0);
    } else if (cue === "shatter" && typeof ctx.soundSynth.playShatter === "function") {
      ctx.soundSynth.playShatter(1.0);
    } else if (cue === "bossDefeat" && typeof ctx.soundSynth.playBossDefeat === "function") {
      ctx.soundSynth.playBossDefeat(1.0);
    } else if (cue === "shieldDeflect" && typeof ctx.soundSynth.playShieldDeflect === "function") {
      ctx.soundSynth.playShieldDeflect(1.0);
    }
  };

  action.type = "audio_cue";
  action.cue = cue;
  return action;
}

/**
  * Combines multiple transition actions into a single composite lifecycle hook.
  */
export function combineTransitionActions(
  ...actions: ((ctx: BossTransitionContext) => any)[]
): (ctx: BossTransitionContext) => void {
  return (ctx: BossTransitionContext): void => {
    for (const action of actions) {
      action(ctx);
    }
  };
}

/**
 * Result returned upon evaluating Cataclysm Pulse line-of-sight occlusion.
 */
export interface CataclysmPulseResult {
  occluded: boolean;
  damageDealt: number;
  occludingObstacle?: Obstacle;
}

/**
 * Tests raycast line-of-sight between origin and target against solid obstacles.
 * Returns true if line-of-sight is clear (unobstructed), false if blocked by any obstacle.
 */
export function testLineOfSightOcclusion(
  origin: Vector2D,
  target: Vector2D,
  obstacles: readonly Obstacle[] = []
): { occluded: boolean; obstacle?: Obstacle } {
  const diff = vecSub(target, origin);
  const dist = vecDistance(origin, target);

  if (dist < 1e-4) {
    return { occluded: false };
  }

  const dir = vecScale(diff, 1 / dist);

  for (const obstacle of obstacles) {
    const hit = rayIntersectsAABB(
      origin,
      dir,
      obstacle.bounds.min,
      obstacle.bounds.max,
      dist
    );

    if (hit && hit.distance < dist) {
      return { occluded: true, obstacle };
    }
  }

  return { occluded: false };
}

export interface CataclysmPulseConfig {
  particleCount?: number;
  speed?: number;
  color?: string;
  damage?: number;
}

export interface CataclysmPulseAction {
  (ctx: BossTransitionContext): CataclysmPulseResult;
  readonly type: "cataclysm_pulse";
  readonly config: CataclysmPulseConfig;
  execute(ctx: BossTransitionContext): CataclysmPulseResult;
}

/**
 * Creates a Cataclysm Pulse action discharging an arena-wide energy wave
 * that inflicts damage unless occluded by solid obstacle geometry.
 */
export function createCataclysmPulse(
  config: CataclysmPulseConfig = {}
): CataclysmPulseAction {
  const particleCount = config.particleCount ?? 36;
  const speed = config.speed ?? 360;
  const color = config.color ?? "#ff1744";
  const damage = config.damage ?? 1;

  const action = ((ctx: BossTransitionContext): CataclysmPulseResult => {
    // 1. Emit radial shockwave particles and audio
    if (ctx.particles && typeof ctx.particles.emitShatter === "function") {
      ctx.particles.emitShatter(ctx.bossPosition, particleCount, color, speed);
    }
    if (ctx.soundSynth && typeof ctx.soundSynth.playShieldBreak === "function") {
      ctx.soundSynth.playShieldBreak(1.0);
    }

    const player = ctx.player ?? ctx.arena?.player;
    const obstacles: readonly Obstacle[] = ctx.obstacles ?? ctx.arena?.obstacles ?? [];

    if (!player || !player.isAlive) {
      return { occluded: false, damageDealt: 0 };
    }

    const { occluded, obstacle } = testLineOfSightOcclusion(
      ctx.bossPosition,
      player.position,
      obstacles
    );

    if (occluded) {
      // Occluded behind obstacle: 0 damage, emit deflection feedback
      if (ctx.particles && typeof ctx.particles.emitImpactSparks === "function" && obstacle) {
        ctx.particles.emitImpactSparks(player.position, { x: 0, y: 1 }, 8);
      }
      if (ctx.soundSynth && typeof ctx.soundSynth.playShieldDeflect === "function") {
        ctx.soundSynth.playShieldDeflect(1.0);
      }
      return { occluded: true, damageDealt: 0, occludingObstacle: obstacle };
    }

    // Exposed in open line of sight: inflict damage on player
    const damageResult = player.takeDamage(damage);

    if (damageResult?.absorbed) {
      if (damageResult.deflected) {
        if (ctx.particles && typeof ctx.particles.emitShieldSparks === "function") {
          ctx.particles.emitShieldSparks(player.position, { x: 0, y: -1 }, 8);
        }
        if (ctx.soundSynth && typeof ctx.soundSynth.playShieldDeflect === "function") {
          ctx.soundSynth.playShieldDeflect(1.0);
        }
      } else if (damageResult.remainingShields === 0) {
        if (ctx.particles && typeof ctx.particles.emitShieldBreak === "function") {
          ctx.particles.emitShieldBreak(player.position, 16);
        }
        if (ctx.soundSynth && typeof ctx.soundSynth.playShieldBreak === "function") {
          ctx.soundSynth.playShieldBreak(1.0);
        }
      } else {
        if (ctx.particles && typeof ctx.particles.emitShieldSparks === "function") {
          ctx.particles.emitShieldSparks(player.position, { x: 0, y: -1 }, 8);
        }
        if (ctx.soundSynth && typeof ctx.soundSynth.playShieldDeflect === "function") {
          ctx.soundSynth.playShieldDeflect(1.0);
        }
      }
    } else if (damageResult?.eliminated || !player.isAlive) {
      if (ctx.particles && typeof ctx.particles.emitShatter === "function") {
        ctx.particles.emitShatter(player.position, 22, "#00f0ff", 240);
      }
      if (ctx.soundSynth && typeof ctx.soundSynth.playShatter === "function") {
        ctx.soundSynth.playShatter(1.0);
      }
      if (ctx.arena) {
        ctx.arena.status = "defeat";
      }
    }

    return { occluded: false, damageDealt: damage };
  }) as CataclysmPulseAction;

  const fn = action as any;
  fn.type = "cataclysm_pulse";
  fn.config = { particleCount, speed, color, damage };
  fn.execute = (ctx: BossTransitionContext) => action(ctx);

  return action;
}
