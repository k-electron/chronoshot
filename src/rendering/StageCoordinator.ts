/**
 * ChronoShot - StageCoordinator
 *
 * Implements the 12-layer scene graph architecture:
 * - rootStage
 *   - worldContainer (subject to post-processing filters: bloom, chromatic aberration, shockwave)
 *     1. floorGridLayer
 *     2. portalLayer
 *     3. cataclysmFlashLayer (positioned beneath obstacles and units to preserve cover silhouettes)
 *     4. obstacleLayer
 *     5. projectileLayer
 *     6. telegraphLayer
 *     7. entityLayer
 *     8. particleLayer
 *   - hudContainer (unfiltered for hairline vector precision & legible typography)
 *     9. telemetryLayer
 *     10. reticleLayer
 *     11. portalTransitionLayer
 *     12. modalOverlayLayer
 */

import { Container } from "pixi.js";

export class StageCoordinator {
  public readonly rootStage: Container;

  // World Layer (filtered)
  public readonly worldContainer: Container;
  public readonly floorGridLayer: Container;
  public readonly portalLayer: Container;
  public readonly cataclysmFlashLayer: Container;
  public readonly obstacleLayer: Container;
  public readonly projectileLayer: Container;
  public readonly telegraphLayer: Container;
  public readonly entityLayer: Container;
  public readonly particleLayer: Container;

  // HUD Layer (unfiltered)
  public readonly hudContainer: Container;
  public readonly telemetryLayer: Container;
  public readonly reticleLayer: Container;
  public readonly portalTransitionLayer: Container;
  public readonly modalOverlayLayer: Container;

  constructor(customStage?: Container) {
    this.rootStage = customStage || new Container();

    // 1. Initialize World Container & child layers
    this.worldContainer = new Container();
    this.floorGridLayer = new Container();
    this.portalLayer = new Container();
    this.cataclysmFlashLayer = new Container();
    this.obstacleLayer = new Container();
    this.projectileLayer = new Container();
    this.telegraphLayer = new Container();
    this.entityLayer = new Container();
    this.particleLayer = new Container();

    this.worldContainer.addChild(this.floorGridLayer);
    this.worldContainer.addChild(this.portalLayer);
    this.worldContainer.addChild(this.cataclysmFlashLayer);
    this.worldContainer.addChild(this.obstacleLayer);
    this.worldContainer.addChild(this.projectileLayer);
    this.worldContainer.addChild(this.telegraphLayer);
    this.worldContainer.addChild(this.entityLayer);
    this.worldContainer.addChild(this.particleLayer);

    // 2. Initialize HUD Container & child layers
    this.hudContainer = new Container();
    this.telemetryLayer = new Container();
    this.reticleLayer = new Container();
    this.portalTransitionLayer = new Container();
    this.modalOverlayLayer = new Container();

    this.hudContainer.addChild(this.telemetryLayer);
    this.hudContainer.addChild(this.reticleLayer);
    this.hudContainer.addChild(this.portalTransitionLayer);
    this.hudContainer.addChild(this.modalOverlayLayer);

    // 3. Attach top-level containers to root stage
    this.rootStage.addChild(this.worldContainer);
    this.rootStage.addChild(this.hudContainer);
  }

  /**
   * Cleans up all layer contents when switching rooms or resetting expedition.
   */
  public resetTransientLayers(): void {
    this.projectileLayer.removeChildren();
    this.particleLayer.removeChildren();
    this.telegraphLayer.removeChildren();
    this.cataclysmFlashLayer.removeChildren();
  }

  /**
   * Complete stage teardown.
   */
  public destroy(): void {
    this.rootStage.destroy({ children: true });
  }
}
