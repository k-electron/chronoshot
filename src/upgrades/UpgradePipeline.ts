/**
 * Upgrade Pipeline module for ChronoShot.
 *
 * Manages active upgrade instances and their stack counts on a player.
 * Computes compounded stat modifiers (additive bonuses, multiplicative speed scalers)
 * and dispatches room/tick lifecycle hooks to all active combat augmentations.
 */

import { UpgradeDefinition, UpgradeModifiers } from "./UpgradeDefinition";

export interface ActiveUpgradeEntry {
  definition: UpgradeDefinition;
  count: number;
}

export class UpgradePipeline {
  private activeUpgrades = new Map<string, { definition: UpgradeDefinition; count: number }>();

  /**
   * Installs or increments an upgrade stack on the player pipeline.
   * Enforces max stack limits and executes `onAcquire` callback.
   */
  public acquire(
    upgrade: UpgradeDefinition,
    player?: any
  ): { installed: boolean; currentStacks: number } {
    const maxStacks = upgrade.maxStacks ?? 1;
    const existing = this.activeUpgrades.get(upgrade.id);
    const currentCount = existing ? existing.count : 0;

    if (currentCount >= maxStacks) {
      return { installed: false, currentStacks: maxStacks };
    }

    const currentStacks = currentCount + 1;
    this.activeUpgrades.set(upgrade.id, { definition: upgrade, count: currentStacks });
    upgrade.onAcquire?.(player);

    return { installed: true, currentStacks };
  }

  /**
   * Removes an active upgrade by ID.
   */
  public remove(id: string): boolean {
    return this.activeUpgrades.delete(id);
  }

  /**
   * Returns true if the upgrade is active with count > 0.
   */
  public has(id: string): boolean {
    const entry = this.activeUpgrades.get(id);
    return entry !== undefined && entry.count > 0;
  }

  /**
   * Returns active stack count for the given upgrade ID.
   */
  public getCount(id: string): number {
    return this.activeUpgrades.get(id)?.count ?? 0;
  }

  /**
   * Returns the upgrade definition if active, or undefined.
   */
  public getUpgrade(id: string): UpgradeDefinition | undefined {
    return this.activeUpgrades.get(id)?.definition;
  }

  /**
   * Returns a list of all active upgrade entries.
   */
  public getAll(): { definition: UpgradeDefinition; count: number }[] {
    return Array.from(this.activeUpgrades.values());
  }

  /**
   * Returns a list of active upgrade IDs.
   */
  public getActiveIds(): string[] {
    return Array.from(this.activeUpgrades.keys());
  }

  /**
   * Computes compounded stat modifiers from all active upgrades.
   * Additive modifiers scale linearly with stack count (mod * N).
   * Multiplicative multipliers scale exponentially (mod^N).
   */
  public computeModifiers(): Required<UpgradeModifiers> {
    let magSizeBonus = 0;
    let reloadTickReduction = 0;
    let shieldChargesBonus = 0;
    let speedMultiplier = 1.0;
    let bulletSpeedMultiplier = 1.0;

    for (const entry of this.activeUpgrades.values()) {
      const n = entry.count;
      const modifiers = entry.definition.modifiers;
      if (!modifiers) continue;

      if (modifiers.magSizeBonus !== undefined) {
        magSizeBonus += modifiers.magSizeBonus * n;
      }
      if (modifiers.reloadTickReduction !== undefined) {
        reloadTickReduction += modifiers.reloadTickReduction * n;
      }
      if (modifiers.shieldChargesBonus !== undefined) {
        shieldChargesBonus += modifiers.shieldChargesBonus * n;
      }
      if (modifiers.speedMultiplier !== undefined) {
        speedMultiplier *= Math.pow(modifiers.speedMultiplier, n);
      }
      if (modifiers.bulletSpeedMultiplier !== undefined) {
        bulletSpeedMultiplier *= Math.pow(modifiers.bulletSpeedMultiplier, n);
      }
    }

    return {
      magSizeBonus,
      reloadTickReduction,
      shieldChargesBonus,
      speedMultiplier,
      bulletSpeedMultiplier,
    };
  }

  /**
   * Dispatches room-start lifecycle events to all installed upgrades.
   */
  public onRoomStart(player?: any): void {
    for (const entry of this.activeUpgrades.values()) {
      entry.definition.onRoomStart?.(player);
    }
  }

  /**
   * Dispatches simulation tick events to all installed upgrades.
   */
  public onTick(player?: any, deltaTicks?: number): void {
    for (const entry of this.activeUpgrades.values()) {
      entry.definition.onTick?.(player, deltaTicks);
    }
  }

  /**
   * Clears all active upgrades.
   */
  public reset(): void {
    this.activeUpgrades.clear();
  }
}
