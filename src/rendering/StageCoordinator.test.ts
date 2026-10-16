import { describe, expect, it } from "vitest";
import { StageCoordinator } from "./StageCoordinator";

describe("StageCoordinator", () => {
  it("initializes 12-layer scene graph with correct parentage and ordering", () => {
    const coordinator = new StageCoordinator();

    // Root stage has 2 children: worldContainer and hudContainer
    expect(coordinator.rootStage.children).toHaveLength(2);
    expect(coordinator.rootStage.children[0]).toBe(coordinator.worldContainer);
    expect(coordinator.rootStage.children[1]).toBe(coordinator.hudContainer);

    // worldContainer has 8 layers in strict Z-order
    expect(coordinator.worldContainer.children).toHaveLength(8);
    expect(coordinator.worldContainer.children[0]).toBe(coordinator.floorGridLayer);
    expect(coordinator.worldContainer.children[1]).toBe(coordinator.portalLayer);
    expect(coordinator.worldContainer.children[2]).toBe(coordinator.cataclysmFlashLayer);
    expect(coordinator.worldContainer.children[3]).toBe(coordinator.obstacleLayer);
    expect(coordinator.worldContainer.children[4]).toBe(coordinator.projectileLayer);
    expect(coordinator.worldContainer.children[5]).toBe(coordinator.telegraphLayer);
    expect(coordinator.worldContainer.children[6]).toBe(coordinator.entityLayer);
    expect(coordinator.worldContainer.children[7]).toBe(coordinator.particleLayer);

    // hudContainer has 4 layers in strict Z-order
    expect(coordinator.hudContainer.children).toHaveLength(4);
    expect(coordinator.hudContainer.children[0]).toBe(coordinator.telemetryLayer);
    expect(coordinator.hudContainer.children[1]).toBe(coordinator.reticleLayer);
    expect(coordinator.hudContainer.children[2]).toBe(coordinator.portalTransitionLayer);
    expect(coordinator.hudContainer.children[3]).toBe(coordinator.modalOverlayLayer);
  });

  it("resets transient layers without removing persistent layers", () => {
    const coordinator = new StageCoordinator();

    coordinator.resetTransientLayers();
    expect(coordinator.projectileLayer.children).toHaveLength(0);
    expect(coordinator.particleLayer.children).toHaveLength(0);
    expect(coordinator.telegraphLayer.children).toHaveLength(0);
    expect(coordinator.cataclysmFlashLayer.children).toHaveLength(0);

    // Structural layers still intact in worldContainer
    expect(coordinator.worldContainer.children).toHaveLength(8);
  });
});
