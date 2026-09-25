/**
 * EndlessDirector module for ChronoShot.
 *
 * Coordinates dynamic wave survival in Endless Mode:
 * - Escalating threat budget proportional to simulation ticks (50 + floor(ticks / 120) * 5)
 * - Active threat tracking across living enemies and materializing units
 * - Fair, distant spatial candidate sampling (min 350px from player, 48px separation, zero obstacle overlap)
 * - 30-tick visual materialization queue telegraphing spawn locations before combat entry
 * - Kill counter and elapsed survival time tracking
 */

import { EnemyConfig, EnemyType } from "../entities/Enemy";
import { Obstacle } from "../entities/Obstacle";
import { testCircleAABB } from "../math/collision";
import { vec2, vecDistance, Vector2D } from "../math/vector";
/**
 * Threat costs for dynamic Endless Mode reinforcement wave scaling.
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
 * Standard archetype timings and collision radii for Endless Mode reinforcement units.
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

export interface MaterializingUnit {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  radius: number;
  ticksRemaining: number;
  config: EnemyConfig;
}

export interface EndlessDirectorConfig {
  arenaWidth?: number;
  arenaHeight?: number;
  minPlayerDistance?: number;
  minUnitSeparation?: number;
  maxConcurrentUnits?: number;
  materializationDurationTicks?: number;
  baseThreatBudget?: number;
  threatGrowthIntervalTicks?: number;
  threatGrowthAmount?: number;
  rng?: () => number;
}

export class EndlessDirector {
  public readonly arenaWidth: number;
  public readonly arenaHeight: number;
  public readonly minPlayerDistance: number;
  public readonly minUnitSeparation: number;
  public readonly maxConcurrentUnits: number;
  public readonly materializationDurationTicks: number;
  public readonly baseThreatBudget: number;
  public readonly threatGrowthIntervalTicks: number;
  public readonly threatGrowthAmount: number;

  private rng: () => number;
  private survivalTicks: number = 0;
  private kills: number = 0;
  private nextUnitId: number = 1;
  private materializationQueue: MaterializingUnit[] = [];

  constructor(config: EndlessDirectorConfig = {}) {
    this.arenaWidth = config.arenaWidth ?? 960;
    this.arenaHeight = config.arenaHeight ?? 640;
    this.minPlayerDistance = config.minPlayerDistance ?? 350;
    this.minUnitSeparation = config.minUnitSeparation ?? 48;
    this.maxConcurrentUnits = config.maxConcurrentUnits ?? 8;
    this.materializationDurationTicks = config.materializationDurationTicks ?? 30;
    this.baseThreatBudget = config.baseThreatBudget ?? 50;
    this.threatGrowthIntervalTicks = config.threatGrowthIntervalTicks ?? 120;
    this.threatGrowthAmount = config.threatGrowthAmount ?? 5;
    this.rng = config.rng ?? Math.random;
  }

  /**
   * Resets simulation ticks, kills, and queued units.
   */
  public reset(): void {
    this.survivalTicks = 0;
    this.kills = 0;
    this.nextUnitId = 1;
    this.materializationQueue = [];
  }

  /**
   * Increments kill count by 1.
   */
  public recordKill(): void {
    this.kills++;
  }

  /**
   * Returns current kill count.
   */
  public getKills(): number {
    return this.kills;
  }

  /**
   * Returns total simulation ticks elapsed in Endless Mode.
   */
  public getSurvivalTicks(): number {
    return this.survivalTicks;
  }

  /**
   * Returns formatted survival time string (MM:SS).
   */
  public getSurvivalTimeFormatted(): string {
    const totalSeconds = Math.floor(this.survivalTicks / 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  /**
   * Calculates the target threat budget for a given tick count.
   * Formula: 50 + floor(ticks / 120) * 5
   */
  public getThreatBudget(ticks: number = this.survivalTicks): number {
    return (
      this.baseThreatBudget +
      Math.floor(ticks / this.threatGrowthIntervalTicks) * this.threatGrowthAmount
    );
  }

  /**
   * Calculates active threat across living enemies and materializing units.
   */
  public calculateActiveThreat(
    livingEnemies: readonly { type: EnemyType; isAlive?: boolean }[]
  ): number {
    const aliveThreat = livingEnemies
      .filter((e) => e.isAlive !== false)
      .reduce((sum, e) => sum + (THREAT_COSTS[e.type] ?? 10), 0);

    const queuedThreat = this.materializationQueue.reduce(
      (sum, m) => sum + (THREAT_COSTS[m.type] ?? 10),
      0
    );

    return aliveThreat + queuedThreat;
  }

  /**
   * Returns the current materialization queue (read-only).
   */
  public getMaterializationQueue(): readonly MaterializingUnit[] {
    return this.materializationQueue;
  }

  /**
   * Evaluates and updates the Endless Mode simulation.
   *
   * Advances elapsed ticks, ticks down the materialization queue,
   * generates candidate reinforcement units when below the target threat budget,
   * and returns any enemies ready to enter active combat.
   *
   * @param ticks Simulation ticks elapsed in this step (default 1)
   * @param playerPos Current player position
   * @param livingEnemies Living enemies currently active in the arena
   * @param obstacles Obstacles in the arena to check collisions against
   * @returns Array of EnemyConfig objects ready to instantiate and enter combat
   */
  public update(
    playerPos: Vector2D,
    livingEnemies: readonly {
      position?: Vector2D;
      x?: number;
      y?: number;
      type: EnemyType;
      isAlive?: boolean;
    }[],
    obstacles: readonly Obstacle[],
    ticks: number = 1
  ): EnemyConfig[] {
    this.survivalTicks += ticks;

    // Tick down materialization queue
    const readyToSpawn: EnemyConfig[] = [];
    const remainingQueue: MaterializingUnit[] = [];

    for (const unit of this.materializationQueue) {
      unit.ticksRemaining -= ticks;
      if (unit.ticksRemaining <= 0) {
        readyToSpawn.push(unit.config);
      } else {
        remainingQueue.push(unit);
      }
    }
    this.materializationQueue = remainingQueue;

    // Check reinforcement capacity
    const activeLiving = livingEnemies.filter((e) => e.isAlive !== false);
    const readyThreat = readyToSpawn.reduce(
      (sum, c) => sum + (THREAT_COSTS[c.type] ?? 10),
      0
    );
    let currentActiveCount =
      activeLiving.length + readyToSpawn.length + this.materializationQueue.length;
    let currentActiveThreat = this.calculateActiveThreat(livingEnemies) + readyThreat;
    const targetBudget = this.getThreatBudget();

    // Spawn reinforcements if below budget and under unit cap
    const candidateTypes: EnemyType[] = ["marksman", "warden", "stalker", "shotgun", "grunt"];

    // Count snipers/marksmen currently active, ready to spawn, or queued
    const readySnipers = readyToSpawn.filter(
      (c) => c.type === "marksman" || c.type === "sniper"
    ).length;
    const currentSnipers =
      activeLiving.filter((e) => e.type === "marksman" || e.type === "sniper").length +
      this.materializationQueue.filter((e) => e.type === "marksman" || e.type === "sniper").length +
      readySnipers;
    let snipersActive = currentSnipers;

    while (
      currentActiveThreat < targetBudget &&
      currentActiveCount < this.maxConcurrentUnits
    ) {
      const threatDeficit = targetBudget - currentActiveThreat;

      // Filter types that fit in deficit and respect constraints
      const eligibleTypes = candidateTypes.filter((type) => {
        const cost = THREAT_COSTS[type];
        if (cost > threatDeficit) return false;
        if ((type === "marksman" || type === "sniper") && snipersActive >= 2) return false;
        return true;
      });

      if (eligibleTypes.length === 0) {
        // If deficit is smaller than any eligible unit, break
        break;
      }

      // Pick an archetype: if threat budget is high (> 80), bias towards higher tiers
      let chosenType: EnemyType;
      if (targetBudget > 80 && eligibleTypes.some((t) => t === "warden" || t === "marksman")) {
        const highTiers = eligibleTypes.filter((t) => t === "warden" || t === "marksman");
        chosenType = highTiers[Math.floor(this.rng() * highTiers.length)];
      } else {
        chosenType = eligibleTypes[Math.floor(this.rng() * eligibleTypes.length)];
      }

      // Sample a safe spawn location
      const existingUnits: Vector2D[] = [
        ...activeLiving.map((e) =>
          e.position ? vec2(e.position.x, e.position.y) : vec2(e.x ?? 0, e.y ?? 0)
        ),
        ...readyToSpawn.map((c) => vec2(c.x, c.y)),
        ...this.materializationQueue.map((m) => vec2(m.x, m.y)),
      ];

      const archetypeConfig = ARCHETYPE_CONFIGS[chosenType] ?? {
        fireCadenceTicks: 50,
        initialDelayTicks: 25,
        radius: 15,
      };

      const spawnPos = this.sampleSafePosition(
        playerPos,
        existingUnits,
        obstacles,
        archetypeConfig.radius
      );

      if (!spawnPos) {
        // Could not find a safe position after max attempts, abort this wave attempt
        break;
      }

      const enemyId = `endless-${chosenType}-${this.nextUnitId++}`;
      const enemyConfig: EnemyConfig = {
        id: enemyId,
        type: chosenType,
        x: spawnPos.x,
        y: spawnPos.y,
        radius: archetypeConfig.radius,
        fireCadenceTicks: archetypeConfig.fireCadenceTicks,
        initialDelayTicks: archetypeConfig.initialDelayTicks,
        maxShields: chosenType === "warden" ? 2 : chosenType === "shotgun" ? 1 : 0,
      };

      this.materializationQueue.push({
        id: enemyId,
        type: chosenType,
        x: spawnPos.x,
        y: spawnPos.y,
        radius: archetypeConfig.radius,
        ticksRemaining: this.materializationDurationTicks,
        config: enemyConfig,
      });

      currentActiveThreat += THREAT_COSTS[chosenType];
      currentActiveCount++;
      if (chosenType === "marksman" || chosenType === "sniper") {
        snipersActive++;
      }
    }

    return readyToSpawn;
  }

  /**
   * Samples a position satisfying:
   * 1. Distance to player >= minPlayerDistance (350px)
   * 2. Distance to other units >= minUnitSeparation (48px)
   * 3. Collision clearance with all obstacles
   */
  public sampleSafePosition(
    playerPos: Vector2D,
    existingUnits: readonly Vector2D[],
    obstacles: readonly Obstacle[],
    unitRadius: number,
    maxAttempts: number = 60
  ): Vector2D | null {
    const margin = 48;
    const minX = margin;
    const maxX = this.arenaWidth - margin;
    const minY = margin;
    const maxY = this.arenaHeight - margin;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateX = minX + this.rng() * (maxX - minX);
      const candidateY = minY + this.rng() * (maxY - minY);
      const candidate = vec2(candidateX, candidateY);

      // 1. Min distance to player
      if (vecDistance(candidate, playerPos) < this.minPlayerDistance) {
        continue;
      }

      // 2. Min distance to existing units
      const tooCloseToUnit = existingUnits.some(
        (unit) => vecDistance(candidate, unit) < this.minUnitSeparation
      );
      if (tooCloseToUnit) {
        continue;
      }

      // 3. Obstacle collision check
      const overlapsObstacle = obstacles.some(
        (obstacle) =>
          testCircleAABB(
            candidate,
            unitRadius + 4,
            obstacle.bounds.min,
            obstacle.bounds.max
          ) !== null
      );
      if (overlapsObstacle) {
        continue;
      }

      return candidate;
    }

    return null;
  }
}
