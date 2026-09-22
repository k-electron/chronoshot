import { describe, expect, it } from "vitest";
import { GridPathfinder } from "../engine/GridPathfinder";
import { vec2 } from "../math/vector";
import { Enemy } from "./Enemy";
import { createObstacle, createPillar } from "./Obstacle";
import { Player } from "./Player";

describe("Enemy Tactical AI & Archetypes", () => {
  it("detects unobstructed line-of-sight to player", () => {
    const enemy = new Enemy({ id: "grunt-1", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });

    const canSee = enemy.checkLineOfSight(player.position, []);
    expect(canSee).toBe(true);
    expect(enemy.hasLineOfSight).toBe(true);
  });

  it("blocks line-of-sight when an obstacle or pillar is intervening", () => {
    const enemy = new Enemy({ id: "grunt-2", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });
    const pillar = createPillar("pillar-1", 250, 100, 40);

    const canSee = enemy.checkLineOfSight(player.position, [pillar]);
    expect(canSee).toBe(false);
    expect(enemy.hasLineOfSight).toBe(false);
  });

  it("Pistol Grunt skirmishes at 120 px/s with 6-tick stutter on fire", () => {
    const enemy = new Enemy({
      id: "grunt-skirmish",
      type: "grunt",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });
    const player = new Player({ x: 100, y: 100 });

    expect(enemy.speed).toBe(120);
    expect(enemy.maxShields).toBe(0);
    expect(enemy.stutterTicks).toBe(6);

    // Tick 1: fires bullet and triggers stutter (6 - 1 = 5 ticks remaining)
    const bullets = enemy.update(player, [], 1);
    expect(bullets).toHaveLength(1);
    expect(enemy.stutterTimerTicks).toBe(5);
    expect(enemy.velocity.x).toBe(0);
    expect(enemy.velocity.y).toBe(0);
  });

  it("Shotgun Guard advances at 90 px/s with 1 shield and 5-pellet spread", () => {
    const guard = new Enemy({
      id: "guard-1",
      type: "shotgun",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });

    expect(guard.speed).toBe(90);
    expect(guard.shields).toBe(1);
    expect(guard.maxShields).toBe(1);
    expect(guard.pellets).toBe(5);

    // Hit 1: shield absorbs
    const hit1 = guard.takeDamage(1);
    expect(hit1.absorbed).toBe(true);
    expect(hit1.eliminated).toBe(false);
    expect(guard.shields).toBe(0);
    expect(guard.isAlive).toBe(true);

    // Hit 2: lethal elimination
    const hit2 = guard.takeDamage(1);
    expect(hit2.absorbed).toBe(false);
    expect(hit2.eliminated).toBe(true);
    expect(guard.isAlive).toBe(false);
  });

  it("Stalker sprints at 210 px/s with run-and-gun continuous velocity", () => {
    const stalker = new Enemy({
      id: "stalker-1",
      type: "stalker",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });
    const player = new Player({ x: 100, y: 100 });

    expect(stalker.speed).toBe(210);
    expect(stalker.runAndGun).toBe(true);
    expect(stalker.maxShields).toBe(0);

    const bullets = stalker.update(player, [], 1);
    expect(bullets).toHaveLength(1);
    // Velocity must remain active even when discharging
    expect(stalker.velocity.x).toBeLessThan(0); // moving left toward player
    expect(stalker.stutterTimerTicks).toBe(0);
  });

  it("Aegis Warden marches at 60 px/s with 2-hit shield durability", () => {
    const warden = new Enemy({
      id: "warden-1",
      type: "warden",
      x: 400,
      y: 100,
    });

    expect(warden.speed).toBe(60);
    expect(warden.maxShields).toBe(2);
    expect(warden.shields).toBe(2);

    // 1st hit: absorbed, 1 shield remains
    const dmg1 = warden.takeDamage(1);
    expect(dmg1.absorbed).toBe(true);
    expect(dmg1.remainingShields).toBe(1);
    expect(warden.isAlive).toBe(true);

    // 2nd hit: absorbed, 0 shields remain
    const dmg2 = warden.takeDamage(1);
    expect(dmg2.absorbed).toBe(true);
    expect(dmg2.remainingShields).toBe(0);
    expect(warden.isAlive).toBe(true);

    // 3rd hit: lethal elimination
    const dmg3 = warden.takeDamage(1);
    expect(dmg3.absorbed).toBe(false);
    expect(dmg3.eliminated).toBe(true);
    expect(warden.isAlive).toBe(false);
  });

  it("Marksman charges laser telegraph for 30 ticks and halts movement while charging", () => {
    const marksman = new Enemy({
      id: "sniper-1",
      type: "marksman",
      x: 450,
      y: 100,
      fireCadenceTicks: 100,
      initialDelayTicks: 30, // exactly at laser charge threshold
    });
    const player = new Player({ x: 100, y: 100 });

    expect(marksman.laserChargeTicks).toBe(30);

    // Update tick: should enter charging laser state and halt
    const bullets1 = marksman.update(player, [], 1);
    expect(bullets1).toHaveLength(0);
    expect(marksman.isChargingLaser).toBe(true);
    expect(marksman.velocity.x).toBe(0);
    expect(marksman.velocity.y).toBe(0);

    // Advance remaining 29 ticks
    const bullets2 = marksman.update(player, [], 29);
    expect(bullets2).toHaveLength(1);
    const speed = Math.sqrt(bullets2[0].velocity.x ** 2 + bullets2[0].velocity.y ** 2);
    expect(speed).toBeCloseTo(850);
    expect(marksman.isChargingLaser).toBe(false);
  });

  it("resolves obstacle collision sliding without penetrating walls", () => {
    const enemy = new Enemy({
      id: "slider",
      type: "grunt",
      x: 90,
      y: 100,
      radius: 15,
    });
    // Wall at x: 100..120, y: 50..150
    const wall = createObstacle("wall-slide", 100, 50, 20, 100);

    // Force velocity into wall (rightward) and along wall (downward)
    enemy.velocity = vec2(100, 80);
    enemy.position.x = 95; // Penetrating (95 + 15 = 110 > 100)

    enemy.resolveObstacleCollisions([wall]);

    // Position must be pushed out to at most 100 - 15 = 85
    expect(enemy.position.x).toBeCloseTo(85);
    // Rightward velocity cancelled, downward preserved
    expect(enemy.velocity.x).toBe(0);
    expect(enemy.velocity.y).toBe(80);
  });

  it("navigates around cover using A* pathfinding when line-of-sight is obstructed", () => {
    const enemy = new Enemy({
      id: "pather",
      type: "grunt",
      x: 400,
      y: 200,
    });
    const player = new Player({ x: 100, y: 200 });
    const wall = createObstacle("wall-blocking", 250, 100, 40, 200);

    const pathfinder = new GridPathfinder(960, 640, 40);
    pathfinder.updateObstacles([wall], enemy.radius);

    // Initial update: blocked LOS triggers A* path finding
    enemy.update(player, [wall], 1, 1 / 60, pathfinder);

    expect(enemy.hasLineOfSight).toBe(false);
    expect(enemy.currentPath.length).toBeGreaterThan(0);
    // Velocity must steer around the obstacle (has vertical component)
    expect(Math.abs(enemy.velocity.x) + Math.abs(enemy.velocity.y)).toBeGreaterThan(0);
  });
});
