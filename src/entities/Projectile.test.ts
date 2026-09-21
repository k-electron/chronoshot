import { describe, expect, it } from "vitest";
import { vec2 } from "../math/vector";
import { createObstacle } from "./Obstacle";
import { CombatUnit, createProjectile } from "./Projectile";

describe("Projectile System with Continuous Collision Detection", () => {
  it("registers collision with wall obstacle and prevents tunneling even at high velocity", () => {
    // Projectile at (50, 100), moving right at 800 px/s
    // Wall at x = 70..90, y = 50..150 (thin 20px wall)
    const bullet = createProjectile("bullet-1", vec2(50, 100), 0, 800, "player");
    const wall = createObstacle("wall-1", 70, 50, 20, 100);

    // Large delta time (e.g. 0.1s = 80px travel), which would completely leap over a 20px wall without CCD
    const hit = bullet.update(0.1, [wall], []);

    expect(hit).not.toBeNull();
    expect(hit!.type).toBe("obstacle");
    expect(hit!.point.x).toBeCloseTo(70);
    expect(hit!.point.y).toBeCloseTo(100);
    expect(hit!.normal.x).toBeCloseTo(-1);
    expect(hit!.normal.y).toBeCloseTo(0);

    // Bullet must terminate at the collision surface
    expect(bullet.isAlive).toBe(false);
    expect(bullet.position.x).toBeCloseTo(70);
    expect(bullet.position.y).toBeCloseTo(100);
  });

  it("registers collision with unit hitbox and enforces 1-hit lethality", () => {
    // Target entity positioned at (150, 100) with radius 15
    let unitKilled = false;
    const dummyTarget: CombatUnit = {
      id: "enemy-dummy",
      position: vec2(150, 100),
      radius: 15,
      isAlive: true,
      kill: () => {
        unitKilled = true;
      },
    };

    const bullet = createProjectile("bullet-2", vec2(100, 100), 0, 600, "player");

    // Travel for 1/60s (10px): from x=100 to 110 (doesn't reach unit at x=135 yet)
    const step1 = bullet.update(1 / 60, [], [dummyTarget]);
    expect(step1).toBeNull();
    expect(bullet.isAlive).toBe(true);
    expect(unitKilled).toBe(false);

    // Second step: travel 30px (reaches x=140, entering radius 15 at x=135)
    const step2 = bullet.update(3 / 60, [], [dummyTarget]);
    expect(step2).not.toBeNull();
    expect(step2!.type).toBe("unit");
    expect(step2!.unit?.id).toBe("enemy-dummy");
    expect(unitKilled).toBe(true);
    expect(bullet.isAlive).toBe(false);
    expect(bullet.position.x).toBeCloseTo(135); // Hit point at circle boundary: 150 - 15 = 135
  });

  it("ignores dead targets and travels unobstructed", () => {
    const deadTarget: CombatUnit = {
      id: "dead-unit",
      position: vec2(150, 100),
      radius: 15,
      isAlive: false,
      kill: () => {},
    };

    const bullet = createProjectile("bullet-3", vec2(100, 100), 0, 600, "player");
    const hit = bullet.update(0.1, [], [deadTarget]);

    expect(hit).toBeNull();
    expect(bullet.isAlive).toBe(true);
    expect(bullet.position.x).toBeCloseTo(160);
  });

  it("terminates when exceeding maximum ballistic range", () => {
    const bullet = createProjectile("bullet-4", vec2(0, 0), 0, 1000, "player", 500);

    // Advance 600px
    bullet.update(0.6, [], []);
    expect(bullet.isAlive).toBe(false);
  });
});
