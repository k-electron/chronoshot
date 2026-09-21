import { describe, it, expect } from "vitest";
import { FixedStepSimulator } from "./FixedStepSimulator";
import { TimeGovernor } from "./TimeGovernor";

describe("FixedStepSimulator - Deterministic Tick Consumption", () => {
  it("consumes accumulated time in fixed 60 Hz quanta regardless of frame rate", () => {
    const sim60 = new FixedStepSimulator();
    let ticks60 = 0;
    // 60 frames of 1/60s
    for (let i = 0; i < 60; i++) {
      sim60.step(1 / 60, () => {
        ticks60++;
      });
    }

    const sim120 = new FixedStepSimulator();
    let ticks120 = 0;
    // 120 frames of 1/120s
    for (let i = 0; i < 120; i++) {
      sim120.step(1 / 120, () => {
        ticks120++;
      });
    }

    const sim30 = new FixedStepSimulator();
    let ticks30 = 0;
    // 30 frames of 1/30s
    for (let i = 0; i < 30; i++) {
      sim30.step(1 / 30, () => {
        ticks30++;
      });
    }

    expect(ticks60).toBe(60);
    expect(ticks120).toBe(60);
    expect(ticks30).toBe(60);
    expect(sim60.getCurrentTick()).toBe(60);
    expect(sim120.getCurrentTick()).toBe(60);
    expect(sim30.getCurrentTick()).toBe(60);
  });

  it("yields identical physical trajectory under variable and jittery frame times", () => {
    // A projectile moving at 300 px/second
    const speed = 300;

    let posSmooth = 0;
    const simSmooth = new FixedStepSimulator();
    for (let i = 0; i < 60; i++) {
      simSmooth.step(1 / 60, (dt) => {
        posSmooth += speed * dt;
      });
    }

    let posJitter = 0;
    const simJitter = new FixedStepSimulator();
    // Variable frame timings summing up to 1.0 second
    const jitterFrames = [
      0.008, 0.024, 0.012, 0.035, 0.005, 0.016, 0.050, 0.010,
      0.020, 0.015, 0.005, 0.030, 0.025, 0.015, 0.030, 0.010,
      0.020, 0.010, 0.040, 0.050, 0.050, 0.100, 0.100, 0.200,
      0.120,
    ];
    // Total sum = 1.000s
    for (const dt of jitterFrames) {
      simJitter.step(dt, (fixedDt) => {
        posJitter += speed * fixedDt;
      });
    }

    // 60 ticks * (300 * 1/60) = 60 * 5 = 300px
    expect(posSmooth).toBeCloseTo(300, 5);
    expect(posJitter).toBeCloseTo(300, 5);
    expect(posSmooth).toBe(posJitter);
  });

  it("computes render interpolation alpha accurately", () => {
    const sim = new FixedStepSimulator();
    const fixedDt = sim.getFixedDeltaTime(); // 1/60 = ~0.016667

    // Half a tick of delta time
    sim.step(fixedDt * 0.5, () => {});
    expect(sim.getAlpha()).toBeCloseTo(0.5, 4);

    // Quarter more tick -> 0.75 alpha
    sim.step(fixedDt * 0.25, () => {});
    expect(sim.getAlpha()).toBeCloseTo(0.75, 4);

    // Quarter more tick completes 1.0 fixed step -> consumes tick, alpha becomes 0
    sim.step(fixedDt * 0.25, () => {});
    expect(sim.getAlpha()).toBeCloseTo(0, 4);
    expect(sim.getCurrentTick()).toBe(1);
  });

  it("safeguards against spiral-of-death during large lag spikes", () => {
    const sim = new FixedStepSimulator({ maxSubSteps: 30 });
    let ticksRan = 0;

    // Simulate huge 5-second stall (would otherwise attempt 300 steps)
    const executed = sim.step(5.0, () => {
      ticksRan++;
    });

    expect(executed).toBe(30);
    expect(ticksRan).toBe(30);
    // Backlog must be cleared to prevent ongoing lag spiral
    expect(sim.getAccumulator()).toBe(0);
  });

  it("executes discrete ticks directly via stepTicks", () => {
    const sim = new FixedStepSimulator();
    let tickCount = 0;

    sim.stepTicks(12, () => {
      tickCount++;
    });

    expect(tickCount).toBe(12);
    expect(sim.getCurrentTick()).toBe(12);
  });
});

describe("FixedStepSimulator + TimeGovernor Integration", () => {
  it("runs exactly 3 micro-creep ticks during 1 second of stationary idle", () => {
    const simulator = new FixedStepSimulator();
    const governor = new TimeGovernor();

    let ticksExecuted = 0;
    const frameDt = 1 / 60;

    for (let frame = 0; frame < 60; frame++) {
      simulator.stepWithGovernor(governor, frameDt, 0, 100, () => {
        ticksExecuted++;
      });
    }

    // Baseline 5% time progression: 60 * 0.05 = 3 ticks
    expect(ticksExecuted).toBe(3);
    expect(simulator.getCurrentTick()).toBe(3);
  });

  it("runs full 60 ticks during 1 second of maximum player sprint", () => {
    const simulator = new FixedStepSimulator();
    const governor = new TimeGovernor();

    let ticksExecuted = 0;
    const frameDt = 1 / 60;

    for (let frame = 0; frame < 60; frame++) {
      simulator.stepWithGovernor(governor, frameDt, 100, 100, () => {
        ticksExecuted++;
      });
    }

    expect(ticksExecuted).toBe(60);
    expect(simulator.getCurrentTick()).toBe(60);
  });

  it("immediately processes gun discharge (+6 ticks) and reload cycle (+30 ticks)", () => {
    const simulator = new FixedStepSimulator();
    const governor = new TimeGovernor();

    // Fire weapon while stationary
    governor.queueFireBurst(6);
    let fireTicks = 0;
    simulator.stepWithGovernor(governor, 0.001, 0, 100, () => {
      fireTicks++;
    });
    expect(fireTicks).toBe(6);

    // Reload weapon while stationary
    governor.queueReloadBurst(30);
    let reloadTicks = 0;
    simulator.stepWithGovernor(governor, 0.001, 0, 100, () => {
      reloadTicks++;
    });
    expect(reloadTicks).toBe(30);

    expect(simulator.getCurrentTick()).toBe(36);
  });
});
