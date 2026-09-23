/**
 * Telegraphed Beam Attack Behavior for ChronoShot.
 *
 * Implements high-velocity precision beam discharge with sightline laser telegraphing.
 * Used by the Marksman sniper archetype. Enters a charging state during the final
 * countdown ticks prior to firing, telegraphing the impending shot to the player,
 * and clears charging state immediately upon discharge or loss of sightline.
 */

import { vec2 } from "../../../math/vector";
import { createProjectile, Projectile } from "../../Projectile";
import { AttackBehavior, AttackContext } from "./AttackBehavior";

export interface TelegraphedBeamConfig {
  fireCadenceTicks?: number;
  bulletSpeed?: number;
  spreadAngle?: number;
  laserChargeTicks?: number;
  stutterTicks?: number;
  initialDelayTicks?: number;
}

export class TelegraphedBeamBehavior implements AttackBehavior {
  public readonly fireCadenceTicks: number;
  public fireCooldownTicks: number;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;

  public bulletSpeed: number;
  public spreadAngle: number;
  public laserChargeTicks: number;
  public stutterTicks: number;
  private readonly initialDelayTicks: number;

  constructor(config: TelegraphedBeamConfig = {}) {
    this.fireCadenceTicks = config.fireCadenceTicks ?? 110;
    this.bulletSpeed = config.bulletSpeed ?? 850;
    this.spreadAngle = config.spreadAngle ?? 0.01;
    this.laserChargeTicks = config.laserChargeTicks ?? 30;
    this.stutterTicks = config.stutterTicks ?? 0;
    this.initialDelayTicks =
      config.initialDelayTicks ?? Math.floor(this.fireCadenceTicks * 0.5);
    this.fireCooldownTicks = this.initialDelayTicks;
  }

  /**
   * Updates laser charging state and firing countdown based on line of sight.
   * Charging is active when line of sight is clear and cooldown is within the charge window.
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
      this.isChargingLaser = false;
      return [];
    }

    this.fireCooldownTicks -= deltaTicks;

    if (this.fireCooldownTicks <= 0) {
      this.fireCooldownTicks = this.fireCadenceTicks;
      this.isChargingLaser = false;
      if (this.stutterTicks > 0) {
        this.stutterTimerTicks = this.stutterTicks;
      }
      const fired = this.discharge(ctx);
      if (this.stutterTimerTicks > 0) {
        this.stutterTimerTicks = Math.max(0, this.stutterTimerTicks - deltaTicks);
      }
      return fired;
    }

    this.isChargingLaser = this.fireCooldownTicks <= this.laserChargeTicks;
    return [];
  }

  /**
   * Discharges a single hyper-velocity beam slug and clears laser charge status.
   */
  public discharge(ctx: AttackContext): Projectile[] {
    this.isChargingLaser = false;

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
   * Resets cooldown, laser charging state, and stutter timers to initial values.
   */
  public reset(): void {
    this.fireCooldownTicks = this.initialDelayTicks;
    this.stutterTimerTicks = 0;
    this.isChargingLaser = false;
  }
}
