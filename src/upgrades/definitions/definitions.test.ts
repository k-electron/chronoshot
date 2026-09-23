import { describe, expect, it } from "vitest";
import { DEFAULT_UPGRADE_REGISTRY, UpgradeRegistry } from "../UpgradeRegistry";
import {
  ALL_UPGRADE_DEFINITIONS,
  chronoBurst,
  extendedCylinder,
  kineticStride,
  overchargeDash,
  phaseDeflector,
  reactiveShield,
  registerDefaultUpgrades,
  speedLoader,
} from "./index";

describe("Baseline & Tactical Upgrade Definitions", () => {
  describe("extendedCylinder", () => {
    it("has correct configuration and modifiers", () => {
      expect(extendedCylinder.id).toBe("extended-cylinder");
      expect(extendedCylinder.name).toBe("EXTENDED CYLINDER");
      expect(extendedCylinder.archetype).toBe("FIREPOWER // CAPACITY");
      expect(extendedCylinder.statHighlight).toBe("6 → 8 CHAMBERS");
      expect(extendedCylinder.accentColor).toBe("#00f0ff");
      expect(extendedCylinder.modifiers?.magSizeBonus).toBe(2);
      expect(extendedCylinder.maxStacks).toBe(1);
    });
  });

  describe("speedLoader", () => {
    it("has correct configuration and modifiers", () => {
      expect(speedLoader.id).toBe("speed-loader");
      expect(speedLoader.name).toBe("SPEED LOADER");
      expect(speedLoader.archetype).toBe("TEMPO // CYCLING");
      expect(speedLoader.statHighlight).toBe("+15 TICK RELOAD");
      expect(speedLoader.accentColor).toBe("#ffb703");
      expect(speedLoader.modifiers?.reloadTickReduction).toBe(15);
      expect(speedLoader.maxStacks).toBe(1);
    });
  });

  describe("reactiveShield", () => {
    it("has correct configuration and modifiers", () => {
      expect(reactiveShield.id).toBe("reactive-shield");
      expect(reactiveShield.name).toBe("REACTIVE SHIELD");
      expect(reactiveShield.archetype).toBe("DEFENSE // RESILIENCE");
      expect(reactiveShield.statHighlight).toBe("+1 SHIELD HIT BUFFER");
      expect(reactiveShield.accentColor).toBe("#06d6a0");
      expect(reactiveShield.modifiers?.shieldChargesBonus).toBe(1);
      expect(reactiveShield.maxStacks).toBe(1);
    });
  });

  describe("kineticStride", () => {
    it("has correct configuration and modifiers", () => {
      expect(kineticStride.id).toBe("kinetic-stride");
      expect(kineticStride.name).toBe("KINETIC STRIDE");
      expect(kineticStride.archetype).toBe("MOBILITY // EVASION");
      expect(kineticStride.statHighlight).toBe("+25% MOVEMENT SPEED");
      expect(kineticStride.accentColor).toBe("#9d4edd");
      expect(kineticStride.modifiers?.speedMultiplier).toBe(1.25);
      expect(kineticStride.maxStacks).toBe(1);
    });
  });

  describe("chronoBurst", () => {
    it("has correct configuration and modifiers", () => {
      expect(chronoBurst.id).toBe("chrono-burst");
      expect(chronoBurst.name).toBe("CHRONO BURST");
      expect(chronoBurst.archetype).toBe("BALLISTICS // ACCELERATION");
      expect(chronoBurst.statHighlight).toBe("+30% BULLET VELOCITY");
      expect(chronoBurst.accentColor).toBe("#f72585");
      expect(chronoBurst.modifiers?.bulletSpeedMultiplier).toBe(1.3);
      expect(chronoBurst.maxStacks).toBe(1);
    });
  });

  describe("phaseDeflector", () => {
    it("has correct configuration and modifiers", () => {
      expect(phaseDeflector.id).toBe("phase-deflector");
      expect(phaseDeflector.name).toBe("PHASE DEFLECTOR");
      expect(phaseDeflector.archetype).toBe("TACTICAL // OMNI-SHIELD");
      expect(phaseDeflector.statHighlight).toBe("+2 SHIELD HIT BUFFER");
      expect(phaseDeflector.accentColor).toBe("#4cc9f0");
      expect(phaseDeflector.modifiers?.shieldChargesBonus).toBe(2);
      expect(phaseDeflector.maxStacks).toBe(1);
    });
  });

  describe("overchargeDash", () => {
    it("has correct configuration and modifiers", () => {
      expect(overchargeDash.id).toBe("overcharge-dash");
      expect(overchargeDash.name).toBe("OVERCHARGE DASH");
      expect(overchargeDash.archetype).toBe("TACTICAL // BURST LOCOMOTION");
      expect(overchargeDash.statHighlight).toBe("BURST PHASE DASH");
      expect(overchargeDash.accentColor).toBe("#00f0ff");
      expect(overchargeDash.tier).toBe("overclock");
      expect(overchargeDash.maxStacks).toBe(1);
    });
  });

  describe("Registry integration", () => {
    it("contains all 7 definitions in ALL_UPGRADE_DEFINITIONS with unique IDs", () => {
      expect(ALL_UPGRADE_DEFINITIONS).toHaveLength(7);
      const ids = ALL_UPGRADE_DEFINITIONS.map((u) => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(7);
    });

    it("automatically registers all definitions in DEFAULT_UPGRADE_REGISTRY", () => {
      for (const upgrade of ALL_UPGRADE_DEFINITIONS) {
        expect(DEFAULT_UPGRADE_REGISTRY.get(upgrade.id)).toBe(upgrade);
      }
      expect(DEFAULT_UPGRADE_REGISTRY.getAll().length).toBeGreaterThanOrEqual(7);
    });

    it("registers definitions into a custom registry via registerDefaultUpgrades", () => {
      const customRegistry = new UpgradeRegistry();
      expect(customRegistry.getAll()).toHaveLength(0);

      registerDefaultUpgrades(customRegistry);
      expect(customRegistry.getAll()).toHaveLength(7);
      expect(customRegistry.get("kinetic-stride")).toBe(kineticStride);
      expect(customRegistry.get("overcharge-dash")).toBe(overchargeDash);
    });

    it("samples 3 distinct draft choices from DEFAULT_UPGRADE_REGISTRY", () => {
      const draft = DEFAULT_UPGRADE_REGISTRY.sampleDraft(3);
      expect(draft).toHaveLength(3);
      const draftIds = new Set(draft.map((u) => u.id));
      expect(draftIds.size).toBe(3);
    });

    it("excludes active player upgrades when drafting from DEFAULT_UPGRADE_REGISTRY", () => {
      const draft = DEFAULT_UPGRADE_REGISTRY.sampleDraft(5, [
        "extended-cylinder",
        "speed-loader",
      ]);
      expect(draft.length).toBeLessThanOrEqual(5);
      const draftIds = draft.map((u) => u.id);
      expect(draftIds).not.toContain("extended-cylinder");
      expect(draftIds).not.toContain("speed-loader");
    });
  });
});
