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
import { hasNavigationClearance } from "../../../math/collision";
import { vec2, Vector2D } from "../../../math/vector";
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
      const dx = target.position.x - ctx.position.x;
      const dy = target.position.y - ctx.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.minDist) {
        // Target too close: retreat away from target if clear behind
        this.currentPath = [];
        this.currentWaypointIndex = 0;

        let retreatDirX = 0;
        let retreatDirY = 0;
        if (dist > 1e-6) {
          retreatDirX = -dx / dist;
          retreatDirY = -dy / dist;
        } else {
          const angle = ctx.aimAngle !== undefined ? ctx.aimAngle + Math.PI : Math.PI;
          retreatDirX = Math.cos(angle);
          retreatDirY = Math.sin(angle);
        }

        // Test if retreat path is physically clear of obstacles
        const retreatProbeDist = Math.min(40, ctx.radius * 2);
        const retreatProbe = vec2(
          ctx.position.x + retreatDirX * retreatProbeDist,
          ctx.position.y + retreatDirY * retreatProbeDist
        );

        if (hasNavigationClearance(ctx.position, retreatProbe, ctx.radius, obstacles)) {
          this.resultVelocity.x = retreatDirX * ctx.speed;
          this.resultVelocity.y = retreatDirY * ctx.speed;
        } else {
          // Obstacle directly behind: hold ground instead of jamming into wall
          this.resultVelocity.x = 0;
          this.resultVelocity.y = 0;
        }

        return this.resultVelocity;
      } else if (dist > this.maxDist) {
        // Target too far: advance toward target if physical clearance is clear
        const hasClearance = hasNavigationClearance(
          ctx.position,
          target.position,
          ctx.radius,
          obstacles
        );

        if (hasClearance) {
          this.currentPath = [];
          this.currentWaypointIndex = 0;

          const advanceDirX = dx / dist;
          const advanceDirY = dy / dist;
          this.resultVelocity.x = advanceDirX * ctx.speed;
          this.resultVelocity.y = advanceDirY * ctx.speed;
          return this.resultVelocity;
        }
        // Fall through to A* pathfinding if advancing path is obstructed by cover
      } else {
        // Sweet spot: hold position
        this.currentPath = [];
        this.currentWaypointIndex = 0;
        this.resultVelocity.x = 0;
        this.resultVelocity.y = 0;
        return this.resultVelocity;
      }
    }

    // 2. Blocked line-of-sight or obstructed advance: 40px tile grid A* pathfinding
    this.repathCooldownTicks -= deltaTicks;

    if (
      this.repathCooldownTicks <= 0 ||
      this.currentPath.length === 0 ||
      this.currentWaypointIndex >= this.currentPath.length
    ) {
      const pf = pathfinder ?? this.getOrCreatePathfinder(obstacles, ctx.radius);

      // Dual-sided walkable endpoint resolution:
      // If either start or target position is located inside an obstacle clearance cell,
      // snap it to the nearest walkable cell center to avoid deadlock.
      let startPos = ctx.position;
      const startGrid = pf.worldToGrid(startPos);
      if (!pf.isWalkable(startGrid.gx, startGrid.gy)) {
        const nearestStart = pf.findNearestWalkable(startPos);
        if (nearestStart) {
          startPos = nearestStart;
        }
      }

      let targetPos = target.position;
      const targetGrid = pf.worldToGrid(targetPos);
      if (!pf.isWalkable(targetGrid.gx, targetGrid.gy)) {
        const nearestTarget = pf.findNearestWalkable(targetPos);
        if (nearestTarget) {
          targetPos = nearestTarget;
        }
      }

      let path = pf.findPath(startPos, targetPos);

      // Fallback: if path is still empty, search nearest walkable cells
      if (path.length === 0) {
        const fallbackTarget = pf.findNearestWalkable(target.position);
        const fallbackStart = pf.findNearestWalkable(ctx.position) ?? ctx.position;
        if (fallbackTarget) {
          path = pf.findPath(fallbackStart, fallbackTarget);
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
