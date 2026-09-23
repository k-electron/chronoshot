import { describe, expect, it } from "vitest";
import { UpgradeDefinition } from "./UpgradeDefinition";
import { DEFAULT_UPGRADE_REGISTRY, UpgradeRegistry } from "./UpgradeRegistry";

describe("UpgradeRegistry", () => {
  const mockUpgradeA: UpgradeDefinition = {
    id: "upgrade-a",
    name: "UPGRADE A",
    archetype: "OFFENSE",
    description: "Offensive perk A",
    statHighlight: "+10 DMG",
    accentColor: "#ff0055",
    maxStacks: 1,
  };

  const mockUpgradeB: UpgradeDefinition = {
    id: "upgrade-b",
    name: "UPGRADE B",
    archetype: "DEFENSE",
    description: "Defensive perk B",
    statHighlight: "+1 SHIELD",
    accentColor: "#00ffaa",
  };

  const mockUpgradeC: UpgradeDefinition = {
    id: "upgrade-c",
    name: "UPGRADE C",
    archetype: "UTILITY",
    description: "Utility perk C",
    statHighlight: "+20% SPEED",
    accentColor: "#00aaff",
    maxStacks: 3,
  };

  it("registers and retrieves upgrade definitions", () => {
    const registry = new UpgradeRegistry();
    registry.register(mockUpgradeA);
    registry.register(mockUpgradeB);

    expect(registry.get("upgrade-a")).toBe(mockUpgradeA);
    expect(registry.get("upgrade-b")).toBe(mockUpgradeB);
    expect(registry.get("unknown")).toBeUndefined();
    expect(registry.getAll()).toEqual([mockUpgradeA, mockUpgradeB]);
  });

  it("updates existing upgrade definition on duplicate registration", () => {
    const registry = new UpgradeRegistry();
    registry.register(mockUpgradeA);

    const updatedA: UpgradeDefinition = {
      ...mockUpgradeA,
      name: "UPGRADE A OVERCLOCK",
    };
    registry.register(updatedA);

    expect(registry.get("upgrade-a")?.name).toBe("UPGRADE A OVERCLOCK");
    expect(registry.getAll()).toHaveLength(1);
  });

  it("clears registered upgrades", () => {
    const registry = new UpgradeRegistry();
    registry.register(mockUpgradeA);
    registry.clear();

    expect(registry.getAll()).toEqual([]);
    expect(registry.get("upgrade-a")).toBeUndefined();
  });

  describe("sampleDraft", () => {
    it("returns empty array when count is <= 0 or registry is empty", () => {
      const registry = new UpgradeRegistry();
      expect(registry.sampleDraft(3)).toEqual([]);
      expect(registry.sampleDraft(0)).toEqual([]);
      expect(registry.sampleDraft(-1)).toEqual([]);

      registry.register(mockUpgradeA);
      expect(registry.sampleDraft(0)).toEqual([]);
    });

    it("returns all eligible upgrades when count exceeds registry size", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeA);
      registry.register(mockUpgradeB);

      const sampled = registry.sampleDraft(5);
      expect(sampled).toHaveLength(2);
      expect(sampled).toContain(mockUpgradeA);
      expect(sampled).toContain(mockUpgradeB);
    });

    it("draws distinct upgrades without duplicates", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeA);
      registry.register(mockUpgradeB);
      registry.register(mockUpgradeC);

      const sampled = registry.sampleDraft(2);
      expect(sampled).toHaveLength(2);
      expect(sampled[0]).not.toBe(sampled[1]);
    });

    it("filters out non-stackable upgrades present in activeUpgradeIds (array)", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeA); // maxStacks: 1
      registry.register(mockUpgradeB); // default maxStacks: 1
      registry.register(mockUpgradeC); // maxStacks: 3

      const sampled = registry.sampleDraft(3, ["upgrade-a"]);
      expect(sampled).toHaveLength(2);
      expect(sampled.map((u) => u.id)).not.toContain("upgrade-a");
      expect(sampled.map((u) => u.id)).toContain("upgrade-b");
      expect(sampled.map((u) => u.id)).toContain("upgrade-c");
    });

    it("filters out non-stackable upgrades present in activeUpgradeIds (Set)", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeA);
      registry.register(mockUpgradeB);

      const sampled = registry.sampleDraft(2, new Set(["upgrade-b"]));
      expect(sampled).toHaveLength(1);
      expect(sampled[0].id).toBe("upgrade-a");
    });

    it("respects maxStacks for multi-stack upgrades", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeC); // maxStacks: 3

      // 1 stack active: still eligible
      let sampled = registry.sampleDraft(1, ["upgrade-c"]);
      expect(sampled).toHaveLength(1);
      expect(sampled[0].id).toBe("upgrade-c");

      // 2 stacks active: still eligible
      sampled = registry.sampleDraft(1, ["upgrade-c", "upgrade-c"]);
      expect(sampled).toHaveLength(1);

      // 3 stacks active (at max): filtered out
      sampled = registry.sampleDraft(1, ["upgrade-c", "upgrade-c", "upgrade-c"]);
      expect(sampled).toHaveLength(0);
    });

    it("samples deterministically with custom rng generator", () => {
      const registry = new UpgradeRegistry();
      registry.register(mockUpgradeA);
      registry.register(mockUpgradeB);
      registry.register(mockUpgradeC);

      // RNG selecting index 0 each step:
      // Step 1: pool [A, B, C], index 0 -> A
      // Step 2: pool [B, C], index 0 -> B
      const fixedRng = () => 0.0;
      const sampled = registry.sampleDraft(2, undefined, fixedRng);
      expect(sampled[0].id).toBe("upgrade-a");
      expect(sampled[1].id).toBe("upgrade-b");
    });
  });

  it("exports a global default singleton DEFAULT_UPGRADE_REGISTRY", () => {
    expect(DEFAULT_UPGRADE_REGISTRY).toBeInstanceOf(UpgradeRegistry);
  });
});
