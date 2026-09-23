import { describe, expect, it } from "vitest";
import { vec2 } from "../../../math/vector";
import { RadialNovaBehavior } from "./RadialNovaBehavior";

describe("RadialNovaBehavior", () => {
  const dummyContext = {
    id: "colossus-boss",
    position: vec2(480, 320),
    aimAngle: 0,
    radius: 24,
  };

  it("initializes with default configuration", () => {
    const behavior = new RadialNovaBehavior();
    expect(behavior.fireCadenceTicks).toBe(60);
    expect(behavior.bulletSpeed).toBe(420);
    expect(behavior.pellets).toBe(12);
    expect(behavior.stutterTicks).toBe(10);
    expect(behavior.angularOffsetStep).toBe(0);
    expect(behavior.fireCooldownTicks).toBe(30);
    expect(behavior.currentRotationAngle).toBe(0);
    expect(behavior.currentAngle).toBe(0);
    expect(behavior.stutterTimerTicks).toBe(0);
    expect(behavior.isChargingLaser).toBe(false);
  });

  it("applies custom configuration options", () => {
    const behavior = new RadialNovaBehavior({
      fireCadenceTicks: 90,
      bulletSpeed: 500,
      pellets: 16,
      stutterTicks: 15,
      angularOffsetStep: Math.PI / 16,
      initialDelayTicks: 10,
      initialAngle: Math.PI / 4,
    });
    expect(behavior.fireCadenceTicks).toBe(90);
    expect(behavior.bulletSpeed).toBe(500);
    expect(behavior.pellets).toBe(16);
    expect(behavior.stutterTicks).toBe(15);
    expect(behavior.angularOffsetStep).toBeCloseTo(Math.PI / 16);
    expect(behavior.fireCooldownTicks).toBe(10);
    expect(behavior.currentRotationAngle).toBeCloseTo(Math.PI / 4);
    expect(behavior.currentAngle).toBeCloseTo(Math.PI / 4);
  });

  it("discharges an evenly spaced 360-degree ring of pellets offset by radius + 6", () => {
    const behavior = new RadialNovaBehavior({
      pellets: 8,
      bulletSpeed: 400,
    });

    const ctx = {
      id: "boss-1",
      position: vec2(200, 200),
      aimAngle: Math.PI / 2, // aimAngle should not override omnidirectional 360 ring
      radius: 20,
    };

    const bullets = behavior.discharge(ctx);
    expect(bullets).toHaveLength(8);

    const angleStep = (2 * Math.PI) / 8;
    const spawnOffset = 20 + 6; // radius + 6 = 26

    for (let i = 0; i < 8; i++) {
      const b = bullets[i];
      expect(b.owner).toBe("enemy");

      // Verify projectile speed
      const speed = Math.hypot(b.velocity.x, b.velocity.y);
      expect(speed).toBeCloseTo(400);

      // Verify angular distribution
      const expectedAngle = i * angleStep;
      const actualAngle = Math.atan2(b.velocity.y, b.velocity.x);
      // Normalize both angles to [0, 2*PI) for exact comparison
      const normalizedExpected = (expectedAngle + 2 * Math.PI) % (2 * Math.PI);
      const normalizedActual = (actualAngle + 2 * Math.PI) % (2 * Math.PI);
      expect(normalizedActual).toBeCloseTo(normalizedExpected);

      // Verify spawn position offset
      const expectedX = 200 + Math.cos(expectedAngle) * spawnOffset;
      const expectedY = 200 + Math.sin(expectedAngle) * spawnOffset;
      expect(b.position.x).toBeCloseTo(expectedX);
      expect(b.position.y).toBeCloseTo(expectedY);
    }
  });

  it("advances internal rotation by angularOffsetStep across consecutive discharges", () => {
    const offsetStep = Math.PI / 6; // 30 degrees
    const behavior = new RadialNovaBehavior({
      pellets: 6,
      angularOffsetStep: offsetStep,
      bulletSpeed: 420,
    });

    const ctx = {
      id: "spiral-boss",
      position: vec2(100, 100),
      aimAngle: 0,
      radius: 16,
    };

    // Discharge 1: starting angle = 0
    const ring1 = behavior.discharge(ctx);
    expect(ring1).toHaveLength(6);
    expect(behavior.currentRotationAngle).toBeCloseTo(offsetStep);
    expect(behavior.currentAngle).toBeCloseTo(offsetStep);

    const angle1_0 = Math.atan2(ring1[0].velocity.y, ring1[0].velocity.x);
    expect(angle1_0).toBeCloseTo(0);

    // Discharge 2: starting angle = offsetStep
    const ring2 = behavior.discharge(ctx);
    expect(ring2).toHaveLength(6);
    expect(behavior.currentRotationAngle).toBeCloseTo(2 * offsetStep);

    const angle2_0 = Math.atan2(ring2[0].velocity.y, ring2[0].velocity.x);
    expect(angle2_0).toBeCloseTo(offsetStep);

    // Discharge 3: starting angle = 2 * offsetStep
    const ring3 = behavior.discharge(ctx);
    expect(ring3).toHaveLength(6);
    expect(behavior.currentRotationAngle).toBeCloseTo(3 * offsetStep);

    const angle3_0 = Math.atan2(ring3[0].velocity.y, ring3[0].velocity.x);
    expect(angle3_0).toBeCloseTo(2 * offsetStep);
  });

  it("progresses cooldown and fires nova ring when hasLineOfSight is true", () => {
    const behavior = new RadialNovaBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 2,
      pellets: 4,
      stutterTicks: 10,
    });

    // Tick 1: cooldown decrements from 2 -> 1, no firing
    const b1 = behavior.update(dummyContext, true, 1);
    expect(b1).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(1);

    // Tick 2: fires 4 pellets, cooldown resets to 50, stutter set to 10 and decremented by 1 -> 9
    const b2 = behavior.update(dummyContext, true, 1);
    expect(b2).toHaveLength(4);
    expect(behavior.fireCooldownTicks).toBe(50);
    expect(behavior.stutterTimerTicks).toBe(9);
  });

  it("halts cooldown progression when line of sight is obstructed", () => {
    const behavior = new RadialNovaBehavior({
      initialDelayTicks: 15,
    });

    const bullets = behavior.update(dummyContext, false, 5);
    expect(bullets).toHaveLength(0);
    expect(behavior.fireCooldownTicks).toBe(15);
  });

  it("decrements active stutter timer during blocked line of sight", () => {
    const behavior = new RadialNovaBehavior({
      initialDelayTicks: 1,
      stutterTicks: 10,
    });

    // Fire on tick 1: stutter becomes 10 - 1 = 9
    behavior.update(dummyContext, true, 1);
    expect(behavior.stutterTimerTicks).toBe(9);

    // Target obscured by wall: stutter timer still ticks down
    behavior.update(dummyContext, false, 4);
    expect(behavior.stutterTimerTicks).toBe(5);

    behavior.update(dummyContext, false, 10);
    expect(behavior.stutterTimerTicks).toBe(0);
  });

  it("restores pristine rotation angle and cooldowns on reset()", () => {
    const behavior = new RadialNovaBehavior({
      fireCadenceTicks: 60,
      initialDelayTicks: 20,
      stutterTicks: 10,
      angularOffsetStep: 0.25,
      initialAngle: 0.1,
    });

    // Fire several discharges
    behavior.discharge(dummyContext);
    behavior.discharge(dummyContext);
    expect(behavior.currentRotationAngle).toBeCloseTo(0.1 + 0.5);

    // Trigger update to alter cooldown and stutter
    behavior.update(dummyContext, true, 19);
    expect(behavior.fireCooldownTicks).toBe(1);
    behavior.update(dummyContext, true, 1);
    expect(behavior.fireCooldownTicks).toBe(60);
    expect(behavior.stutterTimerTicks).toBe(9);

    // Reset restores pristine state
    behavior.reset();
    expect(behavior.fireCooldownTicks).toBe(20);
    expect(behavior.stutterTimerTicks).toBe(0);
    expect(behavior.isChargingLaser).toBe(false);
    expect(behavior.currentRotationAngle).toBeCloseTo(0.1);
    expect(behavior.currentAngle).toBeCloseTo(0.1);
  });

  it("handles pellets = 0 edge case gracefully without throwing", () => {
    const behavior = new RadialNovaBehavior({
      pellets: 0,
      angularOffsetStep: 0.5,
    });

    const bullets = behavior.discharge(dummyContext);
    expect(bullets).toHaveLength(0);
    expect(behavior.currentRotationAngle).toBeCloseTo(0.5);
  });

  it("handles pellets = 1 single projectile discharge", () => {
    const behavior = new RadialNovaBehavior({
      pellets: 1,
      bulletSpeed: 350,
      initialAngle: Math.PI / 3,
    });

    const bullets = behavior.discharge(dummyContext);
    expect(bullets).toHaveLength(1);
    const angle = Math.atan2(bullets[0].velocity.y, bullets[0].velocity.x);
    expect(angle).toBeCloseTo(Math.PI / 3);
  });

  it("supports counter-clockwise rotation with negative angularOffsetStep", () => {
    const behavior = new RadialNovaBehavior({
      pellets: 4,
      angularOffsetStep: -Math.PI / 4,
      initialAngle: Math.PI,
    });

    behavior.discharge(dummyContext);
    expect(behavior.currentRotationAngle).toBeCloseTo(Math.PI - Math.PI / 4);

    behavior.discharge(dummyContext);
    expect(behavior.currentRotationAngle).toBeCloseTo(Math.PI - Math.PI / 2);
  });
});
