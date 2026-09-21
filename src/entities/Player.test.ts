import { describe, expect, it } from "vitest";
import { vec2 } from "../math/vector";
import { createObstacle } from "./Obstacle";
import { Player } from "./Player";

describe("Player Entity", () => {
  it("integrates WASD velocity up to max speed and decelerates with friction", () => {
    const player = new Player({ x: 100, y: 100, maxSpeed: 200, acceleration: 2000, friction: 1000 });

    expect(player.getSpeed()).toBe(0);

    // Apply movement input to the right (D) for several ticks
    const fixedDt = 1 / 60;
    for (let i = 0; i < 10; i++) {
      player.update(vec2(1, 0), fixedDt);
    }

    // Velocity should be accelerating rightwards
    expect(player.velocity.x).toBeGreaterThan(150);
    expect(player.velocity.y).toBe(0);
    expect(player.position.x).toBeGreaterThan(100);

    // Continue moving until maxSpeed is reached
    for (let i = 0; i < 20; i++) {
      player.update(vec2(1, 0), fixedDt);
    }
    expect(player.velocity.x).toBeCloseTo(200);

    // Release movement input (0, 0): player should decelerate due to friction
    const speedBeforeRelease = player.getSpeed();
    player.update(vec2(0, 0), fixedDt);
    expect(player.getSpeed()).toBeLessThan(speedBeforeRelease);
  });

  it("slides smoothly along walls during diagonal movement instead of sticking", () => {
    // Player positioned at (100, 120), horizontal wall barrier at y = [90, 100], span x = [0, 500]
    // Player radius is 14. Top of player is at y = 106.
    const player = new Player({ x: 100, y: 120, radius: 14, maxSpeed: 200 });
    const wall = createObstacle("top-wall", 0, 80, 500, 20); // y from 80 to 100

    const fixedDt = 1 / 60;

    // Move diagonally up-right (vec2(1, -1)) directly into the wall
    for (let i = 0; i < 30; i++) {
      player.update(vec2(1, -1), fixedDt, [wall]);
    }

    // Player position Y must never penetrate the wall (must stay >= wall bottom (100) + radius (14) = 114)
    expect(player.position.y).toBeGreaterThanOrEqual(114);

    // Player X must continue moving rightwards along the wall surface (smooth sliding!)
    expect(player.position.x).toBeGreaterThan(150);
    expect(player.velocity.x).toBeGreaterThan(0);
    // Y velocity into the wall should be cancelled
    expect(player.velocity.y).toBe(0);
  });

  it("updates continuous mouse crosshair aiming without modifying position or time", () => {
    const player = new Player({ x: 100, y: 100 });
    const originalPos = { ...player.position };

    // Aim directly to the right
    player.setAimTarget(vec2(200, 100));
    expect(player.aimAngle).toBeCloseTo(0);

    // Aim directly downwards
    player.setAimTarget(vec2(100, 200));
    expect(player.aimAngle).toBeCloseTo(Math.PI / 2);

    // Aiming must never alter entity position
    expect(player.position.x).toBe(originalPos.x);
    expect(player.position.y).toBe(originalPos.y);
  });

  it("enforces 1-hit lethality and resets properly", () => {
    const player = new Player({ x: 100, y: 100 });
    player.velocity = vec2(100, 50);

    expect(player.isAlive).toBe(true);
    player.kill();

    expect(player.isAlive).toBe(false);
    expect(player.velocity.x).toBe(0);
    expect(player.velocity.y).toBe(0);

    player.reset(vec2(200, 200));
    expect(player.isAlive).toBe(true);
    expect(player.position.x).toBe(200);
    expect(player.position.y).toBe(200);
  });
});
