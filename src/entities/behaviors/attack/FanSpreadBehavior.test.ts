import { describe, expect, it } from "vitest";
import { vec2 } from "../../../math/vector";
import { FanSpreadBehavior } from "./FanSpreadBehavior";

describe("FanSpreadBehavior", () => {
  const dummyContext = {
    id: "guard-1",
    position: vec2(200, 200),
    aimAngle: 0,
    radius: 16,
  };

  it("initializes with Shotgun Guard default configuration", () => {
    const behavior = new FanSpreadBehavior();
    expect(behavior.fireCadenceTicks).toBe(80);
    expect(behavior.bulletSpeed).toBe(480);
    expect(behavior.spreadAngle).toBe(0.35);
    expect(behavior.pellets).toBe(5);
    expect(behavior.stutterTicks).toBe(8);
    expect(behavior.fireCooldownTicks).toBe(40);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("applies custom configuration options", () => {
    const behavior = new FanSpreadBehavior({
      fireCadenceTicks: 60,
      bulletSpeed: 520,
      spreadAngle: 0.5,
      pellets: 3,
      stutterTicks: 10,
      initialDelayTicks: 5,
    });
    expect(behavior.fireCadenceTicks).toBe(60);
    expect(behavior.bulletSpeed).toBe(520);
    expect(behavior.spreadAngle).toBe(0.5);
    expect(behavior.pellets).toBe(3);
    expect(behavior.stutterTicks).toBe(10);
    expect(behavior.fireCooldownTicks).toBe(5);
  });

  it("discharges pellets evenly distributed across spread angle", () => {
    const behavior = new FanSpreadBehavior({
      spreadAngle: 0.4,
      pellets: 5,
      bulletSpeed: 480,
    });

    const ctx = {
      id: "shotgunner",
      position: vec2(100, 100),
      aimAngle: 0, // facing right (+X)
      radius: 16,
    };

    const bullets = behavior.discharge(ctx);
    expect(bullets).toHaveLength(5);

    // Half spread: 0.2 rad; step: 0.4 / 4 = 0.1 rad
    // Angles should be: -0.2, -0.1, 0.0, 0.1, 0.2
    const expectedAngles = [-0.2, -0.1, 0.0, 0.1, 0.2];
    for (let i = 0; i < 5; i++) {
      const b = bullets[i];
      expect(b.owner).toBe("enemy");

      const speed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
      expect(speed).toBeCloseTo(480);

      const angle = Math.atan2(b.velocity.y, b.velocity.x);
      expect(angle).toBeCloseTo(expectedAngles[i]);

      // Spawn pos: offset by (radius + 6) = 22 along pellet angle
      const expectedX = 100 + Math.cos(expectedAngles[i]) * 22;
      const expectedY = 100 + Math.sin(expectedAngles[i]) * 22;
      expect(b.position.x).toBeCloseTo(expectedX);
      expect(b.position.y).toBeCloseTo(expectedY);
    }
  });

  it("handles single pellet fallback without division by zero", () => {
    const behavior = new FanSpreadBehavior({
      pellets: 1,
      bulletSpeed: 450,
      spreadAngle: 0.3,
    });

    const ctx = {
      id: "single-pellet",
      position: vec2(50, 50),
      aimAngle: Math.PI / 4,
      radius: 10,
    };

    const bullets = behavior.discharge(ctx);
    expect(bullets).toHaveLength(1);
    const angle = Math.atan2(bullets[0].velocity.y, bullets[0].velocity.x);
    expect(angle).toBeCloseTo(Math.PI / 4);
  });

  it("progresses cooldown and fires multi-pellet spread when hasLineOfSight is true", () => {
    const behavior = new FanSpreadBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 2,
      pellets: 3,
      stutterTicks: 8,
    });

    // Tick 1: cooldown 2 -> 1
    const b1 = behavior.update(dummyContext, true, 1);
    expect(b1).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(1);

    // Tick 2: fires 3 pellets, stutter set to 8 and decremented by 1 -> 7
    const b2 = behavior.update(dummyContext, true, 1);
    expect(b2).toHaveLength(3);
    expect(behavior.fireCooldownTicks).toBe(50);
    expect(behavior.stutterTimerTicks).toBe(7);
  });

  it("halts cooldown progression when line of sight is obstructed", () => {
    const behavior = new FanSpreadBehavior({
      initialDelayTicks: 15,
    });

    const bullets = behavior.update(dummyContext, false, 5);
    expect(bullets).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(15);
  });

  it("decrements active stutter timer during cover or blocked line of sight", () => {
    const behavior = new FanSpreadBehavior({
      initialDelayTicks: 1,
      stutterTicks: 8,
    });

    // Fire on tick 1
    behavior.update(dummyContext, true, 1);
    expect(behavior.stutterTimerTicks).toBe(7);

    // Cover obscures target: stutter continues recovery
    behavior.update(dummyContext, false, 3);
    expect(behavior.stutterTimerTicks).toBe(4);
  });

  it("resets cooldown and stutter state on reset()", () => {
    const behavior = new FanSpreadBehavior({
      fireCadenceTicks: 80,
      initialDelayTicks: 2,
      stutterTicks: 8,
    });

    behavior.update(dummyContext, true, 2);
    expect(behavior.fireCooldownTicks).toBe(80);
    expect(behavior.stutterTimerTicks).toBe(6);

    behavior.reset();
    expect(behavior.fireCooldownTicks).toBe(2);
    expect(behavior.stutterTimerTicks).toBe(0);
    expect(behavior.isChargingLaser).toBe(false);
  });
});
