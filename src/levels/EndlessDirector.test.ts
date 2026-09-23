import { describe, expect, it } from "vitest";
import { testCircleAABB } from "../math/collision";
import { vec2, vecDistance } from "../math/vector";
import { EndlessDirector } from "./EndlessDirector";
import { ApexColosseumTemplate } from "./templates/ApexColosseumTemplate";

describe("EndlessDirector Threat Budget & Dynamic Spawner", () => {
  describe("Threat Curve & Telemetry Metrics", () => {
    it("calculates escalating threat budget correctly based on simulation ticks", () => {
      const director = new EndlessDirector();

      expect(director.getThreatBudget(0)).toBe(50);
      expect(director.getThreatBudget(60)).toBe(50);
      expect(director.getThreatBudget(119)).toBe(50);
      expect(director.getThreatBudget(120)).toBe(55);
      expect(director.getThreatBudget(240)).toBe(60);
      expect(director.getThreatBudget(600)).toBe(75);
      expect(director.getThreatBudget(1200)).toBe(100);
    });

    it("tracks survival ticks and formats survival time MM:SS accurately", () => {
      const director = new EndlessDirector();
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(480, 320);

      expect(director.getSurvivalTicks()).toBe(0);
      expect(director.getSurvivalTimeFormatted()).toBe("00:00");

      director.update(playerPos, [], obstacles, 60);
      expect(director.getSurvivalTicks()).toBe(60);
      expect(director.getSurvivalTimeFormatted()).toBe("00:01");

      director.update(playerPos, [], obstacles, 3540); // 3600 total ticks = 60s
      expect(director.getSurvivalTicks()).toBe(3600);
      expect(director.getSurvivalTimeFormatted()).toBe("01:00");

      director.update(playerPos, [], obstacles, 4500); // 8100 total ticks = 135s = 2m 15s
      expect(director.getSurvivalTimeFormatted()).toBe("02:15");
    });

    it("tracks and increments kill count with recordKill()", () => {
      const director = new EndlessDirector();
      expect(director.getKills()).toBe(0);

      director.recordKill();
      director.recordKill();
      expect(director.getKills()).toBe(2);

      director.reset();
      expect(director.getKills()).toBe(0);
      expect(director.getSurvivalTicks()).toBe(0);
    });
  });

  describe("Safe Distant Spatial Candidate Sampling", () => {
    it("guarantees candidate positions are at least 350px away from the player", () => {
      const director = new EndlessDirector();
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(480, 320); // Center of arena

      for (let i = 0; i < 50; i++) {
        const candidate = director.sampleSafePosition(playerPos, [], obstacles, 16);
        if (candidate) {
          const dist = vecDistance(candidate, playerPos);
          expect(dist).toBeGreaterThanOrEqual(350);
        }
      }
    });

    it("enforces minimum unit separation of 48px from existing units", () => {
      const director = new EndlessDirector();
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(100, 100);
      const existingUnits = [vec2(800, 500), vec2(700, 400)];

      for (let i = 0; i < 30; i++) {
        const candidate = director.sampleSafePosition(playerPos, existingUnits, obstacles, 16);
        if (candidate) {
          for (const existing of existingUnits) {
            const dist = vecDistance(candidate, existing);
            expect(dist).toBeGreaterThanOrEqual(48);
          }
        }
      }
    });

    it("ensures candidate positions never overlap obstacle bounding boxes", () => {
      const director = new EndlessDirector();
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(100, 100);

      for (let i = 0; i < 50; i++) {
        const candidate = director.sampleSafePosition(playerPos, [], obstacles, 16);
        if (candidate) {
          for (const obs of obstacles) {
            const overlaps = testCircleAABB(candidate, 16 + 4, obs.bounds.min, obs.bounds.max);
            expect(overlaps).toBeNull();
          }
        }
      }
    });
  });

  describe("Materialization Queue & Spawn Lifecycle", () => {
    it("enqueues units into materialization queue for 30 ticks before spawning", () => {
      const director = new EndlessDirector();
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(100, 100);

      // Initial update with no enemies: should enqueue units into materialization queue
      const initialSpawns = director.update(playerPos, [], obstacles, 1);
      expect(initialSpawns).toHaveLength(0); // None immediately spawned
      expect(director.getMaterializationQueue().length).toBeGreaterThan(0);

      const queue = director.getMaterializationQueue();
      for (const unit of queue) {
        expect(unit.ticksRemaining).toBe(30); // Freshly queued
        expect(unit.id).toBeDefined();
        expect(unit.x).toBeGreaterThan(0);
        expect(unit.y).toBeGreaterThan(0);
      }

      // Advance by 29 ticks (ticksRemaining will become 1)
      const midwaySpawns = director.update(playerPos, [], obstacles, 29);
      expect(midwaySpawns).toHaveLength(0);
      expect(director.getMaterializationQueue()[0].ticksRemaining).toBe(1);

      // Advance by 1 more tick (total 30 ticks elapsed since enqueue)
      const materialized = director.update(playerPos, [], obstacles, 1);
      expect(materialized.length).toBeGreaterThan(0);
    });

    it("respects max concurrent units cap (8 units)", () => {
      const director = new EndlessDirector({ baseThreatBudget: 200 }); // High budget
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(100, 100);

      director.update(playerPos, [], obstacles, 1);
      const queuedCount = director.getMaterializationQueue().length;
      expect(queuedCount).toBeLessThanOrEqual(8);
    });

    it("enforces sniper limit of at most 2 snipers active or queued", () => {
      const director = new EndlessDirector({ baseThreatBudget: 300 });
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(100, 100);

      // Let simulation spawn units
      director.update(playerPos, [], obstacles, 1);
      const snipers = director
        .getMaterializationQueue()
        .filter((u) => u.type === "marksman" || u.type === "sniper");
      expect(snipers.length).toBeLessThanOrEqual(2);
    });

    it("calculates active threat accurately combining alive and queued units", () => {
      const director = new EndlessDirector();
      const living = [
        { type: "grunt" as const, isAlive: true },
        { type: "warden" as const, isAlive: true },
      ];
      // grunt=10, warden=35 -> 45
      const threat = director.calculateActiveThreat(living);
      expect(threat).toBe(45);
    });
  });
});
