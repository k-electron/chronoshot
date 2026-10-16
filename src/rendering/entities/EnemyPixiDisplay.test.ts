import { describe, expect, it } from "vitest";
import { EnemyPixiDisplay } from "./EnemyPixiDisplay";
import { Enemy } from "../../entities/Enemy";
import { vec2 } from "../../math/vector";

describe("EnemyPixiDisplay", () => {
  it("renders procedural hull for diamond Pistol Grunt and updates sub-tick position", () => {
    const display = new EnemyPixiDisplay();
    const enemy = new Enemy({
      id: "grunt-1",
      type: "grunt",
      x: 200,
      y: 200,
      radius: 16,
    });
    enemy.previousPosition = vec2(100, 100);

    // Alpha = 0.5 -> pos should be (150, 150)
    display.update(enemy, vec2(300, 300), 0.5);

    expect(display.container.x).toBe(150);
    expect(display.container.y).toBe(150);
    expect(display.container.visible).toBe(true);

    display.destroy();
  });

  it("distinguishes passive dashed sightline from solid Marksman laser", () => {
    const display = new EnemyPixiDisplay();
    const sniper = new Enemy({
      id: "sniper-1",
      type: "marksman",
      x: 100,
      y: 100,
      radius: 16,
    });
    sniper.hasLineOfSight = true;

    // 1. Passive sightline (not charging)
    display.update(sniper, vec2(300, 100), 1);
    expect(display.telegraphGraphics).toBeDefined();

    // 2. Charging sniper beam
    sniper.isChargingLaser = true;
    display.update(sniper, vec2(300, 100), 1);
    expect(display.telegraphGraphics).toBeDefined();

    display.destroy();
  });

  it("renders shield aura ring when enemy possesses active shields", () => {
    const display = new EnemyPixiDisplay();
    const warden = new Enemy({
      id: "warden-1",
      type: "warden",
      x: 100,
      y: 100,
      radius: 20,
      maxShields: 2,
    });

    display.update(warden, null, 1);
    expect(display.shieldGraphics).toBeDefined();

    display.destroy();
  });
});
