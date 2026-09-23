import { describe, expect, it } from "vitest";
import { vec2 } from "../../../math/vector";
import { TelegraphedBeamBehavior } from "./TelegraphedBeamBehavior";

describe("TelegraphedBeamBehavior", () => {
  const dummyContext = {
    id: "sniper-1",
    position: vec2(300, 300),
    aimAngle: 0,
    radius: 14,
  };

  it("initializes with Marksman default configuration", () => {
    const behavior = new TelegraphedBeamBehavior();
    expect(behavior.fireCadenceTicks).toBe(110);
    expect(behavior.bulletSpeed).toBe(850);
    expect(behavior.spreadAngle).toBe(0.01);
    expect(behavior.laserChargeTicks).toBe(30);
    expect(behavior.stutterTicks).toBe(0);
    expect(behavior.fireCooldownTicks).toBe(55);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("applies custom configuration options", () => {
    const behavior = new TelegraphedBeamBehavior({
      fireCadenceTicks: 80,
      bulletSpeed: 900,
      spreadAngle: 0.02,
      laserChargeTicks: 20,
      stutterTicks: 2,
      initialDelayTicks: 25,
    });
    expect(behavior.fireCadenceTicks).toBe(80);
    expect(behavior.bulletSpeed).toBe(900);
    expect(behavior.spreadAngle).toBe(0.02);
    expect(behavior.laserChargeTicks).toBe(20);
    expect(behavior.stutterTicks).toBe(2);
    expect(behavior.fireCooldownTicks).toBe(25);
  });

  it("activates laser charging telegraph when cooldown enters laserChargeTicks threshold", () => {
    const behavior = new TelegraphedBeamBehavior({
      fireCadenceTicks: 100,
      laserChargeTicks: 30,
      initialDelayTicks: 32,
    });

    // Tick 1: cooldown 32 -> 31 (> 30), charging is false
    behavior.update(dummyContext, true, 1);
    expect(behavior.fireCooldownTicks).toBe(31);
    expect(behavior.isChargingLaser).toBe(false);

    // Tick 2: cooldown 31 -> 30 (<= 30), charging becomes true
    behavior.update(dummyContext, true, 1);
    expect(behavior.fireCooldownTicks).toBe(30);
    expect(behavior.isChargingLaser).toBe(true);

    // Continue charging for 20 more ticks: cooldown 30 -> 10, charging remains true
    behavior.update(dummyContext, true, 20);
    expect(behavior.fireCooldownTicks).toBe(10);
    expect(behavior.isChargingLaser).toBe(true);
  });

  it("discharges hyper-velocity beam and resets isChargingLaser on fire", () => {
    const behavior = new TelegraphedBeamBehavior({
      fireCadenceTicks: 100,
      laserChargeTicks: 30,
      initialDelayTicks: 30,
      bulletSpeed: 850,
      spreadAngle: 0,
    });

    // Update 1 tick: cooldown 30 -> 29, charging is true, no projectile yet
    const b1 = behavior.update(dummyContext, true, 1);
    expect(b1).toHaveLength(0);
    expect(behavior.isChargingLaser).toBe(true);

    // Advance remaining 29 ticks: fires bullet, charging resets to false
    const b2 = behavior.update(dummyContext, true, 29);
    expect(b2).toHaveLength(1);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.fireCooldownTicks).toBe(100);

    const projectile = b2[0];
    expect(projectile.owner).toBe("enemy");
    const speed = Math.sqrt(
      projectile.velocity.x ** 2 + projectile.velocity.y ** 2
    );
    expect(speed).toBeCloseTo(850);
  });

  it("resets isChargingLaser to false when line of sight is broken", () => {
    const behavior = new TelegraphedBeamBehavior({
      laserChargeTicks: 30,
      initialDelayTicks: 20,
    });

    // Active charging
    behavior.update(dummyContext, true, 1);
    expect(behavior.isChargingLaser).toBe(true);

    // Sightline broken: charging aborted immediately
    const bullets = behavior.update(dummyContext, false, 5);
    expect(bullets).toHaveLength(0);
    expect(behavior.isChargingLaser).toBe(false);
    // Cooldown does not decrement while out of sight
    expect(behavior.fireCooldownTicks).toBe(19);

    // Sightline restored: charging resumes
    behavior.update(dummyContext, true, 1);
    expect(behavior.isChargingLaser).toBe(true);
    expect(behavior.fireCooldownTicks).toBe(18);
  });

  it("clears isChargingLaser when discharge is invoked directly", () => {
    const behavior = new TelegraphedBeamBehavior({
      laserChargeTicks: 30,
      initialDelayTicks: 10,
    });

    behavior.update(dummyContext, true, 1);
    expect(behavior.isChargingLaser).toBe(true);

    const bullets = behavior.discharge(dummyContext);
    expect(bullets).toHaveLength(1);
    expect(behavior.isChargingLaser).toBe(false);
  });

  it("resets all cooldowns, timers, and charging state on reset()", () => {
    const behavior = new TelegraphedBeamBehavior({
      fireCadenceTicks: 110,
      initialDelayTicks: 25,
      laserChargeTicks: 30,
    });

    behavior.update(dummyContext, true, 5);
    expect(behavior.isChargingLaser).toBe(true);
    expect(behavior.fireCooldownTicks).toBe(20);

    behavior.reset();
    expect(behavior.fireCooldownTicks).toBe(25);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.stutterTimerTicks).toBe(0);
  });
});
