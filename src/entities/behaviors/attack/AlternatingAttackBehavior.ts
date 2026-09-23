/**
 * Alternating Attack Behavior for ChronoShot.
 *
 * Coordinates multi-mode weapon cycling across an array of AttackBehavior delegates.
 * Alternates to the next behavior upon every successful discharge, enabling complex
 * boss attack sequences (e.g. cycling between telegraphed precision beam and wide fan spreads).
 */

import { Projectile } from "../../Projectile";
import { AttackBehavior, AttackContext } from "./AttackBehavior";

export interface AlternatingAttackConfig {
  behaviors: AttackBehavior[];
  startIndex?: number;
}

export class AlternatingAttackBehavior implements AttackBehavior {
  public readonly behaviors: AttackBehavior[];
  public currentIndex: number;

  constructor(config: AlternatingAttackConfig) {
    if (!config.behaviors || config.behaviors.length === 0) {
      throw new Error("AlternatingAttackBehavior requires at least one sub-behavior.");
    }
    this.behaviors = config.behaviors;
    this.currentIndex = config.startIndex ?? 0;
  }

  public get currentBehavior(): AttackBehavior {
    return this.behaviors[this.currentIndex];
  }

  public get fireCadenceTicks(): number {
    return this.currentBehavior.fireCadenceTicks;
  }

  public get fireCooldownTicks(): number {
    return this.currentBehavior.fireCooldownTicks;
  }

  public set fireCooldownTicks(val: number) {
    this.currentBehavior.fireCooldownTicks = val;
  }

  public get isChargingLaser(): boolean {
    return this.currentBehavior.isChargingLaser;
  }

  public set isChargingLaser(val: boolean) {
    this.currentBehavior.isChargingLaser = val;
  }

  public get stutterTimerTicks(): number {
    return this.currentBehavior.stutterTimerTicks;
  }

  public set stutterTimerTicks(val: number) {
    this.currentBehavior.stutterTimerTicks = val;
  }

  public update(
    ctx: AttackContext,
    hasLineOfSight: boolean,
    deltaTicks: number = 1
  ): Projectile[] {
    const fired = this.currentBehavior.update(ctx, hasLineOfSight, deltaTicks);
    if (fired.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.behaviors.length;
    }
    return fired;
  }

  public discharge(ctx: AttackContext): Projectile[] {
    const fired = this.currentBehavior.discharge(ctx);
    this.currentIndex = (this.currentIndex + 1) % this.behaviors.length;
    return fired;
  }

  public reset(): void {
    this.currentIndex = 0;
    for (const b of this.behaviors) {
      b.reset();
    }
  }
}
