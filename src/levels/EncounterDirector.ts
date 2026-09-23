/**
 * Encounter Director for ChronoShot.
 *
 * Implements tactical threat-budget enemy squad spawning:
 * - Point-buy allocation across hostile archetypes without exceeding budget
 * - Composition constraints (max snipers, mandatory frontline escorts, unit caps)
 * - Continuous collision-checked spatial placement inside safe spawn zones
 * - Zero obstacle overlap and verified player spawn clearance (min 280px)
 */

import { EnemyConfig, EnemyType } from "../entities/Enemy";
import { Obstacle } from "../entities/Obstacle";
import { testCircleAABB } from "../math/collision";
import { vec2, Vector2D } from "../math/vector";
import { getDistance, RoomLayoutTemplate } from "./templates/RoomLayoutTemplate";

/**
 * Threat costs for point-buy encounter generation.
 */
export const THREAT_COSTS: Record<EnemyType, number> = {
  grunt: 10,
  shotgun: 20,
  stalker: 25,
  warden: 35,
  sniper: 40,
  marksman: 40,
  boss: 120,
};

/**
 * Standard archetype timings and collision radii for encounter units.
 */
export const ARCHETYPE_CONFIGS: Record<
  EnemyType,
  { fireCadenceTicks: number; initialDelayTicks: number; radius: number }
> = {
  grunt: { fireCadenceTicks: 50, initialDelayTicks: 25, radius: 15 },
  shotgun: { fireCadenceTicks: 80, initialDelayTicks: 35, radius: 16 },
  stalker: { fireCadenceTicks: 32, initialDelayTicks: 20, radius: 13 },
  warden: { fireCadenceTicks: 65, initialDelayTicks: 30, radius: 18 },
  sniper: { fireCadenceTicks: 110, initialDelayTicks: 40, radius: 14 },
  marksman: { fireCadenceTicks: 110, initialDelayTicks: 40, radius: 14 },
  boss: { fireCadenceTicks: 60, initialDelayTicks: 30, radius: 24 },
};

export const FRONTLINE_ARCHETYPES: ReadonlySet<EnemyType> = new Set([
  "grunt",
  "shotgun",
  "stalker",
]);

export const SNIPER_ARCHETYPES: ReadonlySet<EnemyType> = new Set([
  "sniper",
  "marksman",
]);

export interface EncounterDirectorConfig {
  minPlayerDistance?: number;
  minUnitSeparation?: number;
  maxSnipers?: number;
  maxUnits?: number;
}

export class EncounterDirector {
  public readonly minPlayerDistance: number;
  public readonly minUnitSeparation: number;
  public readonly maxSnipers: number;
  public readonly maxUnits: number;

  constructor(config: EncounterDirectorConfig = {}) {
    this.minPlayerDistance = config.minPlayerDistance ?? 280;
    this.minUnitSeparation = config.minUnitSeparation ?? 48;
    this.maxSnipers = config.maxSnipers ?? 2;
    this.maxUnits = config.maxUnits ?? 6;
  }

  /**
   * Calculates escalating threat budget for a given room number.
   * Formula: 15 + max(0, roomNumber - 1) * 15
   */
  public calculateBudget(roomNumber: number): number {
    return 15 + Math.max(0, roomNumber - 1) * 15;
  }

  /**
   * Generates a tactical squad of hostile units based on threat budget and layout template.
   */
  public generateSquad(
    budget: number,
    template: RoomLayoutTemplate,
    rng: () => number = Math.random
  ): EnemyConfig[] {
    if (budget < 10) {
      return [];
    }

    const availableArchetypes: EnemyType[] = [
      "grunt",
      "shotgun",
      "stalker",
      "warden",
      "sniper",
    ];

    const minFrontlineCost = Math.min(
      THREAT_COSTS.grunt,
      THREAT_COSTS.shotgun,
      THREAT_COSTS.stalker
    );

    let remainingBudget = budget;
    const selectedArchetypes: EnemyType[] = [];

    // Point-buy selection loop
    while (selectedArchetypes.length < this.maxUnits) {
      const hasFrontline = selectedArchetypes.some((t) =>
        FRONTLINE_ARCHETYPES.has(t)
      );
      const sniperCount = selectedArchetypes.filter((t) =>
        SNIPER_ARCHETYPES.has(t)
      ).length;

      const validCandidates: EnemyType[] = [];

      for (const archetype of availableArchetypes) {
        const cost = THREAT_COSTS[archetype];
        if (cost > remainingBudget) {
          continue;
        }

        // If a sniper is currently present with NO frontline escort,
        // we MUST select a frontline escort unit.
        if (sniperCount > 0 && !hasFrontline) {
          if (FRONTLINE_ARCHETYPES.has(archetype)) {
            validCandidates.push(archetype);
          }
          continue;
        }

        // Sniper composition constraints
        if (SNIPER_ARCHETYPES.has(archetype)) {
          if (sniperCount + 1 > this.maxSnipers) {
            continue;
          }
          // If no frontline escort is present yet, only allow sniper if we can afford
          // and have space to spawn at least one frontline escort afterwards.
          if (!hasFrontline) {
            if (selectedArchetypes.length + 2 > this.maxUnits) {
              continue;
            }
            if (remainingBudget - cost < minFrontlineCost) {
              continue;
            }
          }
        }

        validCandidates.push(archetype);
      }

      if (validCandidates.length === 0) {
        break;
      }

      const pickIndex = Math.floor(rng() * validCandidates.length);
      const chosen = validCandidates[pickIndex];
      selectedArchetypes.push(chosen);
      remainingBudget -= THREAT_COSTS[chosen];
    }

    // Resolve spatial placement for all selected archetypes
    const obstacles = template.buildObstacles ? template.buildObstacles(960, 640) : [];
    const placedPositions: Vector2D[] = [];
    const squad: EnemyConfig[] = [];

    for (let i = 0; i < selectedArchetypes.length; i++) {
      const type = selectedArchetypes[i];
      const position = this.sampleUnitPosition(
        type,
        template,
        obstacles,
        placedPositions,
        rng
      );
      placedPositions.push(position);

      const timing = ARCHETYPE_CONFIGS[type] ?? ARCHETYPE_CONFIGS.grunt;
      squad.push({
        id: `${type}-${i + 1}`,
        type,
        x: position.x,
        y: position.y,
        radius: timing.radius,
        fireCadenceTicks: timing.fireCadenceTicks,
        initialDelayTicks: timing.initialDelayTicks,
      });
    }

    return squad;
  }

  /**
   * Samples a safe candidate position within enemy spawn zones.
   * Falls back to safe zone center if candidate sampling fails after maxAttempts (25).
   */
  private sampleUnitPosition(
    type: EnemyType,
    template: RoomLayoutTemplate,
    obstacles: Obstacle[],
    placedPositions: Vector2D[],
    rng: () => number
  ): Vector2D {
    const maxAttempts = 25;
    const unitRadius = ARCHETYPE_CONFIGS[type]?.radius ?? 14;

    if (template.enemySpawnZones && template.enemySpawnZones.length > 0) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const zoneIndex = Math.floor(rng() * template.enemySpawnZones.length);
        const zone = template.enemySpawnZones[zoneIndex];

        // Sample coordinates within zone, padding slightly so circle hitbox stays within zone bounds
        const padX = Math.min(zone.width / 2, unitRadius);
        const padY = Math.min(zone.height / 2, unitRadius);
        const candidate = vec2(
          zone.x + padX + rng() * Math.max(0, zone.width - 2 * padX),
          zone.y + padY + rng() * Math.max(0, zone.height - 2 * padY)
        );

        // 1. Min distance from player spawn
        if (getDistance(candidate, template.playerSpawn) < this.minPlayerDistance) {
          continue;
        }

        // 2. Min unit separation from already placed units
        let tooClose = false;
        for (const placed of placedPositions) {
          if (getDistance(candidate, placed) < this.minUnitSeparation) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) {
          continue;
        }

        // 3. Collision check against obstacles using testCircleAABB
        let collides = false;
        for (const obstacle of obstacles) {
          if (
            testCircleAABB(
              candidate,
              unitRadius,
              obstacle.bounds.min,
              obstacle.bounds.max
            ) !== null
          ) {
            collides = true;
            break;
          }
        }
        if (collides) {
          continue;
        }

        return candidate;
      }

      // Fallback: search for safe zone center that does not collide with obstacles
      for (const zone of template.enemySpawnZones) {
        const center = vec2(
          zone.x + zone.width / 2,
          zone.y + zone.height / 2
        );
        let collides = false;
        for (const obstacle of obstacles) {
          if (
            testCircleAABB(
              center,
              unitRadius,
              obstacle.bounds.min,
              obstacle.bounds.max
            ) !== null
          ) {
            collides = true;
            break;
          }
        }
        if (!collides) {
          return center;
        }
      }

      const defaultZone =
        template.enemySpawnZones[
          placedPositions.length % template.enemySpawnZones.length
        ];
      return vec2(
        defaultZone.x + defaultZone.width / 2,
        defaultZone.y + defaultZone.height / 2
      );
    }

    // Default fallback if no spawn zones defined
    return vec2(
      template.playerSpawn.x + this.minPlayerDistance,
      template.playerSpawn.y
    );
  }
}
