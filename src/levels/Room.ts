/**
 * Room Configuration and Level Definitions for ChronoShot.
 *
 * Defines the tactical puzzle room data schema and the 3-room progression sequence:
 * - Room 1 (Basic Cover): 1v1 engagement against a single Pistol Grunt with central cover.
 *   Teaches 5% micro-creep dodging and peeking behind obstacles.
 * - Room 2 (Crossfire): 2v1 flanking engagement with twin pillars.
 *   Teaches line-of-sight breaking and timing the +30 tick reload cycle safely.
 * - Room 3 (Heavy Spread): Shotgun Guard + Pistol Grunt pressure.
 *   Teaches dodging multi-pellet lethal spreads and tactical maneuvering under fire.
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
 * Teaches dodging and micro-creep.
 */
export function createRoom1(width = 960, height = 640): RoomConfig {
  return {
    id: "room-1",
    roomNumber: 1,
    title: "ROOM 01: BASIC COVER",
    subtitle: "1v1 Tactical Engagement",
    tacticalTip: "Time slows to 5% when stationary. Use the central pillar to evade enemy fire.",
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
 * Room 2: 2v1 crossfire (2 Pistol Grunts flanking, 2 pillars).
 * Teaches reload timing and line-of-sight breaking.
 */
export function createRoom2(width = 960, height = 640): RoomConfig {
  return {
    id: "room-2",
    roomNumber: 2,
    title: "ROOM 02: CROSSFIRE",
    subtitle: "2v1 Flanking Pressure",
    tacticalTip: "Enemies attack in crossfire! Duck behind pillars before reloading (+30 ticks).",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-top", width / 2 - 30, height / 2 - 120, 60),
      createPillar("pillar-bottom", width / 2 - 30, height / 2 + 120, 60),
    ],
    enemies: [
      {
        id: "grunt-top",
        type: "grunt",
        x: width - 220,
        y: height / 2 - 140,
        fireCadenceTicks: 55,
        initialDelayTicks: 20,
      },
      {
        id: "grunt-bottom",
        type: "grunt",
        x: width - 220,
        y: height / 2 + 140,
        fireCadenceTicks: 55,
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
 * Room 3: Shotgun Guard + Pistol Grunt pressure.
 * Teaches dodging multi-pellet spread and tactical reload behind cover.
 */
export function createRoom3(width = 960, height = 640): RoomConfig {
  return {
    id: "room-3",
    roomNumber: 3,
    title: "ROOM 03: HEAVY SPREAD",
    subtitle: "Shotgun Guard & Grunt Flank",
    tacticalTip: "Shotgun fires 5 lethal pellets! Bait the buckshot into cover, then eliminate.",
    playerSpawn: vec2(140, height / 2),
    obstacles: [
      ...createPerimeterWalls(width, height),
      createPillar("pillar-cover-top", 380, height / 2 - 110, 50),
      createPillar("pillar-cover-bottom", 380, height / 2 + 110, 50),
      createObstacle("barrier-mid", 490, height / 2 - 40, 28, 80),
    ],
    enemies: [
      {
        id: "guard-shotgun",
        type: "shotgun",
        x: width - 220,
        y: height / 2,
        fireCadenceTicks: 75,
        initialDelayTicks: 30,
      },
      {
        id: "grunt-support",
        type: "grunt",
        x: width - 280,
        y: height / 2 - 150,
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
 * Generates the complete 3-room tactical puzzle progression.
 */
export function createStandardRoomSequence(
  width = 960,
  height = 640
): RoomConfig[] {
  return [
    createRoom1(width, height),
    createRoom2(width, height),
    createRoom3(width, height),
  ];
}
