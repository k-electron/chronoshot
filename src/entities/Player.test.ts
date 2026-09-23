import { describe, expect, it } from "vitest";
import { TimeGovernor } from "../engine/TimeGovernor";
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

  it("enforces 1-hit lethality via takeDamage returning damage result", () => {
    const player = new Player({ x: 100, y: 100 });
    player.velocity = vec2(100, 50);

    const result = player.takeDamage(1);
    expect(result).toEqual({
      absorbed: false,
      eliminated: true,
      remainingShields: 0,
    });
    expect(player.isAlive).toBe(false);
    expect(player.velocity.x).toBe(0);
    expect(player.velocity.y).toBe(0);
  });

  it("supports extended cylinder augmentation with 8-round capacity and reload", () => {
    const player = new Player({ x: 100, y: 100 });
    expect(player.weapon.getMagSize()).toBe(6);

    player.setAugmentation("extendedCylinder", true);
    expect(player.getAugmentations().extendedCylinder).toBe(true);
    expect(player.weapon.getMagSize()).toBe(8);
    expect(player.weapon.getAmmo()).toBe(8);

    // Fire all 8 rounds
    for (let i = 0; i < 8; i++) {
      const bullets = player.fire();
      expect(bullets).toHaveLength(1);
      player.weapon.update(10);
    }
    expect(player.weapon.getAmmo()).toBe(0);

    // 9th pull dry fires
    const dryBullets = player.fire();
    expect(dryBullets).toHaveLength(0);

    // Reload back to 8
    const reloaded = player.reload();
    expect(reloaded).toBe(true);
    expect(player.weapon.getAmmo()).toBe(8);

    // Disabling extended cylinder restores 6 rounds
    player.setAugmentation("extendedCylinder", false);
    expect(player.weapon.getMagSize()).toBe(6);
    expect(player.weapon.getAmmo()).toBe(6);
  });

  it("supports speed loader augmentation queuing 15 reload ticks instead of 30", () => {
    const governor = new TimeGovernor();
    const player = new Player({ x: 100, y: 100 });

    // Standard reload queues 30 ticks
    player.fire();
    player.reload(governor);
    expect(governor.getQueuedTicks()).toBe(30);

    governor.advance(0);
    player.weapon.update(10);
    player.setAugmentation("speedLoader", true);
    expect(player.getAugmentations().speedLoader).toBe(true);

    // Reload with speedLoader queues 15 ticks
    player.fire();
    player.reload(governor);
    expect(governor.getQueuedTicks()).toBe(15);

    // Disabling restores 30 ticks
    governor.advance(0);
    player.weapon.update(10);
    player.setAugmentation("speedLoader", false);
    player.fire();
    player.reload(governor);
    expect(governor.getQueuedTicks()).toBe(30);
  });

  it("supports reactive shield augmentation absorbing 1 hit before lethal elimination", () => {
    const player = new Player({ x: 100, y: 100 });
    expect(player.shields).toBe(0);
    expect(player.maxShields).toBe(0);

    player.setAugmentation("reactiveShield", true);
    expect(player.shields).toBe(1);
    expect(player.maxShields).toBe(1);

    // First impact is absorbed by shield
    const hit1 = player.takeDamage(1);
    expect(hit1).toEqual({
      absorbed: true,
      eliminated: false,
      remainingShields: 0,
    });
    expect(player.isAlive).toBe(true);
    expect(player.shields).toBe(0);

    // Second impact is fatal
    const hit2 = player.takeDamage(1);
    expect(hit2).toEqual({
      absorbed: false,
      eliminated: true,
      remainingShields: 0,
    });
    expect(player.isAlive).toBe(false);
  });

  it("restores reactive shield and weapon on reset() when augmentation is active", () => {
    const player = new Player({ x: 100, y: 100 });
    player.setAugmentation("reactiveShield", true);
    player.setAugmentation("extendedCylinder", true);

    // Fire 3 shots and eliminate player
    player.fire();
    player.weapon.update(10);
    player.fire();
    player.weapon.update(10);
    player.fire();
    expect(player.weapon.getAmmo()).toBe(5);

    player.takeDamage(1); // Shield broken
    player.takeDamage(1); // Eliminated
    expect(player.isAlive).toBe(false);
    expect(player.shields).toBe(0);

    // Reset room
    player.reset(vec2(250, 250));
    expect(player.isAlive).toBe(true);
    expect(player.position.x).toBe(250);
    expect(player.position.y).toBe(250);
    expect(player.shields).toBe(1);
    expect(player.weapon.getAmmo()).toBe(8);
  });

  it("clears all augmentations, restoring default weapon and zero shields on clearAugmentations()", () => {
    const player = new Player({ x: 100, y: 100 });
    player.setAugmentation("extendedCylinder", true);
    player.setAugmentation("speedLoader", true);
    player.setAugmentation("reactiveShield", true);

    expect(player.weapon.getMagSize()).toBe(8);
    expect(player.shields).toBe(1);
    expect(player.maxShields).toBe(1);

    player.clearAugmentations();
    expect(player.getAugmentations()).toEqual({});
    expect(player.shields).toBe(0);
    expect(player.maxShields).toBe(0);
    expect(player.weapon.getMagSize()).toBe(6);
    expect(player.weapon.getReloadTickBurst()).toBe(30);
  });

  describe("UpgradePipeline Integration", () => {
    it("boosts maxSpeed when acquiring kineticStride upgrade", () => {
      const player = new Player({ x: 100, y: 100, maxSpeed: 240 });
      expect(player.maxSpeed).toBe(240);

      const acquired = player.acquireUpgrade("kinetic-stride");
      expect(acquired).toBe(true);
      expect(player.maxSpeed).toBe(300); // 240 * 1.25
      expect(player.upgradePipeline.has("kinetic-stride")).toBe(true);
    });

    it("scales projectile velocity when acquiring chronoBurst upgrade", () => {
      const player = new Player({ x: 100, y: 100 });
      const baseBullets = player.fire();
      expect(baseBullets).toHaveLength(1);
      const baseSpeed = Math.hypot(baseBullets[0].velocity.x, baseBullets[0].velocity.y);
      expect(baseSpeed).toBeCloseTo(800);

      player.acquireUpgrade("chrono-burst");
      player.weapon.update(10);
      const boostedBullets = player.fire();
      expect(boostedBullets).toHaveLength(1);
      const boostedSpeed = Math.hypot(boostedBullets[0].velocity.x, boostedBullets[0].velocity.y);
      expect(boostedSpeed).toBeCloseTo(1040); // 800 * 1.30
    });

    it("grants 2 shield charges with phaseDeflector upgrade", () => {
      const player = new Player({ x: 100, y: 100 });
      expect(player.shields).toBe(0);

      player.acquireUpgrade("phase-deflector");
      expect(player.shields).toBe(2);
      expect(player.maxShields).toBe(2);

      // Can absorb 2 hits
      expect(player.takeDamage(1).eliminated).toBe(false);
      expect(player.shields).toBe(1);
      expect(player.takeDamage(1).eliminated).toBe(false);
      expect(player.shields).toBe(0);
      expect(player.takeDamage(1).eliminated).toBe(true);
    });

    it("compounds multiple tactical upgrades simultaneously", () => {
      const player = new Player({ x: 100, y: 100 });
      player.acquireUpgrade("extended-cylinder");
      player.acquireUpgrade("speed-loader");
      player.acquireUpgrade("reactive-shield");
      player.acquireUpgrade("kinetic-stride");

      expect(player.weapon.getMagSize()).toBe(8);
      expect(player.weapon.getReloadTickBurst()).toBe(15);
      expect(player.shields).toBe(1);
      expect(player.maxSpeed).toBe(300);
      expect(player.augmentations.extendedCylinder).toBe(true);
      expect(player.augmentations.speedLoader).toBe(true);
      expect(player.augmentations.reactiveShield).toBe(true);
    });

    it("enforces maxStacks when attempting duplicate acquisitions", () => {
      const player = new Player({ x: 100, y: 100 });
      expect(player.acquireUpgrade("reactive-shield")).toBe(true);
      expect(player.acquireUpgrade("reactive-shield")).toBe(false);
    });

    it("refreshes shields on room reset with active shield upgrades", () => {
      const player = new Player({ x: 100, y: 100 });
      player.acquireUpgrade("phase-deflector");
      expect(player.shields).toBe(2);

      player.takeDamage(2);
      expect(player.shields).toBe(0);

      player.reset();
      expect(player.shields).toBe(2);
      expect(player.maxShields).toBe(2);
      expect(player.isAlive).toBe(true);
    });

    describe("Overcharge Dash", () => {
      it("activates overcharge dash, queues action burst, and initiates cooldown", () => {
        const governor = new TimeGovernor();
        const player = new Player({ x: 100, y: 100 });
        expect(player.hasOverchargeDash()).toBe(false);
        expect(player.isDashReady()).toBe(false);

        // Cannot dash without upgrade
        expect(player.triggerDash(governor)).toBe(false);

        player.acquireUpgrade("overcharge-dash");
        expect(player.hasOverchargeDash()).toBe(true);
        expect(player.isDashReady()).toBe(true);

        // Aiming right (angle 0)
        player.aimAngle = 0;
        const dashed = player.triggerDash(governor);
        expect(dashed).toBe(true);
        expect(governor.getQueuedTicks()).toBe(12);
        expect(player.velocity.x).toBeCloseTo(480);
        expect(player.velocity.y).toBeCloseTo(0);
        expect(player.dashActiveTicks).toBe(12);
        expect(player.dashCooldownTicks).toBe(90);

        // Cannot re-dash while on cooldown
        expect(player.isDashReady()).toBe(false);
        expect(player.triggerDash(governor)).toBe(false);
      });

      it("deflects projectiles during active dash frames without consuming shields", () => {
        const player = new Player({ x: 100, y: 100 });
        player.acquireUpgrade("overcharge-dash");
        player.acquireUpgrade("reactive-shield");
        expect(player.shields).toBe(1);

        player.triggerDash();
        expect(player.dashActiveTicks).toBe(12);

        // Incoming damage during dash
        const hit = player.takeDamage(1);
        expect(hit.absorbed).toBe(true);
        expect(hit.eliminated).toBe(false);
        // Shields were not consumed!
        expect(player.shields).toBe(1);
        expect(player.isAlive).toBe(true);
      });

      it("counts down cooldown in update loop and resets on room reset", () => {
        const player = new Player({ x: 100, y: 100 });
        player.acquireUpgrade("overcharge-dash");
        player.triggerDash();
        expect(player.dashCooldownTicks).toBe(90);

        // 10 ticks elapse
        for (let i = 0; i < 10; i++) {
          player.update(vec2(0, 0), 1 / 60);
        }
        expect(player.dashCooldownTicks).toBe(80);

        // Reset restores dash ready
        player.reset();
        expect(player.dashCooldownTicks).toBe(0);
        expect(player.dashActiveTicks).toBe(0);
        expect(player.isDashReady()).toBe(true);
      });
    });

    it("equips full 7-upgrade loadout and replenishes shields to max capacity", () => {
      const player = new Player({ x: 100, y: 100 });
      expect(player.shields).toBe(0);
      expect(player.weapon.getMagSize()).toBe(6);

      player.equipFullEndlessLoadout();

      // All 7 upgrades installed
      const activeIds = player.upgradePipeline.getActiveIds();
      expect(activeIds).toContain("extended-cylinder");
      expect(activeIds).toContain("speed-loader");
      expect(activeIds).toContain("reactive-shield");
      expect(activeIds).toContain("kinetic-stride");
      expect(activeIds).toContain("chrono-burst");
      expect(activeIds).toContain("phase-deflector");
      expect(activeIds).toContain("overcharge-dash");

      // Weapon upgraded to 8 rounds & full
      expect(player.weapon.getMagSize()).toBe(8);
      expect(player.weapon.getAmmo()).toBe(8);

      // Shields replenished to max capacity (reactive-shield 1 + phase-deflector 2 = 3)
      expect(player.maxShields).toBe(3);
      expect(player.shields).toBe(3);

      // Dash is ready
      expect(player.hasOverchargeDash()).toBe(true);
      expect(player.isDashReady()).toBe(true);

      // Deplete shields and verify re-topping off
      player.takeDamage(3);
      expect(player.shields).toBe(0);
      player.equipFullEndlessLoadout();
      expect(player.shields).toBe(3);
    });
  });
});

