import { describe, expect, it } from "vitest";
import { WorldPixiRenderer } from "./WorldPixiRenderer";
import { StageCoordinator } from "../StageCoordinator";
import { CataclysmFlashController } from "../../entities/boss/CataclysmFlashController";
import { createObstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";

describe("WorldPixiRenderer", () => {
  it("renders floor grid, obstacles, and cataclysm flash in correct layer containers", () => {
    const coordinator = new StageCoordinator();
    const renderer = new WorldPixiRenderer(coordinator);

    renderer.renderFloorGrid(960, 640);
    expect(coordinator.floorGridLayer.children).toHaveLength(1);

    const obstacles = [createObstacle("obs-1", 100, 100, 200, 40)];
    renderer.renderObstacles(obstacles);
    expect(coordinator.obstacleLayer.children).toHaveLength(1);

    const flash = new CataclysmFlashController();
    flash.trigger(vec2(480, 320), "#ff1744", 0.1);
    renderer.updateCataclysmFlash(flash, obstacles, 960, 640);
    expect(coordinator.cataclysmFlashLayer.children).toHaveLength(1);

    renderer.destroy();
  });
});
