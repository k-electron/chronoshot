/**
 * Fan Spread Attack Behavior for ChronoShot.
 *
 * Implements multi-pellet buckshot spread discharge across an angular fan arc.
 * Used by Shotgun Guard and multi-directional barrage phases (e.g. Enraged Goliath Boss).
 * Manages discrete fire cooldown ticks and recoil stutter delay.
 */

import { vec2 } from "../../../math/vector";
import { createProjectile, Projectile } from "../../Projectile";
import { AttackBehavior, AttackContext } from "./AttackBehavior";

export interface FanSpreadConfig {
  fireCadenceTicks?: number;
  bulletSpeed?: number;
  spreadAngle?: number;
  pellets?: number;
  stutterTicks?: number;
  initialDelayTicks?: number;
}

export class FanSpreadBehavior implements AttackBehavior {
  public readonly fireCadenceTicks: number;
  public fireCooldownTicks: number;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;

  public bulletSpeed: number;
  public spreadAngle: number;
  public pellets: number;
  public stutterTicks: number;
  private readonly initialDelayTicks: number;

  constructor(config: FanSpreadConfig = {}) {
    this.fireCadenceTicks = config.fireCadenceTicks ?? 80;
    this.bulletSpeed = config.bulletSpeed ?? 480;
    this.spreadAngle = config.spreadAngle ?? 0.35;
    this.pellets = config.pellets ?? 5;
    this.stutterTicks = config.stutterTicks ?? 8;
    this.initialDelayTicks =
      config.initialDelayTicks ?? Math.floor(this.fireCadenceTicks * 0.5);
    this.fireCooldownTicks = this.initialDelayTicks;
  }

  /**
   * Updates firing cadence and stutter delay based on line-of-sight and delta ticks.
   */
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

  /**
   * Discharges `pellets` projectiles fanned evenly across `spreadAngle`.
   */
  public discharge(ctx: AttackContext): Projectile[] {
    const projectiles: Projectile[] = [];
    const spawnOffset = ctx.radius + 6;

    if (this.pellets <= 1) {
      const angle = ctx.aimAngle;
      const spawnPos = vec2(
        ctx.position.x + Math.cos(angle) * spawnOffset,
        ctx.position.y + Math.sin(angle) * spawnOffset
      );
      projectiles.push(
        createProjectile(
          `bullet-${ctx.id}-${Date.now()}-pellet-0`,
          spawnPos,
          angle,
          this.bulletSpeed,
          "enemy"
        )
      );
      return projectiles;
    }

    const halfSpread = this.spreadAngle / 2;
    const angleStep = this.spreadAngle / (this.pellets - 1);

    for (let i = 0; i < this.pellets; i++) {
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

    return projectiles;
  }

  /**
   * Resets firing cooldowns and timers to pristine initial state.
   */
  public reset(): void {
    this.fireCooldownTicks = this.initialDelayTicks;
    this.stutterTimerTicks = 0;
    this.isChargingLaser = false;
  }
}
