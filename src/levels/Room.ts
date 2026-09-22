/**
 * Room Configuration and Level Definitions for ChronoShot.
 *
 * Defines the tactical puzzle room data schema and the 5-room progression sequence:
 * - Room 1 (Basic Cover): 1v1 engagement against a mobile Pistol Grunt with central cover.
 *   Teaches 5% micro-creep dodging, leading shots, and peeking behind obstacles.
 * - Room 2 (Armored Breach): Shotgun Guard (1 shield) + Pistol Grunt pressure.
 *   Teaches shield durability (requiring 2 hits) and evading wide buckshot spreads.
 * - Room 3 (Infiltration): High-speed Stalker rusher + Pistol Grunt flank in a zigzag corridor.
 *   Teaches rapid target acquisition, run-and-gun hostile evasion, and leading fast targets.
 * - Room 4 (The Line of Fire): Marksman sniper nest with 30-tick laser telegraph + Shotgun Guard advance.
 *   Teaches dodging telegraphed high-velocity laser sightlines and cover peeking.
 * - Room 5 (Tactical Gauntlet): Aegis Warden (2 shields) + Stalker rusher + Grunt support.
 *   Tests complete 6-cylinder ammunition budgeting, target prioritization, and reload timing.
 */

import { EnemyConfig } from "../entities/Enemy";
import { createObstacle, createPillar, Obstacle } from "../entities/Obstacle";
import { vec2, Vector2D } from "../math/vector";

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
      createObstacle("barrier-top", 380, 0, 24, height / 2 - 40),
      createObstacle("barrier-bottom", 520, height / 2 + 40, 24, height / 2 - 40),
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
 * Room 5: Tactical Gauntlet (Aegis Warden [2 shields] + Stalker + Grunt).
 * Tests complete 6-cylinder ammunition budgeting, target prioritization, and reload timing.
 */
export function createRoom5(width = 960, height = 640): RoomConfig {
  return {
    id: "room-5",
    roomNumber: 5,
    title: "ROOM 05: TACTICAL GAUNTLET",
    subtitle: "Aegis Warden Final Defense",
    tacticalTip: "Budget cylinder ammunition! Wardens require 3 rounds to neutralize—time reloads behind pillars.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-gauntlet-top", 360, 180, 50),
      createPillar("pillar-gauntlet-bottom", 360, height - 180, 50),
      createObstacle("divider-core", 540, height / 2 - 70, 30, 140),
    ],
    enemies: [
      {
        id: "warden-boss",
        type: "warden",
        x: width - 240,
        y: height / 2,
        maxShields: 2,
        fireCadenceTicks: 65,
        initialDelayTicks: 30,
      },
      {
        id: "stalker-flank",
        type: "stalker",
        x: width - 280,
        y: 160,
        fireCadenceTicks: 32,
        initialDelayTicks: 45,
      },
      {
        id: "grunt-support",
        type: "grunt",
        x: width - 280,
        y: height - 160,
        fireCadenceTicks: 50,
        initialDelayTicks: 50,
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
 * Generates the complete 5-room tactical puzzle progression.
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
  ];
}
