/**
 * Geometric Particle Shatter System for ChronoShot.
 *
 * Implements procedural polygonal shard shattering upon unit destruction (1-hit lethality)
 * and dynamic directional impact debris on obstacle hits, matching the minimalist
 * SUPERHOT geometric crystalline aesthetic.
 */

import {
  vec2,
  Vector2D,
} from "../math/vector";

export interface ShardParticle {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  angularVelocity: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
  borderColor: string;
  vertices: Vector2D[];
}

export class ParticleSystem {
  private particles: ShardParticle[] = [];

  /**
   * Spawns an explosion of faceted crystalline polygon shards when an entity is shattered.
   */
  public emitShatter(
    origin: Vector2D,
    count = 14,
    color = "#ff2a44",
    baseSpeed = 220
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = baseSpeed * (0.5 + Math.random() * 0.9);
      const velocity = vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Generate random triangular or quadrilateral shard polygon
      const numVerts = Math.random() > 0.4 ? 3 : 4;
      const shardRadius = 4 + Math.random() * 6;
      const vertices: Vector2D[] = [];

      for (let v = 0; v < numVerts; v++) {
        const vAngle = (v / numVerts) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const vDist = shardRadius * (0.6 + Math.random() * 0.7);
        vertices.push(vec2(Math.cos(vAngle) * vDist, Math.sin(vAngle) * vDist));
      }

      const maxLifetime = 0.8 + Math.random() * 0.6;

      this.particles.push({
        position: { ...origin },
        velocity,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 12,
        lifetime: maxLifetime,
        maxLifetime,
        color,
        borderColor: "#ffffff",
        vertices,
      });
    }
  }

  /**
   * Spawns directional spark/debris particles when a bullet impacts an obstacle.
   */
  public emitImpactSparks(
    origin: Vector2D,
    normal: Vector2D,
    count = 5,
    color = "#ffb700"
  ): void {
    const normalAngle = Math.atan2(normal.y, normal.x);

    for (let i = 0; i < count; i++) {
      // Fan out in reflection hemisphere
      const angle = normalAngle + (Math.random() - 0.5) * 1.4;
      const speed = 120 + Math.random() * 180;
      const velocity = vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);

      const shardRadius = 2 + Math.random() * 3;
      const vertices = [
        vec2(-shardRadius, 0),
        vec2(shardRadius, 0),
        vec2(0, shardRadius * 1.5),
      ];

      const maxLifetime = 0.25 + Math.random() * 0.25;

      this.particles.push({
        position: { ...origin },
        velocity,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 20,
        lifetime: maxLifetime,
        maxLifetime,
        color,
        borderColor: color,
        vertices,
      });
    }
  }

  /**
   * Simulation tick update: moves shards, applies drag, spins polygons, and culls expired particles.
   */
  public update(fixedDeltaTime: number): void {
    const drag = Math.pow(0.15, fixedDeltaTime); // Exponential aerodynamic drag

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.lifetime -= fixedDeltaTime;
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Drag deceleration
      p.velocity.x *= drag;
      p.velocity.y *= drag;

      // Position & rotation integration
      p.position.x += p.velocity.x * fixedDeltaTime;
      p.position.y += p.velocity.y * fixedDeltaTime;
      p.rotation += p.angularVelocity * fixedDeltaTime;
    }
  }

  /**
   * Renders polygonal shards onto canvas with alpha fade-out.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.lifetime / p.maxLifetime));
      ctx.save();
      ctx.translate(p.position.x, p.position.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      for (let i = 0; i < p.vertices.length; i++) {
        const v = p.vertices[i];
        if (i === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = p.borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  public getCount(): number {
    return this.particles.length;
  }

  public clear(): void {
    this.particles = [];
  }
}
