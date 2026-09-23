/**
 * MovementBehavior module for ChronoShot.
 *
 * Defines movement behavior contracts, movement context, and scratch vector
 * pooling for zero-allocation locomotion simulation in fixed-step 60Hz updates.
 */

import { GridPathfinder } from "../../../engine/GridPathfinder";
import { Vector2D } from "../../../math/vector";
import { Obstacle } from "../../Obstacle";
import { CombatUnit } from "../../Projectile";

/**
 * Contextual state snapshot required by movement behaviors to evaluate locomotion.
 */
export interface MovementContext {
  position: Vector2D;
  previousPosition: Vector2D;
  velocity: Vector2D;
  radius: number;
  speed: number;
  aimAngle: number;
  hasLineOfSight: boolean;
}

/**
 * Interface for composable locomotion strategies.
 */
export interface MovementBehavior {
  /**
   * Computes desired movement velocity for this simulation tick.
   *
   * @param ctx Current state snapshot of the moving unit
   * @param target Combat unit target (e.g. Player)
   * @param obstacles Obstacles in the arena
   * @param deltaTicks Fixed simulation ticks elapsed (default: 1)
   * @param fixedDeltaTime Simulation delta time in seconds (default: deltaTicks / 60)
   * @param pathfinder Optional shared GridPathfinder instance
   * @returns Desired velocity vector for this tick
   */
  update(
    ctx: MovementContext,
    target: CombatUnit,
    obstacles: Obstacle[],
    deltaTicks: number,
    fixedDeltaTime: number,
    pathfinder?: GridPathfinder
  ): Vector2D;

  /**
   * Resets internal navigation and steering state (e.g. waypoints, cooldowns).
   */
  reset(): void;
}

/**
 * Reusable scratch vector pool to eliminate memory allocations in the 60Hz simulation loop.
 */
export class ScratchVectorPool {
  private readonly pool: Vector2D[] = [];
  private index: number = 0;

  constructor(initialCapacity: number = 16) {
    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push({ x: 0, y: 0 });
    }
  }

  /**
   * Acquires a scratch vector from the pool, optionally setting initial coordinates.
   */
  public acquire(x: number = 0, y: number = 0): Vector2D {
    if (this.index >= this.pool.length) {
      this.pool.push({ x: 0, y: 0 });
    }
    const vec = this.pool[this.index++];
    vec.x = x;
    vec.y = y;
    return vec;
  }

  /**
   * Resets the allocation pointer. Call at the start or end of each tick.
   */
  public reset(): void {
    this.index = 0;
  }

  /**
   * Returns current count of acquired vectors in the active cycle.
   */
  public get allocatedCount(): number {
    return this.index;
  }

  /**
   * Returns total capacity of the pool.
   */
  public get capacity(): number {
    return this.pool.length;
  }
}

/**
 * Shared pre-allocated scratch vector pool for locomotion computations.
 */
export const sharedMovementScratchPool = new ScratchVectorPool(32);
