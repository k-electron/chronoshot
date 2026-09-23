/**
 * TimeGovernor module for ChronoShot.
 *
 * Governs the core SUPERHOT-style dynamic time dilation:
 * - Baseline micro-creep (default 5% / 0.05 speed) when stationary so bullets crawl forward.
 * - Dynamic velocity-driven scaling ramping up to 100% (1.0 speed) at maximum player movement.
 * - Discrete action tick queuing for combat actions (e.g. +6 ticks on gunshot, +30 ticks on reload)
 *   that force world simulation forward while the player performs actions.
 * - Accumulates scaled wall delta time and calculates discrete fixed-step advances.
 */

export interface TimeGovernorConfig {
  /**
   * Baseline time scale when stationary. Default: 0.05 (5% speed).
   */
  baselineTimeScale?: number;

  /**
   * Maximum time scale at full speed. Default: 1.0 (100% speed).
   */
  maxTimeScale?: number;

  /**
   * Duration of a single physics tick in seconds. Default: 1 / 60 (~0.01667s).
   */
  fixedDeltaTime?: number;

  /**
   * Maximum wall-clock delta time processed in one frame (clamps spiral of death). Default: 0.25s.
   */
  maxDeltaTime?: number;

  /**
   * Smooth ramp rate (units per second) towards target scale.
   * If Infinity (default), time scale immediately reflects velocity.
   */
  rampRate?: number;
}

export class TimeGovernor {
  private baselineTimeScale: number;
  private maxTimeScale: number;
  private fixedDeltaTime: number;
  private maxDeltaTime: number;
  private rampRate: number;
  private timeScaleOverride: number | null = null;

  private currentTimeScale: number;
  private timeAccumulator: number = 0;
  private queuedTicks: number = 0;

  constructor(config?: TimeGovernorConfig) {
    this.baselineTimeScale = config?.baselineTimeScale ?? 0.05;
    this.maxTimeScale = config?.maxTimeScale ?? 1.0;
    this.fixedDeltaTime = config?.fixedDeltaTime ?? 1 / 60;
    this.maxDeltaTime = config?.maxDeltaTime ?? 0.25;
    this.rampRate = config?.rampRate ?? Infinity;

    this.currentTimeScale = this.baselineTimeScale;
  }

  /**
   * Calculates the target time scale based on player's current and maximum speed.
   * Linearly maps [0, maxSpeed] to [baselineTimeScale, maxTimeScale].
   */
  public calculateTargetTimeScale(currentSpeed: number, maxSpeed: number): number {
    if (maxSpeed <= 0) {
      return this.baselineTimeScale;
    }
    const ratio = Math.max(0, Math.min(1, currentSpeed / maxSpeed));
    return this.baselineTimeScale + ratio * (this.maxTimeScale - this.baselineTimeScale);
  }

  /**
   * Updates current time scale towards target given elapsed wall time.
   */
  public updateTimeScale(currentSpeed: number, maxSpeed: number, wallDeltaTime: number): number {
    if (this.timeScaleOverride !== null) {
      this.currentTimeScale = this.timeScaleOverride;
      return this.currentTimeScale;
    }

    const target = this.calculateTargetTimeScale(currentSpeed, maxSpeed);

    if (this.rampRate === Infinity || wallDeltaTime <= 0) {
      this.currentTimeScale = target;
    } else {
      const step = this.rampRate * wallDeltaTime;
      const diff = target - this.currentTimeScale;
      if (Math.abs(diff) <= step) {
        this.currentTimeScale = target;
      } else {
        this.currentTimeScale += Math.sign(diff) * step;
      }
    }

    return this.currentTimeScale;
  }

  /**
   * Queues discrete simulation ticks to immediately advance the world on combat actions.
   * For instance, firing weapon queues +6 ticks, reloading queues +30 ticks.
   */
  public queueTicks(ticks: number): void {
    if (ticks > 0) {
      this.queuedTicks += Math.round(ticks);
    }
  }

  /**
   * Convenience helper for weapon discharge burst.
   */
  public queueFireBurst(ticks = 6): void {
    this.queueTicks(ticks);
  }

  /**
   * Convenience helper for weapon reload cycle burst.
   */
  public queueReloadBurst(ticks = 30): void {
    this.queueTicks(ticks);
  }

  /**
   * Convenience helper for tactical locomotion dash burst.
   */
  public queueDashBurst(ticks = 12): void {
    this.queueTicks(ticks);
  }

  /**
   * Advances wall-clock time and returns the total discrete physics ticks
   * to execute for this frame (combining accumulated scaled time and action bursts).
   *
   * @param wallDeltaTime Elapsed wall-clock delta time in seconds (e.g. from requestAnimationFrame)
   * @param currentSpeed Current movement speed of player (optional, default: 0)
   * @param maxSpeed Maximum movement speed of player (optional, default: 1)
   * @returns Total discrete simulation ticks to simulate this frame
   */
  public advance(
    wallDeltaTime: number,
    currentSpeed: number = 0,
    maxSpeed: number = 1
  ): number {
    const clampedDt = Math.max(0, Math.min(wallDeltaTime, this.maxDeltaTime));

    // Update velocity-driven time scale
    this.updateTimeScale(currentSpeed, maxSpeed, clampedDt);

    // Accumulate scaled delta time
    const scaledDt = clampedDt * this.currentTimeScale;
    this.timeAccumulator += scaledDt;

    // Calculate discrete ticks from continuous accumulation
    const accumulatedTicks = Math.floor(this.timeAccumulator / this.fixedDeltaTime);
    this.timeAccumulator -= accumulatedTicks * this.fixedDeltaTime;

    // Combine with queued action bursts
    const burstTicks = this.queuedTicks;
    this.queuedTicks = 0;

    return accumulatedTicks + burstTicks;
  }

  /**
   * Returns current active time scale [baseline .. max].
   */
  public getTimeScale(): number {
    return this.currentTimeScale;
  }

  /**
   * Explicitly overrides the time scale (e.g. for debug or special events).
   */
  public setTimeScale(scale: number): void {
    this.currentTimeScale = Math.max(0, Math.min(this.maxTimeScale, scale));
  }

  /**
   * Returns remaining accumulated scaled time waiting for next fixed step.
   */
  public getAccumulator(): number {
    return this.timeAccumulator;
  }

  /**
   * Returns rendering interpolation alpha [0, 1) representing how far
   * the current frame is between the previous and next fixed physics tick.
   */
  public getAlpha(): number {
    return this.timeAccumulator / this.fixedDeltaTime;
  }

  /**
   * Returns number of queued action ticks waiting to be consumed.
   */
  public getQueuedTicks(): number {
    return this.queuedTicks;
  }

  /**
   * Returns the configured fixed delta time (e.g. 1/60s).
   */
  public getFixedDeltaTime(): number {
    return this.fixedDeltaTime;
  }

  /**
   * Sets or clears a persistent time scale override (e.g. 1.00x during active tactical reload channel).
   * While set, velocity-driven scaling and ramp rates are bypassed.
   */
  public setTimeScaleOverride(scale: number | null): void {
    this.timeScaleOverride = scale !== null ? Math.max(0, Math.min(this.maxTimeScale, scale)) : null;
    if (this.timeScaleOverride !== null) {
      this.currentTimeScale = this.timeScaleOverride;
    }
  }

  /**
   * Returns active time scale override or null if velocity scaling is active.
   */
  public getTimeScaleOverride(): number | null {
    return this.timeScaleOverride;
  }

  /**
   * Resets accumulator, queued ticks, and time scale to initial baseline.
   */
  public reset(): void {
    this.timeScaleOverride = null;
    this.currentTimeScale = this.baselineTimeScale;
    this.timeAccumulator = 0;
    this.queuedTicks = 0;
  }
}
