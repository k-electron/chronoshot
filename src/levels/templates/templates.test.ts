import { describe, expect, it } from "vitest";
import {
  ALL_LAYOUT_TEMPLATES,
  ArenaQuadrantTemplate,
  CenterPillarsTemplate,
  DEFAULT_LAYOUT_REGISTRY,
  KillboxLanesTemplate,
  RoomLayoutTemplate,
  SplitCorridorTemplate,
  TwinBunkersTemplate,
  validateSpawnSeparation,
} from "./index";

describe("Modular Tactical Cover Templates", () => {
  const templates: RoomLayoutTemplate[] = [
    CenterPillarsTemplate,
    TwinBunkersTemplate,
    SplitCorridorTemplate,
    KillboxLanesTemplate,
    ArenaQuadrantTemplate,
  ];

  it("exports exactly 5 distinct templates in ALL_LAYOUT_TEMPLATES", () => {
    expect(ALL_LAYOUT_TEMPLATES).toHaveLength(5);
    const ids = new Set(ALL_LAYOUT_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(5);
  });

  describe.each(templates)("Template: $id ($name)", (template) => {
    it("has descriptive identity fields", () => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.name).toBe(template.name.toUpperCase());
    });

    it("defines valid player spawn and exit portal", () => {
      expect(template.playerSpawn.x).toBeGreaterThan(20);
      expect(template.playerSpawn.x).toBeLessThan(400);
      expect(template.playerSpawn.y).toBeGreaterThan(20);
      expect(template.playerSpawn.y).toBeLessThan(620);

      expect(template.exitPortal.x).toBeGreaterThan(700);
      expect(template.exitPortal.x).toBeLessThan(940);
      expect(template.exitPortal.y).toBeGreaterThan(20);
      expect(template.exitPortal.y).toBeLessThan(620);
      expect(template.exitPortal.radius).toBeGreaterThan(10);
    });

    it("generates perimeter walls and interior obstacles", () => {
      const obstacles = template.buildObstacles(960, 640);
      expect(obstacles.length).toBeGreaterThan(4); // 4 walls + interior cover

      // Check perimeter walls exist
      const wallIds = obstacles.map((o) => o.id);
      expect(wallIds).toContain("wall-top");
      expect(wallIds).toContain("wall-bottom");
      expect(wallIds).toContain("wall-left");
      expect(wallIds).toContain("wall-right");

      // Verify every obstacle has valid dimensions and bounds
      for (const obs of obstacles) {
        expect(obs.width).toBeGreaterThan(0);
        expect(obs.height).toBeGreaterThan(0);
        expect(obs.bounds.min.x).toBe(obs.x);
        expect(obs.bounds.min.y).toBe(obs.y);
        expect(obs.bounds.max.x).toBe(obs.x + obs.width);
        expect(obs.bounds.max.y).toBe(obs.y + obs.height);
      }
    });

    it("ensures player spawn and exit portal do not overlap obstacles", () => {
      const obstacles = template.buildObstacles(960, 640);

      for (const obs of obstacles) {
        // Player spawn must not be inside obstacle bounds
        const playerInside =
          template.playerSpawn.x >= obs.bounds.min.x &&
          template.playerSpawn.x <= obs.bounds.max.x &&
          template.playerSpawn.y >= obs.bounds.min.y &&
          template.playerSpawn.y <= obs.bounds.max.y;
        expect(playerInside).toBe(false);

        // Exit portal center must not be inside obstacle bounds
        const portalInside =
          template.exitPortal.x >= obs.bounds.min.x &&
          template.exitPortal.x <= obs.bounds.max.x &&
          template.exitPortal.y >= obs.bounds.min.y &&
          template.exitPortal.y <= obs.bounds.max.y;
        expect(portalInside).toBe(false);
      }
    });

    it("provides valid enemy spawn zones within arena boundaries", () => {
      expect(template.enemySpawnZones.length).toBeGreaterThan(0);

      for (const zone of template.enemySpawnZones) {
        expect(zone.width).toBeGreaterThan(0);
        expect(zone.height).toBeGreaterThan(0);
        // Must be inside arena playable area (perimeter wall thickness 20)
        expect(zone.x).toBeGreaterThanOrEqual(20);
        expect(zone.y).toBeGreaterThanOrEqual(20);
        expect(zone.x + zone.width).toBeLessThanOrEqual(940);
        expect(zone.y + zone.height).toBeLessThanOrEqual(620);
      }
    });

    it("guarantees minimum separation distance (280px) from player spawn", () => {
      const passes = validateSpawnSeparation(template, 280);
      expect(passes).toBe(true);
    });

    it("scales obstacle geometry with custom arena dimensions", () => {
      const customObstacles = template.buildObstacles(1200, 800);
      const rightWall = customObstacles.find((o) => o.id === "wall-right");
      const bottomWall = customObstacles.find((o) => o.id === "wall-bottom");

      expect(rightWall?.x).toBe(1180);
      expect(bottomWall?.y).toBe(780);
    });
  });

  describe("DEFAULT_LAYOUT_REGISTRY", () => {
    it("auto-registers all 5 tactical templates", () => {
      expect(DEFAULT_LAYOUT_REGISTRY.getAll()).toHaveLength(5);

      expect(DEFAULT_LAYOUT_REGISTRY.get("center-pillars")).toBe(CenterPillarsTemplate);
      expect(DEFAULT_LAYOUT_REGISTRY.get("twin-bunkers")).toBe(TwinBunkersTemplate);
      expect(DEFAULT_LAYOUT_REGISTRY.get("split-corridor")).toBe(SplitCorridorTemplate);
      expect(DEFAULT_LAYOUT_REGISTRY.get("killbox-lanes")).toBe(KillboxLanesTemplate);
      expect(DEFAULT_LAYOUT_REGISTRY.get("arena-quadrant")).toBe(ArenaQuadrantTemplate);
    });

    it("allows deterministic sampling across all 5 templates", () => {
      // 0.0 -> index 0 (CenterPillars)
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.0).id).toBe("center-pillars");
      // 0.25 -> index 1 (TwinBunkers)
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.25).id).toBe("twin-bunkers");
      // 0.45 -> index 2 (SplitCorridor)
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.45).id).toBe("split-corridor");
      // 0.65 -> index 3 (KillboxLanes)
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.65).id).toBe("killbox-lanes");
      // 0.85 -> index 4 (ArenaQuadrant)
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.85).id).toBe("arena-quadrant");
    });
  });
});
