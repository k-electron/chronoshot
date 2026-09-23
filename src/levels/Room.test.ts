import { describe, expect, it } from "vitest";
import {
  createRoom1,
  createRoom2,
  createRoom3,
  createRoom4,
  createRoom5,
  createRoom6,
  createRoom7,
  createRoom8,
  createRoom9,
  createRoom10,
  createRoom11,
  createRoom12,
  createRoom13,
  createRoom14,
  createStandardRoomSequence,
} from "./Room";
import { CHRONO_WEAVER_BLUEPRINT } from "../entities/boss/BossBlueprint";

describe("Room Level Configurations (Rooms 1 to 14)", () => {
  it("creates valid room configurations for Rooms 1 through 9", () => {
    const r1 = createRoom1();
    expect(r1.roomNumber).toBe(1);
    expect(r1.enemies).toHaveLength(1);
    expect(r1.enemies[0].type).toBe("grunt");

    const r2 = createRoom2();
    expect(r2.roomNumber).toBe(2);

    const r3 = createRoom3();
    expect(r3.roomNumber).toBe(3);

    const r4 = createRoom4();
    expect(r4.roomNumber).toBe(4);

    const r5 = createRoom5();
    expect(r5.roomNumber).toBe(5);
    expect(r5.enemies.some((e) => e.type === "boss")).toBe(true);

    const r6 = createRoom6();
    expect(r6.roomNumber).toBe(6);

    const r7 = createRoom7();
    expect(r7.roomNumber).toBe(7);

    const r8 = createRoom8();
    expect(r8.roomNumber).toBe(8);

    const r9 = createRoom9();
    expect(r9.roomNumber).toBe(9);
    expect(r9.enemies.filter((e) => e.type === "warden")).toHaveLength(2);
  });

  it("createRoom10 sets up Chrono-Weaver milestone boss encounter with 4 tactical pillars", () => {
    const r10 = createRoom10();
    expect(r10.id).toBe("room-10");
    expect(r10.roomNumber).toBe(10);
    expect(r10.title).toContain("ROOM 10: CHRONO-WEAVER");
    expect(r10.subtitle).toContain("Milestone Boss 2");
    expect(r10.playerSpawn).toEqual({ x: 140, y: 320 });
    expect(r10.exitPortal).toBeDefined();

    // 4 perimeter walls + 4 corner pillars = 8 obstacles
    expect(r10.obstacles).toHaveLength(8);
    const pillars = r10.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(4);

    // Enemies: Chrono-Weaver boss + Warden screen
    expect(r10.enemies).toHaveLength(2);
    const boss = r10.enemies.find((e) => e.type === "boss");
    expect(boss).toBeDefined();
    expect(boss?.id).toBe("chrono-weaver-boss");
    expect(boss?.maxShields).toBe(3);
    expect(boss?.blueprint).toBe(CHRONO_WEAVER_BLUEPRINT);

    const warden = r10.enemies.find((e) => e.type === "warden");
    expect(warden).toBeDefined();
    expect(warden?.maxShields).toBe(2);
  });

  it("createRoom11 configures Sector 3 Vanguard Breach", () => {
    const r11 = createRoom11();
    expect(r11.id).toBe("room-11");
    expect(r11.roomNumber).toBe(11);
    expect(r11.title).toContain("VANGUARD BREACH");
    expect(r11.enemies.length).toBeGreaterThanOrEqual(5);

    const stalker = r11.enemies.find((e) => e.type === "stalker");
    const warden = r11.enemies.find((e) => e.type === "warden");
    const shotguns = r11.enemies.filter((e) => e.type === "shotgun");
    expect(stalker).toBeDefined();
    expect(warden).toBeDefined();
    expect(shotguns).toHaveLength(2);
  });

  it("createRoom12 configures Twin Bunker Crossfire", () => {
    const r12 = createRoom12();
    expect(r12.id).toBe("room-12");
    expect(r12.roomNumber).toBe(12);
    expect(r12.title).toContain("TWIN BUNKER CROSSFIRE");

    const wardens = r12.enemies.filter((e) => e.type === "warden");
    const snipers = r12.enemies.filter((e) => e.type === "marksman");
    expect(wardens).toHaveLength(2);
    expect(snipers).toHaveLength(2);
    expect(r12.obstacles.filter((o) => o.id.includes("bunker"))).toHaveLength(4);
  });

  it("createRoom13 configures Split Flank Matrix", () => {
    const r13 = createRoom13();
    expect(r13.id).toBe("room-13");
    expect(r13.roomNumber).toBe(13);
    expect(r13.title).toContain("SPLIT FLANK MATRIX");

    const stalkers = r13.enemies.filter((e) => e.type === "stalker");
    expect(stalkers).toHaveLength(2);
    const dividers = r13.obstacles.filter((o) => o.id.includes("divider"));
    expect(dividers).toHaveLength(2);
  });

  it("createRoom14 configures The Crucible peak gauntlet", () => {
    const r14 = createRoom14();
    expect(r14.id).toBe("room-14");
    expect(r14.roomNumber).toBe(14);
    expect(r14.title).toContain("THE CRUCIBLE");

    const wardens = r14.enemies.filter((e) => e.type === "warden");
    const snipers = r14.enemies.filter((e) => e.type === "marksman");
    const stalkers = r14.enemies.filter((e) => e.type === "stalker");
    const shotguns = r14.enemies.filter((e) => e.type === "shotgun");
    expect(wardens).toHaveLength(2);
    expect(snipers).toHaveLength(2);
    expect(stalkers).toHaveLength(1);
    expect(shotguns).toHaveLength(1);
  });

  it("createStandardRoomSequence returns complete 14-room campaign sequence", () => {
    const sequence = createStandardRoomSequence();
    expect(sequence).toHaveLength(14);

    sequence.forEach((room, index) => {
      expect(room.roomNumber).toBe(index + 1);
      expect(room.id).toBe(`room-${index + 1}`);
      expect(room.obstacles.length).toBeGreaterThan(0);
      expect(room.enemies.length).toBeGreaterThan(0);
      expect(room.exitPortal).toBeDefined();
    });

    // Milestone bosses in Room 5 and Room 10
    expect(sequence[4].enemies.some((e) => e.type === "boss")).toBe(true);
    expect(sequence[9].enemies.some((e) => e.type === "boss")).toBe(true);
  });
});
