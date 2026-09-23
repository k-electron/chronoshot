/**
 * KiterBehavior module for ChronoShot.
 *
 * Implements tactical distance-keeping locomotion:
 * - When target is too close (< minDist): retreats away from target at full speed.
 * - When target is too far (> maxDist): advances toward target at full speed.
 * - When target is in sweet spot (minDist..maxDist): holds position (0, 0).
 * - When line-of-sight is obstructed: navigates via 40px grid A* pathfinding.
 */

import { GridPathfinder } from "../../../engine/GridPathfinder";
import { Vector2D } from "../../../math/vector";
import { Obstacle } from "../../Obstacle";
import { CombatUnit } from "../../Projectile";
import { MovementBehavior, MovementContext } from "./MovementBehavior";

export interface KiterConfig {
  minDist?: number;
  maxDist?: number;
  arrivalRadius?: number;
  repathIntervalTicks?: number;
}

export class KiterBehavior implements MovementBehavior {
  public minDist: number;
  public maxDist: number;
  public readonly arrivalRadius: number;
  public readonly repathIntervalTicks: number;

  public currentPath: Vector2D[] = [];
  public currentWaypointIndex: number = 0;
  public repathCooldownTicks: number = 0;

  private defaultPathfinder?: GridPathfinder;
  private readonly resultVelocity: Vector2D = { x: 0, y: 0 };

  constructor(
    minDistOrConfig?: number | KiterConfig,
    maxDist: number = 520,
    arrivalRadius: number = 18,
    repathIntervalTicks: number = 20
  ) {
    if (typeof minDistOrConfig === "object" && minDistOrConfig !== null) {
      this.minDist = minDistOrConfig.minDist ?? 340;
      this.maxDist = minDistOrConfig.maxDist ?? 520;
      this.arrivalRadius = minDistOrConfig.arrivalRadius ?? 18;
      this.repathIntervalTicks = minDistOrConfig.repathIntervalTicks ?? 20;
    } else {
      this.minDist = minDistOrConfig ?? 340;
      this.maxDist = maxDist;
      this.arrivalRadius = arrivalRadius;
      this.repathIntervalTicks = repathIntervalTicks;
    }
  }

  public update(
    ctx: MovementContext,
    target: CombatUnit,
    obstacles: Obstacle[],
    deltaTicks: number = 1,
    _fixedDeltaTime: number = deltaTicks / 60,
    pathfinder?: GridPathfinder
  ): Vector2D {
    // If target is down or unit has no speed, halt immediately
    if (!target.isAlive || ctx.speed <= 0) {
      this.resultVelocity.x = 0;
      this.resultVelocity.y = 0;
      return this.resultVelocity;
    }

    // 1. Clear line-of-sight: distance-keeping kiting logic
    if (ctx.hasLineOfSight) {
      this.currentPath = [];
      this.currentWaypointIndex = 0;

      const dx = target.position.x - ctx.position.x;
      const dy = target.position.y - ctx.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.minDist) {
        // Target too close: retreat away from target
        if (dist > 1e-6) {
          const retreatDirX = -dx / dist;
          const retreatDirY = -dy / dist;
          this.resultVelocity.x = retreatDirX * ctx.speed;
          this.resultVelocity.y = retreatDirY * ctx.speed;
        } else {
          // Exactly on target: retreat backward relative to aim angle
          const angle = ctx.aimAngle !== undefined ? ctx.aimAngle + Math.PI : Math.PI;
          this.resultVelocity.x = Math.cos(angle) * ctx.speed;
          this.resultVelocity.y = Math.sin(angle) * ctx.speed;
        }
      } else if (dist > this.maxDist) {
        // Target too far: advance toward target
        const advanceDirX = dx / dist;
        const advanceDirY = dy / dist;
        this.resultVelocity.x = advanceDirX * ctx.speed;
        this.resultVelocity.y = advanceDirY * ctx.speed;
      } else {
        // Sweet spot: hold position
        this.resultVelocity.x = 0;
        this.resultVelocity.y = 0;
      }

      return this.resultVelocity;
    }

    // 2. Blocked line-of-sight: 40px tile grid A* pathfinding
    this.repathCooldownTicks -= deltaTicks;

    if (
      this.repathCooldownTicks <= 0 ||
      this.currentPath.length === 0 ||
      this.currentWaypointIndex >= this.currentPath.length
    ) {
      const pf = pathfinder ?? this.getOrCreatePathfinder(obstacles, ctx.radius);
      let path = pf.findPath(ctx.position, target.position);

      // Fallback: if target cell itself is inside obstacle clearance, pathfind to nearest walkable cell
      if (path.length === 0) {
        const nearestTarget = pf.findNearestWalkable(target.position);
        if (nearestTarget) {
          path = pf.findPath(ctx.position, nearestTarget);
        }
      }

      this.currentPath = path;
      this.currentWaypointIndex = 0;
      this.repathCooldownTicks = this.repathIntervalTicks;
    }

    if (
      this.currentPath.length > 0 &&
      this.currentWaypointIndex < this.currentPath.length
    ) {
      const nextWaypoint = this.currentPath[this.currentWaypointIndex];
      const toWpX = nextWaypoint.x - ctx.position.x;
      const toWpY = nextWaypoint.y - ctx.position.y;
      const distToWaypoint = Math.sqrt(toWpX * toWpX + toWpY * toWpY);

      if (distToWaypoint < this.arrivalRadius) {
        this.currentWaypointIndex++;
      }

      if (this.currentWaypointIndex < this.currentPath.length) {
        const activeWp = this.currentPath[this.currentWaypointIndex];
        const wpDirX = activeWp.x - ctx.position.x;
        const wpDirY = activeWp.y - ctx.position.y;
        const wpDist = Math.sqrt(wpDirX * wpDirX + wpDirY * wpDirY);

        if (wpDist > 1e-6) {
          this.resultVelocity.x = (wpDirX / wpDist) * ctx.speed;
          this.resultVelocity.y = (wpDirY / wpDist) * ctx.speed;
        } else {
          this.resultVelocity.x = 0;
          this.resultVelocity.y = 0;
        }
      } else {
        this.resultVelocity.x = 0;
        this.resultVelocity.y = 0;
      }
    } else {
      this.resultVelocity.x = 0;
      this.resultVelocity.y = 0;
    }

    return this.resultVelocity;
  }

  public reset(): void {
    this.currentPath = [];
    this.currentWaypointIndex = 0;
    this.repathCooldownTicks = 0;
    this.resultVelocity.x = 0;
    this.resultVelocity.y = 0;
  }

  private getOrCreatePathfinder(
    obstacles: Obstacle[],
    clearanceRadius: number
  ): GridPathfinder {
    if (!this.defaultPathfinder) {
      this.defaultPathfinder = new GridPathfinder(960, 640, 40);
    }
    this.defaultPathfinder.updateObstacles(obstacles, clearanceRadius);
    return this.defaultPathfinder;
  }
}
