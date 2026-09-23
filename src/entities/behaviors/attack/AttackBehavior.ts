/**
 * Attack Behavior interface & context contracts for ChronoShot.
 *
 * Defines modular attack strategies for combat entities, decoupling weapon
 * cycling, charging telegraphs, stutter delays, and projectile ballistics
 * from unit movement and state machines.
 */

import { Vector2D } from "../../../math/vector";
import { Projectile } from "../../Projectile";

export interface AttackContext {
  id: string;
  position: Vector2D;
  aimAngle: number;
  radius: number;
}

export interface AttackBehavior {
  readonly fireCadenceTicks: number;
  fireCooldownTicks: number;
  isChargingLaser: boolean;
  stutterTimerTicks: number;
  update(
    ctx: AttackContext,
    hasLineOfSight: boolean,
    deltaTicks: number
  ): Projectile[];
  discharge(ctx: AttackContext): Projectile[];
  reset(): void;
}
