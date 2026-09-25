import { describe, expect, it } from "vitest";
import { testCircleAABB } from "../math/collision";
import { vec2, vecDistance } from "../math/vector";
import {
  ApexColosseumTemplate,
} from "./templates/ApexColosseumTemplate";
import {
  ARCHETYPE_CONFIGS,
  EndlessDirector,
  THREAT_COSTS,
} from "./EndlessDirector";

describe("EndlessDirector Threat Budget & Dynamic Spawner", () => {
  describe("Threat Constants & Archetype Timings", () => {
    it("exports valid threat costs and archetype configs", () => {
      expect(THREAT_COSTS.grunt).toBe(10);
      expect(THREAT_COSTS.shotgun).toBe(20);
      expect(THREAT_COSTS.stalker).toBe(25);
      expect(THREAT_COSTS.warden).toBe(35);
      expect(THREAT_COSTS.sniper).toBe(40);
      expect(THREAT_COSTS.boss).toBe(120);

      expect(ARCHETYPE_CONFIGS.grunt.fireCadenceTicks).toBe(50);
      expect(ARCHETYPE_CONFIGS.shotgun.fireCadenceTicks).toBe(80);
      expect(ARCHETYPE_CONFIGS.stalker.fireCadenceTicks).toBe(32);
      expect(ARCHETYPE_CONFIGS.warden.fireCadenceTicks).toBe(65);
      expect(ARCHETYPE_CONFIGS.sniper.fireCadenceTicks).toBe(110);
    });
  });

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

    it("maintains strict 8-unit concurrent limit and at most 2 snipers under rapid kill churn", () => {
      const director = new EndlessDirector({ baseThreatBudget: 500 });
      const obstacles = ApexColosseumTemplate.buildObstacles(960, 640);
      const playerPos = vec2(480, 320);

      let livingEnemies: { type: any; x: number; y: number; isAlive: boolean }[] = [];

      for (let tick = 0; tick < 180; tick++) {
        const ready = director.update(playerPos, livingEnemies, obstacles, 1);
        for (const spawned of ready) {
          livingEnemies.push({
            type: spawned.type,
            x: spawned.x,
            y: spawned.y,
            isAlive: true,
          });
        }

        const activeLiving = livingEnemies.filter((e) => e.isAlive);
        const queued = director.getMaterializationQueue();
        const totalConcurrent = activeLiving.length + queued.length;
        expect(totalConcurrent).toBeLessThanOrEqual(8);

        const livingSnipers = activeLiving.filter(
          (e) => e.type === "marksman" || e.type === "sniper"
        ).length;
        const queuedSnipers = queued.filter(
          (u) => u.type === "marksman" || u.type === "sniper"
        ).length;
        expect(livingSnipers + queuedSnipers).toBeLessThanOrEqual(2);

        // Simulate rapid kill churn: kill 1 enemy periodically
        if (tick % 5 === 0 && activeLiving.length > 0) {
          activeLiving[0].isAlive = false;
          director.recordKill();
        }
        livingEnemies = livingEnemies.filter((e) => e.isAlive);
      }
    });
  });
});

