import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import { ParticleSystem } from "./ParticleSystem";

describe("Geometric Particle Shatter System", () => {
  it("spawns faceted polygon shards upon entity shatter", () => {
    const ps = new ParticleSystem();

    expect(ps.getCount()).toBe(0);
    ps.emitShatter(vec2(100, 100), 16, "#ff2a44");

    expect(ps.getCount()).toBe(16);
  });

  it("spawns impact sparks oriented away from obstacle normal", () => {
    const ps = new ParticleSystem();
    const normal = vec2(-1, 0); // Wall facing left, sparks bounce left

    ps.emitImpactSparks(vec2(100, 100), normal, 6);
    expect(ps.getCount()).toBe(6);
  });

  it("updates particles, applies drag, and culls expired shards over time", () => {
    const ps = new ParticleSystem();
    ps.emitShatter(vec2(100, 100), 10, "#00f0ff");

    // Advance 0.5 seconds
    ps.update(0.5);
    expect(ps.getCount()).toBe(10); // Shards still alive

    // Advance additional 2 seconds (well beyond maxLifetime of ~1.4s)
    ps.update(2.0);
    expect(ps.getCount()).toBe(0); // All expired shards culled
  });

  it("clears all active particles", () => {
    const ps = new ParticleSystem();
    ps.emitShatter(vec2(50, 50), 12);
    expect(ps.getCount()).toBe(12);

    ps.clear();
    expect(ps.getCount()).toBe(0);
  });

  it("spawns electric cyan spark particles on shield deflection along normal", () => {
    const ps = new ParticleSystem();
    const normal = vec2(1, 0); // Deflecting toward right

    ps.emitShieldSparks(vec2(200, 150), normal, 8);
    expect(ps.getCount()).toBe(8);

    const particles = ps.getParticles();
    expect(particles.length).toBe(8);

    for (const p of particles) {
      expect(p.position.x).toBe(200);
      expect(p.position.y).toBe(150);
      expect(["#00f0ff", "#80d8ff"]).toContain(p.color);
      expect(p.borderColor).toBe("#ffffff");
      // Sparks bounce along positive normal direction (x > 0)
      expect(p.velocity.x).toBeGreaterThan(0);
    }
  });

  it("spawns circular radiant energy shards on shield break", () => {
    const ps = new ParticleSystem();
    ps.emitShieldBreak(vec2(300, 300), 16);

    expect(ps.getCount()).toBe(16);
    const particles = ps.getParticles();

    for (const p of particles) {
      expect(p.position.x).toBe(300);
      expect(p.position.y).toBe(300);
      expect(["#00f0ff", "#80d8ff"]).toContain(p.color);
      expect(p.vertices.length).toBeGreaterThanOrEqual(3);
      expect(p.vertices.length).toBeLessThanOrEqual(4);
    }
  });

  it("updates and culls shield particles across simulation frames", () => {
    const ps = new ParticleSystem();
    ps.emitShieldSparks(vec2(100, 100), vec2(0, -1), 8);
    ps.emitShieldBreak(vec2(200, 200), 16);

    expect(ps.getCount()).toBe(24);

    // After 0.05s, particles have moved and are still active
    ps.update(0.05);
    expect(ps.getCount()).toBe(24);

    // After 1.0s, all short-lived shield sparks and break shards have expired
    ps.update(1.0);
    expect(ps.getCount()).toBe(0);
  });

  it("renders shield particles with canvas 2D context", () => {
    const ps = new ParticleSystem();
    ps.emitShieldSparks(vec2(100, 100), vec2(1, 0), 4);

    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      globalAlpha: 1,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;

    ps.render(mockCtx);

    expect(mockCtx.save).toHaveBeenCalledTimes(4);
    expect(mockCtx.restore).toHaveBeenCalledTimes(4);
    expect(mockCtx.fill).toHaveBeenCalledTimes(4);
    expect(mockCtx.stroke).toHaveBeenCalledTimes(4);
  });
});
