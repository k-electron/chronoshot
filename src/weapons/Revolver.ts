/**
 * Revolver implementation for ChronoShot.
 *
 * Models a 6-round cylinder firearm with discrete chamber state tracking,
 * continuous cylinder indexing, cooldown intervals, dry-fire detection,
 * and TimeGovernor action tick queue integration.
 */

import { TimeGovernor } from "../engine/TimeGovernor";
import { ChamberState, FireResult, Weapon, WeaponConfig } from "./Weapon";

export const DEFAULT_REVOLVER_CONFIG: WeaponConfig = {
  name: "Revolver",
  magSize: 6,
  fireTickBurst: 6,
  reloadTickBurst: 30,
  cooldownTicks: 10,
  bulletSpeed: 800,
  spreadAngle: 0,
  pellets: 1,
};

export class Revolver implements Weapon {
  public readonly config: WeaponConfig;

  private chambers: ChamberState[];
  private currentChamberIndex: number = 0;
  private currentAmmo: number;
  private cooldownRemainingTicks: number = 0;
  private dryFiredThisFrame: boolean = false;

  constructor(config: Partial<WeaponConfig> = {}) {
    this.config = { ...DEFAULT_REVOLVER_CONFIG, ...config };
    this.currentAmmo = this.config.magSize;
    this.chambers = new Array<ChamberState>(this.config.magSize).fill("loaded");
  }

  public getAmmo(): number {
    return this.currentAmmo;
  }

  public getMagSize(): number {
    return this.config.magSize;
  }

  public getCooldownRemaining(): number {
    return this.cooldownRemainingTicks;
  }

  public isReady(): boolean {
    return this.cooldownRemainingTicks <= 0;
  }

  public isReloading(): boolean {
    return false;
  }

  /**
   * Returns a copy of the cylinder chambers array for HUD inspection.
   */
  public getChambers(): readonly ChamberState[] {
    return [...this.chambers];
  }

  /**
   * Returns the 0-based index of the currently active chamber aligned with the barrel.
   */
  public getCurrentChamberIndex(): number {
    return this.currentChamberIndex;
  }

  /**
   * Checks if dry fire was triggered recently.
   */
  public wasDryFired(): boolean {
    return this.dryFiredThisFrame;
  }

  /**
   * Clears the dry-fire flag after consumption by HUD or audio.
   */
  public clearDryFire(): void {
    this.dryFiredThisFrame = false;
  }

  /**
   * Ticks down weapon cooldowns by discrete simulation ticks.
   */
  public update(deltaTicks: number = 1): void {
    if (this.cooldownRemainingTicks > 0) {
      this.cooldownRemainingTicks = Math.max(0, this.cooldownRemainingTicks - deltaTicks);
    }
  }

  /**
   * Attempts to discharge the round aligned with the firing pin.
   * - If on cooldown: returns without firing or dry-firing.
   * - If empty or current chamber is spent: triggers dry-fire, rotates cylinder, returns dryFired.
   * - If chamber is loaded: marks chamber spent, decrements ammo, rotates cylinder, queues fire burst on TimeGovernor.
   */
  public fire(governor?: TimeGovernor): FireResult {
    this.dryFiredThisFrame = false;

    // Cannot fire while cycling between shots
    if (this.cooldownRemainingTicks > 0) {
      return {
        fired: false,
        dryFired: false,
        pellets: 0,
        bulletSpeed: 0,
        spreadAngle: 0,
      };
    }

    const chamber = this.chambers[this.currentChamberIndex];
    if (chamber !== "loaded" || this.currentAmmo <= 0) {
      // Dry-fire click: empty chamber under the hammer
      this.dryFiredThisFrame = true;
      // Cylinder still rotates on trigger pull
      this.currentChamberIndex = (this.currentChamberIndex + 1) % this.config.magSize;
      return {
        fired: false,
        dryFired: true,
        pellets: 0,
        bulletSpeed: 0,
        spreadAngle: 0,
      };
    }

    // Fire loaded round
    this.chambers[this.currentChamberIndex] = "spent";
    this.currentChamberIndex = (this.currentChamberIndex + 1) % this.config.magSize;
    this.currentAmmo = Math.max(0, this.currentAmmo - 1);
    this.cooldownRemainingTicks = this.config.cooldownTicks;

    if (governor) {
      governor.queueFireBurst(this.config.fireTickBurst);
    }

    return {
      fired: true,
      dryFired: false,
      pellets: this.config.pellets,
      bulletSpeed: this.config.bulletSpeed,
      spreadAngle: this.config.spreadAngle,
    };
  }

  /**
   * Reloads the cylinder to full capacity (6 loaded rounds),
   * sets cooldown to prevent instant spamming, and queues the reload tick burst on TimeGovernor.
   *
   * @returns true if reload was performed, false if cylinder was already full.
   */
  public reload(governor?: TimeGovernor): boolean {
    if (this.currentAmmo === this.config.magSize) {
      return false; // Cylinder is already fully loaded
    }

    // Refill all chambers
    this.chambers.fill("loaded");
    this.currentAmmo = this.config.magSize;
    this.currentChamberIndex = 0;
    this.cooldownRemainingTicks = this.config.cooldownTicks;
    this.dryFiredThisFrame = false;

    if (governor) {
      governor.queueReloadBurst(this.config.reloadTickBurst);
    }

    return true;
  }

  /**
   * Resets cylinder to full ammunition and zero cooldown.
   */
  public reset(): void {
    this.chambers.fill("loaded");
    this.currentAmmo = this.config.magSize;
    this.currentChamberIndex = 0;
    this.cooldownRemainingTicks = 0;
    this.dryFiredThisFrame = false;
  }
}
