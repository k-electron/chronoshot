/**
 * Projectile Entity & Continuous Collision Detection (CCD) system for ChronoShot.
 *
 * Implements high-speed ballistics with raycast segment checking per fixed simulation tick
 * to completely eliminate tunneling through thin walls, cover pillars, and unit hitboxes.
 */

import { rayIntersectsAABB, rayIntersectsCircle } from "../math/collision";
import {
  vecFromAngle,
  vecLength,
  vecScale,
  Vector2D,
} from "../math/vector";
import { Obstacle } from "./Obstacle";

export type ProjectileOwner = "player" | "enemy";

export interface DamageResult {
  readonly absorbed: boolean;
  readonly eliminated: boolean;
  readonly remainingShields: number;
  readonly deflected?: boolean;
}

export interface CombatUnit {
  readonly id: string;
  readonly position: Vector2D;
  readonly radius: number;
  readonly isAlive: boolean;
  shields?: number;
  maxShields?: number;
  takeDamage?(damage?: number): DamageResult;
  kill(): void;
}

export interface ProjectileHitResult {
  readonly type: "obstacle" | "unit";
  readonly point: Vector2D;
  readonly normal: Vector2D;
  readonly obstacle?: Obstacle;
  readonly unit?: CombatUnit;
  readonly damageResult?: DamageResult;
}

export interface Projectile {
  readonly id: string;
  readonly owner: ProjectileOwner;
  position: Vector2D;
  previousPosition: Vector2D;
  velocity: Vector2D;
  radius: number;
  isAlive: boolean;
  distanceTraveled: number;
  maxRange: number;

  update(
    fixedDeltaTime: number,
    obstacles: Obstacle[],
    targets: CombatUnit[]
  ): ProjectileHitResult | null;
}

export function createProjectile(
  id: string,
  startPos: Vector2D,
  angleRadians: number,
  speed: number,
  owner: ProjectileOwner,
  maxRange = 2500
): Projectile {
  const dir = vecFromAngle(angleRadians);
  const velocity = vecScale(dir, speed);

  return {
    id,
    owner,
    position: { ...startPos },
    previousPosition: { ...startPos },
    velocity,
    radius: 3,
    isAlive: true,
    distanceTraveled: 0,
    maxRange,

    update(
      fixedDeltaTime: number,
      obstacles: Obstacle[],
      targets: CombatUnit[]
    ): ProjectileHitResult | null {
      if (!this.isAlive) {
        return null;
      }

      this.previousPosition = { ...this.position };

      // Step vector for this discrete tick
      const step = vecScale(this.velocity, fixedDeltaTime);
      const stepDistance = vecLength(step);

      if (stepDistance < 1e-4) {
        return null;
      }

      const rayDir = vecScale(step, 1 / stepDistance);
      const rayOrigin = this.position;

      // Track the earliest collision along the ray segment
      let closestHitDistance = stepDistance;
      let hitResult: ProjectileHitResult | null = null;

      // 1. Raycast against all solid obstacles (walls & pillars)
      for (const obstacle of obstacles) {
        const intersection = rayIntersectsAABB(
          rayOrigin,
          rayDir,
          obstacle.bounds.min,
          obstacle.bounds.max,
          closestHitDistance
        );

        if (intersection && intersection.distance < closestHitDistance) {
          closestHitDistance = intersection.distance;
          hitResult = {
            type: "obstacle",
            point: intersection.point,
            normal: intersection.normal,
            obstacle,
          };
        }
      }

      // 2. Raycast against valid alive combat units
      for (const target of targets) {
        if (!target.isAlive) {
          continue;
        }

        const intersection = rayIntersectsCircle(
          rayOrigin,
          rayDir,
          target.position,
          target.radius,
          closestHitDistance
        );

        if (intersection && intersection.distance < closestHitDistance) {
          closestHitDistance = intersection.distance;
          hitResult = {
            type: "unit",
            point: intersection.point,
            normal: intersection.normal,
            unit: target,
          };
        }
      }

      // 3. Process collision outcome
      if (hitResult) {
        this.position = { ...hitResult.point };
        this.isAlive = false;

        if (hitResult.type === "unit" && hitResult.unit) {
          let damageResult: DamageResult;
          if (typeof hitResult.unit.takeDamage === "function") {
            damageResult = hitResult.unit.takeDamage(1);
          } else {
            hitResult.unit.kill();
            damageResult = {
              absorbed: false,
              eliminated: true,
              remainingShields: 0,
            };
          }

          return {
            ...hitResult,
            damageResult,
          };
        }

        return hitResult;
      }

      // No collision along this tick's segment: advance to full step position
      this.position.x += step.x;
      this.position.y += step.y;
      this.distanceTraveled += stepDistance;

      if (this.distanceTraveled >= this.maxRange) {
        this.isAlive = false;
      }

      return null;
    },
  };
}
