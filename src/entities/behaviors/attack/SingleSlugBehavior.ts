/**
 * Single Slug Attack Behavior for ChronoShot.
 *
 * Implements standard precision projectile discharge for combat archetypes
 * such as Pistol Grunt, Stalker, Aegis Warden, and baseline skirmishers.
 * Manages discrete fire cooldown ticks and post-shot recoil stutter timers.
 */

import { vec2 } from "../../../math/vector";
import { createProjectile, Projectile } from "../../Projectile";
import { AttackBehavior, AttackContext } from "./AttackBehavior";

export interface SingleSlugConfig {
  fireCadenceTicks?: number;
  bulletSpeed?: number;
  spreadAngle?: number;
  stutterTicks?: number;
  initialDelayTicks?: number;
}

export class SingleSlugBehavior implements AttackBehavior {
  public readonly fireCadenceTicks: number;
  public fireCooldownTicks: number;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;

  public bulletSpeed: number;
  public spreadAngle: number;
  public stutterTicks: number;
  private readonly initialDelayTicks: number;

  constructor(config: SingleSlugConfig = {}) {
    this.fireCadenceTicks = config.fireCadenceTicks ?? 50;
    this.bulletSpeed = config.bulletSpeed ?? 550;
    this.spreadAngle = config.spreadAngle ?? 0.04;
    this.stutterTicks = config.stutterTicks ?? 6;
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
   * Discharges a single slug projectile offset by (radius + 6) along aimAngle
   * with random distribution within spreadAngle.
   */
  public discharge(ctx: AttackContext): Projectile[] {
    const spawnOffset = ctx.radius + 6;
    const angle = ctx.aimAngle + (Math.random() - 0.5) * this.spreadAngle;
    const spawnPos = vec2(
      ctx.position.x + Math.cos(angle) * spawnOffset,
      ctx.position.y + Math.sin(angle) * spawnOffset
    );

    return [
      createProjectile(
        `bullet-${ctx.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spawnPos,
        angle,
        this.bulletSpeed,
        "enemy"
      ),
    ];
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
