import { describe, expect, it } from "vitest";
import { vec2 } from "../../math/vector";
import {
  LayoutTemplateRegistry,
  RoomLayoutTemplate,
  validateSpawnSeparation,
} from "./RoomLayoutTemplate";

describe("RoomLayoutTemplate & Registry", () => {
  const dummyTemplate: RoomLayoutTemplate = {
    id: "dummy-template",
    name: "DUMMY TEMPLATE",
    description: "Test template for unit tests",
    playerSpawn: vec2(140, 320),
    exitPortal: { x: 880, y: 320, radius: 28 },
    buildObstacles: () => [],
    enemySpawnZones: [
      { x: 500, y: 150, width: 200, height: 100 },
      { x: 600, y: 400, width: 200, height: 100 },
    ],
  };

  it("registers, retrieves, and queries templates in LayoutTemplateRegistry", () => {
    const registry = new LayoutTemplateRegistry();
    expect(registry.getAll()).toHaveLength(0);

    registry.register(dummyTemplate);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get("dummy-template")).toBe(dummyTemplate);
    expect(registry.get("non-existent")).toBeUndefined();

    registry.clear();
    expect(registry.getAll()).toHaveLength(0);
  });

  it("samples templates uniformly using custom RNG", () => {
    const registry = new LayoutTemplateRegistry();
    const t1 = { ...dummyTemplate, id: "t1" };
    const t2 = { ...dummyTemplate, id: "t2" };
    registry.register(t1);
    registry.register(t2);

    expect(registry.sample(() => 0.1).id).toBe("t1");
    expect(registry.sample(() => 0.9).id).toBe("t2");
  });

  it("throws when sampling an empty registry", () => {
    const registry = new LayoutTemplateRegistry();
    expect(() => registry.sample()).toThrow("Cannot sample from an empty LayoutTemplateRegistry");
  });

  it("validates spawn separation distance between player and enemy spawn zones", () => {
    // Valid: zones are at x=500+ and player is at x=140 (distance > 350px)
    expect(validateSpawnSeparation(dummyTemplate, 280)).toBe(true);

    // Invalid: enemy zone is too close to player spawn
    const closeTemplate: RoomLayoutTemplate = {
      ...dummyTemplate,
      enemySpawnZones: [{ x: 200, y: 320, width: 50, height: 50 }],
    };
    expect(validateSpawnSeparation(closeTemplate, 280)).toBe(false);
  });
});
