/**
 * Player Entity module for ChronoShot.
 *
 * Implements the player character with:
 * - Responsive WASD omnidirectional velocity integration
 * - Smooth wall sliding and non-penetrating collision bounds
 * - Decoupled mouse crosshair aiming (aiming does not advance time)
 * - 6-round revolver firearm integration
 * - 1-hit lethality state
 */

import { TimeGovernor } from "../engine/TimeGovernor";
import { testCircleAABB } from "../math/collision";
import {
  vec2,
  vecAngle,
  vecDot,
  vecLength,
  vecLengthSq,
  vecNormalize,
  vecScale,
  vecSub,
  Vector2D,
} from "../math/vector";
import { Revolver } from "../weapons/Revolver";
import { Obstacle } from "./Obstacle";
import {
  CombatUnit,
  createProjectile,
  DamageResult,
  Projectile,
} from "./Projectile";

export interface PlayerAugmentations {
  extendedCylinder?: boolean;
  speedLoader?: boolean;
  reactiveShield?: boolean;
}

export interface PlayerConfig {
  x?: number;
  y?: number;
  radius?: number;
  maxSpeed?: number;
  acceleration?: number;
  friction?: number;
}

export class Player implements CombatUnit {
  public readonly id: string = "player";
  public position: Vector2D;
  public previousPosition: Vector2D;
  public velocity: Vector2D;
  public radius: number;
  public maxSpeed: number;
  public acceleration: number;
  public friction: number;
  public aimAngle: number;
  public aimTarget: Vector2D;
  public isAlive: boolean;
  public weapon: Revolver;
  public augmentations: PlayerAugmentations = {};
  public shields: number = 0;
  public maxShields: number = 0;

  private spawnPosition: Vector2D;

  constructor(config: PlayerConfig = {}) {
    const x = config.x ?? 120;
    const y = config.y ?? 320;
    this.spawnPosition = vec2(x, y);
    this.position = vec2(x, y);
    this.previousPosition = vec2(x, y);
    this.velocity = vec2(0, 0);
    this.aimTarget = vec2(x + 50, y);
    this.radius = config.radius ?? 14;
    this.maxSpeed = config.maxSpeed ?? 240;
    this.acceleration = config.acceleration ?? 2000;
    this.friction = config.friction ?? 1800;
    this.aimAngle = 0;
    this.isAlive = true;
    this.weapon = new Revolver();
    this.augmentations = {};
    this.shields = 0;
    this.maxShields = 0;
  }

  /**
   * Continuous mouse aiming: rotates player towards cursor position.
   * Free aiming does not advance physical time scale.
   */
  public setAimTarget(target: Vector2D): void {
    this.aimTarget = { ...target };
    const diff = vecSub(target, this.position);
    if (vecLengthSq(diff) > 1e-4) {
      this.aimAngle = vecAngle(diff);
    }
  }

  /**
   * Computes current movement speed for TimeGovernor scaling.
   */
  public getSpeed(): number {
    return vecLength(this.velocity);
  }

  /**
   * Fixed physics tick update:
   * Integrates velocity from keyboard input, applies friction, moves position,
   * and smoothly resolves wall collisions without sticking.
   */
  public update(
    inputDir: Vector2D,
    fixedDeltaTime: number,
    obstacles: Obstacle[] = [],
    arenaBounds?: { width: number; height: number }
  ): void {
    this.previousPosition = { ...this.position };

    if (!this.isAlive) {
      this.velocity = vec2(0, 0);
      return;
    }

    // 1. Advance weapon cooldown ticks
    this.weapon.update(1);

    // 2. Velocity Integration
    const inputLenSq = vecLengthSq(inputDir);
    if (inputLenSq > 1e-4) {
      const normalizedInput = vecNormalize(inputDir);
      const targetVelocity = vecScale(normalizedInput, this.maxSpeed);

      // Accelerate towards target velocity
      const velDiff = vecSub(targetVelocity, this.velocity);
      const diffLen = vecLength(velDiff);
      const maxChange = this.acceleration * fixedDeltaTime;

      if (diffLen <= maxChange) {
        this.velocity = targetVelocity;
      } else {
        const accelDir = vecScale(velDiff, 1 / diffLen);
        this.velocity = {
          x: this.velocity.x + accelDir.x * maxChange,
          y: this.velocity.y + accelDir.y * maxChange,
        };
      }
    } else {
      // Decelerate with friction when no movement keys are depressed
      const currentSpeed = vecLength(this.velocity);
      if (currentSpeed > 1e-4) {
        const drop = this.friction * fixedDeltaTime;
        const newSpeed = Math.max(0, currentSpeed - drop);
        this.velocity = vecScale(this.velocity, newSpeed / currentSpeed);
      } else {
        this.velocity = vec2(0, 0);
      }
    }

    // 3. Position integration
    this.position.x += this.velocity.x * fixedDeltaTime;
    this.position.y += this.velocity.y * fixedDeltaTime;

    // 4. Smooth wall collision resolution with sliding
    this.resolveObstacleCollisions(obstacles);

    // 5. Arena boundary clamping
    if (arenaBounds) {
      const minX = this.radius;
      const maxX = arenaBounds.width - this.radius;
      const minY = this.radius;
      const maxY = arenaBounds.height - this.radius;

      if (this.position.x < minX) {
        this.position.x = minX;
        this.velocity.x = Math.max(0, this.velocity.x);
      } else if (this.position.x > maxX) {
        this.position.x = maxX;
        this.velocity.x = Math.min(0, this.velocity.x);
      }

      if (this.position.y < minY) {
        this.position.y = minY;
        this.velocity.y = Math.max(0, this.velocity.y);
      } else if (this.position.y > maxY) {
        this.position.y = maxY;
        this.velocity.y = Math.min(0, this.velocity.y);
      }
    }
  }

  /**
   * Resolves collisions with solid obstacles, smoothly canceling perpendicular
   * velocity while retaining parallel sliding momentum.
   */
  private resolveObstacleCollisions(obstacles: Obstacle[], maxIterations = 3): void {
    for (let iter = 0; iter < maxIterations; iter++) {
      let hadCollision = false;

      for (const obstacle of obstacles) {
        const collision = testCircleAABB(
          this.position,
          this.radius,
          obstacle.bounds.min,
          obstacle.bounds.max
        );

        if (collision && collision.collided) {
          hadCollision = true;

          // Push player out of obstacle along contact normal
          this.position.x += collision.normal.x * collision.depth;
          this.position.y += collision.normal.y * collision.depth;

          // Project velocity along collision plane (smooth sliding)
          const velDotNormal = vecDot(this.velocity, collision.normal);
          if (velDotNormal < 0) {
            // Subtract component moving into the wall
            this.velocity.x -= collision.normal.x * velDotNormal;
            this.velocity.y -= collision.normal.y * velDotNormal;
          }
        }
      }

      if (!hadCollision) {
        break;
      }
    }
  }

  /**
   * Discharges revolver towards aim target and queues fire burst onto TimeGovernor.
   */
  public fire(governor?: TimeGovernor): Projectile[] {
    if (!this.isAlive) {
      return [];
    }

    const fireResult = this.weapon.fire(governor);
    if (!fireResult.fired) {
      return [];
    }

    // Spawn projectile along barrel direction
    const spawnOffset = this.radius + 6;
    const spawnX = this.position.x + Math.cos(this.aimAngle) * spawnOffset;
    const spawnY = this.position.y + Math.sin(this.aimAngle) * spawnOffset;

    const bullet = createProjectile(
      `bullet-player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vec2(spawnX, spawnY),
      this.aimAngle,
      fireResult.bulletSpeed,
      "player"
    );

    return [bullet];
  }

  /**
   * Sets or updates a tactical augmentation modifier on the player.
   */
  public setAugmentation(key: keyof PlayerAugmentations, value: boolean): void {
    this.augmentations[key] = value;

    if (key === "extendedCylinder") {
      const magSize = value ? 8 : 6;
      const reloadTickBurst = this.augmentations.speedLoader ? 15 : 30;
      this.weapon = new Revolver({
        magSize,
        reloadTickBurst,
      });
      this.weapon.reset();
    } else if (key === "speedLoader") {
      const reloadTicks = value ? 15 : 30;
      this.weapon.setReloadTickBurst(reloadTicks);
    } else if (key === "reactiveShield") {
      if (value) {
        this.maxShields = 1;
        this.shields = 1;
      } else {
        this.maxShields = 0;
        this.shields = 0;
      }
    }
  }

  /**
   * Returns current active player augmentations.
   */
  public getAugmentations(): Readonly<PlayerAugmentations> {
    return { ...this.augmentations };
  }

  /**
   * Clears all tactical augmentations, restores default 6-chamber weapon, and clears shields.
   */
  public clearAugmentations(): void {
    this.augmentations = {};
    this.shields = 0;
    this.maxShields = 0;
    this.weapon = new Revolver();
  }

  /**
   * Reloads revolver cylinder back to full capacity and queues reload burst onto TimeGovernor.
   */
  public reload(governor?: TimeGovernor): boolean {
    if (!this.isAlive) {
      return false;
    }
    const reloadTicks = this.augmentations.speedLoader ? 15 : 30;
    return this.weapon.reload(governor, reloadTicks);
  }

  /**
   * Processes incoming damage, absorbing impact with reactive shields if available,
   * otherwise enforcing 1-hit lethality.
   */
  public takeDamage(damage = 1): DamageResult {
    if (this.shields > 0) {
      this.shields = Math.max(0, this.shields - damage);
      return {
        absorbed: true,
        eliminated: false,
        remainingShields: this.shields,
      };
    }
    this.kill();
    return {
      absorbed: false,
      eliminated: true,
      remainingShields: 0,
    };
  }

  /**
   * Enforces 1-hit lethality upon projectile impact.
   */
  public kill(): void {
    this.isAlive = false;
    this.velocity = vec2(0, 0);
  }

  /**
   * Resets player state for instant room restart.
   */
  public reset(spawnPos?: Vector2D): void {
    if (spawnPos) {
      this.spawnPosition = { ...spawnPos };
    }
    this.position = { ...this.spawnPosition };
    this.previousPosition = { ...this.spawnPosition };
    this.velocity = vec2(0, 0);
    this.isAlive = true;
    if (this.augmentations.reactiveShield) {
      this.shields = 1;
      this.maxShields = 1;
    } else {
      this.shields = 0;
      this.maxShields = 0;
    }
    this.weapon.reset();
  }
}
