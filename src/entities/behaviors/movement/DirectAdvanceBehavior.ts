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

  // Tangent fallback state
  private activeTangent: Vector2D = { x: 0, y: 0 };
  private tangentLockTicks: number = 0;

  // Intentional-stop-aware movement watchdog state
  public stallTicks: number = 0;
  private lastWatchedPos: Vector2D = { x: 0, y: 0 };
  private watchdogInitialized: boolean = false;

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
      this.resetWatchdog(ctx.position);
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
      this.activeTangent.x = 0;
      this.activeTangent.y = 0;
      this.tangentLockTicks = 0;
      return this.steerDirectly(ctx, target, obstacles, activeNeighbors);
    }

    // 2. Blocked line-of-sight or obstructed physical clearance: 20px tile grid A* pathfinding
    this.repathCooldownTicks -= deltaTicks;

    const isStalled = this.updateWatchdog(ctx, target, deltaTicks);
    if (isStalled) {
      this.repathCooldownTicks = 0;
    }

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

      if (isStalled && path.length === 0) {
        // Trigger breakout tangent slide along obstacle
        let breakoutNormal: Vector2D | null = null;
        for (const obs of obstacles) {
          const contact = testCircleAABB(
            ctx.position,
            ctx.radius + 4,
            obs.bounds.min,
            obs.bounds.max
          );
          if (contact && contact.collided) {
            breakoutNormal = contact.normal;
            break;
          }
        }
        if (breakoutNormal) {
          const t = { x: -breakoutNormal.y, y: breakoutNormal.x };
          this.activeTangent.x = t.x;
          this.activeTangent.y = t.y;
          this.tangentLockTicks = 8;
        }
      }
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
      } else {
        // Swept-circle waypoint shortcut lookahead:
        // Validate forward chords using continuous Minkowski swept-circle raycasting
        for (let i = this.currentPath.length - 1; i > this.currentWaypointIndex; i--) {
          const candidateWp = this.currentPath[i];
          if (hasNavigationClearance(ctx.position, candidateWp, ctx.radius, obstacles)) {
            this.currentWaypointIndex = i;
            break;
          }
        }
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
    if (ctx.hasLineOfSight && hasNavigationClearance(ctx.position, target.position, ctx.radius, obstacles)) {
      this.activeTangent.x = 0;
      this.activeTangent.y = 0;
      this.tangentLockTicks = 0;
      this.steerDirectly(ctx, target, obstacles, activeNeighbors);
    } else {
      // Find obstacle in contact or close proximity (within radius + 3)
      let contactObstacle: Obstacle | null = null;
      let contactNormal: Vector2D | null = null;
      let deepestPenetration = -Infinity;

      for (const obs of obstacles) {
        const contact = testCircleAABB(
          ctx.position,
          ctx.radius + 3,
          obs.bounds.min,
          obs.bounds.max
        );
        if (contact && contact.collided) {
          if (contact.depth > deepestPenetration) {
            deepestPenetration = contact.depth;
            contactObstacle = obs;
            contactNormal = contact.normal;
          }
        }
      }

      if (contactObstacle && contactNormal) {
        // Goal direction (towards target position)
        const dx = target.position.x - ctx.position.x;
        const dy = target.position.y - ctx.position.y;
        const dist = Math.hypot(dx, dy);
        const goalDirX = dist > 1e-6 ? dx / dist : 0;
        const goalDirY = dist > 1e-6 ? dy / dist : 0;

        // Tangent candidates: (-ny, nx) and (ny, -nx)
        const t1 = { x: -contactNormal.y, y: contactNormal.x };
        const t2 = { x: contactNormal.y, y: -contactNormal.x };

        const score1 = goalDirX * t1.x + goalDirY * t1.y;
        const score2 = goalDirX * t2.x + goalDirY * t2.y;

        const bestTangent = score1 >= score2 ? t1 : t2;
        const bestScore = Math.max(score1, score2);
        const otherTangent = score1 >= score2 ? t2 : t1;

        this.tangentLockTicks = Math.max(0, this.tangentLockTicks - deltaTicks);

        const checkObstructed = (t: Vector2D): boolean => {
          const probeDist = ctx.radius + 4;
          const px = ctx.position.x + t.x * probeDist;
          const py = ctx.position.y + t.y * probeDist;
          for (const obs of obstacles) {
            const hit = testCircleAABB(
              { x: px, y: py },
              ctx.radius * 0.8,
              obs.bounds.min,
              obs.bounds.max
            );
            if (hit && hit.collided) {
              return true;
            }
          }
          return false;
        };

        const hasActiveTangent =
          this.activeTangent.x !== 0 || this.activeTangent.y !== 0;

        if (!hasActiveTangent) {
          if (!checkObstructed(bestTangent)) {
            this.activeTangent.x = bestTangent.x;
            this.activeTangent.y = bestTangent.y;
          } else {
            this.activeTangent.x = otherTangent.x;
            this.activeTangent.y = otherTangent.y;
          }
          this.tangentLockTicks = 8;
        } else {
          if (checkObstructed(this.activeTangent)) {
            this.activeTangent.x = otherTangent.x;
            this.activeTangent.y = otherTangent.y;
            this.tangentLockTicks = 8;
          } else if (this.tangentLockTicks === 0) {
            const currentScore =
              goalDirX * this.activeTangent.x + goalDirY * this.activeTangent.y;
            if (bestScore > currentScore + 0.25 && !checkObstructed(bestTangent)) {
              this.activeTangent.x = bestTangent.x;
              this.activeTangent.y = bestTangent.y;
              this.tangentLockTicks = 8;
            }
          }
        }

        this.resultVelocity.x = this.activeTangent.x * ctx.speed;
        this.resultVelocity.y = this.activeTangent.y * ctx.speed;
      } else {
        // Optical LOS blocked, but no obstacle in contact: steer toward nearest walkable cell to target
        this.activeTangent.x = 0;
        this.activeTangent.y = 0;
        this.tangentLockTicks = 0;

        const pf = pathfinder ?? this.getOrCreatePathfinder(obstacles, ctx.radius);
        const fallbackGoal = pf.findNearestWalkable(target.position) ?? target.position;
        const dx = fallbackGoal.x - ctx.position.x;
        const dy = fallbackGoal.y - ctx.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1e-6) {
          this.resultVelocity.x = (dx / dist) * ctx.speed;
          this.resultVelocity.y = (dy / dist) * ctx.speed;
        } else {
          this.resultVelocity.x = 0;
          this.resultVelocity.y = 0;
        }
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
    this.activeTangent.x = 0;
    this.activeTangent.y = 0;
    this.tangentLockTicks = 0;
    this.stallTicks = 0;
    this.watchdogInitialized = false;
  }

  public resetWatchdog(pos?: Vector2D): void {
    this.stallTicks = 0;
    if (pos) {
      this.lastWatchedPos.x = pos.x;
      this.lastWatchedPos.y = pos.y;
    }
  }

  private updateWatchdog(
    ctx: MovementContext,
    target: CombatUnit,
    deltaTicks: number
  ): boolean {
    if (!this.watchdogInitialized) {
      this.lastWatchedPos.x = ctx.position.x;
      this.lastWatchedPos.y = ctx.position.y;
      this.watchdogInitialized = true;
      this.stallTicks = 0;
      return false;
    }

    // Intentional stop detection:
    // Reset watchdog during intentional halts
    const isIntentionalStop =
      ctx.speed <= 0 ||
      ctx.isChargingLaser === true ||
      ctx.isOverloading === true ||
      (ctx.stutterTimerTicks !== undefined && ctx.stutterTimerTicks > 0);

    if (isIntentionalStop) {
      this.stallTicks = 0;
      this.lastWatchedPos.x = ctx.position.x;
      this.lastWatchedPos.y = ctx.position.y;
      return false;
    }

    // Surface arrival check
    const distToTarget = Math.hypot(
      target.position.x - ctx.position.x,
      target.position.y - ctx.position.y
    );
    if (distToTarget <= ctx.radius + target.radius + 2) {
      this.stallTicks = 0;
      this.lastWatchedPos.x = ctx.position.x;
      this.lastWatchedPos.y = ctx.position.y;
      return false;
    }

    // Check displacement from lastWatchedPos
    const disp = Math.hypot(
      ctx.position.x - this.lastWatchedPos.x,
      ctx.position.y - this.lastWatchedPos.y
    );

    if (disp >= 1.5) {
      // Made progress: reset stall timer and update watched position
      this.stallTicks = 0;
      this.lastWatchedPos.x = ctx.position.x;
      this.lastWatchedPos.y = ctx.position.y;
      return false;
    } else {
      this.stallTicks += deltaTicks;
      if (this.stallTicks >= 12) {
        // Stall detected!
        this.stallTicks = 0;
        this.lastWatchedPos.x = ctx.position.x;
        this.lastWatchedPos.y = ctx.position.y;
        return true;
      }
      return false;
    }
  }

  /**
   * Smooths path chords using continuous Minkowski swept-circle raycasting to shortcut intermediate waypoints.
   */
  public smoothPath(
    path: Vector2D[],
    radius: number,
    obstacles: Obstacle[]
  ): Vector2D[] {
    if (path.length <= 2) return path;

    const smoothed: Vector2D[] = [path[0]];
    let currentIdx = 0;

    while (currentIdx < path.length - 1) {
      let nextIdx = currentIdx + 1;
      for (let testIdx = path.length - 1; testIdx > currentIdx + 1; testIdx--) {
        if (hasNavigationClearance(path[currentIdx], path[testIdx], radius, obstacles)) {
          nextIdx = testIdx;
          break;
        }
      }
      smoothed.push(path[nextIdx]);
      currentIdx = nextIdx;
    }

    return smoothed;
  }

  private getOrCreatePathfinder(
    obstacles: Obstacle[],
    clearanceRadius: number
  ): GridPathfinder {
    if (!this.defaultPathfinder) {
      this.defaultPathfinder = new GridPathfinder(960, 640, 20);
    }
    this.defaultPathfinder.updateObstacles(obstacles, clearanceRadius);
    return this.defaultPathfinder;
  }
}
