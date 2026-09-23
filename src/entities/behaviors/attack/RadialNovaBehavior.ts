/**
 * Radial Nova Attack Behavior for ChronoShot.
 *
 * Implements omnidirectional 360-degree projectile rings with configurable
 * pellet count, bullet speed, and spiral angular offsets.
 * Used for bullet-hell encounters, boss milestone phases, and nova barrages.
 * Manages discrete fire cooldown ticks and recoil stutter delay.
 */

import { vec2 } from "../../../math/vector";
import { createProjectile, Projectile } from "../../Projectile";
import { AttackBehavior, AttackContext } from "./AttackBehavior";

export interface RadialNovaConfig {
  fireCadenceTicks?: number;
  bulletSpeed?: number;
  pellets?: number;
  stutterTicks?: number;
  angularOffsetStep?: number;
  initialDelayTicks?: number;
  initialAngle?: number;
}

export class RadialNovaBehavior implements AttackBehavior {
  public readonly fireCadenceTicks: number;
  public fireCooldownTicks: number;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;

  public bulletSpeed: number;
  public pellets: number;
  public stutterTicks: number;
  public angularOffsetStep: number;
  public currentRotationAngle: number;
  private readonly initialDelayTicks: number;
  private readonly initialAngle: number;

  public get currentAngle(): number {
    return this.currentRotationAngle;
  }
  public set currentAngle(val: number) {
    this.currentRotationAngle = val;
  }

  constructor(config: RadialNovaConfig = {}) {
    this.fireCadenceTicks = config.fireCadenceTicks ?? 60;
    this.bulletSpeed = config.bulletSpeed ?? 420;
    this.pellets = config.pellets ?? 12;
    this.stutterTicks = config.stutterTicks ?? 10;
    this.angularOffsetStep = config.angularOffsetStep ?? 0;
    this.initialAngle = config.initialAngle ?? 0;
    this.currentRotationAngle = this.initialAngle;
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
   * Discharges an evenly spaced 360-degree ring of `pellets` projectiles offset by `ctx.radius + 6`.
   * Advances internal rotation by `angularOffsetStep` on each discharge.
   */
  public discharge(ctx: AttackContext): Projectile[] {
    const projectiles: Projectile[] = [];
    if (this.pellets <= 0) {
      this.currentRotationAngle += this.angularOffsetStep;
      return projectiles;
    }

    const spawnOffset = ctx.radius + 6;
    const angleStep = (Math.PI * 2) / this.pellets;

    for (let i = 0; i < this.pellets; i++) {
      const pelletAngle = this.currentRotationAngle + i * angleStep;
      const spawnPos = vec2(
        ctx.position.x + Math.cos(pelletAngle) * spawnOffset,
        ctx.position.y + Math.sin(pelletAngle) * spawnOffset
      );
      projectiles.push(
        createProjectile(
          `bullet-${ctx.id}-${Date.now()}-nova-${i}`,
          spawnPos,
          pelletAngle,
          this.bulletSpeed,
          "enemy"
        )
      );
    }

    this.currentRotationAngle += this.angularOffsetStep;
    return projectiles;
  }

  /**
   * Resets firing cooldowns, stutter timers, and rotation angle to pristine initial state.
   */
  public reset(): void {
    this.fireCooldownTicks = this.initialDelayTicks;
    this.stutterTimerTicks = 0;
    this.isChargingLaser = false;
    this.currentRotationAngle = this.initialAngle;
  }
}
