/**
 * Enemy Entities module for ChronoShot.
 *
 * Implements tactical combat AI units:
 * - Pistol Grunt: Single accurate lethal shot with medium cadence
 * - Shotgun Guard: Multi-pellet lethal buckshot spread with heavier cadence
 * - Continuous line-of-sight (LOS) obstacle raycasting
 * - Predictive directional aiming and tick-based discharge timers
 */

import { rayIntersectsAABB } from "../math/collision";
import {
  vec2,
  vecAngle,
  vecLength,
  vecScale,
  vecSub,
  Vector2D,
} from "../math/vector";
import { Obstacle } from "./Obstacle";
import { CombatUnit, createProjectile, Projectile } from "./Projectile";

export type EnemyType = "grunt" | "shotgun";

export interface EnemyConfig {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  radius?: number;
  fireCadenceTicks?: number;
  initialDelayTicks?: number;
}

export class Enemy implements CombatUnit {
  public readonly id: string;
  public readonly type: EnemyType;
  public position: Vector2D;
  public previousPosition: Vector2D;
  public radius: number;
  public isAlive: boolean = true;
  public aimAngle: number = 0;
  public hasLineOfSight: boolean = false;
  public fireCooldownTicks: number;

  public readonly fireCadenceTicks: number;
  public readonly bulletSpeed: number;
  public readonly spreadAngle: number;
  public readonly pellets: number;

  private spawnPosition: Vector2D;

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.type = config.type;
    this.spawnPosition = vec2(config.x, config.y);
    this.position = vec2(config.x, config.y);
    this.previousPosition = vec2(config.x, config.y);
    this.radius = config.radius ?? 15;

    if (config.type === "shotgun") {
      this.fireCadenceTicks = config.fireCadenceTicks ?? 75;
      this.bulletSpeed = 480;
      this.spreadAngle = 0.35; // ~20 degrees fan spread
      this.pellets = 5;
    } else {
      // Default: Pistol Grunt
      this.fireCadenceTicks = config.fireCadenceTicks ?? 45;
      this.bulletSpeed = 550;
      this.spreadAngle = 0.04; // High precision
      this.pellets = 1;
    }

    // Optional staggered first shot delay
    this.fireCooldownTicks = config.initialDelayTicks ?? Math.floor(this.fireCadenceTicks * 0.5);
  }

  /**
   * Raycasts a segment from this enemy to target position against all obstacles.
   * Returns true if line-of-sight is unobstructed.
   */
  public checkLineOfSight(targetPos: Vector2D, obstacles: Obstacle[]): boolean {
    const diff = vecSub(targetPos, this.position);
    const dist = vecLength(diff);

    if (dist < 1e-4) {
      this.hasLineOfSight = true;
      return true;
    }

    const dir = vecScale(diff, 1 / dist);

    // Check if any obstacle intercepts the sightline before reaching the target
    for (const obstacle of obstacles) {
      const hit = rayIntersectsAABB(
        this.position,
        dir,
        obstacle.bounds.min,
        obstacle.bounds.max,
        dist
      );

      if (hit && hit.distance < dist) {
        this.hasLineOfSight = false;
        return false;
      }
    }

    this.hasLineOfSight = true;
    return true;
  }

  /**
   * Updates enemy state per fixed simulation tick:
   * - Evaluates line of sight to player
   * - If visible, tracks aim angle and ticks down firing cooldown
   * - Discharges weapon when cooldown reaches zero
   */
  public update(
    target: CombatUnit,
    obstacles: Obstacle[],
    deltaTicks: number = 1
  ): Projectile[] {
    this.previousPosition = { ...this.position };

    if (!this.isAlive || !target.isAlive) {
      this.hasLineOfSight = false;
      return [];
    }

    const canSee = this.checkLineOfSight(target.position, obstacles);
    if (!canSee) {
      return [];
    }

    // Align aim with player position
    const diff = vecSub(target.position, this.position);
    this.aimAngle = vecAngle(diff);

    // Advance discharge timer
    this.fireCooldownTicks -= deltaTicks;

    if (this.fireCooldownTicks <= 0) {
      this.fireCooldownTicks = this.fireCadenceTicks;
      return this.discharge();
    }

    return [];
  }

  /**
   * Discharges weapon projectile(s) toward current aimAngle.
   */
  public discharge(): Projectile[] {
    const projectiles: Projectile[] = [];
    const spawnOffset = this.radius + 6;

    if (this.pellets === 1) {
      // Single pinpoint shot
      const angle = this.aimAngle + (Math.random() - 0.5) * this.spreadAngle;
      const spawnPos = vec2(
        this.position.x + Math.cos(angle) * spawnOffset,
        this.position.y + Math.sin(angle) * spawnOffset
      );
      projectiles.push(
        createProjectile(
          `bullet-${this.id}-${Date.now()}-${Math.random()}`,
          spawnPos,
          angle,
          this.bulletSpeed,
          "enemy"
        )
      );
    } else {
      // Fan spread for shotgun pellets
      const halfSpread = this.spreadAngle / 2;
      const angleStep = this.spreadAngle / (this.pellets - 1);

      for (let i = 0; i < this.pellets; i++) {
        const pelletAngle = this.aimAngle - halfSpread + i * angleStep;
        const spawnPos = vec2(
          this.position.x + Math.cos(pelletAngle) * spawnOffset,
          this.position.y + Math.sin(pelletAngle) * spawnOffset
        );
        projectiles.push(
          createProjectile(
            `bullet-${this.id}-${Date.now()}-pellet-${i}`,
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

  /**
   * 1-hit lethality elimination.
   */
  public kill(): void {
    this.isAlive = false;
    this.hasLineOfSight = false;
  }

  /**
   * Resets enemy to original spawn location and initial cooldown for room resets.
   */
  public reset(): void {
    this.position = { ...this.spawnPosition };
    this.previousPosition = { ...this.spawnPosition };
    this.isAlive = true;
    this.hasLineOfSight = false;
    this.fireCooldownTicks = Math.floor(this.fireCadenceTicks * 0.5);
  }
}
