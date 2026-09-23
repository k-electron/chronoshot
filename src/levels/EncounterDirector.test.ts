import { describe, expect, it } from "vitest";
import { createObstacle, createPillar } from "../entities/Obstacle";
import { testCircleAABB } from "../math/collision";
import { vec2 } from "../math/vector";
import {
  ARCHETYPE_CONFIGS,
  EncounterDirector,
  FRONTLINE_ARCHETYPES,
  SNIPER_ARCHETYPES,
  THREAT_COSTS,
} from "./EncounterDirector";
import { getDistance, RoomLayoutTemplate } from "./templates/RoomLayoutTemplate";

/**
 * Seedable PRNG (Mulberry32) for deterministic testing.
 */
function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("EncounterDirector", () => {
  const testTemplate: RoomLayoutTemplate = {
    id: "test-arena",
    name: "TEST ARENA",
    description: "Layout for EncounterDirector testing",
    playerSpawn: vec2(120, 320),
    exitPortal: { x: 880, y: 320, radius: 28 },
    buildObstacles: () => [
      createObstacle("wall-top", 0, 0, 960, 20),
      createObstacle("wall-bottom", 0, 620, 960, 20),
      createObstacle("wall-left", 0, 0, 20, 640),
      createObstacle("wall-right", 940, 0, 20, 640),
      createPillar("pillar-1", 480, 240, 40),
      createPillar("pillar-2", 480, 400, 40),
    ],
    enemySpawnZones: [
      { x: 550, y: 80, width: 320, height: 180 },
      { x: 550, y: 380, width: 320, height: 180 },
    ],
  };

  describe("Threat Costs & Configuration", () => {
    it("defines correct threat costs across all archetypes", () => {
      expect(THREAT_COSTS.grunt).toBe(10);
      expect(THREAT_COSTS.shotgun).toBe(20);
      expect(THREAT_COSTS.stalker).toBe(25);
      expect(THREAT_COSTS.warden).toBe(35);
      expect(THREAT_COSTS.sniper).toBe(40);
      expect(THREAT_COSTS.boss).toBe(120);
    });

    it("initializes with default configuration values", () => {
      const director = new EncounterDirector();
      expect(director.minPlayerDistance).toBe(280);
      expect(director.minUnitSeparation).toBe(48);
      expect(director.maxSnipers).toBe(2);
      expect(director.maxUnits).toBe(6);
    });

    it("respects custom configuration values", () => {
      const director = new EncounterDirector({
        minPlayerDistance: 350,
        minUnitSeparation: 60,
        maxSnipers: 1,
        maxUnits: 4,
      });
      expect(director.minPlayerDistance).toBe(350);
      expect(director.minUnitSeparation).toBe(60);
      expect(director.maxSnipers).toBe(1);
      expect(director.maxUnits).toBe(4);
    });
  });

  describe("calculateBudget", () => {
    const director = new EncounterDirector();

    it("calculates correct budget for rooms 1, 2, 3, 5, 8, 10", () => {
      expect(director.calculateBudget(1)).toBe(15);
      expect(director.calculateBudget(2)).toBe(30);
      expect(director.calculateBudget(3)).toBe(45);
      expect(director.calculateBudget(4)).toBe(60);
      expect(director.calculateBudget(5)).toBe(75);
      expect(director.calculateBudget(8)).toBe(120);
      expect(director.calculateBudget(10)).toBe(150);
    });

    it("handles non-positive room numbers gracefully", () => {
      expect(director.calculateBudget(0)).toBe(15);
      expect(director.calculateBudget(-1)).toBe(15);
    });
  });

  describe("Threat-Budget Allocation & Composition Constraints", () => {
    const director = new EncounterDirector();

    it("returns an empty squad when budget is insufficient (< 10)", () => {
      expect(director.generateSquad(0, testTemplate)).toEqual([]);
      expect(director.generateSquad(5, testTemplate)).toEqual([]);
      expect(director.generateSquad(9, testTemplate)).toEqual([]);
    });

    it("allocates archetypes without exceeding budget across multiple tiers", () => {
      const testBudgets = [15, 30, 45, 60, 75, 100, 150];

      for (const budget of testBudgets) {
        for (let seed = 1; seed <= 10; seed++) {
          const rng = createMulberry32(seed * 100 + budget);
          const squad = director.generateSquad(budget, testTemplate, rng);

          const totalCost = squad.reduce(
            (sum, u) => sum + THREAT_COSTS[u.type],
            0
          );
          expect(totalCost).toBeLessThanOrEqual(budget);
          expect(squad.length).toBeGreaterThan(0);
        }
      }
    });

    it("strictly respects the maxUnits cap (default 6)", () => {
      const highBudget = 500;
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed);
        const squad = director.generateSquad(highBudget, testTemplate, rng);
        expect(squad.length).toBeLessThanOrEqual(director.maxUnits);
      }
    });

    it("strictly respects custom maxUnits cap", () => {
      const smallDirector = new EncounterDirector({ maxUnits: 3 });
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed);
        const squad = smallDirector.generateSquad(300, testTemplate, rng);
        expect(squad.length).toBeLessThanOrEqual(3);
      }
    });

    it("enforces sniper cap (never > maxSnipers)", () => {
      const highBudget = 300;
      for (let seed = 1; seed <= 30; seed++) {
        const rng = createMulberry32(seed * 7);
        const squad = director.generateSquad(highBudget, testTemplate, rng);
        const sniperCount = squad.filter((u) => SNIPER_ARCHETYPES.has(u.type)).length;
        expect(sniperCount).toBeLessThanOrEqual(director.maxSnipers);
      }
    });

    it("strictly respects custom maxSnipers (e.g. 0 or 1)", () => {
      const zeroSniperDirector = new EncounterDirector({ maxSnipers: 0 });
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed * 11);
        const squad = zeroSniperDirector.generateSquad(200, testTemplate, rng);
        const snipers = squad.filter((u) => SNIPER_ARCHETYPES.has(u.type));
        expect(snipers).toHaveLength(0);
      }

      const singleSniperDirector = new EncounterDirector({ maxSnipers: 1 });
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed * 13);
        const squad = singleSniperDirector.generateSquad(200, testTemplate, rng);
        const snipers = squad.filter((u) => SNIPER_ARCHETYPES.has(u.type));
        expect(snipers.length).toBeLessThanOrEqual(1);
      }
    });

    it("enforces escort constraint: when a sniper is present, at least 1 frontline escort exists", () => {
      const budgets = [40, 50, 60, 75, 100, 150];

      for (const budget of budgets) {
        for (let seed = 1; seed <= 25; seed++) {
          const rng = createMulberry32(seed * 17 + budget);
          const squad = director.generateSquad(budget, testTemplate, rng);

          const sniperCount = squad.filter((u) => SNIPER_ARCHETYPES.has(u.type)).length;
          if (sniperCount > 0) {
            const frontlineCount = squad.filter((u) =>
              FRONTLINE_ARCHETYPES.has(u.type)
            ).length;
            expect(frontlineCount).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    it("never spawns a sniper at budget 40 because escort cannot be afforded", () => {
      // Sniper costs 40, cheapest frontline costs 10 -> min 50 required for sniper + escort
      for (let seed = 1; seed <= 30; seed++) {
        const rng = createMulberry32(seed * 31);
        const squad = director.generateSquad(40, testTemplate, rng);
        const snipers = squad.filter((u) => SNIPER_ARCHETYPES.has(u.type));
        expect(snipers).toHaveLength(0);
      }
    });
  });

  describe("Spatial Placement", () => {
    const director = new EncounterDirector();

    it("ensures all placed units are at least minPlayerDistance (280px) from player spawn", () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed * 41);
        const squad = director.generateSquad(100, testTemplate, rng);

        for (const unit of squad) {
          const dist = getDistance(vec2(unit.x, unit.y), testTemplate.playerSpawn);
          expect(dist).toBeGreaterThanOrEqual(director.minPlayerDistance);
        }
      }
    });

    it("ensures all placed units maintain at least minUnitSeparation (48px) from each other", () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed * 53);
        const squad = director.generateSquad(120, testTemplate, rng);

        for (let i = 0; i < squad.length; i++) {
          for (let j = i + 1; j < squad.length; j++) {
            const p1 = vec2(squad[i].x, squad[i].y);
            const p2 = vec2(squad[j].x, squad[j].y);
            const dist = getDistance(p1, p2);
            expect(dist).toBeGreaterThanOrEqual(director.minUnitSeparation);
          }
        }
      }
    });

    it("ensures no unit overlaps any obstacle bounding box", () => {
      const obstacles = testTemplate.buildObstacles();

      for (let seed = 1; seed <= 20; seed++) {
        const rng = createMulberry32(seed * 67);
        const squad = director.generateSquad(150, testTemplate, rng);

        for (const unit of squad) {
          const unitPos = vec2(unit.x, unit.y);
          const radius = unit.radius ?? 14;

          for (const obs of obstacles) {
            const collision = testCircleAABB(
              unitPos,
              radius,
              obs.bounds.min,
              obs.bounds.max
            );
            expect(collision).toBeNull();
          }
        }
      }
    });

    it("falls back to safe zone center when candidate sampling collides or exhausts attempts", () => {
      // Create a restrictive template where obstacles cover 99% of the spawn zone,
      // but zone center is clear
      const restrictedTemplate: RoomLayoutTemplate = {
        id: "restricted",
        name: "RESTRICTED",
        description: "Nearly blocked spawn zone",
        playerSpawn: vec2(100, 320),
        exitPortal: { x: 880, y: 320, radius: 28 },
        buildObstacles: () => [
          // Obstacle surrounding all but a small center pocket
          createObstacle("obs-left", 500, 200, 80, 200),
          createObstacle("obs-right", 640, 200, 80, 200),
        ],
        enemySpawnZones: [{ x: 500, y: 200, width: 220, height: 200 }],
      };

      const squad = director.generateSquad(15, restrictedTemplate, () => 0.05);
      expect(squad).toHaveLength(1);
      // Unit should be safely placed without throwing or hanging
      expect(squad[0].x).toBeGreaterThan(0);
      expect(squad[0].y).toBeGreaterThan(0);
    });
  });

  describe("Deterministic Generation", () => {
    const director = new EncounterDirector();

    it("produces 100% identical squad output with identical PRNG seeds", () => {
      const seed = 12345;
      const rng1 = createMulberry32(seed);
      const rng2 = createMulberry32(seed);

      const squad1 = director.generateSquad(100, testTemplate, rng1);
      const squad2 = director.generateSquad(100, testTemplate, rng2);

      expect(squad1).toEqual(squad2);
    });

    it("produces varied squad compositions with different seeds", () => {
      const rng1 = createMulberry32(1111);
      const rng2 = createMulberry32(9999);

      const squad1 = director.generateSquad(100, testTemplate, rng1);
      const squad2 = director.generateSquad(100, testTemplate, rng2);

      // Either coordinates or archetype composition differ
      const isIdentical = JSON.stringify(squad1) === JSON.stringify(squad2);
      expect(isIdentical).toBe(false);
    });
  });

  describe("EnemyConfig Attributes", () => {
    const director = new EncounterDirector();

    it("assigns appropriate fireCadenceTicks, initialDelayTicks, and radius per enemy archetype", () => {
      const rng = createMulberry32(42);
      const squad = director.generateSquad(150, testTemplate, rng);

      for (const unit of squad) {
        const expected = ARCHETYPE_CONFIGS[unit.type];
        expect(expected).toBeDefined();
        expect(unit.fireCadenceTicks).toBe(expected.fireCadenceTicks);
        expect(unit.initialDelayTicks).toBe(expected.initialDelayTicks);
        expect(unit.radius).toBe(expected.radius);
        expect(unit.id).toBeDefined();
        expect(unit.id.length).toBeGreaterThan(0);
      }
    });
  });
});
