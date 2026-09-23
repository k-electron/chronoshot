/**
 * Revolver implementation for ChronoShot.
 *
 * Models a 6-round cylinder firearm with discrete chamber state tracking,
 * continuous cylinder indexing, cooldown intervals, dry-fire detection,
 * and TimeGovernor action tick queue integration.
 */

import { TimeGovernor } from "../engine/TimeGovernor";
import { ChamberState, FireResult, ReloadUpdateResult, Weapon, WeaponConfig } from "./Weapon";

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
  private reloadTickBurst?: number;

  private reloading: boolean = false;
  private reloadTicksRemaining: number = 0;
  private reloadTicksTotal: number = 0;
  private reloadInitialSpentChambers: number = 0;
  private reloadChambersLoadedCount: number = 0;

  constructor(config: Partial<WeaponConfig> = {}) {
    this.config = { ...DEFAULT_REVOLVER_CONFIG, ...config };
    this.currentAmmo = this.config.magSize;
    this.chambers = new Array<ChamberState>(this.config.magSize).fill("loaded");
    if (config.reloadTickBurst !== undefined) {
      this.reloadTickBurst = config.reloadTickBurst;
    }
  }

  public getReloadTickBurst(): number {
    return this.reloadTickBurst ?? this.config.reloadTickBurst;
  }

  public setReloadTickBurst(burst: number): void {
    this.reloadTickBurst = burst;
  }

  public reconfigure(config: Partial<WeaponConfig>): void {
    Object.assign(this.config, config);
    if (config.reloadTickBurst !== undefined) {
      this.reloadTickBurst = config.reloadTickBurst;
    }
    if (config.magSize !== undefined) {
      this.chambers = new Array<ChamberState>(this.config.magSize).fill("loaded");
      this.currentAmmo = this.config.magSize;
      this.currentChamberIndex = 0;
    }
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
    return !this.reloading && this.cooldownRemainingTicks <= 0;
  }

  public isReloading(): boolean {
    return this.reloading;
  }

  public getReloadProgress(): number {
    if (!this.reloading || this.reloadTicksTotal <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, (this.reloadTicksTotal - this.reloadTicksRemaining) / this.reloadTicksTotal));
  }

  public getReloadTicksRemaining(): number {
    return this.reloadTicksRemaining;
  }

  public getReloadTicksTotal(): number {
    return this.reloadTicksTotal;
  }

  /**
   * Starts a stateful multi-tick reload cycle.
   * Returns true if reload started, false if already reloading or already at full capacity.
   */
  public startReload(totalTicks?: number): boolean {
    if (this.currentAmmo === this.config.magSize || this.reloading) {
      return false;
    }

    const burst = totalTicks ?? this.getReloadTickBurst();
    this.reloading = true;
    this.reloadTicksTotal = Math.max(1, burst);
    this.reloadTicksRemaining = this.reloadTicksTotal;
    this.reloadInitialSpentChambers = this.config.magSize - this.currentAmmo;
    this.reloadChambersLoadedCount = 0;
    this.dryFiredThisFrame = false;

    return true;
  }

  /**
   * Advances the reload timer by deltaTicks, sequentially seating chambers.
   */
  public updateReload(deltaTicks: number = 1): ReloadUpdateResult {
    if (!this.reloading) {
      return { completed: false, justLoadedChamber: false, loadedChambers: this.currentAmmo };
    }

    const ticksToApply = Math.min(deltaTicks, this.reloadTicksRemaining);
    this.reloadTicksRemaining -= ticksToApply;

    const elapsedTicks = this.reloadTicksTotal - this.reloadTicksRemaining;
    const isFinished = this.reloadTicksRemaining <= 0;

    const shouldBeLoaded = isFinished
      ? this.reloadInitialSpentChambers
      : Math.min(
          this.reloadInitialSpentChambers,
          Math.floor((elapsedTicks / this.reloadTicksTotal) * this.reloadInitialSpentChambers)
        );

    let justLoadedChamber = false;
    while (this.reloadChambersLoadedCount < shouldBeLoaded) {
      this.reloadChambersLoadedCount++;
      justLoadedChamber = true;

      const spentIdx = this.chambers.indexOf("spent");
      if (spentIdx !== -1) {
        this.chambers[spentIdx] = "loaded";
      }
      this.currentAmmo = Math.min(this.config.magSize, this.currentAmmo + 1);
    }

    if (isFinished) {
      this.reloading = false;
      this.reloadTicksRemaining = 0;
      this.currentAmmo = this.config.magSize;
      this.chambers.fill("loaded");
      this.currentChamberIndex = 0;
      this.cooldownRemainingTicks = this.config.cooldownTicks;

      return { completed: true, justLoadedChamber, loadedChambers: this.currentAmmo };
    }

    return { completed: false, justLoadedChamber, loadedChambers: this.currentAmmo };
  }

  /**
   * Cancels an active reload, preserving any chambers that finished seating.
   * Returns count of retained loaded chambers.
   */
  public cancelReload(): number {
    if (!this.reloading) {
      return this.currentAmmo;
    }

    this.reloading = false;
    this.reloadTicksRemaining = 0;
    return this.currentAmmo;
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

    // Cannot fire while reloading or cycling between shots
    if (this.reloading || this.cooldownRemainingTicks > 0) {
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
   * Reloads the cylinder to full capacity (e.g. 6 or 8 loaded rounds),
   * sets cooldown to prevent instant spamming, and queues the reload tick burst on TimeGovernor.
   *
   * @returns true if reload was performed, false if cylinder was already full.
   */
  public reload(governor?: TimeGovernor, reloadTickBurst?: number): boolean {
    if (this.currentAmmo === this.config.magSize && !this.reloading) {
      return false; // Cylinder is already fully loaded
    }
    this.cancelReload();

    // Refill all chambers
    if (this.chambers.length !== this.config.magSize) {
      this.chambers = new Array<ChamberState>(this.config.magSize).fill("loaded");
    } else {
      this.chambers.fill("loaded");
    }
    this.currentAmmo = this.config.magSize;
    this.currentChamberIndex = 0;
    this.cooldownRemainingTicks = this.config.cooldownTicks;
    this.dryFiredThisFrame = false;

    const burst = reloadTickBurst ?? this.getReloadTickBurst();
    if (governor) {
      governor.queueReloadBurst(burst);
    }

    return true;
  }

  /**
   * Resets cylinder to full ammunition and zero cooldown.
   */
  public reset(): void {
    this.cancelReload();
    if (this.chambers.length !== this.config.magSize) {
      this.chambers = new Array<ChamberState>(this.config.magSize).fill("loaded");
    } else {
      this.chambers.fill("loaded");
    }
    this.currentAmmo = this.config.magSize;
    this.currentChamberIndex = 0;
    this.cooldownRemainingTicks = 0;
    this.dryFiredThisFrame = false;
  }
}
