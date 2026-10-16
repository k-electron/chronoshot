/**
 * ChronoShot - PlayerPixiDisplay
 *
 * Manages persistent Pixi v8 display objects for the Operative:
 * - Directional chassis (body circle, cyan visor, gun barrel pointer)
 * - Reactive shield aura rings
 * - ChronoAnchor ground clamps and 360-degree radial sweep arc
 */

import { Container, Graphics } from "pixi.js";
import { Player } from "../../entities/Player";
import { ChronoAnchorRenderer } from "../../ui/ChronoAnchorRenderer";
import { interpolatePosition } from "../RenderInterpolator";

export class PlayerPixiDisplay {
  public readonly container: Container;
  public readonly anchorGraphics: Graphics;
  public readonly shieldGraphics: Graphics;
  public readonly chassisGraphics: Graphics;

  constructor() {
    this.container = new Container();
    this.anchorGraphics = new Graphics();
    this.shieldGraphics = new Graphics();
    this.chassisGraphics = new Graphics();

    // Order: anchor ground clamps -> shield aura -> operative chassis
    this.container.addChild(this.anchorGraphics);
    this.container.addChild(this.shieldGraphics);
    this.container.addChild(this.chassisGraphics);
  }

  /**
   * Updates transforms and graphics for the player chassis with sub-tick interpolation.
   */
  public update(player: Player, alpha: number): void {
    if (!player.isAlive) {
      this.container.visible = false;
      return;
    }
    this.container.visible = true;

    // 1. Interpolated position
    const renderPos = interpolatePosition(player.previousPosition, player.position, alpha);
    this.container.x = renderPos.x;
    this.container.y = renderPos.y;

    // 2. ChronoAnchor ground telemetry during active reload
    this.anchorGraphics.clear();
    if (player.isReloading()) {
      ChronoAnchorRenderer.renderPixi(this.anchorGraphics, {
        position: { x: 0, y: 0 },
        radius: player.radius,
        progress: player.getReloadProgress(),
        isReloading: true,
      });
    }

    // 3. Reactive Shield Ring
    this.shieldGraphics.clear();
    if (player.shields > 0) {
      this.shieldGraphics
        .circle(0, 0, player.radius + 6)
        .stroke({ width: 2, color: 0x00f0ff, alpha: 0.85 });
    }

    // 4. Operative Chassis with aim orientation
    this.chassisGraphics.clear();
    this.chassisGraphics.rotation = player.aimAngle;

    // Body
    this.chassisGraphics
      .circle(0, 0, player.radius)
      .fill({ color: 0x00bcd4 })
      .stroke({ width: 2, color: 0x00f0ff });

    // Visor
    this.chassisGraphics
      .circle(4, 0, 4)
      .fill({ color: 0xffffff });

    // Barrel pointer
    this.chassisGraphics
      .rect(player.radius - 2, -2, 10, 4)
      .fill({ color: 0xe0f7fa });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
