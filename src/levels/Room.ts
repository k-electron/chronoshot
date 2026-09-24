/**
 * Room Configuration and Level Definitions for ChronoShot.
 *
 * Defines the tactical puzzle room data schema and the 9-room progression sequence across 2 zones:
 * - Sector 1 (Rooms 1–5):
 *   - Room 1 (Basic Cover): 1v1 engagement against a mobile Pistol Grunt with central cover.
 *     Teaches 5% micro-creep dodging, leading shots, and peeking behind obstacles.
 *   - Room 2 (Armored Breach): Shotgun Guard (1 shield) + Pistol Grunt pressure.
 *     Teaches shield durability (requiring 2 hits) and evading wide buckshot spreads.
 *   - Room 3 (Infiltration): High-speed Stalker rusher + Pistol Grunt flank in a zigzag corridor.
 *     Teaches rapid target acquisition, run-and-gun hostile evasion, and leading fast targets.
 *   - Room 4 (The Line of Fire): Marksman sniper nest with 30-tick laser telegraph + Shotgun Guard advance.
 *     Teaches dodging telegraphed high-velocity laser sightlines and cover peeking.
 *   - Room 5 (Sector 1 Boss): Goliath-01 Aegis Colossus (4 shields) + Grunt escorts.
 *     Tests multi-layer shield stripping, target prioritization, and spatial dodging.
 * - Zone 2 Escalated Baseline (Rooms 6–9):
 *   - Room 6 (Breach Protocol): Dual Stalker pincer + Shotgun Guard area denial in central choke.
 *   - Room 7 (Crossfire Corridor): Crisscrossing dual Marksman snipers + advancing Aegis Warden.
 *   - Room 8 (Killbox Enclosure): Dual Shotgun Guards + Grunts + Stalker in narrow pillar lanes.
 *   - Room 9 (The Iron Gate): Final defensive line with dual Aegis Wardens + Marksman + Stalker.
 */

import {
  CHRONO_WEAVER_BLUEPRINT,
  CHRONO_ZENITH_BLUEPRINT,
  VEKTOR_PRIME_BLUEPRINT,
} from "../entities/boss/BossBlueprint";
import { EnemyConfig } from "../entities/Enemy";
import { createObstacle, createPillar, Obstacle } from "../entities/Obstacle";
import { vec2, Vector2D } from "../math/vector";
import { ApexRedoubtTemplate } from "./templates/ApexRedoubtTemplate";

export interface ExitPortal {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface RoomConfig {
  readonly id: string;
  readonly roomNumber: number;
  readonly title: string;
  readonly subtitle: string;
  readonly tacticalTip: string;
  readonly playerSpawn: Vector2D;
  readonly obstacles: Obstacle[];
  readonly enemies: EnemyConfig[];
  readonly exitPortal: ExitPortal;
}

/**
 * Creates enclosing perimeter boundary walls for the combat arena.
 */
export function createPerimeterWalls(
  width = 960,
  height = 640,
  thickness = 20
): Obstacle[] {
  return [
    createObstacle("wall-top", 0, 0, width, thickness),
    createObstacle("wall-bottom", 0, height - thickness, width, thickness),
    createObstacle("wall-left", 0, 0, thickness, height),
    createObstacle("wall-right", width - thickness, 0, thickness, height),
  ];
}

/**
 * Room 1: 1v1 basic cover (1 Pistol Grunt, 1 central pillar).
 * Teaches moving hostiles, dodging, and micro-creep.
 */
export function createRoom1(width = 960, height = 640): RoomConfig {
  return {
    id: "room-1",
    roomNumber: 1,
    title: "ROOM 01: BASIC COVER",
    subtitle: "1v1 Skirmish & Movement",
    tacticalTip: "Time slows to 5% when stationary. Evade the mobile grunt behind cover.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-center", width / 2, height / 2, 70),
    ],
    enemies: [
      {
        id: "grunt-1",
        type: "grunt",
        x: width - 220,
        y: height / 2,
        fireCadenceTicks: 50,
        initialDelayTicks: 25,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 2: Armored Breach (Shotgun Guard with 1 shield + Pistol Grunt).
 * Teaches shield durability (requiring 2 hits) and buckshot evasion.
 */
export function createRoom2(width = 960, height = 640): RoomConfig {
  return {
    id: "room-2",
    roomNumber: 2,
    title: "ROOM 02: ARMORED BREACH",
    subtitle: "Shielded Guard & Flank",
    tacticalTip: "Energy shields absorb bullets! Break the guard's shield before delivering the lethal shot.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-top", width / 2 - 30, height / 2 - 120, 60),
      createPillar("pillar-bottom", width / 2 - 30, height / 2 + 120, 60),
    ],
    enemies: [
      {
        id: "guard-shotgun",
        type: "shotgun",
        x: width - 220,
        y: height / 2,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 30,
      },
      {
        id: "grunt-support",
        type: "grunt",
        x: width - 280,
        y: height / 2 - 140,
        fireCadenceTicks: 50,
        initialDelayTicks: 45,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 3: Infiltration (Stalker rusher + Pistol Grunt in zigzag corridor).
 * Teaches dodging high-speed rushers with continuous fire.
 */
export function createRoom3(width = 960, height = 640): RoomConfig {
  return {
    id: "room-3",
    roomNumber: 3,
    title: "ROOM 03: INFILTRATION",
    subtitle: "High-Speed Stalker Pursuit",
    tacticalTip: "Stalkers sprint at high velocity and never pause to shoot. Evade in micro-creep.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("barrier-top", 380, 0, 24, height / 2 - 100),
      createObstacle("barrier-bottom", 520, height / 2 + 100, 24, height / 2 - 100),
      createPillar("pillar-mid", 450, height / 2, 45),
    ],
    enemies: [
      {
        id: "stalker-infiltrator",
        type: "stalker",
        x: width - 200,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "grunt-anchor",
        type: "grunt",
        x: width - 280,
        y: 160,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 4: The Line of Fire (Marksman sniper + Shotgun Guard with cover bunkers).
 * Teaches dodging 30-tick telegraphed laser sightlines and timing peeks.
 */
export function createRoom4(width = 960, height = 640): RoomConfig {
  return {
    id: "room-4",
    roomNumber: 4,
    title: "ROOM 04: THE LINE OF FIRE",
    subtitle: "Precision Sniper Sightline",
    tacticalTip: "Marksman locks a red targeting laser before firing! Duck behind cover to avoid lethal beam.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("bunker-top", 360, 130, 40, 110),
      createObstacle("bunker-bottom", 360, height - 240, 40, 110),
      createPillar("pillar-sniper-nest", width - 260, height / 2 - 70, 45),
    ],
    enemies: [
      {
        id: "marksman-nest",
        type: "marksman",
        x: width - 180,
        y: height / 2,
        fireCadenceTicks: 110,
        initialDelayTicks: 40,
      },
      {
        id: "guard-patrol",
        type: "shotgun",
        x: width - 340,
        y: height - 180,
        maxShields: 1,
        fireCadenceTicks: 80,
        initialDelayTicks: 30,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 5: Sector 1 Boss (Goliath-01 Aegis Colossus [4 shields] + Grunt escorts).
 * Demands multi-layer shield stripping, cover maneuvering, and escort management.
 */
export function createRoom5(width = 960, height = 640): RoomConfig {
  return {
    id: "room-5",
    roomNumber: 5,
    title: "ROOM 05: SECTOR 1 BOSS",
    subtitle: "Goliath-01 Aegis Colossus",
    tacticalTip:
      "Eliminate Goliath's 4 energy shields before targeting its exposed core! Watch for flanking grunts.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-bunker-left", 380, 190, 55),
      createPillar("pillar-bunker-right", 380, height - 190, 55),
      createObstacle("divider-block", 540, height / 2 - 70, 30, 140),
    ],
    enemies: [
      {
        id: "goliath-boss",
        type: "boss",
        x: width - 200,
        y: height / 2,
        maxShields: 4,
        fireCadenceTicks: 60,
        initialDelayTicks: 25,
      },
      {
        id: "grunt-escort-top",
        type: "grunt",
        x: width - 260,
        y: 140,
        fireCadenceTicks: 50,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-escort-bottom",
        type: "grunt",
        x: width - 260,
        y: height - 140,
        fireCadenceTicks: 50,
        initialDelayTicks: 45,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 6: Breach Protocol (Dual Stalker Pincer + Shotgun Guard in central choke).
 * Escalates baseline threat with coordinated high-speed rushers.
 */
export function createRoom6(width = 960, height = 640): RoomConfig {
  return {
    id: "room-6",
    roomNumber: 6,
    title: "ROOM 06: BREACH PROTOCOL",
    subtitle: "Dual Stalker Pincer",
    tacticalTip:
      "Zone 2 hostiles attack without hesitation. Use your tactical augmentation to survive the pincer.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("barrier-top", 440, 0, 30, height / 2 - 60),
      createObstacle("barrier-bottom", 440, height / 2 + 60, 30, height / 2 - 60),
    ],
    enemies: [
      {
        id: "stalker-north",
        type: "stalker",
        x: width - 240,
        y: 150,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "stalker-south",
        type: "stalker",
        x: width - 240,
        y: height - 150,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "guard-center",
        type: "shotgun",
        x: width - 220,
        y: height / 2,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 25,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 7: Crossfire Corridor (Dual Marksman snipers + advancing Aegis Warden).
 * Forces cover transitions against crisscrossing sniper sightlines.
 */
export function createRoom7(width = 960, height = 640): RoomConfig {
  return {
    id: "room-7",
    roomNumber: 7,
    title: "ROOM 07: CROSSFIRE CORRIDOR",
    subtitle: "Crisscrossing Sniper Sightlines",
    tacticalTip:
      "Two snipers lock sightlines across the corridor while an armored warden advances. Break lines of sight!",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("bunker-left", 360, height / 2 - 70, 35, 140),
      createObstacle("bunker-top", 540, 90, 35, 150),
      createObstacle("bunker-bottom", 540, height - 240, 35, 150),
    ],
    enemies: [
      {
        id: "sniper-top",
        type: "marksman",
        x: width - 180,
        y: 130,
        fireCadenceTicks: 100,
        initialDelayTicks: 30,
      },
      {
        id: "sniper-bottom",
        type: "marksman",
        x: width - 180,
        y: height - 130,
        fireCadenceTicks: 100,
        initialDelayTicks: 45,
      },
      {
        id: "warden-advance",
        type: "warden",
        x: width - 300,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 8: Killbox Enclosure (Dual Shotgun Guards + Grunts + Stalker in narrow lanes).
 * Tests quick weapon cycling, reload timing behind pillars, and crowd control.
 */
export function createRoom8(width = 960, height = 640): RoomConfig {
  return {
    id: "room-8",
    roomNumber: 8,
    title: "ROOM 08: KILLBOX ENCLOSURE",
    subtitle: "Close-Quarters Shotgun Suppression",
    tacticalTip:
      "Heavy shotgun guards suppress narrow corridors. Time your reloads behind pillars.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-top-left", 360, 190, 48),
      createPillar("pillar-bottom-left", 360, height - 190, 48),
      createPillar("pillar-top-right", 580, 190, 48),
      createPillar("pillar-bottom-right", 580, height - 190, 48),
    ],
    enemies: [
      {
        id: "guard-upper",
        type: "shotgun",
        x: width - 240,
        y: height / 2 - 130,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 25,
      },
      {
        id: "guard-lower",
        type: "shotgun",
        x: width - 240,
        y: height / 2 + 130,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-support-1",
        type: "grunt",
        x: width - 320,
        y: 150,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
      {
        id: "grunt-support-2",
        type: "grunt",
        x: width - 320,
        y: height - 150,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
      {
        id: "stalker-rusher",
        type: "stalker",
        x: width - 180,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 9: The Iron Gate (Zone 2 Final Defense: Dual Wardens + Marksman + Stalker).
 * Requires careful ammunition budgeting to deplete 6 total enemy shields and neutralize hostiles.
 */
export function createRoom9(width = 960, height = 640): RoomConfig {
  return {
    id: "room-9",
    roomNumber: 9,
    title: "ROOM 09: THE IRON GATE",
    subtitle: "Zone 2 Final Defense",
    tacticalTip:
      "6 enemy shield hits to break. Budget your ammunition and maintain distance from the warden pair.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("heavy-divider-core", 480, height / 2 - 90, 40, 180),
      createPillar("pillar-gate-top", 340, 180, 50),
      createPillar("pillar-gate-bottom", 340, height - 180, 50),
    ],
    enemies: [
      {
        id: "warden-lead",
        type: "warden",
        x: width - 240,
        y: height / 2 - 120,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-flank",
        type: "warden",
        x: width - 240,
        y: height / 2 + 120,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "marksman-anchor",
        type: "marksman",
        x: width - 160,
        y: height / 2,
        fireCadenceTicks: 105,
        initialDelayTicks: 40,
      },
      {
        id: "stalker-infiltrator",
        type: "stalker",
        x: width - 320,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 10: Milestone Boss 2 (Chrono-Weaver: Temporal Anchor [3 shields] + Warden escort).
 * Demands standoff laser evasion in Phase 1, followed by needle-eye micro-creep weaving
 * through 360-degree radial novae while managing Stalker reinforcements in Phase 2.
 */
export function createRoom10(width = 960, height = 640): RoomConfig {
  return {
    id: "room-10",
    roomNumber: 10,
    title: "ROOM 10: CHRONO-WEAVER",
    subtitle: "Milestone Boss 2: Temporal Anchor",
    tacticalTip:
      "Chrono-Weaver kites at range with precision laser beams. Destroy its 3 shields, then freeze in micro-creep to weave through radial novae!",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-nw", 340, 180, 48),
      createPillar("pillar-sw", 340, height - 180, 48),
      createPillar("pillar-ne", 620, 180, 48),
      createPillar("pillar-se", 620, height - 180, 48),
    ],
    enemies: [
      {
        id: "chrono-weaver-boss",
        type: "boss",
        x: width - 200,
        y: height / 2,
        maxShields: 3,
        blueprint: CHRONO_WEAVER_BLUEPRINT,
        bossName: CHRONO_WEAVER_BLUEPRINT.name,
        fireCadenceTicks: 80,
        initialDelayTicks: 25,
      },
      {
        id: "warden-screen",
        type: "warden",
        x: width - 340,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 30,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 11: Vanguard Breach (Sector 3 Entry: 1 Warden + 2 Shotgun Guards + 1 Stalker + 2 Grunts).
 * Calibrates fire tempo and allows the player to test compounded upgrade synergies.
 */
export function createRoom11(width = 960, height = 640): RoomConfig {
  return {
    id: "room-11",
    roomNumber: 11,
    title: "ROOM 11: VANGUARD BREACH",
    subtitle: "Sector 3 Entry Skirmish",
    tacticalTip:
      "Test your upgraded weapon systems against combined vanguard forces. Clear the charging stalker before breaking heavy shields.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-center-top", width / 2, height / 2 - 130, 60),
      createPillar("pillar-center-bottom", width / 2, height / 2 + 130, 60),
    ],
    enemies: [
      {
        id: "warden-center",
        type: "warden",
        x: width - 260,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "guard-top",
        type: "shotgun",
        x: width - 220,
        y: height / 2 - 150,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 30,
      },
      {
        id: "guard-bottom",
        type: "shotgun",
        x: width - 220,
        y: height / 2 + 150,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 35,
      },
      {
        id: "stalker-vanguard",
        type: "stalker",
        x: width - 340,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "grunt-support-1",
        type: "grunt",
        x: width - 160,
        y: height / 2 - 80,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
      {
        id: "grunt-support-2",
        type: "grunt",
        x: width - 160,
        y: height / 2 + 80,
        fireCadenceTicks: 50,
        initialDelayTicks: 45,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 12: Twin Bunker Crossfire (2 Wardens + 2 Marksman Snipers + 1 Shotgun Guard + 1 Grunt).
 * Multi-shield siege requiring disciplined bunker cover peeking under crossfire.
 */
export function createRoom12(width = 960, height = 640): RoomConfig {
  return {
    id: "room-12",
    roomNumber: 12,
    title: "ROOM 12: TWIN BUNKER CROSSFIRE",
    subtitle: "Armored Line & Precision Snipers",
    tacticalTip:
      "Dual snipers lock crossfire angles from bunker cover while twin wardens advance. Displace and flank.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("bunker-left-top", 340, 110, 40, 130),
      createObstacle("bunker-left-bottom", 340, height - 240, 40, 130),
      createObstacle("bunker-right-top", 580, 110, 40, 130),
      createObstacle("bunker-right-bottom", 580, height - 240, 40, 130),
    ],
    enemies: [
      {
        id: "warden-alpha",
        type: "warden",
        x: width - 260,
        y: height / 2 - 80,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-beta",
        type: "warden",
        x: width - 260,
        y: height / 2 + 80,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "sniper-high",
        type: "marksman",
        x: width - 160,
        y: 120,
        fireCadenceTicks: 100,
        initialDelayTicks: 40,
      },
      {
        id: "sniper-low",
        type: "marksman",
        x: width - 160,
        y: height - 120,
        fireCadenceTicks: 100,
        initialDelayTicks: 50,
      },
      {
        id: "guard-center",
        type: "shotgun",
        x: width - 360,
        y: height / 2,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 20,
      },
      {
        id: "grunt-anchor",
        type: "grunt",
        x: width - 200,
        y: height / 2,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 13: Split Flank Matrix (2 Stalkers + 2 Shotgun Guards + 1 Warden + 3 Grunts).
 * High-velocity corridor containment preventing dual pincer rushes.
 */
export function createRoom13(width = 960, height = 640): RoomConfig {
  return {
    id: "room-13",
    roomNumber: 13,
    title: "ROOM 13: SPLIT FLANK MATRIX",
    subtitle: "Dual Pincer & Choke Defense",
    tacticalTip:
      "Corridor dividers separate the arena into high-speed rush lanes. Do not allow stalkers to pincer you into the center choke.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("corridor-divider-top", 280, 190, width - 480, 24),
      createObstacle("corridor-divider-bottom", 280, height - 214, width - 480, 24),
      createPillar("choke-pillar", width / 2 + 60, height / 2, 45),
    ],
    enemies: [
      {
        id: "stalker-north",
        type: "stalker",
        x: width - 180,
        y: 110,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "stalker-south",
        type: "stalker",
        x: width - 180,
        y: height - 110,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "guard-choke-top",
        type: "shotgun",
        x: width - 260,
        y: height / 2 - 80,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 25,
      },
      {
        id: "guard-choke-bottom",
        type: "shotgun",
        x: width - 260,
        y: height / 2 + 65,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 30,
      },
      {
        id: "warden-anchor",
        type: "warden",
        x: width - 180,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-north",
        type: "grunt",
        x: width - 300,
        y: 110,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
      {
        id: "grunt-south",
        type: "grunt",
        x: width - 300,
        y: height - 110,
        fireCadenceTicks: 50,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-center",
        type: "grunt",
        x: width - 340,
        y: height / 2,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 14: The Crucible (Sector 3 Peak Gauntlet: 2 Wardens + 2 Marksmen + 1 Stalker + 1 Shotgun + 1 Grunt).
 * The ultimate tactical gauntlet demanding complete combat and ammunition mastery.
 */
export function createRoom14(width = 960, height = 640): RoomConfig {
  return {
    id: "room-14",
    roomNumber: 14,
    title: "ROOM 14: THE CRUCIBLE",
    subtitle: "Sector 3 Peak Gauntlet",
    tacticalTip:
      "All 4 tactical archetypes coordinate in a quadrant killbox. Prioritize fast threats, track sniper lasers, and crack wardens last.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("quad-nw", 340, 100, 24, 120),
      createObstacle("quad-sw", 340, height - 220, 24, 120),
      createObstacle("quad-ne", 580, 100, 24, 120),
      createObstacle("quad-se", 580, height - 220, 24, 120),
      createPillar("pillar-core-top", width / 2, height / 2 - 110, 46),
      createPillar("pillar-core-bottom", width / 2, height / 2 + 110, 46),
    ],
    enemies: [
      {
        id: "warden-core-1",
        type: "warden",
        x: width - 220,
        y: height / 2 - 100,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-core-2",
        type: "warden",
        x: width - 220,
        y: height / 2 + 100,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "sniper-upper-nest",
        type: "marksman",
        x: width - 150,
        y: 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 30,
      },
      {
        id: "sniper-lower-nest",
        type: "marksman",
        x: width - 150,
        y: height - 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 45,
      },
      {
        id: "stalker-infiltrator",
        type: "stalker",
        x: width - 360,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "guard-forward",
        type: "shotgun",
        x: width - 280,
        y: height / 2,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 20,
      },
      {
        id: "grunt-support",
        type: "grunt",
        x: width - 140,
        y: height / 2,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 15: Milestone Boss 3 (Vektor-Prime: Phase Sovereign [5 shields] + Grunt escorts).
 * Step-function milestone: 5-shield fortress -> 3-shield standoff kiter with minion spawns -> 16-pellet nova overdrive.
 */
export function createRoom15(width = 960, height = 640): RoomConfig {
  return {
    id: "room-15",
    roomNumber: 15,
    title: "ROOM 15: VEKTOR-PRIME",
    subtitle: "Milestone Boss 3: Phase Sovereign",
    tacticalTip:
      "Vektor-Prime shifts across 3 high-intensity combat phases! Deplete 5 shields, evade standoff kiter beams, and weave through 16-pellet radial novae.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-nw", 360, 180, 50),
      createPillar("pillar-sw", 360, height - 180, 50),
      createPillar("pillar-ne", 600, 180, 50),
      createPillar("pillar-se", 600, height - 180, 50),
      createObstacle("center-bunker", width / 2 - 20, height / 2 - 50, 40, 100),
    ],
    enemies: [
      {
        id: "vektor-prime-boss",
        type: "boss",
        x: width - 200,
        y: height / 2,
        maxShields: 5,
        blueprint: VEKTOR_PRIME_BLUEPRINT,
        bossName: VEKTOR_PRIME_BLUEPRINT.name,
        fireCadenceTicks: 50,
        initialDelayTicks: 25,
      },
      {
        id: "grunt-escort-top",
        type: "grunt",
        x: width - 260,
        y: 150,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
      {
        id: "grunt-escort-bottom",
        type: "grunt",
        x: width - 260,
        y: height - 150,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 16: Zenith Entry (Sector 4 Entry: 1 Warden + 2 Shotguns + 2 Stalkers + 2 Grunts).
 * Calibrates player against mixed vanguard pressure using newly drafted 3-upgrade synergies.
 */
export function createRoom16(width = 960, height = 640): RoomConfig {
  return {
    id: "room-16",
    roomNumber: 16,
    title: "ROOM 16: ZENITH ENTRY",
    subtitle: "Sector 4 Vanguard Infiltration",
    tacticalTip:
      "Sector 4 hostiles coordinate simultaneous flank advances. Exploit your 3-augmentation build to control engagement distances.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("barrier-top", 420, 0, 30, height / 2 - 70),
      createObstacle("barrier-bottom", 420, height / 2 + 70, 30, height / 2 - 70),
      createPillar("pillar-choke", width / 2 + 80, height / 2, 45),
    ],
    enemies: [
      {
        id: "warden-center",
        type: "warden",
        x: width - 240,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "guard-top",
        type: "shotgun",
        x: width - 220,
        y: 140,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 30,
      },
      {
        id: "guard-bottom",
        type: "shotgun",
        x: width - 220,
        y: height - 140,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 35,
      },
      {
        id: "stalker-fast-1",
        type: "stalker",
        x: width - 320,
        y: 130,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "stalker-fast-2",
        type: "stalker",
        x: width - 320,
        y: height - 130,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "grunt-support-1",
        type: "grunt",
        x: width - 160,
        y: height / 2 - 80,
        fireCadenceTicks: 50,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-support-2",
        type: "grunt",
        x: width - 160,
        y: height / 2 + 80,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 17: Twin Bastions (2 Wardens + 2 Marksmen + 2 Shotguns).
 * Fortified bunker crossfire requiring disciplined cover peeking and shield-cracking.
 */
export function createRoom17(width = 960, height = 640): RoomConfig {
  return {
    id: "room-17",
    roomNumber: 17,
    title: "ROOM 17: TWIN BASTIONS",
    subtitle: "Armored Bunker Siege",
    tacticalTip:
      "Dual snipers pin crossfire lanes from fortified bastions while twin wardens and shotgun guards hold the choke. Break sightlines!",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("bunker-nw", 340, 110, 40, 130),
      createObstacle("bunker-sw", 340, height - 240, 40, 130),
      createObstacle("bunker-ne", 580, 110, 40, 130),
      createObstacle("bunker-se", 580, height - 240, 40, 130),
      createPillar("pillar-mid-top", width / 2, height / 2 - 110, 42),
      createPillar("pillar-mid-bottom", width / 2, height / 2 + 110, 42),
    ],
    enemies: [
      {
        id: "warden-top",
        type: "warden",
        x: width - 260,
        y: height / 2 - 90,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-bottom",
        type: "warden",
        x: width - 260,
        y: height / 2 + 90,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 30,
      },
      {
        id: "sniper-upper",
        type: "marksman",
        x: width - 150,
        y: 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 35,
      },
      {
        id: "sniper-lower",
        type: "marksman",
        x: width - 150,
        y: height - 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 45,
      },
      {
        id: "guard-upper",
        type: "shotgun",
        x: width - 430,
        y: height / 2 - 100,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 20,
      },
      {
        id: "guard-lower",
        type: "shotgun",
        x: width - 430,
        y: height / 2 + 100,
        maxShields: 1,
        fireCadenceTicks: 75,
        initialDelayTicks: 25,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 18: Chrono Choke (2 Wardens + 3 Stalkers + 2 Shotguns + 1 Grunt).
 * Relentless close-quarters containment testing rapid target prioritization and sprint evasion.
 */
export function createRoom18(width = 960, height = 640): RoomConfig {
  return {
    id: "room-18",
    roomNumber: 18,
    title: "ROOM 18: CHRONO CHOKE",
    subtitle: "Triple Stalker Inundation",
    tacticalTip:
      "Three high-velocity stalkers surge through narrow lanes backed by armored wardens. Neutralize rushers immediately.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("corridor-top", 280, 190, width - 480, 24),
      createObstacle("corridor-bottom", 280, height - 214, width - 480, 24),
      createPillar("pillar-choke-1", 420, height / 2, 45),
      createPillar("pillar-choke-2", 620, height / 2, 45),
    ],
    enemies: [
      {
        id: "stalker-1",
        type: "stalker",
        x: width - 200,
        y: 110,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "stalker-2",
        type: "stalker",
        x: width - 200,
        y: height - 110,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "stalker-3",
        type: "stalker",
        x: width - 440,
        y: height / 2,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "warden-north",
        type: "warden",
        x: width - 260,
        y: height / 2 - 80,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-south",
        type: "warden",
        x: width - 260,
        y: height / 2 + 80,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "guard-flank-top",
        type: "shotgun",
        x: width - 180,
        y: 160,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 30,
      },
      {
        id: "guard-flank-bottom",
        type: "shotgun",
        x: width - 180,
        y: height - 160,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 35,
      },
      {
        id: "grunt-anchor",
        type: "grunt",
        x: width - 140,
        y: height / 2,
        fireCadenceTicks: 50,
        initialDelayTicks: 40,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 19: Protocol Zenith (Campaign Climax: 3 Wardens + 2 Marksmen + 2 Stalkers + 1 Shotgun).
 * The ultimate tactical gauntlet demanding complete mastery of all 3 installed augmentations.
 */
export function createRoom19(width = 960, height = 640): RoomConfig {
  return {
    id: "room-19",
    roomNumber: 19,
    title: "ROOM 19: PROTOCOL ZENITH",
    subtitle: "Endgame Campaign Climax",
    tacticalTip:
      "All elite archetypes coordinate in a quadrant matrix. 6 enemy shields to crack under sniper fire—master your timing in micro-creep!",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createObstacle("quad-nw", 340, 100, 24, 120),
      createObstacle("quad-sw", 340, height - 220, 24, 120),
      createObstacle("quad-ne", 580, 100, 24, 120),
      createObstacle("quad-se", 580, height - 220, 24, 120),
      createPillar("pillar-core-top", width / 2, height / 2 - 110, 46),
      createPillar("pillar-core-bottom", width / 2, height / 2 + 110, 46),
    ],
    enemies: [
      {
        id: "warden-lead-1",
        type: "warden",
        x: width - 240,
        y: height / 2 - 110,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 25,
      },
      {
        id: "warden-lead-2",
        type: "warden",
        x: width - 240,
        y: height / 2 + 110,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 30,
      },
      {
        id: "warden-center",
        type: "warden",
        x: width - 200,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 35,
      },
      {
        id: "sniper-high-nest",
        type: "marksman",
        x: width - 150,
        y: 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 30,
      },
      {
        id: "sniper-low-nest",
        type: "marksman",
        x: width - 150,
        y: height - 110,
        fireCadenceTicks: 95,
        initialDelayTicks: 45,
      },
      {
        id: "stalker-infiltrator-1",
        type: "stalker",
        x: width - 360,
        y: height / 2 - 70,
        fireCadenceTicks: 32,
        initialDelayTicks: 15,
      },
      {
        id: "stalker-infiltrator-2",
        type: "stalker",
        x: width - 360,
        y: height / 2 + 70,
        fireCadenceTicks: 32,
        initialDelayTicks: 20,
      },
      {
        id: "guard-forward",
        type: "shotgun",
        x: width - 280,
        y: height / 2,
        maxShields: 1,
        fireCadenceTicks: 70,
        initialDelayTicks: 25,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Room 20: Protocol Omega (Sector 4 Climax: Chrono-Zenith Zero Sovereign).
 * The ultimate campaign milestone encounter featuring 4 escalating phases,
 * telegraphed Cataclysm Overload shockwaves, and tactical cover dueling inside The Apex Redoubt.
 */
export function createRoom20(width = 960, height = 640): RoomConfig {
  const obstacles = ApexRedoubtTemplate.buildObstacles(width, height);

  return {
    id: "room-20",
    roomNumber: 20,
    title: "ROOM 20: PROTOCOL OMEGA",
    subtitle: "Sector 4 Climax // Milestone Final Boss",
    tacticalTip:
      "Chrono-Zenith channels invulnerable Cataclysm Overload upon shield breaks. Seek cover behind bastions to survive the blast, or pre-fire shots to land post-channel!",
    playerSpawn: vec2(140, height / 2),
    obstacles,
    enemies: [
      {
        id: "boss-chrono-zenith",
        type: "boss",
        x: width - 350,
        y: height / 2,
        maxShields: 5,
        fireCadenceTicks: 45,
        initialDelayTicks: 25,
        blueprint: CHRONO_ZENITH_BLUEPRINT,
        bossName: CHRONO_ZENITH_BLUEPRINT.name,
      },
      {
        id: "escort-grunt-top",
        type: "grunt",
        x: width - 280,
        y: height / 2 - 120,
        fireCadenceTicks: 50,
        initialDelayTicks: 30,
      },
      {
        id: "escort-grunt-bottom",
        type: "grunt",
        x: width - 280,
        y: height / 2 + 120,
        fireCadenceTicks: 50,
        initialDelayTicks: 35,
      },
    ],
    exitPortal: {
      x: width - 80,
      y: height / 2,
      radius: 28,
    },
  };
}

/**
 * Generates the complete 20-room tactical puzzle progression.
 */
export function createStandardRoomSequence(
  width = 960,
  height = 640
): RoomConfig[] {
  return [
    createRoom1(width, height),
    createRoom2(width, height),
    createRoom3(width, height),
    createRoom4(width, height),
    createRoom5(width, height),
    createRoom6(width, height),
    createRoom7(width, height),
    createRoom8(width, height),
    createRoom9(width, height),
    createRoom10(width, height),
    createRoom11(width, height),
    createRoom12(width, height),
    createRoom13(width, height),
    createRoom14(width, height),
    createRoom15(width, height),
    createRoom16(width, height),
    createRoom17(width, height),
    createRoom18(width, height),
    createRoom19(width, height),
    createRoom20(width, height),
  ];
}
