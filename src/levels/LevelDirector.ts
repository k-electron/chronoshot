/**
 * LevelDirector module for ChronoShot.
 *
 * Coordinates deterministic procedural level generation:
 * - Seedable Mulberry32 PRNG for reproducible daily challenges and runs
 * - Template selection from LayoutTemplateRegistry
 * - Threat-budget encounter generation via EncounterDirector
 * - Automatic milestone boss injection every 5th room using BossBlueprint
 * - Synthesis of complete RoomConfig objects ready for Arena / RoomManager
 */

import {
  GOLIATH_01_BLUEPRINT,
  CHRONO_WEAVER_BLUEPRINT,
  VEKTOR_PRIME_BLUEPRINT,
  BossBlueprint,
} from "../entities/boss/BossBlueprint";
import { EnemyConfig } from "../entities/Enemy";
import { RoomConfig } from "./Room";
import { EncounterDirector } from "./EncounterDirector";
import {
  DEFAULT_LAYOUT_REGISTRY,
  LayoutTemplateRegistry,
} from "./templates";

/**
 * 32-bit string hashing using Murmur/Jenkins style integer multiplication.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Creates a deterministic, seedable Mulberry32 pseudo-random number generator.
 * Produces uniformly distributed 32-bit floats in [0, 1).
 */
export function createMulberry32(seed: number | string): () => number {
  let a = typeof seed === "string" ? hashString(seed) : seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LevelDirectorConfig {
  templateRegistry?: LayoutTemplateRegistry;
  encounterDirector?: EncounterDirector;
  bossBlueprint?: BossBlueprint;
  arenaWidth?: number;
  arenaHeight?: number;
  seed?: string | number;
}

export class LevelDirector {
  public readonly templateRegistry: LayoutTemplateRegistry;
  public readonly encounterDirector: EncounterDirector;
  public readonly bossBlueprint: BossBlueprint;
  private readonly customBossBlueprint?: BossBlueprint;
  public readonly arenaWidth: number;
  public readonly arenaHeight: number;
  public baseSeed?: string | number;

  constructor(config: LevelDirectorConfig = {}) {
    this.templateRegistry = config.templateRegistry ?? DEFAULT_LAYOUT_REGISTRY;
    this.encounterDirector = config.encounterDirector ?? new EncounterDirector();
    this.customBossBlueprint = config.bossBlueprint;
    this.bossBlueprint = config.bossBlueprint ?? GOLIATH_01_BLUEPRINT;
    this.arenaWidth = config.arenaWidth ?? 960;
    this.arenaHeight = config.arenaHeight ?? 640;
    this.baseSeed = config.seed;
  }

  /**
   * Resolves a pseudo-random number generator for room generation.
   */
  private resolveRNG(roomNumber: number, seedOverride?: string | number): () => number {
    if (seedOverride !== undefined) {
      return createMulberry32(seedOverride);
    }
    if (this.baseSeed !== undefined) {
      return createMulberry32(`${this.baseSeed}-room-${roomNumber}`);
    }
    return Math.random;
  }

  /**
   * Generates a complete, validated RoomConfig for the specified room number.
   * Milestone boss encounters are synthesized automatically every 5th room.
   */
  public generateRoom(roomNumber: number, seedOverride?: string | number): RoomConfig {
    const rng = this.resolveRNG(roomNumber, seedOverride);
    const isBoss = roomNumber > 0 && roomNumber % 5 === 0;

    if (isBoss) {
      return this.generateBossRoom(roomNumber, rng);
    }

    return this.generateStandardRoom(roomNumber, rng);
  }

  /**
   * Generates a standard combat room with a sampled template and threat-budget squad.
   */
  private generateStandardRoom(roomNumber: number, rng: () => number): RoomConfig {
    const template = this.templateRegistry.sample(rng);
    const budget = this.encounterDirector.calculateBudget(roomNumber);
    const enemies = this.encounterDirector.generateSquad(budget, template, rng);

    const padNumber = String(roomNumber).padStart(2, "0");
    const sectorNumber = Math.ceil(roomNumber / 5);

    return {
      id: `procedural-room-${roomNumber}`,
      roomNumber,
      title: `ROOM ${padNumber}: ${template.name}`,
      subtitle: `Sector ${sectorNumber} // Threat Budget: ${budget}`,
      tacticalTip: template.description,
      playerSpawn: template.playerSpawn,
      obstacles: template.buildObstacles(this.arenaWidth, this.arenaHeight),
      enemies,
      exitPortal: template.exitPortal,
    };
  }

  /**
   * Generates a milestone boss room with structured boss cover and escorts.
   */
  private generateBossRoom(roomNumber: number, rng: () => number): RoomConfig {
    const template = this.templateRegistry.sample(rng);
    const padNumber = String(roomNumber).padStart(2, "0");
    const sectorNumber = Math.floor(roomNumber / 5);

    const blueprint =
      this.customBossBlueprint ??
      (sectorNumber <= 1
        ? GOLIATH_01_BLUEPRINT
        : sectorNumber === 2
        ? CHRONO_WEAVER_BLUEPRINT
        : VEKTOR_PRIME_BLUEPRINT);

    const bossId = `boss-sector-${sectorNumber}-${roomNumber}`;
    const bossConfig: EnemyConfig = {
      id: bossId,
      type: "boss",
      x: this.arenaWidth - 200,
      y: this.arenaHeight / 2,
      maxShields: blueprint.phases[0]?.maxShields ?? 4,
      fireCadenceTicks: 60,
      initialDelayTicks: 25,
      blueprint,
      bossName: blueprint.name,
    };

    const escorts: EnemyConfig[] = [];
    // Scale escorts with sector
    const escortCount = Math.min(3, Math.max(1, sectorNumber));
    const escortType = sectorNumber >= 2 ? "stalker" : "grunt";

    for (let i = 0; i < escortCount; i++) {
      const zone = template.enemySpawnZones[i % template.enemySpawnZones.length];
      const yOffset = (i === 0 ? -120 : 120) * (i % 2 === 0 ? 1 : -1);
      const safeY = Math.max(80, Math.min(this.arenaHeight - 80, this.arenaHeight / 2 + yOffset));

      escorts.push({
        id: `boss-escort-${roomNumber}-${i + 1}`,
        type: escortType,
        x: zone ? zone.x + zone.width / 2 : this.arenaWidth - 260,
        y: safeY,
        fireCadenceTicks: 50,
        initialDelayTicks: 35 + i * 10,
      });
    }

    return {
      id: `procedural-room-${roomNumber}`,
      roomNumber,
      title: `ROOM ${padNumber}: ${blueprint.name}`,
      subtitle: `Sector ${sectorNumber} Milestone Boss Encounter`,
      tacticalTip: `Neutralize ${blueprint.name} shields and coordinate fire against escort hostiles.`,
      playerSpawn: template.playerSpawn,
      obstacles: template.buildObstacles(this.arenaWidth, this.arenaHeight),
      enemies: [bossConfig, ...escorts],
      exitPortal: template.exitPortal,
    };
  }

  /**
   * Generates an entire sector sequence of rooms (default 5 rooms per sector).
   */
  public generateSector(
    sectorNumber: number,
    roomCount = 5,
    seedOverride?: string | number
  ): RoomConfig[] {
    const rooms: RoomConfig[] = [];
    const startRoom = (sectorNumber - 1) * roomCount + 1;
    const endRoom = sectorNumber * roomCount;

    for (let r = startRoom; r <= endRoom; r++) {
      const roomSeed = seedOverride !== undefined ? `${seedOverride}-s${sectorNumber}-r${r}` : undefined;
      rooms.push(this.generateRoom(r, roomSeed));
    }

    return rooms;
  }

  /**
   * Generates an arbitrary sequence of procedural rooms.
   */
  public generateEndlessSequence(
    count: number,
    startRoomNumber = 1,
    seedOverride?: string | number
  ): RoomConfig[] {
    const rooms: RoomConfig[] = [];
    for (let i = 0; i < count; i++) {
      const roomNum = startRoomNumber + i;
      const roomSeed = seedOverride !== undefined ? `${seedOverride}-r${roomNum}` : undefined;
      rooms.push(this.generateRoom(roomNum, roomSeed));
    }
    return rooms;
  }
}
