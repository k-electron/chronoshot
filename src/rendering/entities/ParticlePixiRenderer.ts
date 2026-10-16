/**
 * ChronoShot - ParticlePixiRenderer
 *
 * Renders polygonal shatter shards, deflection sparks, and expanding debris
 * in wall-clock time using DisplayObjectPool in ParticleLayer.
 */

import { Container } from "pixi.js";
import { ParticleSystem } from "../../entities/ParticleSystem";
import { DisplayObjectPool } from "../DisplayObjectPool";

function parseColorToHex(color: string): number {
  if (color.startsWith("#")) {
    return parseInt(color.slice(1), 16);
  }
  return 0x00f0ff;
}

export class ParticlePixiRenderer {
  public readonly pool: DisplayObjectPool;

  constructor(particleLayer: Container) {
    this.pool = new DisplayObjectPool(particleLayer, 128);
  }

  /**
   * Updates and renders all active particles with wall-clock alpha fade-out.
   */
  public update(particleSystem: ParticleSystem): void {
    this.pool.releaseAll();
    const particles = particleSystem.getParticles();

    for (const p of particles) {
      const alpha = Math.max(0, Math.min(1, p.lifetime / p.maxLifetime));
      if (alpha <= 0.001) continue;

      const g = this.pool.acquire();
      g.x = p.position.x;
      g.y = p.position.y;
      g.rotation = p.rotation;
      g.alpha = alpha;

      const flatPoints: number[] = [];
      for (const v of p.vertices) {
        flatPoints.push(v.x, v.y);
      }

      const fillColor = parseColorToHex(p.color);
      const strokeColor = parseColorToHex(p.borderColor);

      g.poly(flatPoints)
        .fill({ color: fillColor })
        .stroke({ width: 1, color: strokeColor });
    }
  }

  public destroy(): void {
    this.pool.destroy();
  }
}
