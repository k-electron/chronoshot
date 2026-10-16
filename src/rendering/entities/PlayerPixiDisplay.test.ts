import { describe, expect, it } from "vitest";
import { PlayerPixiDisplay } from "./PlayerPixiDisplay";
import { Player } from "../../entities/Player";
import { vec2 } from "../../math/vector";

describe("PlayerPixiDisplay", () => {
  it("interpolates player position and updates display transforms", () => {
    const display = new PlayerPixiDisplay();
    const player = new Player(vec2(100, 100));
    player.previousPosition = vec2(50, 50);

    // Alpha = 0.5 -> pos should be (75, 75)
    display.update(player, 0.5);

    expect(display.container.x).toBe(75);
    expect(display.container.y).toBe(75);
    expect(display.container.visible).toBe(true);

    display.destroy();
  });

  it("hides container when player is eliminated", () => {
    const display = new PlayerPixiDisplay();
    const player = new Player(vec2(100, 100));
    player.isAlive = false;

    display.update(player, 1);
    expect(display.container.visible).toBe(false);

    display.destroy();
  });
});
