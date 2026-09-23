import { describe, expect, it } from "vitest";
import { vec2 } from "../../../math/vector";
import { SingleSlugBehavior } from "./SingleSlugBehavior";

describe("SingleSlugBehavior", () => {
  const dummyContext = {
    id: "slugger-1",
    position: vec2(200, 200),
    aimAngle: 0,
    radius: 15,
  };

  it("initializes with sensible default configuration", () => {
    const behavior = new SingleSlugBehavior();
    expect(behavior.fireCadenceTicks).toBe(50);
    expect(behavior.bulletSpeed).toBe(550);
    expect(behavior.spreadAngle).toBe(0.04);
    expect(behavior.stutterTicks).toBe(6);
    expect(behavior.fireCooldownTicks).toBe(25);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("applies custom configuration options", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 40,
      bulletSpeed: 600,
      spreadAngle: 0.1,
      stutterTicks: 4,
      initialDelayTicks: 10,
    });
    expect(behavior.fireCadenceTicks).toBe(40);
    expect(behavior.bulletSpeed).toBe(600);
    expect(behavior.spreadAngle).toBe(0.1);
    expect(behavior.stutterTicks).toBe(4);
    expect(behavior.fireCooldownTicks).toBe(10);
  });

  it("discharges a single projectile offset by radius + 6", () => {
    const behavior = new SingleSlugBehavior({
      bulletSpeed: 500,
      spreadAngle: 0,
    });

    const ctx = {
      id: "unit-42",
      position: vec2(100, 100),
      aimAngle: 0, // facing right (+X)
      radius: 15,
    };

    const bullets = behavior.discharge(ctx);
    expect(bullets).toHaveLength(1);

    const bullet = bullets[0];
    expect(bullet.owner).toBe("enemy");
    // radius (15) + 6 = 21px offset in +X direction
    expect(bullet.position.x).toBeCloseTo(121);
    expect(bullet.position.y).toBeCloseTo(100);
    expect(bullet.velocity.x).toBeCloseTo(500);
    expect(bullet.velocity.y).toBeCloseTo(0);
  });

  it("discharges within spreadAngle tolerance", () => {
    const behavior = new SingleSlugBehavior({
      bulletSpeed: 500,
      spreadAngle: 0.2,
    });

    const ctx = {
      id: "unit-spread",
      position: vec2(100, 100),
      aimAngle: Math.PI / 2, // facing down (+Y)
      radius: 10,
    };

    for (let i = 0; i < 20; i++) {
      const [bullet] = behavior.discharge(ctx);
      const angle = Math.atan2(bullet.velocity.y, bullet.velocity.x);
      expect(angle).toBeGreaterThanOrEqual(Math.PI / 2 - 0.1001);
      expect(angle).toBeLessThanOrEqual(Math.PI / 2 + 0.1001);
    }
  });

  it("progresses cooldown and fires when hasLineOfSight is true", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 30,
      initialDelayTicks: 2,
      stutterTicks: 6,
    });

    // Tick 1: cooldown decrements from 2 to 1, no fire
    const b1 = behavior.update(dummyContext, true, 1);
    expect(b1).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(1);
    expect(behavior.stutterTimerTicks).toBe(0);

    // Tick 2: cooldown reaches 0, fires, resets to fireCadenceTicks (30)
    // Stutter is set to 6 and decremented by 1 tick -> 5
    const b2 = behavior.update(dummyContext, true, 1);
    expect(b2).toHaveLength(1);
    expect(behavior.fireCooldownTicks).toBe(30);
    expect(behavior.stutterTimerTicks).toBe(5);

    // Subsequent ticks count down stutterTimerTicks
    behavior.update(dummyContext, true, 1);
    expect(behavior.stutterTimerTicks).toBe(4);
    behavior.update(dummyContext, true, 2);
    expect(behavior.stutterTimerTicks).toBe(2);
    behavior.update(dummyContext, true, 2);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("does not decrement fire cooldown when line of sight is obstructed", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 10,
    });

    const b = behavior.update(dummyContext, false, 5);
    expect(b).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(10);
  });

  it("decrements active stutter even when line of sight is broken", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 1,
      stutterTicks: 6,
    });

    behavior.update(dummyContext, true, 1);
    expect(behavior.stutterTimerTicks).toBe(5);

    // LOS lost on subsequent tick: stutter timer continues to recover
    behavior.update(dummyContext, false, 2);
    expect(behavior.stutterTimerTicks).toBe(3);
  });

  it("supports zero stutter ticks for run-and-gun combatants", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 30,
      initialDelayTicks: 1,
      stutterTicks: 0,
    });

    const bullets = behavior.update(dummyContext, true, 1);
    expect(bullets).toHaveLength(1);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("resets cooldown and stutter timer on reset()", () => {
    const behavior = new SingleSlugBehavior({
      fireCadenceTicks: 60,
      initialDelayTicks: 1,
      stutterTicks: 8,
    });

    behavior.update(dummyContext, true, 1);
    expect(behavior.fireCooldownTicks).toBe(60);
    expect(behavior.stutterTimerTicks).toBe(7);

    behavior.reset();
    expect(behavior.fireCooldownTicks).toBe(1);
    expect(behavior.stutterTimerTicks).toBe(0);
    expect(behavior.isChargingLaser).toBe(false);
  });
});
