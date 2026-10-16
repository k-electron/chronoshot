import { describe, expect, it } from "vitest";
import { HudPixiRenderer } from "./HudPixiRenderer";
import { StageCoordinator } from "../StageCoordinator";
import { Reticle } from "../../ui/Reticle";
import { vec2 } from "../../math/vector";

describe("HudPixiRenderer", () => {
  it("renders reticle into reticleLayer with precision crosshair vectors", () => {
    const coordinator = new StageCoordinator();
    const hudRenderer = new HudPixiRenderer(coordinator);
    const reticle = new Reticle();

    hudRenderer.updateReticle(reticle, vec2(480, 320), 0.05, 0, false);
    expect(coordinator.reticleLayer.children).toHaveLength(1);

    hudRenderer.hideReticle();
    expect(coordinator.reticleLayer.children).toHaveLength(1);

    hudRenderer.destroy();
  });
});
