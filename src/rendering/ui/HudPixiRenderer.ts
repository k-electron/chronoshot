/**
 * ChronoShot - HudPixiRenderer
 *
 * Coordinates hairline vector telemetry, precision hardware reticle,
 * and HUD overlays in the unfiltered hudContainer.
 */

import { Graphics } from "pixi.js";
import { Reticle } from "../../ui/Reticle";
import { StageCoordinator } from "../StageCoordinator";
import { Vector2D } from "../../math/vector";

export class HudPixiRenderer {
  public readonly reticleGraphics: Graphics;
  public readonly telemetryGraphics: Graphics;

  constructor(coordinator: StageCoordinator) {
    this.reticleGraphics = new Graphics();
    this.telemetryGraphics = new Graphics();

    coordinator.reticleLayer.addChild(this.reticleGraphics);
    coordinator.telemetryLayer.addChild(this.telemetryGraphics);
  }

  /**
   * Updates precision in-canvas reticle crosshair.
   */
  public updateReticle(
    reticle: Reticle,
    target: Vector2D,
    timeScale: number,
    reloadProgress: number,
    isReloading: boolean
  ): void {
    reticle.renderPixi(
      this.reticleGraphics,
      target,
      timeScale,
      reloadProgress,
      isReloading
    );
  }

  public hideReticle(): void {
    this.reticleGraphics.clear();
  }

  public destroy(): void {
    this.reticleGraphics.destroy();
    this.telemetryGraphics.destroy();
  }
}
