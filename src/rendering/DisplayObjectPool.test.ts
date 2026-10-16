import { describe, expect, it } from "vitest";
import { Container } from "pixi.js";
import { DisplayObjectPool } from "./DisplayObjectPool";
import { ProjectilePixiRenderer } from "./entities/ProjectilePixiRenderer";
import { ParticlePixiRenderer } from "./entities/ParticlePixiRenderer";
import { createProjectile } from "../entities/Projectile";
import { ParticleSystem } from "../entities/ParticleSystem";
import { vec2 } from "../math/vector";

describe("DisplayObjectPool & Projectile/Particle Renderers", () => {
  it("recycles graphics instances without expanding pool unnecessarily", () => {
    const container = new Container();
    const pool = new DisplayObjectPool(container, 4);

    expect(pool.getPoolSize()).toBe(4);
    expect(pool.getActiveCount()).toBe(0);

    const g1 = pool.acquire();
    pool.acquire();
    expect(pool.getActiveCount()).toBe(2);

    pool.release(g1);
    expect(pool.getActiveCount()).toBe(1);

    const reused = pool.acquire();
    expect(reused).toBe(g1);
    expect(pool.getActiveCount()).toBe(2);
    expect(pool.getPoolSize()).toBe(4); // Reused g1!

    pool.releaseAll();
    expect(pool.getActiveCount()).toBe(0);

    pool.destroy();
  });

  it("renders projectiles using pooled Graphics", () => {
    const container = new Container();
    const renderer = new ProjectilePixiRenderer(container);

    const bullet = createProjectile(
      "bullet-1",
      vec2(100, 100),
      0,
      500,
      "player"
    );
    bullet.previousPosition = vec2(90, 100);

    renderer.update([bullet], 0.5);
    expect(renderer.pool.getActiveCount()).toBe(1);

    renderer.update([], 1);
    expect(renderer.pool.getActiveCount()).toBe(0);

    renderer.destroy();
  });

  it("renders particles using pooled Graphics", () => {
    const container = new Container();
    const renderer = new ParticlePixiRenderer(container);
    const particleSystem = new ParticleSystem();

    particleSystem.emitShatter(vec2(100, 100), 10, "#00f0ff", 220);
    expect(particleSystem.getCount()).toBeGreaterThan(0);

    renderer.update(particleSystem);
    expect(renderer.pool.getActiveCount()).toBe(particleSystem.getCount());

    particleSystem.clear();
    renderer.update(particleSystem);
    expect(renderer.pool.getActiveCount()).toBe(0);

    renderer.destroy();
  });
});
