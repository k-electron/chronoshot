import { describe, expect, it } from "vitest";
import { TimeGovernor } from "../engine/TimeGovernor";
import { DEFAULT_REVOLVER_CONFIG, Revolver } from "./Revolver";

describe("Revolver Weapon State Machine", () => {
  it("initializes with 6 loaded chambers and full capacity", () => {
    const revolver = new Revolver();

    expect(revolver.getAmmo()).toBe(6);
    expect(revolver.getMagSize()).toBe(6);
    expect(revolver.isReady()).toBe(true);
    expect(revolver.getCooldownRemaining()).toBe(0);

    const chambers = revolver.getChambers();
    expect(chambers).toHaveLength(6);
    expect(chambers.every((c) => c === "loaded")).toBe(true);
  });

  it("fires 6 times and then dry-fires on empty chamber", () => {
    const governor = new TimeGovernor();
    const revolver = new Revolver();

    // Fire 6 consecutive rounds, updating cooldown between each
    for (let i = 0; i < 6; i++) {
      expect(revolver.isReady()).toBe(true);
      const result = revolver.fire(governor);

      expect(result.fired).toBe(true);
      expect(result.dryFired).toBe(false);
      expect(result.pellets).toBe(1);
      expect(result.bulletSpeed).toBe(DEFAULT_REVOLVER_CONFIG.bulletSpeed);
      expect(revolver.getAmmo()).toBe(5 - i);
      expect(revolver.getCooldownRemaining()).toBe(DEFAULT_REVOLVER_CONFIG.cooldownTicks);

      // Advance cooldown to allow next trigger pull
      revolver.update(DEFAULT_REVOLVER_CONFIG.cooldownTicks);
    }

    // Cylinder is now completely empty
    expect(revolver.getAmmo()).toBe(0);
    const chambers = revolver.getChambers();
    expect(chambers.every((c) => c === "spent")).toBe(true);

    // 7th attempt triggers dry-fire
    const dryResult = revolver.fire(governor);
    expect(dryResult.fired).toBe(false);
    expect(dryResult.dryFired).toBe(true);
    expect(revolver.wasDryFired()).toBe(true);
    expect(revolver.getAmmo()).toBe(0);
  });

  it("prevents firing while weapon cooldown interval is active", () => {
    const revolver = new Revolver();

    const firstShot = revolver.fire();
    expect(firstShot.fired).toBe(true);
    expect(revolver.isReady()).toBe(false);
    expect(revolver.getCooldownRemaining()).toBe(10);

    // Attempting to fire immediately within cooldown interval
    const blockedShot = revolver.fire();
    expect(blockedShot.fired).toBe(false);
    expect(blockedShot.dryFired).toBe(false);
    expect(revolver.getAmmo()).toBe(5); // Ammo untouched

    // Advance 5 ticks: still on cooldown
    revolver.update(5);
    expect(revolver.getCooldownRemaining()).toBe(5);
    expect(revolver.isReady()).toBe(false);

    // Advance remaining 5 ticks: weapon becomes ready
    revolver.update(5);
    expect(revolver.getCooldownRemaining()).toBe(0);
    expect(revolver.isReady()).toBe(true);

    const secondShot = revolver.fire();
    expect(secondShot.fired).toBe(true);
    expect(revolver.getAmmo()).toBe(4);
  });

  it("queues fire action tick burst on TimeGovernor upon discharge", () => {
    const governor = new TimeGovernor();
    const revolver = new Revolver();

    expect(governor.getQueuedTicks()).toBe(0);
    revolver.fire(governor);

    // Default revolver queues +6 ticks on fire
    expect(governor.getQueuedTicks()).toBe(DEFAULT_REVOLVER_CONFIG.fireTickBurst);
  });

  it("reload replenishes 6 rounds and queues reload tick burst on TimeGovernor", () => {
    const governor = new TimeGovernor();
    const revolver = new Revolver();

    // Fire 3 rounds
    for (let i = 0; i < 3; i++) {
      revolver.fire(governor);
      revolver.update(DEFAULT_REVOLVER_CONFIG.cooldownTicks);
    }
    expect(revolver.getAmmo()).toBe(3);

    // Drain governor ticks from firing
    governor.advance(0);
    expect(governor.getQueuedTicks()).toBe(0);

    // Execute reload
    const reloaded = revolver.reload(governor);
    expect(reloaded).toBe(true);
    expect(revolver.getAmmo()).toBe(6);

    const chambers = revolver.getChambers();
    expect(chambers.every((c) => c === "loaded")).toBe(true);
    expect(revolver.getCurrentChamberIndex()).toBe(0);

    // Verifies 30 reload tick burst queued onto TimeGovernor
    expect(governor.getQueuedTicks()).toBe(DEFAULT_REVOLVER_CONFIG.reloadTickBurst);
  });

  it("ignores reload when cylinder is already full", () => {
    const governor = new TimeGovernor();
    const revolver = new Revolver();

    expect(revolver.getAmmo()).toBe(6);
    const reloaded = revolver.reload(governor);

    expect(reloaded).toBe(false);
    expect(governor.getQueuedTicks()).toBe(0);
  });

  it("resets cylinder state completely on reset()", () => {
    const revolver = new Revolver();
    revolver.fire();
    revolver.update(DEFAULT_REVOLVER_CONFIG.cooldownTicks);
    revolver.fire();
    expect(revolver.getAmmo()).toBe(4);

    revolver.reset();
    expect(revolver.getAmmo()).toBe(6);
    expect(revolver.getCooldownRemaining()).toBe(0);
    expect(revolver.getChambers().every((c) => c === "loaded")).toBe(true);
  });
});
