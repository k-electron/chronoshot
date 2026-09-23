import { describe, expect, it, vi } from "vitest";
import { UpgradeDefinition, UpgradeModifiers } from "./UpgradeDefinition";

describe("UpgradeDefinition & UpgradeModifiers", () => {
  it("allows defining a full upgrade definition with all metadata, modifiers, and lifecycle hooks", () => {
    const onAcquire = vi.fn();
    const onRoomStart = vi.fn();
    const onTick = vi.fn();
    const onDischarge = vi.fn();

    const upgrade: UpgradeDefinition = {
      id: "test-upgrade",
      name: "TEST UPGRADE",
      archetype: "TACTICAL // TEST",
      description: "A test augmentation.",
      statHighlight: "+10% STAT",
      accentColor: "#00f0ff",
      tier: "rare",
      maxStacks: 3,
      modifiers: {
        magSizeBonus: 2,
        reloadTickReduction: 5,
        shieldChargesBonus: 1,
        speedMultiplier: 1.15,
        bulletSpeedMultiplier: 1.25,
      },
      onAcquire,
      onRoomStart,
      onTick,
      onDischarge,
    };

    expect(upgrade.id).toBe("test-upgrade");
    expect(upgrade.name).toBe("TEST UPGRADE");
    expect(upgrade.archetype).toBe("TACTICAL // TEST");
    expect(upgrade.description).toBe("A test augmentation.");
    expect(upgrade.statHighlight).toBe("+10% STAT");
    expect(upgrade.accentColor).toBe("#00f0ff");
    expect(upgrade.tier).toBe("rare");
    expect(upgrade.maxStacks).toBe(3);

    expect(upgrade.modifiers).toEqual({
      magSizeBonus: 2,
      reloadTickReduction: 5,
      shieldChargesBonus: 1,
      speedMultiplier: 1.15,
      bulletSpeedMultiplier: 1.25,
    });

    const mockPlayer = { id: "player-1" };
    upgrade.onAcquire?.(mockPlayer);
    expect(onAcquire).toHaveBeenCalledWith(mockPlayer);

    upgrade.onRoomStart?.(mockPlayer);
    expect(onRoomStart).toHaveBeenCalledWith(mockPlayer);

    upgrade.onTick?.(mockPlayer, 6);
    expect(onTick).toHaveBeenCalledWith(mockPlayer, 6);

    upgrade.onDischarge?.(mockPlayer);
    expect(onDischarge).toHaveBeenCalledWith(mockPlayer);
  });

  it("supports minimal upgrade definitions without optional properties", () => {
    const minimalUpgrade: UpgradeDefinition = {
      id: "minimal",
      name: "MINIMAL",
      archetype: "CORE",
      description: "Basic upgrade.",
      statHighlight: "FLAT STAT",
      accentColor: "#ffffff",
    };

    expect(minimalUpgrade.id).toBe("minimal");
    expect(minimalUpgrade.tier).toBeUndefined();
    expect(minimalUpgrade.maxStacks).toBeUndefined();
    expect(minimalUpgrade.modifiers).toBeUndefined();
    expect(minimalUpgrade.onAcquire).toBeUndefined();
    expect(minimalUpgrade.onRoomStart).toBeUndefined();
    expect(minimalUpgrade.onTick).toBeUndefined();
    expect(minimalUpgrade.onDischarge).toBeUndefined();
  });

  it("supports partial modifier objects", () => {
    const partialModifiers: UpgradeModifiers = {
      speedMultiplier: 1.2,
    };

    expect(partialModifiers.speedMultiplier).toBe(1.2);
    expect(partialModifiers.magSizeBonus).toBeUndefined();
    expect(partialModifiers.reloadTickReduction).toBeUndefined();
    expect(partialModifiers.shieldChargesBonus).toBeUndefined();
    expect(partialModifiers.bulletSpeedMultiplier).toBeUndefined();
  });
});
