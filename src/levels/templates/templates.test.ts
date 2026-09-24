import { describe, expect, it } from "vitest";
import {
  ALL_LAYOUT_TEMPLATES,
  ApexColosseumTemplate,
  ApexRedoubtTemplate,
  DEFAULT_LAYOUT_REGISTRY,
  RoomLayoutTemplate,
  validateSpawnSeparation,
} from "./index";

describe("Modular Tactical Cover Templates", () => {
  const templates: RoomLayoutTemplate[] = [
    ApexRedoubtTemplate,
    ApexColosseumTemplate,
  ];

  it("exports exactly 2 distinct templates in ALL_LAYOUT_TEMPLATES", () => {
    expect(ALL_LAYOUT_TEMPLATES).toHaveLength(2);
    const ids = new Set(ALL_LAYOUT_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(2);
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

      // Verify interior obstacles have positive dimensions
      for (const obstacle of obstacles) {
        expect(obstacle.width).toBeGreaterThan(0);
        expect(obstacle.height).toBeGreaterThan(0);
        expect(obstacle.bounds.min.x).toBeLessThan(obstacle.bounds.max.x);
        expect(obstacle.bounds.min.y).toBeLessThan(obstacle.bounds.max.y);
      }
    });

    it("defines valid enemy spawn zones that do not overlap the perimeter walls", () => {
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

  describe("ApexRedoubtTemplate cover reachability", () => {
    it("guarantees reachable cover within <= 140px from every spot across the arena", () => {
      const obstacles = ApexRedoubtTemplate.buildObstacles(960, 640);

      // Test a grid of points covering the playable space
      for (let x = 40; x <= 920; x += 30) {
        for (let y = 40; y <= 600; y += 30) {
          let minDistance = Infinity;
          for (const obs of obstacles) {
            const dx = Math.max(0, obs.bounds.min.x - x, x - obs.bounds.max.x);
            const dy = Math.max(0, obs.bounds.min.y - y, y - obs.bounds.max.y);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
            }
          }
          expect(minDistance).toBeLessThanOrEqual(140);
        }
      }
    });
  });

  describe("DEFAULT_LAYOUT_REGISTRY", () => {
    it("auto-registers active tactical templates", () => {
      expect(DEFAULT_LAYOUT_REGISTRY.getAll()).toHaveLength(2);

      expect(DEFAULT_LAYOUT_REGISTRY.get("apex-redoubt")).toBe(ApexRedoubtTemplate);
      expect(DEFAULT_LAYOUT_REGISTRY.get("apex-colosseum")).toBe(ApexColosseumTemplate);
    });

    it("allows deterministic sampling across active templates", () => {
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.1).id).toBe("apex-redoubt");
      expect(DEFAULT_LAYOUT_REGISTRY.sample(() => 0.9).id).toBe("apex-colosseum");
    });
  });
});
