/**
 * ChronoShot - WorldPixiRenderer
 *
 * Coordinates static and dynamic world environment rendering in Pixi v8:
 * - FloorGridLayer: #0e1117 background + #161b22 tactical grid
 * - PortalLayer: Floor energy beacon
 * - CataclysmFlashLayer: Occluded screen flash polygon (ordered beneath obstacles)
 * - ObstacleLayer: Static walls and pillars (#1e242f fill with #384556 strokes)
 */

import { Graphics } from "pixi.js";
import { Obstacle } from "../../entities/Obstacle";
import { CataclysmFlashController } from "../../entities/boss/CataclysmFlashController";
import { StageCoordinator } from "../StageCoordinator";

export class WorldPixiRenderer {
  private floorGraphics: Graphics;
  private obstacleGraphics: Graphics;
  private flashGraphics: Graphics;
  private portalGraphics: Graphics;

  constructor(coordinator: StageCoordinator) {
    this.floorGraphics = new Graphics();
    this.obstacleGraphics = new Graphics();
    this.flashGraphics = new Graphics();
    this.portalGraphics = new Graphics();

    coordinator.floorGridLayer.addChild(this.floorGraphics);
    coordinator.obstacleLayer.addChild(this.obstacleGraphics);
    coordinator.cataclysmFlashLayer.addChild(this.flashGraphics);
    coordinator.portalLayer.addChild(this.portalGraphics);
  }

  /**
   * Caches static tactical floor grid.
   */
  public renderFloorGrid(width = 960, height = 640, gridSize = 40): void {
    const g = this.floorGraphics;
    g.clear();

    // Background fill
    g.rect(0, 0, width, height).fill({ color: 0x0e1117 });

    // Grid lines
    for (let x = 0; x < width; x += gridSize) {
      g.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      g.moveTo(0, y).lineTo(width, y);
    }
    g.stroke({ width: 1, color: 0x161b22 });
  }

  /**
   * Caches static room obstacles.
   */
  public renderObstacles(obstacles: readonly Obstacle[]): void {
    const g = this.obstacleGraphics;
    g.clear();

    for (const obs of obstacles) {
      g.rect(obs.x, obs.y, obs.width, obs.height)
        .fill({ color: 0x1e242f })
        .stroke({ width: 1.5, color: 0x384556 });
    }
  }

  /**
   * Updates dynamic Cataclysm occluded screen flash.
   */
  public updateCataclysmFlash(
    flashController: CataclysmFlashController,
    obstacles: readonly Obstacle[],
    width = 960,
    height = 640
  ): void {
    flashController.renderPixi(this.flashGraphics, obstacles, width, height);
  }

  public destroy(): void {
    this.floorGraphics.destroy();
    this.obstacleGraphics.destroy();
    this.flashGraphics.destroy();
    this.portalGraphics.destroy();
  }
}
