/**
 * FixedStepSimulator module for ChronoShot.
 *
 * Runs a deterministic fixed-rate simulation loop (default 60 Hz / 16.67ms per tick)
 * decoupled from variable display refresh rates (60Hz, 120Hz, 144Hz, 240Hz).
 *
 * Prevents projectile tunneling and physics drift by consuming accumulated time
 * in identical discrete quanta, and provides rendering interpolation alpha
 * for jitter-free visual rendering.
 */

import { TimeGovernor } from "./TimeGovernor";

export type TickCallback = (fixedDeltaTime: number, currentTick: number) => void;

export interface FixedStepSimulatorConfig {
  /**
   * Duration of each simulation tick in seconds. Default: 1 / 60 (60 Hz).
   */
  fixedDeltaTime?: number;

  /**
   * Maximum number of simulation sub-steps executed in a single update call.
   * Prevents spiral-of-death when tab is throttled or lagging. Default: 60.
   */
  maxSubSteps?: number;
}

export class FixedStepSimulator {
  private readonly fixedDeltaTime: number;
  private readonly maxSubSteps: number;

  private accumulator: number = 0;
  private currentTick: number = 0;

  constructor(config?: FixedStepSimulatorConfig) {
    this.fixedDeltaTime = config?.fixedDeltaTime ?? 1 / 60;
    this.maxSubSteps = config?.maxSubSteps ?? 60;
  }

  /**
   * Feeds delta time to the accumulator, running fixed physics ticks as time accumulates.
   *
   * @param deltaTime Elapsed delta time in seconds (can be scaled by TimeGovernor or unscaled)
   * @param tickCallback Function invoked for each discrete physics step
   * @returns Number of ticks executed in this step
   */
  public step(deltaTime: number, tickCallback: TickCallback): number {
    if (deltaTime <= 0) {
      return 0;
    }

    this.accumulator += deltaTime;

    let stepsExecuted = 0;
    while (this.accumulator >= this.fixedDeltaTime && stepsExecuted < this.maxSubSteps) {
      this.accumulator -= this.fixedDeltaTime;
      this.currentTick++;
      tickCallback(this.fixedDeltaTime, this.currentTick);
      stepsExecuted++;
    }

    // Discard residual backlog if maxSubSteps clamp was reached to avoid spiral of death
    if (this.accumulator >= this.fixedDeltaTime) {
      this.accumulator = 0;
    }

    return stepsExecuted;
  }

  /**
   * Executes an explicit number of discrete simulation ticks directly.
   * Particularly useful when processing discrete action bursts (fire/reload)
   * calculated by TimeGovernor.
   *
   * @param tickCount Number of discrete ticks to run
   * @param tickCallback Function invoked for each discrete tick
   * @returns Number of ticks executed
   */
  public stepTicks(tickCount: number, tickCallback: TickCallback): number {
    if (tickCount <= 0) {
      return 0;
    }

    const stepsToRun = Math.min(tickCount, this.maxSubSteps);
    for (let i = 0; i < stepsToRun; i++) {
      this.currentTick++;
      tickCallback(this.fixedDeltaTime, this.currentTick);
    }

    return stepsToRun;
  }

  /**
   * Convenient unified step method coordinating with a TimeGovernor.
   * Evaluates movement speed, drains action bursts, and advances physics ticks.
   *
   * @param governor Active TimeGovernor instance
   * @param wallDeltaTime Wall-clock elapsed frame time in seconds
   * @param currentSpeed Current movement speed of player
   * @param maxSpeed Maximum movement speed of player
   * @param tickCallback Function invoked for each discrete tick
   * @returns Number of ticks executed
   */
  public stepWithGovernor(
    governor: TimeGovernor,
    wallDeltaTime: number,
    currentSpeed: number,
    maxSpeed: number,
    tickCallback: TickCallback
  ): number {
    const ticksToRun = governor.advance(wallDeltaTime, currentSpeed, maxSpeed);
    return this.stepTicks(ticksToRun, tickCallback);
  }

  /**
   * Returns current render interpolation alpha [0, 1).
   * Represents the fractional progress between the previous and next fixed tick:
   * renderPos = prevPos * (1 - alpha) + currPos * alpha
   */
  public getAlpha(): number {
    return Math.max(0, Math.min(1, this.accumulator / this.fixedDeltaTime));
  }

  /**
   * Total number of discrete physics ticks executed since initialization or reset.
   */
  public getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Total accumulated simulated time in seconds.
   */
  public getSimulatedTime(): number {
    return this.currentTick * this.fixedDeltaTime;
  }

  /**
   * Configured fixed delta time in seconds (e.g. 1/60s = 0.016667s).
   */
  public getFixedDeltaTime(): number {
    return this.fixedDeltaTime;
  }

  /**
   * Current fractional accumulator in seconds.
   */
  public getAccumulator(): number {
    return this.accumulator;
  }

  /**
   * Resets simulator state back to tick 0 with empty accumulator.
   */
  public reset(): void {
    this.accumulator = 0;
    this.currentTick = 0;
  }
}
