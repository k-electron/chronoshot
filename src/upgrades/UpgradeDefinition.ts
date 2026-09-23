/**
 * UpgradeDefinition module for ChronoShot.
 *
 * Defines declarative data contracts for tactical augmentations,
 * continuous stat modifiers, and lifecycle event hooks.
 */
export type UpgradeTier = "standard" | "rare" | "overclock";

export interface UpgradeModifiers {
  magSizeBonus?: number;
  reloadTickReduction?: number;
  shieldChargesBonus?: number;
  speedMultiplier?: number;
  bulletSpeedMultiplier?: number;
}

export interface UpgradeDefinition {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly description: string;
  readonly statHighlight: string;
  readonly accentColor?: string;
  readonly tier?: UpgradeTier;
  readonly maxStacks?: number;
  readonly modifiers?: UpgradeModifiers;
  readonly onAcquire?: (player?: any) => void;
  readonly onRoomStart?: (player?: any) => void;
  readonly onTick?: (player?: any, deltaTicks?: number) => void;
  readonly onDischarge?: (player?: any) => void;
}
