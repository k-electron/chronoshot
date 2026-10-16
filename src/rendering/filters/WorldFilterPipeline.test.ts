import { describe, expect, it } from "vitest";
import { Container } from "pixi.js";
import { WorldFilterPipeline } from "./WorldFilterPipeline";
import { StageCoordinator } from "../StageCoordinator";

describe("WorldFilterPipeline", () => {
  it("attaches filters strictly to worldContainer leaving hudContainer unfiltered", () => {
    const coordinator = new StageCoordinator();
    const pipeline = new WorldFilterPipeline(coordinator.worldContainer);

    pipeline.syncFilters();

    expect(coordinator.worldContainer.filters).toBeDefined();
    // hudContainer must remain completely unfiltered (undefined or empty)
    expect(coordinator.hudContainer.filters || []).toHaveLength(0);

    pipeline.destroy();
  });

  it("configures luminance threshold for dark contrast protection", () => {
    const world = new Container();
    const pipeline = new WorldFilterPipeline(world);

    expect(pipeline.bloomThreshold).toBe(0.65); // Default protects #0e1117 and #1e242f
    pipeline.configureBloom({ threshold: 0.75, strength: 2.0 });
    expect(pipeline.bloomThreshold).toBe(0.75);
    expect(pipeline.bloomStrength).toBe(2.0);

    pipeline.destroy();
  });

  it("triggers and decays chromatic aberration pulse in wall-clock time", () => {
    const world = new Container();
    const pipeline = new WorldFilterPipeline(world);

    pipeline.triggerChromaticAberration(8, 0.2);
    expect(pipeline.chromaticAberrationOffset).toBe(8);

    // Advance 0.1s (halfway)
    pipeline.update(0.1);
    expect(pipeline.chromaticAberrationOffset).toBeCloseTo(4, 1);

    // Complete duration
    pipeline.update(0.1);
    expect(pipeline.chromaticAberrationOffset).toBe(0);

    pipeline.destroy();
  });

  it("triggers, expands, and dissipates radial shockwaves", () => {
    const world = new Container();
    const pipeline = new WorldFilterPipeline(world);

    pipeline.triggerShockwave(480, 320, 500, 0.5);
    expect(pipeline.activeShockwaves).toHaveLength(1);
    expect(pipeline.activeShockwaves[0].radius).toBe(0);

    // Advance halfway (0.25s) -> radius should be ~250
    pipeline.update(0.25);
    expect(pipeline.activeShockwaves[0].radius).toBeCloseTo(250, 1);

    // Finish duration -> shockwave dissipates
    pipeline.update(0.26);
    expect(pipeline.activeShockwaves).toHaveLength(0);

    pipeline.destroy();
  });
});
