import { describe, expect, it } from "vitest";
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
});
