import { describe, expect, it, vi } from "vitest";
import { UpgradeDefinition } from "./UpgradeDefinition";
import { UpgradePipeline } from "./UpgradePipeline";

describe("UpgradePipeline", () => {
  const mockPlayer = { id: "test-player", maxSpeed: 180 };

  const createDummyUpgrade = (overrides: Partial<UpgradeDefinition> = {}): UpgradeDefinition => ({
    id: "dummy-upgrade",
    name: "Dummy Upgrade",
    archetype: "Tactical",
    description: "A dummy upgrade for testing",
    statHighlight: "+2 Capacity",
    accentColor: "#00f0ff",
    ...overrides,
  });

  describe("Initial State", () => {
    it("starts with empty active upgrades and baseline modifiers", () => {
      const pipeline = new UpgradePipeline();

      expect(pipeline.getAll()).toEqual([]);
      expect(pipeline.getActiveIds()).toEqual([]);
      expect(pipeline.has("dummy-upgrade")).toBe(false);
      expect(pipeline.getCount("dummy-upgrade")).toBe(0);
      expect(pipeline.getUpgrade("dummy-upgrade")).toBeUndefined();

      const modifiers = pipeline.computeModifiers();
      expect(modifiers).toEqual({
        magSizeBonus: 0,
        reloadTickReduction: 0,
        shieldChargesBonus: 0,
        speedMultiplier: 1.0,
        bulletSpeedMultiplier: 1.0,
      });
    });
  });

  describe("Single Stack Acquisition", () => {
    it("installs an upgrade with default maxStacks of 1", () => {
      const pipeline = new UpgradePipeline();
      const upgrade = createDummyUpgrade({ id: "extended-cylinder" });

      const result = pipeline.acquire(upgrade, mockPlayer);

      expect(result).toEqual({ installed: true, currentStacks: 1 });
      expect(pipeline.has("extended-cylinder")).toBe(true);
      expect(pipeline.getCount("extended-cylinder")).toBe(1);
      expect(pipeline.getUpgrade("extended-cylinder")).toBe(upgrade);
      expect(pipeline.getActiveIds()).toEqual(["extended-cylinder"]);
      expect(pipeline.getAll()).toHaveLength(1);
      expect(pipeline.getAll()[0]).toEqual({ definition: upgrade, count: 1 });
    });

    it("prevents acquiring beyond maxStacks of 1", () => {
      const pipeline = new UpgradePipeline();
      const upgrade = createDummyUpgrade({ id: "reactive-shield" });

      const first = pipeline.acquire(upgrade);
      expect(first).toEqual({ installed: true, currentStacks: 1 });

      const second = pipeline.acquire(upgrade);
      expect(second).toEqual({ installed: false, currentStacks: 1 });
      expect(pipeline.getCount("reactive-shield")).toBe(1);
    });
  });

  describe("Multi-Stack Acquisition and Limits", () => {
    it("allows stacking up to custom maxStacks and enforces the limit", () => {
      const pipeline = new UpgradePipeline();
      const onAcquire = vi.fn();
      const upgrade = createDummyUpgrade({
        id: "kinetic-stride",
        maxStacks: 3,
        onAcquire,
      });

      const res1 = pipeline.acquire(upgrade, mockPlayer);
      expect(res1).toEqual({ installed: true, currentStacks: 1 });
      expect(onAcquire).toHaveBeenCalledTimes(1);

      const res2 = pipeline.acquire(upgrade, mockPlayer);
      expect(res2).toEqual({ installed: true, currentStacks: 2 });
      expect(onAcquire).toHaveBeenCalledTimes(2);

      const res3 = pipeline.acquire(upgrade, mockPlayer);
      expect(res3).toEqual({ installed: true, currentStacks: 3 });
      expect(onAcquire).toHaveBeenCalledTimes(3);

      // Attempt 4th stack beyond limit
      const res4 = pipeline.acquire(upgrade, mockPlayer);
      expect(res4).toEqual({ installed: false, currentStacks: 3 });
      expect(onAcquire).toHaveBeenCalledTimes(3); // Not called on failed attempt
      expect(pipeline.getCount("kinetic-stride")).toBe(3);
    });
  });

  describe("Modifier Compounding", () => {
    it("linearly aggregates additive modifiers per stack", () => {
      const pipeline = new UpgradePipeline();
      const upgrade = createDummyUpgrade({
        id: "extended-cylinder",
        maxStacks: 3,
        modifiers: {
          magSizeBonus: 2,
          reloadTickReduction: 5,
          shieldChargesBonus: 1,
        },
      });

      pipeline.acquire(upgrade);
      pipeline.acquire(upgrade);

      const mods = pipeline.computeModifiers();
      expect(mods.magSizeBonus).toBe(4);
      expect(mods.reloadTickReduction).toBe(10);
      expect(mods.shieldChargesBonus).toBe(2);
      expect(mods.speedMultiplier).toBeCloseTo(1.0);
      expect(mods.bulletSpeedMultiplier).toBeCloseTo(1.0);
    });

    it("multiplicatively compounds speed multipliers per stack", () => {
      const pipeline = new UpgradePipeline();
      const upgrade = createDummyUpgrade({
        id: "kinetic-stride",
        maxStacks: 3,
        modifiers: {
          speedMultiplier: 1.15,
          bulletSpeedMultiplier: 1.2,
        },
      });

      pipeline.acquire(upgrade);
      pipeline.acquire(upgrade);
      pipeline.acquire(upgrade);

      const mods = pipeline.computeModifiers();
      expect(mods.speedMultiplier).toBeCloseTo(Math.pow(1.15, 3));
      expect(mods.bulletSpeedMultiplier).toBeCloseTo(Math.pow(1.2, 3));
    });

    it("combines multiple disparate upgrades with mixed additive and multiplicative modifiers", () => {
      const pipeline = new UpgradePipeline();
      const upgA = createDummyUpgrade({
        id: "upg-a",
        maxStacks: 2,
        modifiers: {
          magSizeBonus: 2,
          speedMultiplier: 1.1,
        },
      });
      const upgB = createDummyUpgrade({
        id: "upg-b",
        modifiers: {
          magSizeBonus: 1,
          reloadTickReduction: 10,
          speedMultiplier: 1.2,
        },
      });

      pipeline.acquire(upgA);
      pipeline.acquire(upgA); // 2 stacks of upgA
      pipeline.acquire(upgB); // 1 stack of upgB

      const mods = pipeline.computeModifiers();
      expect(mods.magSizeBonus).toBe(2 * 2 + 1); // 5
      expect(mods.reloadTickReduction).toBe(10);
      expect(mods.speedMultiplier).toBeCloseTo(Math.pow(1.1, 2) * 1.2);
    });

    it("gracefully handles upgrades without modifiers defined", () => {
      const pipeline = new UpgradePipeline();
      const upgrade = createDummyUpgrade({
        id: "utility-beacon",
      });

      pipeline.acquire(upgrade);
      const mods = pipeline.computeModifiers();

      expect(mods).toEqual({
        magSizeBonus: 0,
        reloadTickReduction: 0,
        shieldChargesBonus: 0,
        speedMultiplier: 1.0,
        bulletSpeedMultiplier: 1.0,
      });
    });
  });

  describe("Lifecycle Hooks Dispatching", () => {
    it("invokes onAcquire with the provided player reference", () => {
      const pipeline = new UpgradePipeline();
      const onAcquire = vi.fn();
      const upgrade = createDummyUpgrade({ onAcquire });

      pipeline.acquire(upgrade, mockPlayer);

      expect(onAcquire).toHaveBeenCalledWith(mockPlayer);
    });

    it("invokes onRoomStart on all active upgrades", () => {
      const pipeline = new UpgradePipeline();
      const onRoomStart1 = vi.fn();
      const onRoomStart2 = vi.fn();

      const upg1 = createDummyUpgrade({ id: "upg-1", onRoomStart: onRoomStart1 });
      const upg2 = createDummyUpgrade({ id: "upg-2", onRoomStart: onRoomStart2 });
      const upg3 = createDummyUpgrade({ id: "upg-3" }); // No onRoomStart

      pipeline.acquire(upg1);
      pipeline.acquire(upg2);
      pipeline.acquire(upg3);

      pipeline.onRoomStart(mockPlayer);

      expect(onRoomStart1).toHaveBeenCalledTimes(1);
      expect(onRoomStart1).toHaveBeenCalledWith(mockPlayer);
      expect(onRoomStart2).toHaveBeenCalledTimes(1);
      expect(onRoomStart2).toHaveBeenCalledWith(mockPlayer);
    });

    it("invokes onTick on all active upgrades with deltaTicks", () => {
      const pipeline = new UpgradePipeline();
      const onTick1 = vi.fn();
      const onTick2 = vi.fn();

      const upg1 = createDummyUpgrade({ id: "upg-1", onTick: onTick1 });
      const upg2 = createDummyUpgrade({ id: "upg-2", onTick: onTick2 });
      const upg3 = createDummyUpgrade({ id: "upg-3" }); // No onTick

      pipeline.acquire(upg1);
      pipeline.acquire(upg2);
      pipeline.acquire(upg3);

      pipeline.onTick(mockPlayer, 6);

      expect(onTick1).toHaveBeenCalledTimes(1);
      expect(onTick1).toHaveBeenCalledWith(mockPlayer, 6);
      expect(onTick2).toHaveBeenCalledTimes(1);
      expect(onTick2).toHaveBeenCalledWith(mockPlayer, 6);
    });
  });

  describe("Removal and Reset", () => {
    it("removes an active upgrade by id", () => {
      const pipeline = new UpgradePipeline();
      const upg = createDummyUpgrade({
        id: "speed-loader",
        modifiers: { reloadTickReduction: 15 },
      });

      pipeline.acquire(upg);
      expect(pipeline.has("speed-loader")).toBe(true);

      const removed = pipeline.remove("speed-loader");
      expect(removed).toBe(true);
      expect(pipeline.has("speed-loader")).toBe(false);
      expect(pipeline.getCount("speed-loader")).toBe(0);
      expect(pipeline.getUpgrade("speed-loader")).toBeUndefined();
      expect(pipeline.computeModifiers().reloadTickReduction).toBe(0);

      // Attempt removing non-existent id
      expect(pipeline.remove("speed-loader")).toBe(false);
    });

    it("resets all active upgrades", () => {
      const pipeline = new UpgradePipeline();
      const upg1 = createDummyUpgrade({ id: "upg-1", modifiers: { magSizeBonus: 2 } });
      const upg2 = createDummyUpgrade({ id: "upg-2", modifiers: { shieldChargesBonus: 1 } });

      pipeline.acquire(upg1);
      pipeline.acquire(upg2);
      expect(pipeline.getAll()).toHaveLength(2);

      pipeline.reset();

      expect(pipeline.getAll()).toHaveLength(0);
      expect(pipeline.getActiveIds()).toHaveLength(0);
      expect(pipeline.has("upg-1")).toBe(false);
      expect(pipeline.has("upg-2")).toBe(false);
      expect(pipeline.computeModifiers()).toEqual({
        magSizeBonus: 0,
        reloadTickReduction: 0,
        shieldChargesBonus: 0,
        speedMultiplier: 1.0,
        bulletSpeedMultiplier: 1.0,
      });
    });
  });
});
