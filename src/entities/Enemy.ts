/**
 * Enemy Entities module for ChronoShot.
 *
 * Implements tactical combat AI units across 5 archetypes:
 * - Pistol Grunt: Standard skirmisher with medium cadence, moderate speed, and discharge stutter
 * - Shotgun Guard: Heavy breacher with 1-hit shield, wide 5-pellet buckshot spread, and steady advance
 * - Stalker: Agile glass-cannon rusher with high sprint speed and run-and-gun rapid fire
 * - Aegis Warden: Frontline tank with 2-hit shield, heavy slug cannon, and inexorable march
 * - Marksman: Long-range sniper with kiting AI, hyper-velocity beam, and charging sightline laser
 *
 * Coordinates continuous line-of-sight raycasting, 40px grid A* navigation around obstacles,
 * smooth obstacle collision sliding, and hit-count shield durability.
 */

import { GridPathfinder } from "../engine/GridPathfinder";
import { rayIntersectsAABB, testCircleAABB } from "../math/collision";
import {
  vec2,
  vecAngle,
  vecDistance,
  vecDot,
  vecLength,
  vecLengthSq,
  vecNormalize,
  vecScale,
  vecSub,
  Vector2D,
} from "../math/vector";
import { Obstacle } from "./Obstacle";
import {
  CombatUnit,
  createProjectile,
  DamageResult,
  Projectile,
} from "./Projectile";

export type EnemyType = "grunt" | "shotgun" | "stalker" | "warden" | "marksman";

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
  public fireCooldownTicks: number;

  public shields: number;
  public readonly maxShields: number;

  public readonly speed: number;
  public readonly fireCadenceTicks: number;
  public readonly bulletSpeed: number;
  public readonly spreadAngle: number;
  public readonly pellets: number;
  public readonly stutterTicks: number;
  public readonly runAndGun: boolean;

  // Sniper / Marksman charging laser state
  public isChargingLaser: boolean = false;
  public readonly laserChargeTicks: number = 30;

  // Stutter state
  public stutterTimerTicks: number = 0;

  // Pathfinding state
  public currentPath: Vector2D[] = [];
  public currentWaypointIndex: number = 0;
  public repathCooldownTicks: number = 0;

  private spawnPosition: Vector2D;
  private defaultPathfinder?: GridPathfinder;

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.type = config.type;
    this.spawnPosition = vec2(config.x, config.y);
    this.position = vec2(config.x, config.y);
    this.previousPosition = vec2(config.x, config.y);
    this.velocity = vec2(0, 0);

    switch (config.type) {
      case "shotgun":
        this.radius = config.radius ?? 16;
        this.speed = config.speed ?? 90;
        this.maxShields = config.maxShields ?? 1;
        this.fireCadenceTicks = config.fireCadenceTicks ?? 80;
        this.bulletSpeed = config.bulletSpeed ?? 480;
        this.spreadAngle = config.spreadAngle ?? 0.35; // ~20 deg fan
        this.pellets = config.pellets ?? 5;
        this.stutterTicks = 8;
        this.runAndGun = false;
        break;

      case "stalker":
        this.radius = config.radius ?? 13;
        this.speed = config.speed ?? 210;
        this.maxShields = config.maxShields ?? 0;
        this.fireCadenceTicks = config.fireCadenceTicks ?? 32;
        this.bulletSpeed = config.bulletSpeed ?? 500;
        this.spreadAngle = config.spreadAngle ?? 0.08;
        this.pellets = config.pellets ?? 1;
        this.stutterTicks = 0;
        this.runAndGun = true;
        break;

      case "warden":
        this.radius = config.radius ?? 18;
        this.speed = config.speed ?? 60;
        this.maxShields = config.maxShields ?? 2;
        this.fireCadenceTicks = config.fireCadenceTicks ?? 65;
        this.bulletSpeed = config.bulletSpeed ?? 580;
        this.spreadAngle = config.spreadAngle ?? 0.03;
        this.pellets = config.pellets ?? 1;
        this.stutterTicks = 8;
        this.runAndGun = false;
        break;

      case "marksman":
        this.radius = config.radius ?? 14;
        this.speed = config.speed ?? 80;
        this.maxShields = config.maxShields ?? 0;
        this.fireCadenceTicks = config.fireCadenceTicks ?? 110;
        this.bulletSpeed = config.bulletSpeed ?? 850;
        this.spreadAngle = config.spreadAngle ?? 0.01;
        this.pellets = config.pellets ?? 1;
        this.stutterTicks = 0;
        this.runAndGun = false;
        break;

      case "grunt":
      default:
        this.radius = config.radius ?? 15;
        this.speed = config.speed ?? 120;
        this.maxShields = config.maxShields ?? 0;
        this.fireCadenceTicks = config.fireCadenceTicks ?? 50;
        this.bulletSpeed = config.bulletSpeed ?? 550;
        this.spreadAngle = config.spreadAngle ?? 0.04;
        this.pellets = config.pellets ?? 1;
        this.stutterTicks = 6;
        this.runAndGun = false;
        break;
    }

    this.shields = this.maxShields;
    this.fireCooldownTicks =
      config.initialDelayTicks ?? Math.floor(this.fireCadenceTicks * 0.5);
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
    const canSee = this.checkLineOfSight(target.position, obstacles);

    // 2. Aim angle always aligns with target position
    const diff = vecSub(target.position, this.position);
    if (vecLengthSq(diff) > 1e-4) {
      this.aimAngle = vecAngle(diff);
    }

    // 3. Firing cadence and charging telegraph logic
    let firedProjectiles: Projectile[] = [];

    if (canSee) {
      if (this.type === "marksman") {
        if (this.fireCooldownTicks <= this.laserChargeTicks) {
          this.isChargingLaser = true;
        } else {
          this.isChargingLaser = false;
        }
      }

      this.fireCooldownTicks -= deltaTicks;

      if (this.fireCooldownTicks <= 0) {
        this.fireCooldownTicks = this.fireCadenceTicks;
        this.isChargingLaser = false;
        if (!this.runAndGun) {
          this.stutterTimerTicks = this.stutterTicks;
        }
        firedProjectiles = this.discharge();
      }
    } else {
      this.isChargingLaser = false;
    }

    // 4. Movement AI
    if (this.stutterTimerTicks > 0 && !this.runAndGun) {
      this.stutterTimerTicks = Math.max(0, this.stutterTimerTicks - deltaTicks);
      this.velocity = vec2(0, 0);
    } else if (this.isChargingLaser) {
      this.velocity = vec2(0, 0);
    } else if (canSee) {
      // Clear line-of-sight: direct vector steering ("string pulling")
      this.currentPath = [];
      this.currentWaypointIndex = 0;

      if (this.type === "marksman") {
        // Marksman kiting logic
        const dist = vecDistance(this.position, target.position);
        if (dist < 340) {
          // Retreat away from player
          const retreatDir = vecNormalize(vecSub(this.position, target.position));
          this.velocity = vecScale(retreatDir, this.speed);
        } else if (dist > 520) {
          // Close in toward comfortable sniper range
          const advanceDir = vecNormalize(vecSub(target.position, this.position));
          this.velocity = vecScale(advanceDir, this.speed);
        } else {
          // Hold position in sweet spot
          this.velocity = vec2(0, 0);
        }
      } else {
        // Rushers / standard combatants close in along sightline
        const advanceDir = vecNormalize(vecSub(target.position, this.position));
        this.velocity = vecScale(advanceDir, this.speed);
      }
    } else {
      // Blocked line-of-sight: 40px tile grid A* pathfinding
      this.repathCooldownTicks -= deltaTicks;

      if (
        this.repathCooldownTicks <= 0 ||
        this.currentPath.length === 0 ||
        this.currentWaypointIndex >= this.currentPath.length
      ) {
        const pf = pathfinder ?? this.getOrCreatePathfinder(obstacles);
        this.currentPath = pf.findPath(this.position, target.position);
        this.currentWaypointIndex = 0;
        this.repathCooldownTicks = 20; // Repath every 20 ticks (~0.33s)
      }

      if (
        this.currentPath.length > 0 &&
        this.currentWaypointIndex < this.currentPath.length
      ) {
        const nextWaypoint = this.currentPath[this.currentWaypointIndex];
        const toWaypoint = vecSub(nextWaypoint, this.position);
        const distToWaypoint = vecLength(toWaypoint);

        if (distToWaypoint < 18) {
          this.currentWaypointIndex++;
        }

        if (this.currentWaypointIndex < this.currentPath.length) {
          const activeWp = this.currentPath[this.currentWaypointIndex];
          const wpDir = vecNormalize(vecSub(activeWp, this.position));
          this.velocity = vecScale(wpDir, this.speed);
        } else {
          this.velocity = vec2(0, 0);
        }
      } else {
        this.velocity = vec2(0, 0);
      }
    }

    // 5. Position integration
    this.position.x += this.velocity.x * fixedDeltaTime;
    this.position.y += this.velocity.y * fixedDeltaTime;

    // 6. Obstacle collision sliding
    this.resolveObstacleCollisions(obstacles);

    // 7. Clamp to arena perimeter
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

  private getOrCreatePathfinder(obstacles: Obstacle[]): GridPathfinder {
    if (!this.defaultPathfinder) {
      this.defaultPathfinder = new GridPathfinder(960, 640, 40);
      this.defaultPathfinder.updateObstacles(obstacles, this.radius);
    }
    return this.defaultPathfinder;
  }

  /**
   * Discharges weapon projectile(s) toward current aimAngle.
   */
  public discharge(): Projectile[] {
    const projectiles: Projectile[] = [];
    const spawnOffset = this.radius + 6;

    if (this.pellets === 1) {
      // Single pinpoint / sniper / slug shot
      const angle = this.aimAngle + (Math.random() - 0.5) * this.spreadAngle;
      const spawnPos = vec2(
        this.position.x + Math.cos(angle) * spawnOffset,
        this.position.y + Math.sin(angle) * spawnOffset
      );
      projectiles.push(
        createProjectile(
          `bullet-${this.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
   * Applies damage to shields first before lethal elimination.
   */
  public takeDamage(damage: number = 1): DamageResult {
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
   * Enforces elimination.
   */
  public kill(): void {
    this.isAlive = false;
    this.shields = 0;
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
    this.shields = this.maxShields;
    this.hasLineOfSight = false;
    this.isChargingLaser = false;
    this.stutterTimerTicks = 0;
    this.currentPath = [];
    this.currentWaypointIndex = 0;
    this.repathCooldownTicks = 0;
    this.fireCooldownTicks = Math.floor(this.fireCadenceTicks * 0.5);
  }
}
