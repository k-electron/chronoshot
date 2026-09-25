/**
 * DirectAdvanceBehavior module for ChronoShot.
 *
 * Implements direct line-of-sight vector closing steering and 40px grid A*
 * obstacle pathfinding when sightlines to the target are obstructed.
 */

import { GridPathfinder } from "../../../engine/GridPathfinder";
import {
  hasNavigationClearance,
  rayIntersectsAABB,
  testCircleAABB,
} from "../../../math/collision";
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
  private readonly scratchDir: Vector2D = { x: 0, y: 0 };
  private readonly scratchProbe: Vector2D = { x: 0, y: 0 };

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
    pathfinder?: GridPathfinder,
    neighbors?: CombatUnit[]
  ): Vector2D {
    // If target is down or unit has no speed, halt immediately
    if (!target.isAlive || ctx.speed <= 0) {
      this.resultVelocity.x = 0;
      this.resultVelocity.y = 0;
      return this.resultVelocity;
    }

    const activeNeighbors = neighbors ?? ctx.neighbors;

    // 1. Clear line-of-sight AND physical navigation clearance: direct vector steering ("string pulling")
    const hasClearance =
      ctx.hasLineOfSight &&
      hasNavigationClearance(ctx.position, target.position, ctx.radius, obstacles);

    if (hasClearance) {
      this.currentPath = [];
      this.currentWaypointIndex = 0;
      return this.steerDirectly(ctx, target, obstacles, activeNeighbors);
    }

    // 2. Blocked line-of-sight or obstructed physical clearance: 40px tile grid A* pathfinding
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
        return this.resultVelocity;
      }
    }

    // 3. Fallback locomotion when A* yields an empty path or path is exhausted
    if (ctx.hasLineOfSight) {
      return this.steerDirectly(ctx, target, obstacles, activeNeighbors);
    } else {
      // Optical LOS blocked: steer toward nearest walkable cell to target
      const pf = pathfinder ?? this.getOrCreatePathfinder(obstacles, ctx.radius);
      const fallbackGoal = pf.findNearestWalkable(target.position) ?? target.position;
      const dx = fallbackGoal.x - ctx.position.x;
      const dy = fallbackGoal.y - ctx.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1e-6) {
        this.resultVelocity.x = (dx / dist) * ctx.speed;
        this.resultVelocity.y = (dy / dist) * ctx.speed;
      } else {
        this.resultVelocity.x = 0;
        this.resultVelocity.y = 0;
      }
    }

    return this.resultVelocity;
  }

  private steerDirectly(
    ctx: MovementContext,
    target: CombatUnit,
    obstacles: Obstacle[],
    activeNeighbors?: CombatUnit[],
    dxParam?: number,
    dyParam?: number
  ): Vector2D {
    const dx = dxParam ?? target.position.x - ctx.position.x;
    const dy = dyParam ?? target.position.y - ctx.position.y;
    const dist = Math.hypot(dx, dy);

    // Surface-distance arrival: halt forward velocity when within surface arrival distance
    const arrivalDist = ctx.radius + target.radius + 2;
    if (dist <= arrivalDist || dist <= 1e-6) {
      this.resultVelocity.x = 0;
      this.resultVelocity.y = 0;
      return this.resultVelocity;
    }

    const goalDirX = dx / dist;
    const goalDirY = dy / dist;

    // Check lead unit sensing & corridor queueing if neighbors are provided
    if (activeNeighbors && activeNeighbors.length > 0) {
      let closestLeadUnit: CombatUnit | null = null;
      let closestLeadDist = Infinity;

      for (const neighbor of activeNeighbors) {
        if (!neighbor.isAlive) continue;
        const toNeighX = neighbor.position.x - ctx.position.x;
        const toNeighY = neighbor.position.y - ctx.position.y;
        const distToNeigh = Math.hypot(toNeighX, toNeighY);

        const leadTriggerDist = ctx.radius + neighbor.radius + 16;
        if (distToNeigh < leadTriggerDist && distToNeigh > 1e-4) {
          // Angle within +/- 45 deg: cos(theta) >= cos(45 deg) = ~0.7071
          const cosAngle = (toNeighX * goalDirX + toNeighY * goalDirY) / distToNeigh;
          if (cosAngle >= 0.7071) {
            if (distToNeigh < closestLeadDist) {
              closestLeadDist = distToNeigh;
              closestLeadUnit = neighbor;
            }
          }
        }
      }

      if (closestLeadUnit) {
        // Lateral directions perpendicular to goal direction
        const n1x = -goalDirY;
        const n1y = goalDirX;
        const n2x = goalDirY;
        const n2y = -goalDirX;

        const isBlocked1 = this.isLateralBlocked(ctx.position, n1x, n1y, ctx.radius, obstacles);
        const isBlocked2 = this.isLateralBlocked(ctx.position, n2x, n2y, ctx.radius, obstacles);

        if (isBlocked1 && isBlocked2) {
          // Constrained corridor: suppress lateral separation force and clamp forward speed
          const standoffDist = ctx.radius + closestLeadUnit.radius + 6;
          const leadTriggerDist = ctx.radius + closestLeadUnit.radius + 16;

          let leadForwardSpeed = 0;
          if (closestLeadUnit.velocity) {
            leadForwardSpeed =
              closestLeadUnit.velocity.x * goalDirX + closestLeadUnit.velocity.y * goalDirY;
          }
          const leadClampedSpeed = Math.max(0, Math.min(ctx.speed, leadForwardSpeed));

          let forwardSpeed = 0;
          if (closestLeadDist <= standoffDist) {
            forwardSpeed = leadClampedSpeed;
          } else {
            const t = Math.max(
              0,
              Math.min(1, (closestLeadDist - standoffDist) / (leadTriggerDist - standoffDist))
            );
            forwardSpeed = leadClampedSpeed + t * (ctx.speed - leadClampedSpeed);
          }

          this.resultVelocity.x = goalDirX * forwardSpeed;
          this.resultVelocity.y = goalDirY * forwardSpeed;
          return this.resultVelocity;
        }
      }
    }

    // Quadratic separation flocking across open sightlines
    let repulsionX = 0;
    let repulsionY = 0;
    const R_sep = 64;

    if (activeNeighbors) {
      for (const neighbor of activeNeighbors) {
        if (!neighbor.isAlive) continue;
        const diffX = ctx.position.x - neighbor.position.x;
        const diffY = ctx.position.y - neighbor.position.y;
        const nDist = Math.hypot(diffX, diffY);

        if (nDist < R_sep) {
          const factor = Math.pow(1 - nDist / R_sep, 2);
          if (nDist > 1e-4) {
            repulsionX += (diffX / nDist) * factor;
            repulsionY += (diffY / nDist) * factor;
          } else {
            repulsionX += -goalDirY * factor;
            repulsionY += goalDirX * factor;
          }
        }
      }
    }

    const w_sep = 0.75 * ctx.speed;
    const desiredVx = goalDirX * ctx.speed + repulsionX * w_sep;
    const desiredVy = goalDirY * ctx.speed + repulsionY * w_sep;

    const desiredSpeed = Math.hypot(desiredVx, desiredVy);
    if (desiredSpeed > 1e-6) {
      this.resultVelocity.x = (desiredVx / desiredSpeed) * ctx.speed;
      this.resultVelocity.y = (desiredVy / desiredSpeed) * ctx.speed;
    } else {
      this.resultVelocity.x = 0;
      this.resultVelocity.y = 0;
    }

    return this.resultVelocity;
  }

  private isLateralBlocked(
    pos: Vector2D,
    latDirX: number,
    latDirY: number,
    radius: number,
    obstacles: Obstacle[]
  ): boolean {
    if (obstacles.length === 0) return false;
    const probeDist = radius + 12;
    this.scratchDir.x = latDirX;
    this.scratchDir.y = latDirY;

    for (const obs of obstacles) {
      if (
        rayIntersectsAABB(
          pos,
          this.scratchDir,
          obs.bounds.min,
          obs.bounds.max,
          probeDist
        ) !== null
      ) {
        return true;
      }
      this.scratchProbe.x = pos.x + latDirX * 6;
      this.scratchProbe.y = pos.y + latDirY * 6;
      const contact = testCircleAABB(
        this.scratchProbe,
        radius,
        obs.bounds.min,
        obs.bounds.max
      );
      if (contact && contact.collided) {
        return true;
      }
    }
    return false;
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
