/**
 * Upgrade Registry for ChronoShot.
 *
 * Central catalog of tactical player augmentations. Supports registration,
 * query lookup, and dynamic draft pool sampling with stack limit filtering.
 */

import { UpgradeDefinition } from "./UpgradeDefinition";

export class UpgradeRegistry {
  private registered = new Map<string, UpgradeDefinition>();

  /**
   * Registers an upgrade definition into the catalog.
   * If an upgrade with the same ID already exists, it is updated.
   */
  public register(upgrade: UpgradeDefinition): void {
    this.registered.set(upgrade.id, upgrade);
  }

  /**
   * Retrieves an upgrade definition by its unique identifier.
   */
  public get(id: string): UpgradeDefinition | undefined {
    return this.registered.get(id);
  }

  /**
   * Returns all registered upgrade definitions.
   */
  public getAll(): UpgradeDefinition[] {
    return Array.from(this.registered.values());
  }

  /**
   * Clears all registered upgrades from the catalog.
   */
  public clear(): void {
    this.registered.clear();
  }

  /**
   * Samples a random subset of distinct upgrade definitions from the registry for a draft reward.
   *
   * Filters out upgrades that cannot be drafted:
   * - Non-stackable upgrades (maxStacks = 1, the default) already present in activeUpgradeIds.
   * - Upgrades that have reached their maxStacks limit.
   *
   * @param count Number of distinct upgrades to draft.
   * @param activeUpgradeIds Current upgrade IDs held by the player (array or Set).
   * @param rng Optional pseudo-random number generator (defaults to Math.random).
   * @returns An array of up to `count` distinct upgrade definitions.
   */
  public sampleDraft(
    count: number,
    activeUpgradeIds?: string[] | Set<string>,
    rng: () => number = Math.random
  ): UpgradeDefinition[] {
    if (count <= 0) {
      return [];
    }

    // Build stack count map for active upgrades
    const activeCounts = new Map<string, number>();
    if (Array.isArray(activeUpgradeIds)) {
      for (const id of activeUpgradeIds) {
        activeCounts.set(id, (activeCounts.get(id) ?? 0) + 1);
      }
    } else if (activeUpgradeIds instanceof Set) {
      for (const id of activeUpgradeIds) {
        activeCounts.set(id, (activeCounts.get(id) ?? 0) + 1);
      }
    }

    // Filter available upgrades based on stack limits
    const eligible: UpgradeDefinition[] = [];
    for (const upgrade of this.registered.values()) {
      const maxStacks = upgrade.maxStacks ?? 1;
      const currentStacks = activeCounts.get(upgrade.id) ?? 0;
      if (currentStacks < maxStacks) {
        eligible.push(upgrade);
      }
    }

    if (eligible.length <= count) {
      return [...eligible];
    }

    // Draw distinct upgrades without replacement
    const pool = [...eligible];
    const drawn: UpgradeDefinition[] = [];
    const drawCount = Math.min(count, pool.length);

    for (let i = 0; i < drawCount; i++) {
      const index = Math.floor(rng() * pool.length);
      drawn.push(pool[index]);
      pool.splice(index, 1);
    }

    return drawn;
  }
}

/**
 * Global default upgrade registry instance.
 */
export const DEFAULT_UPGRADE_REGISTRY = new UpgradeRegistry();
