import { describe, expect, it } from "vitest";
import {
  createMulberry32,
  hashString,
  LevelDirector,
} from "./LevelDirector";

describe("LevelDirector & PRNG", () => {
  describe("Mulberry32 PRNG", () => {
    it("produces deterministic pseudo-random sequences for numeric seeds", () => {
      const rng1 = createMulberry32(1337);
      const rng2 = createMulberry32(1337);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
      for (const val of seq1) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it("produces deterministic pseudo-random sequences for string seeds", () => {
      const rng1 = createMulberry32("daily-challenge-2026-09-22");
      const rng2 = createMulberry32("daily-challenge-2026-09-22");

      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
    });

    it("produces distinct sequences for different seeds", () => {
      const rngA = createMulberry32("seed-alpha");
      const rngB = createMulberry32("seed-beta");

      expect(rngA()).not.toBe(rngB());
    });

    it("hashes strings consistently", () => {
      expect(hashString("hello")).toBe(hashString("hello"));
      expect(hashString("alpha")).not.toBe(hashString("beta"));
    });
  });

  describe("LevelDirector Room Generation", () => {
    it("generates a valid standard room configuration for Room 1", () => {
      const director = new LevelDirector({ seed: 42 });
      const room = director.generateRoom(1);

      expect(room.id).toBe("procedural-room-1");
      expect(room.roomNumber).toBe(1);
      expect(room.title).toContain("ROOM 01");
      expect(room.subtitle).toContain("Sector 1");
      expect(room.playerSpawn).toBeDefined();
      expect(room.exitPortal).toBeDefined();
      expect(room.obstacles.length).toBeGreaterThanOrEqual(4); // at least perimeter walls
      expect(room.enemies.length).toBeGreaterThan(0);
      expect(room.enemies.every((e) => e.type !== "boss")).toBe(true);
    });

    it("scales threat budget and enemy squads with room number", () => {
      const director = new LevelDirector({ seed: 99 });
      const room1 = director.generateRoom(1);
      const room4 = director.generateRoom(4);

      expect(room1.subtitle).toContain("Threat Budget: 15");
      expect(room4.subtitle).toContain("Threat Budget: 60");
    });

    it("automatically generates a milestone boss encounter on Room 5", () => {
      const director = new LevelDirector({ seed: 123 });
      const room5 = director.generateRoom(5);

      expect(room5.roomNumber).toBe(5);
      expect(room5.title).toContain("GOLIATH-01: AEGIS COLOSSUS");
      expect(room5.subtitle).toContain("Milestone Boss Encounter");
      expect(room5.enemies.length).toBeGreaterThanOrEqual(2); // Boss + at least 1 escort

      const boss = room5.enemies.find((e) => e.type === "boss");
      expect(boss).toBeDefined();
      expect(boss?.maxShields).toBe(4);
      expect(boss?.blueprint).toBeDefined();
    });

    it("automatically generates a milestone boss encounter on Room 10 (Sector 2 Boss)", () => {
      const director = new LevelDirector({ seed: 456 });
      const room10 = director.generateRoom(10);

      expect(room10.roomNumber).toBe(10);
      expect(room10.title).toContain("GOLIATH-01: AEGIS COLOSSUS");
      expect(room10.subtitle).toContain("Sector 2 Milestone Boss");

      const boss = room10.enemies.find((e) => e.type === "boss");
      expect(boss).toBeDefined();
      const escorts = room10.enemies.filter((e) => e.type !== "boss");
      expect(escorts.length).toBeGreaterThanOrEqual(2);
      expect(escorts.some((e) => e.type === "stalker")).toBe(true);
    });

    it("generates 100% reproducible rooms from identical seeds", () => {
      const director1 = new LevelDirector();
      const director2 = new LevelDirector();

      const roomA = director1.generateRoom(3, "fixed-seed-xyz");
      const roomB = director2.generateRoom(3, "fixed-seed-xyz");

      expect(roomA.title).toBe(roomB.title);
      expect(roomA.enemies).toEqual(roomB.enemies);
      expect(roomA.obstacles.length).toBe(roomB.obstacles.length);
    });

    it("generates varied rooms from different seeds", () => {
      const director = new LevelDirector();
      const roomA = director.generateRoom(2, "seed-1");
      const roomB = director.generateRoom(2, "seed-9999");

      // Either template or enemy positions should vary
      const same =
        roomA.title === roomB.title &&
        JSON.stringify(roomA.enemies) === JSON.stringify(roomB.enemies);
      expect(same).toBe(false);
    });
  });

  describe("Sector & Endless Sequence Generation", () => {
    it("generates a complete 5-room sector with milestone boss at the end", () => {
      const director = new LevelDirector({ seed: 777 });
      const sector1 = director.generateSector(1, 5);

      expect(sector1).toHaveLength(5);
      expect(sector1[0].roomNumber).toBe(1);
      expect(sector1[4].roomNumber).toBe(5);
      expect(sector1[4].enemies.some((e) => e.type === "boss")).toBe(true);
      expect(sector1[0].enemies.every((e) => e.type !== "boss")).toBe(true);
    });

    it("generates Sector 2 with rooms 6 through 10", () => {
      const director = new LevelDirector({ seed: 888 });
      const sector2 = director.generateSector(2, 5);

      expect(sector2).toHaveLength(5);
      expect(sector2[0].roomNumber).toBe(6);
      expect(sector2[4].roomNumber).toBe(10);
      expect(sector2[4].enemies.some((e) => e.type === "boss")).toBe(true);
    });

    it("generates arbitrary endless room sequences", () => {
      const director = new LevelDirector({ seed: "endless-seed" });
      const endless = director.generateEndlessSequence(8, 1);

      expect(endless).toHaveLength(8);
      expect(endless.map((r) => r.roomNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(endless[4].enemies.some((e) => e.type === "boss")).toBe(true);
    });
  });
});
