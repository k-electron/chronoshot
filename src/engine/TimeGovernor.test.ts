import { describe, it, expect } from "vitest";
import { TimeGovernor } from "./TimeGovernor";

describe("TimeGovernor - Micro-Creep & Velocity Scaling", () => {
  it("maintains 5% baseline micro-creep when player is stationary", () => {
    const governor = new TimeGovernor();
    expect(governor.getTimeScale()).toBeCloseTo(0.05, 5);

    // Over 1 full second of real time at 60 FPS (60 steps of 1/60s)
    let totalTicks = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      totalTicks += governor.advance(dt, 0, 100);
    }

    // 1 second * 0.05 scale = 0.05s simulated time = exactly 3 ticks at 60Hz
    expect(totalTicks).toBe(3);
  });

  it("yields full 60 ticks per real second at maximum player velocity", () => {
    const governor = new TimeGovernor();
    let totalTicks = 0;
    const dt = 1 / 60;

    for (let i = 0; i < 60; i++) {
      totalTicks += governor.advance(dt, 100, 100);
    }

    expect(governor.getTimeScale()).toBeCloseTo(1.0, 5);
    expect(totalTicks).toBe(60);
  });

  it("dynamically ramps time scale proportional to player movement speed", () => {
    const governor = new TimeGovernor();

    // Half speed: 0.05 + 0.5 * (1.0 - 0.05) = 0.525
    governor.advance(0.016, 50, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.525, 4);

    // Quarter speed: 0.05 + 0.25 * 0.95 = 0.2875
    governor.advance(0.016, 25, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.2875, 4);

    // Stopping decelerates back to 0.05
    governor.advance(0.016, 0, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.05, 4);
  });

  it("clamps time scale within valid bounds [0.05, 1.0]", () => {
    const governor = new TimeGovernor();

    // Overspeed clamped to 1.0
    governor.advance(0.016, 250, 100);
    expect(governor.getTimeScale()).toBe(1.0);

    // Negative velocity clamped to baseline 0.05
    governor.advance(0.016, -50, 100);
    expect(governor.getTimeScale()).toBe(0.05);
  });

  it("smoothly ramps up and down when rampRate is configured", () => {
    // Ramp rate of 2.0 units per second
    const governor = new TimeGovernor({ rampRate: 2.0 });

    // Step 0.1s towards full speed (target 1.0 from 0.05)
    // Diff step = 2.0 * 0.1 = 0.2 -> timeScale = 0.05 + 0.2 = 0.25
    governor.advance(0.1, 100, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.25, 4);

    // Another 0.1s step -> 0.45
    governor.advance(0.1, 100, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.45, 4);

    // Player stops: ramp down towards 0.05
    governor.advance(0.1, 0, 100);
    expect(governor.getTimeScale()).toBeCloseTo(0.25, 4);
  });
});

describe("TimeGovernor - Action Tick Queuing", () => {
  it("advances exact discrete burst ticks when firing weapon", () => {
    const governor = new TimeGovernor();

    // Stationary player queues firearm discharge (+6 ticks)
    governor.queueFireBurst(6);
    expect(governor.getQueuedTicks()).toBe(6);

    // On single tiny frame (1ms) where accumulator yields 0 ticks
    const ticks = governor.advance(0.001, 0, 100);

    // Should immediately consume and return the 6 burst ticks
    expect(ticks).toBe(6);
    // Queued ticks must be drained
    expect(governor.getQueuedTicks()).toBe(0);

    // Next frame without action should advance 0 ticks
    const nextTicks = governor.advance(0.001, 0, 100);
    expect(nextTicks).toBe(0);
  });

  it("advances larger discrete burst ticks during reload cycle", () => {
    const governor = new TimeGovernor();

    // Queuing a 30-tick reload cycle
    governor.queueReloadBurst(30);
    expect(governor.getQueuedTicks()).toBe(30);

    const ticks = governor.advance(0.001, 0, 100);
    expect(ticks).toBe(30);
    expect(governor.getQueuedTicks()).toBe(0);
  });

  it("combines movement accumulator ticks with action burst ticks deterministically", () => {
    const governor = new TimeGovernor();

    // Moving at full speed for 1/60s generates 1 tick from movement
    // Plus a 6-tick gunshot burst queued
    governor.queueFireBurst(6);
    const totalTicks = governor.advance(1 / 60, 100, 100);

    // 1 movement tick + 6 action burst ticks = 7 ticks
    expect(totalTicks).toBe(7);
  });

  it("properly resets accumulator, queue, and scale", () => {
    const governor = new TimeGovernor();
    governor.advance(1.0, 100, 100);
    governor.queueTicks(15);

    governor.reset();
    expect(governor.getTimeScale()).toBe(0.05);
    expect(governor.getAccumulator()).toBe(0);
    expect(governor.getQueuedTicks()).toBe(0);
  });
});
