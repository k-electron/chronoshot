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
  createRoom15,
  createRoom16,
  createRoom17,
  createRoom18,
  createRoom19,
  createRoom20,
  createStandardRoomSequence,
} from "./Room";
import {
  CHRONO_WEAVER_BLUEPRINT,
  CHRONO_ZENITH_BLUEPRINT,
  VEKTOR_PRIME_BLUEPRINT,
} from "../entities/boss/BossBlueprint";
import { testCircleAABB } from "../math/collision";
import { vec2 } from "../math/vector";

describe("Room Level Configurations (Rooms 1 to 19)", () => {
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

  it("createRoom15 sets up Vektor-Prime milestone boss encounter with Phase Sovereign blueprint and escorts", () => {
    const r15 = createRoom15();
    expect(r15.id).toBe("room-15");
    expect(r15.roomNumber).toBe(15);
    expect(r15.title).toContain("ROOM 15: VEKTOR-PRIME");
    expect(r15.subtitle).toContain("Milestone Boss 3: Phase Sovereign");
    expect(r15.playerSpawn).toEqual({ x: 140, y: 320 });
    expect(r15.exitPortal).toBeDefined();

    // 4 perimeter walls + 4 corner pillars + 1 center bunker = 9 obstacles
    expect(r15.obstacles).toHaveLength(9);
    const pillars = r15.obstacles.filter((o) => o.id.includes("pillar"));
    expect(pillars).toHaveLength(4);

    // Enemies: Vektor-Prime boss + 2 Grunt escorts
    expect(r15.enemies).toHaveLength(3);
    const boss = r15.enemies.find((e) => e.type === "boss");
    expect(boss).toBeDefined();
    expect(boss?.id).toBe("vektor-prime-boss");
    expect(boss?.maxShields).toBe(5);
    expect(boss?.blueprint).toBe(VEKTOR_PRIME_BLUEPRINT);

    const grunts = r15.enemies.filter((e) => e.type === "grunt");
    expect(grunts).toHaveLength(2);
  });

  it("createRoom16 through createRoom19 configure endgame linear progression (Rooms 16-19)", () => {
    const r16 = createRoom16();
    expect(r16.id).toBe("room-16");
    expect(r16.roomNumber).toBe(16);
    expect(r16.title).toContain("ROOM 16: ZENITH ENTRY");
    expect(r16.enemies.length).toBeGreaterThanOrEqual(5);

    const r17 = createRoom17();
    expect(r17.id).toBe("room-17");
    expect(r17.roomNumber).toBe(17);
    expect(r17.title).toContain("ROOM 17: TWIN BASTIONS");
    expect(r17.enemies.filter((e) => e.type === "marksman")).toHaveLength(2);

    const r18 = createRoom18();
    expect(r18.id).toBe("room-18");
    expect(r18.roomNumber).toBe(18);
    expect(r18.title).toContain("ROOM 18: CHRONO CHOKE");
    expect(r18.enemies.filter((e) => e.type === "warden")).toHaveLength(2);

    const r19 = createRoom19();
    expect(r19.id).toBe("room-19");
    expect(r19.roomNumber).toBe(19);
    expect(r19.title).toContain("ROOM 19: PROTOCOL ZENITH");
    expect(r19.enemies.filter((e) => e.type === "warden")).toHaveLength(3);
    expect(r19.enemies.filter((e) => e.type === "marksman")).toHaveLength(2);
    expect(r19.enemies.filter((e) => e.type === "stalker")).toHaveLength(2);

    const r20 = createRoom20();
    expect(r20.id).toBe("room-20");
    expect(r20.roomNumber).toBe(20);
    expect(r20.title).toContain("ROOM 20: PROTOCOL OMEGA");
    expect(r20.enemies.some((e) => e.type === "boss" && e.bossName === CHRONO_ZENITH_BLUEPRINT.name)).toBe(true);
    expect(r20.obstacles.length).toBeGreaterThan(4);
  });

  it("createStandardRoomSequence returns complete 20-room campaign sequence", () => {
    const sequence = createStandardRoomSequence();
    expect(sequence).toHaveLength(20);

    sequence.forEach((room, index) => {
      expect(room.roomNumber).toBe(index + 1);
      expect(room.id).toBe(`room-${index + 1}`);
      expect(room.obstacles.length).toBeGreaterThan(0);
      expect(room.enemies.length).toBeGreaterThan(0);
      expect(room.exitPortal).toBeDefined();
    });

    // Milestone bosses in Room 5, Room 10, Room 15, and Room 20
    expect(sequence[4].enemies.some((e) => e.type === "boss")).toBe(true);
    expect(sequence[9].enemies.some((e) => e.type === "boss")).toBe(true);
    expect(sequence[14].enemies.some((e) => e.type === "boss")).toBe(true);
    expect(sequence[19].enemies.some((e) => e.type === "boss" && e.bossName === CHRONO_ZENITH_BLUEPRINT.name)).toBe(true);
  });

  it("Room 3 chicane maintains passable corridor openings of at least 70px around central pillar", () => {
    const r3 = createRoom3();
    const barrierTop = r3.obstacles.find((o) => o.id === "barrier-top")!;
    const barrierBottom = r3.obstacles.find((o) => o.id === "barrier-bottom")!;
    const pillarMid = r3.obstacles.find((o) => o.id === "pillar-mid")!;

    expect(barrierTop).toBeDefined();
    expect(barrierBottom).toBeDefined();
    expect(pillarMid).toBeDefined();

    // Top gap between barrier-top bottom and pillar-mid top
    const topGap = pillarMid.bounds.min.y - barrierTop.bounds.max.y;
    expect(topGap).toBeGreaterThanOrEqual(70);

    // Bottom gap between pillar-mid bottom and barrier-bottom top
    const bottomGap = barrierBottom.bounds.min.y - pillarMid.bounds.max.y;
    expect(bottomGap).toBeGreaterThanOrEqual(70);
  });

  it("Rooms 17, 18, and 20 hostiles spawn outside all obstacle hitboxes with clean physical clearance", () => {
    const checkedRooms = [createRoom17(), createRoom18(), createRoom20()];

    for (const room of checkedRooms) {
      for (const enemy of room.enemies) {
        const radius = enemy.radius ?? 15;
        for (const obs of room.obstacles) {
          const collision = testCircleAABB(
            vec2(enemy.x, enemy.y),
            radius,
            obs.bounds.min,
            obs.bounds.max
          );
          expect(
            collision,
            `Enemy ${enemy.id} in ${room.id} collided with ${obs.id}`
          ).toBeNull();
        }
      }
    }
  });
});

