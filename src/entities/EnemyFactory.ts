/**
 * Enemy Blueprint & Archetype Factory for ChronoShot.
 *
 * Provides data-driven archetype blueprints and component factory methods
 * to construct combat units from modular movement and attack behaviors.
 */

import { EnemyChassisType } from "../ui/EnemyRenderer";
import { AttackBehavior, AttackContext } from "./behaviors/attack/AttackBehavior";
import { FanSpreadBehavior } from "./behaviors/attack/FanSpreadBehavior";
import { SingleSlugBehavior } from "./behaviors/attack/SingleSlugBehavior";
import { TelegraphedBeamBehavior } from "./behaviors/attack/TelegraphedBeamBehavior";
import { DirectAdvanceBehavior } from "./behaviors/movement/DirectAdvanceBehavior";
import { KiterBehavior } from "./behaviors/movement/KiterBehavior";
import { MovementBehavior } from "./behaviors/movement/MovementBehavior";
import { Enemy, EnemyConfig, EnemyType } from "./Enemy";
import { createProjectile, Projectile } from "./Projectile";
import { vec2 } from "../math/vector";

export interface EnemyBlueprint {
  readonly type: EnemyType;
  readonly radius: number;
  readonly speed: number;
  readonly maxShields: number;
  readonly fireCadenceTicks: number;
  readonly bulletSpeed: number;
  readonly spreadAngle: number;
  readonly pellets: number;
  readonly stutterTicks: number;
  readonly runAndGun: boolean;
  readonly chassis: EnemyChassisType;
  readonly createMovement: (config?: Partial<EnemyConfig>) => MovementBehavior;
  readonly createAttack: (config?: Partial<EnemyConfig>) => AttackBehavior;
}

/**
 * Specialized attack behavior for Goliath-01 Aegis Colossus.
 * Discharges a pinpoint slug in phase 1, transitioning to a 3-pellet fan spread in enraged phase 2.
 */
export class BossAttackBehavior implements AttackBehavior {
  public readonly fireCadenceTicks: number;
  public fireCooldownTicks: number;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;
  public isEnraged: boolean = false;

  public bulletSpeed: number;
  public spreadAngle: number;
  public pellets: number;
  public stutterTicks: number;
  private readonly initialDelayTicks: number;

  constructor(config: {
    fireCadenceTicks?: number;
    bulletSpeed?: number;
    spreadAngle?: number;
    pellets?: number;
    stutterTicks?: number;
    initialDelayTicks?: number;
  } = {}) {
    this.fireCadenceTicks = config.fireCadenceTicks ?? 60;
    this.bulletSpeed = config.bulletSpeed ?? 520;
    this.spreadAngle = config.spreadAngle ?? 0.05;
    this.pellets = config.pellets ?? 1;
    this.stutterTicks = config.stutterTicks ?? 10;
    this.initialDelayTicks =
      config.initialDelayTicks ?? Math.floor(this.fireCadenceTicks * 0.5);
    this.fireCooldownTicks = this.initialDelayTicks;
  }

  public update(
    ctx: AttackContext,
    hasLineOfSight: boolean,
    deltaTicks: number = 1
  ): Projectile[] {
    if (this.stutterTimerTicks > 0) {
      this.stutterTimerTicks = Math.max(0, this.stutterTimerTicks - deltaTicks);
    }

    if (!hasLineOfSight) {
      return [];
    }

    this.fireCooldownTicks -= deltaTicks;

    if (this.fireCooldownTicks <= 0) {
      this.fireCooldownTicks = this.fireCadenceTicks;
      if (this.stutterTicks > 0) {
        this.stutterTimerTicks = this.stutterTicks;
      }
      const fired = this.discharge(ctx);
      if (this.stutterTimerTicks > 0) {
        this.stutterTimerTicks = Math.max(0, this.stutterTimerTicks - deltaTicks);
      }
      return fired;
    }

    return [];
  }

  public discharge(ctx: AttackContext): Projectile[] {
    const pellets = this.isEnraged ? 3 : this.pellets;
    const spreadAngle = this.isEnraged ? 0.35 : this.spreadAngle;
    const spawnOffset = ctx.radius + 6;
    const projectiles: Projectile[] = [];

    if (pellets === 1) {
      const angle = ctx.aimAngle + (Math.random() - 0.5) * spreadAngle;
      const spawnPos = vec2(
        ctx.position.x + Math.cos(angle) * spawnOffset,
        ctx.position.y + Math.sin(angle) * spawnOffset
      );
      projectiles.push(
        createProjectile(
          `bullet-${ctx.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          spawnPos,
          angle,
          this.bulletSpeed,
          "enemy"
        )
      );
    } else {
      const halfSpread = spreadAngle / 2;
      const angleStep = spreadAngle / (pellets - 1);

      for (let i = 0; i < pellets; i++) {
        const pelletAngle = ctx.aimAngle - halfSpread + i * angleStep;
        const spawnPos = vec2(
          ctx.position.x + Math.cos(pelletAngle) * spawnOffset,
          ctx.position.y + Math.sin(pelletAngle) * spawnOffset
        );
        projectiles.push(
          createProjectile(
            `bullet-${ctx.id}-${Date.now()}-pellet-${i}`,
            spawnPos,
            pelletAngle,
            this.bulletSpeed,
            "enemy"
          )
        );
      }
    }

    return projectiles;
  }

  public reset(): void {
    this.isEnraged = false;
    this.stutterTimerTicks = 0;
    this.fireCooldownTicks = this.initialDelayTicks;
  }
}

export const BLUEPRINTS: Record<EnemyType, EnemyBlueprint> = {
  grunt: {
    type: "grunt",
    radius: 15,
    speed: 120,
    maxShields: 0,
    fireCadenceTicks: 50,
    bulletSpeed: 550,
    spreadAngle: 0.04,
    pellets: 1,
    stutterTicks: 6,
    runAndGun: false,
    chassis: "diamond",
    createMovement: () => new DirectAdvanceBehavior(),
    createAttack: (config) =>
      new SingleSlugBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 50,
        bulletSpeed: config?.bulletSpeed ?? 550,
        spreadAngle: config?.spreadAngle ?? 0.04,
        stutterTicks: 6,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },

  shotgun: {
    type: "shotgun",
    radius: 16,
    speed: 90,
    maxShields: 1,
    fireCadenceTicks: 80,
    bulletSpeed: 480,
    spreadAngle: 0.35,
    pellets: 5,
    stutterTicks: 8,
    runAndGun: false,
    chassis: "rounded",
    createMovement: () => new DirectAdvanceBehavior(),
    createAttack: (config) =>
      new FanSpreadBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 80,
        bulletSpeed: config?.bulletSpeed ?? 480,
        spreadAngle: config?.spreadAngle ?? 0.35,
        pellets: config?.pellets ?? 5,
        stutterTicks: 8,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },

  stalker: {
    type: "stalker",
    radius: 13,
    speed: 210,
    maxShields: 0,
    fireCadenceTicks: 32,
    bulletSpeed: 500,
    spreadAngle: 0.08,
    pellets: 1,
    stutterTicks: 0,
    runAndGun: true,
    chassis: "chevron",
    createMovement: () => new DirectAdvanceBehavior(),
    createAttack: (config) =>
      new SingleSlugBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 32,
        bulletSpeed: config?.bulletSpeed ?? 500,
        spreadAngle: config?.spreadAngle ?? 0.08,
        stutterTicks: 0,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },

  warden: {
    type: "warden",
    radius: 18,
    speed: 60,
    maxShields: 2,
    fireCadenceTicks: 65,
    bulletSpeed: 580,
    spreadAngle: 0.03,
    pellets: 1,
    stutterTicks: 8,
    runAndGun: false,
    chassis: "hexagon",
    createMovement: () => new DirectAdvanceBehavior(),
    createAttack: (config) =>
      new SingleSlugBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 65,
        bulletSpeed: config?.bulletSpeed ?? 580,
        spreadAngle: config?.spreadAngle ?? 0.03,
        stutterTicks: 8,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },

  marksman: {
    type: "marksman",
    radius: 14,
    speed: 80,
    maxShields: 0,
    fireCadenceTicks: 110,
    bulletSpeed: 850,
    spreadAngle: 0.01,
    pellets: 1,
    stutterTicks: 0,
    runAndGun: false,
    chassis: "star",
    createMovement: () => new KiterBehavior({ minDist: 340, maxDist: 520 }),
    createAttack: (config) =>
      new TelegraphedBeamBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 110,
        bulletSpeed: config?.bulletSpeed ?? 850,
        spreadAngle: config?.spreadAngle ?? 0.01,
        laserChargeTicks: 30,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },

  boss: {
    type: "boss",
    radius: 24,
    speed: 55,
    maxShields: 4,
    fireCadenceTicks: 60,
    bulletSpeed: 520,
    spreadAngle: 0.05,
    pellets: 1,
    stutterTicks: 10,
    runAndGun: false,
    chassis: "octagon",
    createMovement: () => new DirectAdvanceBehavior(),
    createAttack: (config) =>
      new BossAttackBehavior({
        fireCadenceTicks: config?.fireCadenceTicks ?? 60,
        bulletSpeed: config?.bulletSpeed ?? 520,
        spreadAngle: config?.spreadAngle ?? 0.05,
        pellets: config?.pellets ?? 1,
        stutterTicks: 10,
        initialDelayTicks: config?.initialDelayTicks,
      }),
  },
};

export class EnemyFactory {
  /**
   * Retrieves registered blueprint for a given enemy archetype.
   */
  public static getBlueprint(type: EnemyType): EnemyBlueprint {
    return BLUEPRINTS[type] ?? BLUEPRINTS.grunt;
  }

  /**
   * Registers or overrides a blueprint for an archetype type.
   */
  public static registerBlueprint(blueprint: EnemyBlueprint): void {
    BLUEPRINTS[blueprint.type] = blueprint;
  }

  /**
   * Constructs an Enemy instance adhering to archetype blueprints.
   */
  public static createEnemy(config: EnemyConfig): Enemy {
    return new Enemy(config);
  }
}
