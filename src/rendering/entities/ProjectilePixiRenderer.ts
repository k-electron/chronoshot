/**
 * ChronoShot - ProjectilePixiRenderer
 *
 * Renders high-velocity luminous projectile tracer trails and bullet cores
 * using DisplayObjectPool in ProjectileLayer.
 */

import { Container } from "pixi.js";
import { Projectile } from "../../entities/Projectile";
import { DisplayObjectPool } from "../DisplayObjectPool";
import { interpolatePosition } from "../RenderInterpolator";

export class ProjectilePixiRenderer {
  public readonly pool: DisplayObjectPool;

  constructor(projectileLayer: Container) {
    this.pool = new DisplayObjectPool(projectileLayer, 64);
  }

  /**
   * Updates and renders all active projectiles into pooled Graphics instances.
   */
  public update(projectiles: readonly Projectile[], alpha: number): void {
    this.pool.releaseAll();

    for (const bullet of projectiles) {
      const g = this.pool.acquire();
      const isPlayerBullet = bullet.owner === "player";
      const strokeColor = isPlayerBullet ? 0x00f0ff : 0xff3344;

      const head = interpolatePosition(bullet.previousPosition, bullet.position, alpha);

      // 1. Tracer streak from previous tick to interpolated head
      g.moveTo(bullet.previousPosition.x, bullet.previousPosition.y)
        .lineTo(head.x, head.y)
        .stroke({ width: 2, color: strokeColor });

      // 2. White luminous bullet core
      g.circle(head.x, head.y, bullet.radius)
        .fill({ color: 0xffffff });
    }
  }

  public destroy(): void {
    this.pool.destroy();
  }
}
