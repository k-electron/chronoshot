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
import { UpgradeDefinition } from "../upgrades/UpgradeDefinition";
import { UpgradePipeline } from "../upgrades/UpgradePipeline";
import { DEFAULT_UPGRADE_REGISTRY } from "../upgrades/UpgradeRegistry";
import "../upgrades/definitions";
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
  public upgradePipeline: UpgradePipeline;
  public shields: number = 0;
  public maxShields: number = 0;
  public dashCooldownTicks: number = 0;
  public dashActiveTicks: number = 0;
  public readonly dashSpeed: number = 480;
  public readonly dashDurationTicks: number = 12;
  public readonly dashCooldownMaxTicks: number = 90;

  public readonly baseMaxSpeed: number;
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
    this.baseMaxSpeed = config.maxSpeed ?? 240;
    this.maxSpeed = this.baseMaxSpeed;
    this.acceleration = config.acceleration ?? 2000;
    this.friction = config.friction ?? 1800;
    this.aimAngle = 0;
    this.isAlive = true;
    this.weapon = new Revolver();
    this.augmentations = {};
    this.upgradePipeline = new UpgradePipeline();
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

    // 1. Advance weapon cooldown ticks and active upgrade ticks
    this.weapon.update(1);
    this.upgradePipeline.onTick(this, 1);

    if (this.dashCooldownTicks > 0) {
      this.dashCooldownTicks--;
    }
    if (this.dashActiveTicks > 0) {
      this.dashActiveTicks--;
    }

    // 2. Velocity Integration
    if (this.dashActiveTicks <= 0) {
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
   * Returns whether the Overcharge Dash augmentation is installed.
   */
  public hasOverchargeDash(): boolean {
    return this.upgradePipeline.has("overcharge-dash");
  }

  /**
   * Returns whether Overcharge Dash is ready to activate (installed and off cooldown).
   */
  public isDashReady(): boolean {
    return this.hasOverchargeDash() && this.dashCooldownTicks <= 0 && this.isAlive;
  }

  /**
   * Triggers an Overcharge Dash: queues an action burst of +12 simulation ticks
   * onto the TimeGovernor, propels the player at 480 px/s, and initiates a 90-tick cooldown.
   *
   * @returns true if dash was successfully initiated.
   */
  public triggerDash(governor?: TimeGovernor, explicitDir?: Vector2D): boolean {
    if (!this.isDashReady()) {
      return false;
    }

    // Determine dash direction: explicitDir -> current velocity -> aim direction
    let dir: Vector2D;
    if (explicitDir && vecLengthSq(explicitDir) > 1e-4) {
      dir = vecNormalize(explicitDir);
    } else if (vecLengthSq(this.velocity) > 1e-4) {
      dir = vecNormalize(this.velocity);
    } else {
      dir = vec2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
    }

    this.velocity = vecScale(dir, this.dashSpeed);
    this.dashActiveTicks = this.dashDurationTicks;
    this.dashCooldownTicks = this.dashCooldownMaxTicks;

    governor?.queueDashBurst(this.dashDurationTicks);
    return true;
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

    const bulletSpeedMultiplier = this.upgradePipeline.computeModifiers().bulletSpeedMultiplier;
    const finalBulletSpeed = fireResult.bulletSpeed * bulletSpeedMultiplier;

    const bullet = createProjectile(
      `bullet-player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vec2(spawnX, spawnY),
      this.aimAngle,
      finalBulletSpeed,
      "player"
    );

    for (const entry of this.upgradePipeline.getAll()) {
      entry.definition.onDischarge?.(this);
    }

    return [bullet];
  }

  /**
   * Installs an upgrade onto the player via definition or registered ID,
   * recalculating compounded modifiers and updating backward-compatible flags.
   */
  public acquireUpgrade(upgrade: UpgradeDefinition | string): boolean {
    const def =
      typeof upgrade === "string"
        ? DEFAULT_UPGRADE_REGISTRY.get(upgrade)
        : upgrade;
    if (!def) return false;

    const res = this.upgradePipeline.acquire(def, this);
    if (res.installed) {
      this.recalculateModifiers();
    }
    return res.installed;
  }

  /**
   * Recalculates compounded modifiers from active upgrades and applies them
   * to weapon magazine size, reload duration, movement speed, and shield charges.
   */
  public recalculateModifiers(): void {
    const mods = this.upgradePipeline.computeModifiers();

    // 1. Ammunition & Reload Burst
    const netMagSize = 6 + mods.magSizeBonus;
    const netReloadTicks = Math.max(1, 30 - mods.reloadTickReduction);

    if (this.weapon.getMagSize() !== netMagSize) {
      this.weapon = new Revolver({
        magSize: netMagSize,
        reloadTickBurst: netReloadTicks,
      });
      this.weapon.reset();
    } else {
      this.weapon.setReloadTickBurst(netReloadTicks);
    }

    // 2. Movement speed
    this.maxSpeed = this.baseMaxSpeed * mods.speedMultiplier;

    // 3. Shield durability
    this.maxShields = mods.shieldChargesBonus;
    if (this.shields === 0 && this.maxShields > 0) {
      this.shields = this.maxShields;
    } else if (this.shields > this.maxShields) {
      this.shields = this.maxShields;
    }

    // 4. Backward-compatible augmentations flags
    this.augmentations.extendedCylinder = this.upgradePipeline.has("extended-cylinder");
    this.augmentations.speedLoader = this.upgradePipeline.has("speed-loader");
    this.augmentations.reactiveShield = this.upgradePipeline.has("reactive-shield");
  }

  /**
   * Sets or updates a tactical augmentation modifier on the player.
   * Kept for 100% backward compatibility with existing tests and scripts.
   */
  public setAugmentation(key: keyof PlayerAugmentations, value: boolean): void {
    const idMap: Record<keyof PlayerAugmentations, string> = {
      extendedCylinder: "extended-cylinder",
      speedLoader: "speed-loader",
      reactiveShield: "reactive-shield",
    };

    const id = idMap[key];
    if (value) {
      const def = DEFAULT_UPGRADE_REGISTRY.get(id);
      if (def && !this.upgradePipeline.has(id)) {
        this.upgradePipeline.acquire(def, this);
      }
    } else {
      this.upgradePipeline.remove(id);
    }

    this.recalculateModifiers();
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
    this.upgradePipeline.reset();
    this.augmentations = {};
    this.shields = 0;
    this.maxShields = 0;
    this.dashCooldownTicks = 0;
    this.dashActiveTicks = 0;
    this.maxSpeed = this.baseMaxSpeed;
    this.weapon = new Revolver();
  }

  /**
   * Equips all 7 baseline and advanced combat augmentations for Endless Survival Mode,
   * replenishes shields to maximum capacity, and reloads weapon to full capacity (8 rounds).
   */
  public equipFullEndlessLoadout(): void {
    const upgradeIds = [
      "extended-cylinder",
      "speed-loader",
      "reactive-shield",
      "kinetic-stride",
      "chrono-burst",
      "phase-deflector",
      "overcharge-dash",
    ];
    for (const id of upgradeIds) {
      if (!this.upgradePipeline.has(id)) {
        this.acquireUpgrade(id);
      }
    }
    // Replenish shields to full capacity
    if (this.maxShields > 0) {
      this.shields = this.maxShields;
    }
    // Refill ammunition to 8 rounds (max magazine size)
    this.weapon.reset();
  }

  /**
   * Reloads revolver cylinder back to full capacity and queues reload burst onto TimeGovernor.
   */
  public reload(governor?: TimeGovernor): boolean {
    if (!this.isAlive) {
      return false;
    }
    const reloadTicks = this.weapon.getReloadTickBurst();
    return this.weapon.reload(governor, reloadTicks);
  }

  /**
   * Processes incoming damage, absorbing impact with reactive shields or phase dash deflection,
   * otherwise enforcing 1-hit lethality.
   */
  public takeDamage(damage = 1): DamageResult {
    if (this.dashActiveTicks > 0) {
      return {
        absorbed: true,
        eliminated: false,
        remainingShields: this.shields,
      };
    }
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
    this.dashCooldownTicks = 0;
    this.dashActiveTicks = 0;

    // Dispatch room start to active upgrades
    this.upgradePipeline.onRoomStart(this);

    // Refresh shields to maximum configured
    if (this.maxShields > 0 || this.augmentations.reactiveShield) {
      this.shields = Math.max(1, this.maxShields);
      this.maxShields = this.shields;
    } else {
      this.shields = 0;
      this.maxShields = 0;
    }
    this.weapon.reset();
  }
}
