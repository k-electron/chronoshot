/**
 * Room Layout Template definitions and registry for ChronoShot.
 *
 * Defines modular geometric layouts with:
 * - Deterministic tactical obstacle generation
 * - Validated player spawn coordinates
 * - Exit portal placement
 * - Dedicated enemy spawn zones providing guaranteed minimum player distance
 */

import { Obstacle } from "../../entities/Obstacle";
import { ExitPortal } from "../Room";
import { vec2, Vector2D } from "../../math/vector";

export interface SpawnZone {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RoomLayoutTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly playerSpawn: Vector2D;
  readonly exitPortal: ExitPortal;
  readonly buildObstacles: (arenaWidth?: number, arenaHeight?: number) => Obstacle[];
  readonly enemySpawnZones: SpawnZone[];
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function getDistance(a: Vector2D, b: Vector2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Validates that all enemy spawn zones in a template maintain a minimum
 * separation distance from the player spawn position (default 280px).
 */
export function validateSpawnSeparation(
  template: RoomLayoutTemplate,
  minDistance = 280
): boolean {
  const p = template.playerSpawn;
  for (const zone of template.enemySpawnZones) {
    // Check closest corner or center of the zone to player
    const closestX = Math.max(zone.x, Math.min(p.x, zone.x + zone.width));
    const closestY = Math.max(zone.y, Math.min(p.y, zone.y + zone.height));
    const dist = getDistance(p, vec2(closestX, closestY));
    if (dist < minDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Registry catalog for available room layout templates.
 */
export class LayoutTemplateRegistry {
  private templates = new Map<string, RoomLayoutTemplate>();

  public register(template: RoomLayoutTemplate): void {
    this.templates.set(template.id, template);
  }

  public get(id: string): RoomLayoutTemplate | undefined {
    return this.templates.get(id);
  }

  public getAll(): RoomLayoutTemplate[] {
    return Array.from(this.templates.values());
  }

  public clear(): void {
    this.templates.clear();
  }

  /**
   * Samples a random template from registered entries.
   */
  public sample(rng: () => number = Math.random): RoomLayoutTemplate {
    const all = this.getAll();
    if (all.length === 0) {
      throw new Error("Cannot sample from an empty LayoutTemplateRegistry");
    }
    const index = Math.floor(rng() * all.length);
    return all[index];
  }
}

export const DEFAULT_LAYOUT_REGISTRY = new LayoutTemplateRegistry();
