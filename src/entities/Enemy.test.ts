import { describe, expect, it } from "vitest";
import { Enemy } from "./Enemy";
import { createObstacle, createPillar } from "./Obstacle";
import { Player } from "./Player";

describe("Enemy Tactical AI", () => {
  it("detects unobstructed line-of-sight to player", () => {
    const enemy = new Enemy({ id: "grunt-1", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });

    // Open line of sight with no obstacles
    const canSee = enemy.checkLineOfSight(player.position, []);
    expect(canSee).toBe(true);
    expect(enemy.hasLineOfSight).toBe(true);
  });

  it("blocks line-of-sight when an obstacle or pillar is intervening", () => {
    const enemy = new Enemy({ id: "grunt-2", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });

    // Place a 40x40 cover pillar at (250, 100) directly between them
    const pillar = createPillar("pillar-1", 250, 100, 40);

    const canSee = enemy.checkLineOfSight(player.position, [pillar]);
    expect(canSee).toBe(false);
    expect(enemy.hasLineOfSight).toBe(false);
  });

  it("does not block line-of-sight when obstacle is off to the side", () => {
    const enemy = new Enemy({ id: "grunt-3", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });

    // Pillar at y = 300 (far below the sightline)
    const pillar = createPillar("pillar-offside", 250, 300, 40);

    const canSee = enemy.checkLineOfSight(player.position, [pillar]);
    expect(canSee).toBe(true);
  });

  it("Pistol Grunt discharges single projectile when cooldown expires and LOS is clear", () => {
    const enemy = new Enemy({
      id: "grunt-4",
      type: "grunt",
      x: 300,
      y: 100,
      fireCadenceTicks: 40,
      initialDelayTicks: 5,
    });
    const player = new Player({ x: 100, y: 100 });

    // Advance 4 ticks (cooldown remaining is 1)
    const bullets1 = enemy.update(player, [], 4);
    expect(bullets1).toHaveLength(0);
    expect(enemy.fireCooldownTicks).toBe(1);

    // Advance 1 more tick -> triggers discharge
    const bullets2 = enemy.update(player, [], 1);
    expect(bullets2).toHaveLength(1);
    expect(bullets2[0].owner).toBe("enemy");
    expect(enemy.fireCooldownTicks).toBe(40); // Reset to cadence
  });

  it("Shotgun Guard discharges 5-pellet spread fan when cooldown expires", () => {
    const enemy = new Enemy({
      id: "guard-1",
      type: "shotgun",
      x: 300,
      y: 100,
      fireCadenceTicks: 60,
      initialDelayTicks: 1,
    });
    const player = new Player({ x: 100, y: 100 });

    const pellets = enemy.update(player, [], 1);
    expect(pellets).toHaveLength(5);
    expect(pellets.every((p) => p.owner === "enemy")).toBe(true);
  });

  it("suspends weapon discharge when line-of-sight is obstructed", () => {
    const enemy = new Enemy({
      id: "grunt-blocked",
      type: "grunt",
      x: 300,
      y: 100,
      initialDelayTicks: 0,
    });
    const player = new Player({ x: 100, y: 100 });
    const wall = createObstacle("wall-blocking", 200, 50, 20, 100);

    const bullets = enemy.update(player, [wall], 10);
    expect(bullets).toHaveLength(0);
    expect(enemy.hasLineOfSight).toBe(false);
  });
});
