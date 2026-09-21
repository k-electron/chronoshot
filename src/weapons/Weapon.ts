/**
 * Weapon system module for ChronoShot.
 *
 * Defines modular firearm configuration schemas, ballistics profiles,
 * and base interfaces for weapons, supporting ammo tracking,
 * cooldown cycles, action tick queuing on the TimeGovernor,
 * and dry-fire detection.
 */

import { TimeGovernor } from "../engine/TimeGovernor";

export interface WeaponConfig {
  /**
   * Display name of the firearm.
   */
  readonly name: string;

  /**
   * Magazine / cylinder capacity (e.g. 6 rounds for standard revolver).
   */
  readonly magSize: number;

  /**
   * Discrete simulation ticks immediately queued to TimeGovernor upon discharge.
   */
  readonly fireTickBurst: number;

  /**
   * Discrete simulation ticks queued to TimeGovernor upon executing a reload.
   */
  readonly reloadTickBurst: number;

  /**
   * Simulation cooldown ticks required between consecutive discharges.
   */
  readonly cooldownTicks: number;

  /**
   * Velocity of discharged projectile in world pixels per second.
   */
  readonly bulletSpeed: number;

  /**
   * Angular projectile dispersion in radians (0 for pinpoint precision).
   */
  readonly spreadAngle: number;

  /**
   * Number of simultaneous projectile pellets discharged per trigger pull.
   */
  readonly pellets: number;
}

export type ChamberState = "loaded" | "spent" | "empty";

export interface FireResult {
  /**
   * Whether the weapon successfully fired a round.
   */
  readonly fired: boolean;

  /**
   * Whether trigger pull resulted in a dry-fire click (empty chamber or zero ammo).
   */
  readonly dryFired: boolean;

  /**
   * Number of pellets discharged.
   */
  readonly pellets: number;

  /**
   * Projectile muzzle velocity in world pixels per second.
   */
  readonly bulletSpeed: number;

  /**
   * Angular dispersion for this shot in radians.
   */
  readonly spreadAngle: number;
}

export interface Weapon {
  readonly config: WeaponConfig;

  /**
   * Current remaining ammunition count.
   */
  getAmmo(): number;

  /**
   * Total maximum capacity of magazine/cylinder.
   */
  getMagSize(): number;

  /**
   * Remaining cooldown ticks before next shot can be fired.
   */
  getCooldownRemaining(): number;

  /**
   * True if weapon can fire right now (not on cooldown).
   */
  isReady(): boolean;

  /**
   * Advances internal cooldown timers by the specified simulation tick count.
   */
  update(deltaTicks?: number): void;

  /**
   * Attempts to fire the weapon.
   * If successful, consumes ammunition, applies cooldown, and queues fire burst on TimeGovernor.
   * If empty, flags a dry-fire event.
   */
  fire(governor?: TimeGovernor): FireResult;

  /**
   * Reloads the weapon back to full capacity, resetting cooldown and queuing reload burst.
   * Returns true if reload occurred, false if already at max capacity.
   */
  reload(governor?: TimeGovernor): boolean;

  /**
   * Resets weapon to full ammo and zero cooldown.
   */
  reset(): void;
}
