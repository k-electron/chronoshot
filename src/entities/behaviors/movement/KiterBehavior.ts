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
import { hasNavigationClearance, testCircleAABB } from "../../../math/collision";
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
  private activeTangent: Vector2D = { x: 0, y: 0 };
  private tangentLockTicks: number = 0;

  // Intentional-stop-aware movement watchdog state
  public stallTicks: number = 0;
  private lastWatchedPos: Vector2D = { x: 0, y: 0 };
  private watchdogInitialized: boolean = false;

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

        // Test if retreat path is physically clear of obstacles and friendly units
        const retreatProbeDist = Math.min(40, ctx.radius * 2);
        const retreatProbe = vec2(
          ctx.position.x + retreatDirX * retreatProbeDist,
          ctx.position.y + retreatDirY * retreatProbeDist
        );

        let isRetreatBlockedByNeighbor = false;
        if (activeNeighbors) {
          for (const n of activeNeighbors) {
            if (!n.isAlive) continue;
            const toNeighX = n.position.x - retreatProbe.x;
            const toNeighY = n.position.y - retreatProbe.y;
            if (Math.hypot(toNeighX, toNeighY) < ctx.radius + n.radius + 6) {
              isRetreatBlockedByNeighbor = true;
              break;
            }
          }
        }

        const isRetreatClear =
          !isRetreatBlockedByNeighbor &&
          hasNavigationClearance(ctx.position, retreatProbe, ctx.radius, obstacles);

        if (isRetreatClear) {
          this.resultVelocity.x = retreatDirX * ctx.speed;
          this.resultVelocity.y = retreatDirY * ctx.speed;
        } else {
          // Obstacle or neighbor directly behind: probe lateral wall/unit escape tangents
          const lateralCandidates: Vector2D[] = [
            { x: -retreatDirY, y: retreatDirX },
            { x: retreatDirY, y: -retreatDirX },
          ];
          let chosenLateral: Vector2D | null = null;
          let maxDistSq = -1;

          for (const lat of lateralCandidates) {
            const probe = vec2(
              ctx.position.x + lat.x * retreatProbeDist,
              ctx.position.y + lat.y * retreatProbeDist
            );

            let isLatBlockedByNeighbor = false;
            if (activeNeighbors) {
              for (const n of activeNeighbors) {
                if (!n.isAlive) continue;
                const toNeighX = n.position.x - probe.x;
                const toNeighY = n.position.y - probe.y;
                if (Math.hypot(toNeighX, toNeighY) < ctx.radius + n.radius + 6) {
                  isLatBlockedByNeighbor = true;
                  break;
                }
              }
            }

            if (
              !isLatBlockedByNeighbor &&
              hasNavigationClearance(ctx.position, probe, ctx.radius, obstacles)
            ) {
              const dX = probe.x - target.position.x;
              const dY = probe.y - target.position.y;
              const dSq = dX * dX + dY * dY;
              if (dSq > maxDistSq) {
                maxDistSq = dSq;
                chosenLateral = lat;
              }
            }
          }

          if (chosenLateral) {
            this.resultVelocity.x = chosenLateral.x * ctx.speed;
            this.resultVelocity.y = chosenLateral.y * ctx.speed;
          } else {
            // Trapped on all sides: hold ground instead of jamming into wall
            this.resultVelocity.x = 0;
            this.resultVelocity.y = 0;
          }
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
        this.resetWatchdog(ctx.position);
        return this.resultVelocity;
      }
    }

    // 2. Blocked line-of-sight or obstructed advance: 20px tile grid A* pathfinding
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
    if (ctx.hasLineOfSight) {
      this.activeTangent.x = 0;
      this.activeTangent.y = 0;
      this.tangentLockTicks = 0;
      // Advance directly toward target
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
    } else {
      // Find obstacle in contact or close proximity
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
        const dx = target.position.x - ctx.position.x;
        const dy = target.position.y - ctx.position.y;
        const dist = Math.hypot(dx, dy);
        const goalDirX = dist > 1e-6 ? dx / dist : 0;
        const goalDirY = dist > 1e-6 ? dy / dist : 0;

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
        this.activeTangent.x = 0;
        this.activeTangent.y = 0;
        this.tangentLockTicks = 0;

        // Steer toward nearest walkable cell to target
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
    }

    return this.resultVelocity;
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

    // Kiter sweet-spot range holding exemption:
    if (ctx.hasLineOfSight) {
      const distToTarget = Math.hypot(
        target.position.x - ctx.position.x,
        target.position.y - ctx.position.y
      );
      if (distToTarget >= this.minDist && distToTarget <= this.maxDist) {
        this.stallTicks = 0;
        this.lastWatchedPos.x = ctx.position.x;
        this.lastWatchedPos.y = ctx.position.y;
        return false;
      }
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
