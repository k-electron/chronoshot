/**
 * DirectAdvanceBehavior module for ChronoShot.
 *
 * Implements direct line-of-sight vector closing steering and 40px grid A*
 * obstacle pathfinding when sightlines to the target are obstructed.
 */

import { GridPathfinder } from "../../../engine/GridPathfinder";
import { Vector2D } from "../../../math/vector";
import { Obstacle } from "../../Obstacle";
import { CombatUnit } from "../../Projectile";
import { MovementBehavior, MovementContext } from "./MovementBehavior";

export class DirectAdvanceBehavior implements MovementBehavior {
  public currentPath: Vector2D[] = [];
  public currentWaypointIndex: number = 0;
  public repathCooldownTicks: number = 0;

  public readonly arrivalRadius: number;
  public readonly repathIntervalTicks: number;

  private defaultPathfinder?: GridPathfinder;
  private readonly resultVelocity: Vector2D = { x: 0, y: 0 };

  constructor(arrivalRadius: number = 18, repathIntervalTicks: number = 20) {
    this.arrivalRadius = arrivalRadius;
    this.repathIntervalTicks = repathIntervalTicks;
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

    // 1. Clear line-of-sight: direct vector steering ("string pulling")
    if (ctx.hasLineOfSight) {
      this.currentPath = [];
      this.currentWaypointIndex = 0;

      const dx = target.position.x - ctx.position.x;
      const dy = target.position.y - ctx.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1e-6) {
        this.resultVelocity.x = (dx / dist) * ctx.speed;
        this.resultVelocity.y = (dy / dist) * ctx.speed;
      } else {
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
