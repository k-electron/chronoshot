/**
 * Enemy Entities module for ChronoShot.
 *
 * Implements tactical combat AI units across 5 baseline archetypes and milestone boss:
 * - Pistol Grunt: Standard skirmisher with medium cadence, moderate speed, and discharge stutter
 * - Shotgun Guard: Heavy breacher with 1-hit shield, wide 5-pellet buckshot spread, and steady advance
 * - Stalker: Agile glass-cannon rusher with high sprint speed and run-and-gun rapid fire
 * - Aegis Warden: Frontline tank with 2-hit shield, heavy slug cannon, and inexorable march
 * - Marksman: Long-range sniper with kiting AI, hyper-velocity beam, and charging sightline laser
 * - Boss (Goliath-01: Aegis Colossus): Multi-phase juggernaut with 4-hit shield durability and enraged spread barrage
 *
 * Composed from modular MovementBehavior and AttackBehavior strategies with
 * continuous line-of-sight raycasting, 40px grid A* navigation, and smooth wall sliding.
 */

import { GridPathfinder } from "../engine/GridPathfinder";
import { rayIntersectsAABB, testCircleAABB } from "../math/collision";
import {
  vec2,
  vecAngle,
  vecDot,
  vecLength,
  vecLengthSq,
  vecScale,
  vecSub,
  Vector2D,
} from "../math/vector";
import { EnemyChassisType } from "../ui/EnemyRenderer";
import { AttackBehavior, AttackContext } from "./behaviors/attack/AttackBehavior";
import { MovementBehavior, MovementContext } from "./behaviors/movement/MovementBehavior";
import { BossBlueprint, createBossPhaseController, GOLIATH_01_BLUEPRINT } from "./boss/BossBlueprint";
import { BossPhaseController } from "./boss/BossPhaseController";
import { BLUEPRINTS } from "./EnemyFactory";
import { Obstacle } from "./Obstacle";
import { CombatUnit, DamageResult, Projectile } from "./Projectile";

export type EnemyType =
  | "grunt"
  | "shotgun"
  | "stalker"
  | "warden"
  | "marksman"
  | "sniper"
  | "boss";

export interface EnemyConfig {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  radius?: number;
  speed?: number;
  maxShields?: number;
  fireCadenceTicks?: number;
  initialDelayTicks?: number;
  bulletSpeed?: number;
  spreadAngle?: number;
  pellets?: number;
  isBoss?: boolean;
  bossName?: string;
  movement?: MovementBehavior;
  attack?: AttackBehavior;
  chassis?: EnemyChassisType;
  phaseController?: BossPhaseController;
  blueprint?: BossBlueprint;
}

export class Enemy implements CombatUnit {
  public readonly id: string;
  public readonly type: EnemyType;
  public position: Vector2D;
  public previousPosition: Vector2D;
  public velocity: Vector2D;
  public radius: number;
  public isAlive: boolean = true;
  public aimAngle: number = 0;
  public hasLineOfSight: boolean = false;

  public movement: MovementBehavior;
  public attack: AttackBehavior;
  public chassis: EnemyChassisType;

  public shields: number;
  public readonly maxShields: number;

  public readonly isBoss: boolean;
  public readonly bossName?: string;
  public phaseController?: BossPhaseController;
  public blueprint?: BossBlueprint;
  private _isEnraged: boolean = false;

  public get isEnraged(): boolean {
    if (this.phaseController) {
      return this.phaseController.currentPhaseIndex > 0;
    }
    return this._isEnraged;
  }
  public set isEnraged(val: boolean) {
    this._isEnraged = val;
    if (this.phaseController) {
      if (val && this.phaseController.currentPhaseIndex === 0 && this.phaseController.hasNextPhase) {
        this.phaseController.transitionToPhase(1, this.position);
        this.movement = this.phaseController.movement;
        this.attack = this.phaseController.attack;
      } else if (!val && this.phaseController.currentPhaseIndex !== 0) {
        this.phaseController.transitionToPhase(0, this.position);
        this.movement = this.phaseController.movement;
        this.attack = this.phaseController.attack;
      }
    }
    if ("isEnraged" in this.attack) {
      (this.attack as any).isEnraged = val;
    }
  }

  private _speed: number = 0;
  public get speed(): number {
    if (this.phaseController) {
      return this.phaseController.speed;
    }
    if (this.isBoss && this.isEnraged) {
      return 95;
    }
    return this._speed;
  }
  public set speed(val: number) {
    this._speed = val;
  }

  public readonly fireCadenceTicks: number;
  public readonly bulletSpeed: number;
  public readonly spreadAngle: number;
  public readonly pellets: number;
  public readonly stutterTicks: number;
  public readonly runAndGun: boolean;

  public get isChargingLaser(): boolean {
    return this.attack.isChargingLaser;
  }
  public set isChargingLaser(val: boolean) {
    this.attack.isChargingLaser = val;
  }
  public readonly laserChargeTicks: number = 30;

  public get stutterTimerTicks(): number {
    return this.attack.stutterTimerTicks;
  }
  public set stutterTimerTicks(val: number) {
    this.attack.stutterTimerTicks = val;
  }

  public get fireCooldownTicks(): number {
    return this.attack.fireCooldownTicks;
  }
  public set fireCooldownTicks(val: number) {
    this.attack.fireCooldownTicks = val;
  }

  public get currentPath(): Vector2D[] {
    if ("currentPath" in this.movement) {
      return (this.movement as any).currentPath;
    }
    return [];
  }
  public set currentPath(val: Vector2D[]) {
    if ("currentPath" in this.movement) {
      (this.movement as any).currentPath = val;
    }
  }

  public get currentWaypointIndex(): number {
    if ("currentWaypointIndex" in this.movement) {
      return (this.movement as any).currentWaypointIndex;
    }
    return 0;
  }
  public set currentWaypointIndex(val: number) {
    if ("currentWaypointIndex" in this.movement) {
      (this.movement as any).currentWaypointIndex = val;
    }
  }

  public get repathCooldownTicks(): number {
    if ("repathCooldownTicks" in this.movement) {
      return (this.movement as any).repathCooldownTicks;
    }
    return 0;
  }
  public set repathCooldownTicks(val: number) {
    if ("repathCooldownTicks" in this.movement) {
      (this.movement as any).repathCooldownTicks = val;
    }
  }

  private spawnPosition: Vector2D;

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.type = config.type;
    this.spawnPosition = vec2(config.x, config.y);
    this.position = vec2(config.x, config.y);
    this.previousPosition = vec2(config.x, config.y);
    this.velocity = vec2(0, 0);

    const blueprint = BLUEPRINTS[config.type] ?? BLUEPRINTS.grunt;

    if (config.type === "boss") {
      this.isBoss = true;
      this.bossName = config.bossName ?? "GOLIATH-01: AEGIS COLOSSUS";
    } else {
      this.isBoss = config.isBoss ?? false;
      this.bossName = config.bossName;
    }

    this.blueprint = config.blueprint;
    if (config.phaseController) {
      this.phaseController = config.phaseController;
    } else if (config.type === "boss") {
      this.phaseController = createBossPhaseController(config.blueprint ?? GOLIATH_01_BLUEPRINT, this.position);
    }

    this.radius = config.radius ?? blueprint.radius;
    this.speed = config.speed ?? (this.phaseController ? this.phaseController.speed : blueprint.speed);
    this.maxShields = config.maxShields ?? (this.phaseController ? this.phaseController.maxShields : blueprint.maxShields);
    this.fireCadenceTicks = config.fireCadenceTicks ?? blueprint.fireCadenceTicks;
    this.bulletSpeed = config.bulletSpeed ?? blueprint.bulletSpeed;
    this.spreadAngle = config.spreadAngle ?? blueprint.spreadAngle;
    this.pellets = config.pellets ?? blueprint.pellets;
    this.stutterTicks = blueprint.stutterTicks;
    this.runAndGun = blueprint.runAndGun;
    this.chassis = config.chassis ?? blueprint.chassis;

    if (this.phaseController) {
      if (config.initialDelayTicks !== undefined) {
        this.phaseController.attack.fireCooldownTicks = config.initialDelayTicks;
      }
      this.movement = config.movement ?? this.phaseController.movement;
      this.attack = config.attack ?? this.phaseController.attack;
      this.shields = this.phaseController.shields;
    } else {
      this.movement = config.movement ?? blueprint.createMovement(config);
      this.attack = config.attack ?? blueprint.createAttack(config);
      this.shields = this.maxShields;
    }

    this.isEnraged = false;
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
   * Resolves collisions with solid obstacles, sliding smoothly along obstacle walls.
   */
  public resolveObstacleCollisions(
    obstacles: Obstacle[],
    maxIterations = 3
  ): void {
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

          // Displace along contact normal
          this.position.x += collision.normal.x * collision.depth;
          this.position.y += collision.normal.y * collision.depth;

          // Project velocity along wall tangent
          const velDot = vecDot(this.velocity, collision.normal);
          if (velDot < 0) {
            this.velocity.x -= collision.normal.x * velDot;
            this.velocity.y -= collision.normal.y * velDot;
          }
        }
      }

      if (!hadCollision) break;
    }
  }

  /**
   * Updates enemy AI, pathfinding, movement integration, and weapon discharge.
   */
  public update(
    target: CombatUnit,
    obstacles: Obstacle[],
    deltaTicks: number = 1,
    fixedDeltaTime: number = deltaTicks / 60,
    pathfinder?: GridPathfinder
  ): Projectile[] {
    this.previousPosition = { ...this.position };

    if (!this.isAlive || !target.isAlive) {
      this.hasLineOfSight = false;
      this.velocity = vec2(0, 0);
      this.isChargingLaser = false;
      return [];
    }

    // 1. Evaluate Line of Sight
    this.hasLineOfSight = this.checkLineOfSight(target.position, obstacles);

    // 2. Aim angle always aligns with target position
    const diff = vecSub(target.position, this.position);
    if (vecLengthSq(diff) > 1e-4) {
      this.aimAngle = vecAngle(diff);
    }

    // 3. Boss Phase Controller tick advancement & transitions
    if (this.phaseController) {
      const transitioned = this.phaseController.update(deltaTicks, this.position);
      if (transitioned) {
        this.movement = this.phaseController.movement;
        this.attack = this.phaseController.attack;
        this.shields = this.phaseController.shields;
        this._isEnraged = this.phaseController.currentPhaseIndex > 0;
      }
    }

    // 4. Firing cadence and charging telegraph logic delegated to attack behavior
    const attackCtx: AttackContext = {
      id: this.id,
      position: this.position,
      aimAngle: this.aimAngle,
      radius: this.radius,
    };
    const firedProjectiles = this.attack.update(
      attackCtx,
      this.hasLineOfSight,
      deltaTicks
    );

    // 5. Movement AI delegated to movement behavior
    if (this.stutterTimerTicks > 0 && !this.runAndGun) {
      this.velocity = vec2(0, 0);
    } else if (this.isChargingLaser) {
      this.velocity = vec2(0, 0);
    } else {
      const movementCtx: MovementContext = {
        position: this.position,
        previousPosition: this.previousPosition,
        velocity: this.velocity,
        radius: this.radius,
        speed: this.speed,
        aimAngle: this.aimAngle,
        hasLineOfSight: this.hasLineOfSight,
      };
      this.velocity = this.movement.update(
        movementCtx,
        target,
        obstacles,
        deltaTicks,
        fixedDeltaTime,
        pathfinder
      );
    }

    // 6. Position integration
    this.position.x += this.velocity.x * fixedDeltaTime;
    this.position.y += this.velocity.y * fixedDeltaTime;

    // 7. Obstacle collision sliding
    this.resolveObstacleCollisions(obstacles);

    // 8. Clamp to arena perimeter
    this.position.x = Math.max(
      this.radius,
      Math.min(960 - this.radius, this.position.x)
    );
    this.position.y = Math.max(
      this.radius,
      Math.min(640 - this.radius, this.position.y)
    );

    return firedProjectiles;
  }

  /**
   * Discharges weapon projectile(s) toward current aimAngle.
   */
  public discharge(): Projectile[] {
    const attackCtx: AttackContext = {
      id: this.id,
      position: this.position,
      aimAngle: this.aimAngle,
      radius: this.radius,
    };
    return this.attack.discharge(attackCtx);
  }

  /**
   * Applies damage to shields first before lethal elimination.
   */
  public takeDamage(damage: number = 1): DamageResult {
    if (this.phaseController) {
      const res = this.phaseController.takeDamage(damage, this.shields, this.position);
      if (res.eliminated) {
        this.kill();
        return {
          absorbed: false,
          eliminated: true,
          remainingShields: 0,
        };
      }

      this.shields = res.remainingShields;
      if (res.transitioned) {
        this.movement = this.phaseController.movement;
        this.attack = this.phaseController.attack;
        this._isEnraged = true;
      }
      return {
        absorbed: res.absorbed,
        eliminated: false,
        remainingShields: this.shields,
      };
    }

    if (this.shields > 0) {
      this.shields = Math.max(0, this.shields - damage);
      if (this.isBoss) {
        this.isEnraged = this.shields === 0;
      }
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
   * Enforces elimination.
   */
  public kill(): void {
    this.isAlive = false;
    this.shields = 0;
    if (this.phaseController) {
      this.phaseController.shields = 0;
    }
    this.velocity = vec2(0, 0);
    this.hasLineOfSight = false;
    this.isChargingLaser = false;
  }

  /**
   * Resets enemy to pristine spawn state for room restarts.
   */
  public reset(): void {
    this.position = { ...this.spawnPosition };
    this.previousPosition = { ...this.spawnPosition };
    this.velocity = vec2(0, 0);
    this.isAlive = true;
    this.hasLineOfSight = false;
    this.isChargingLaser = false;

    if (this.phaseController) {
      this.phaseController.reset();
      this.movement = this.phaseController.movement;
      this.attack = this.phaseController.attack;
      this.shields = this.phaseController.shields;
      this.isEnraged = false;
    } else {
      this.shields = this.maxShields;
      this.isEnraged = false;
      this.movement.reset();
      this.attack.reset();
    }
  }
}
