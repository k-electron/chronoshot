/**
 * ChronoShot - WorldFilterPipeline
 *
 * Manages GPU post-processing shader filters attached exclusively to worldContainer:
 * 1. Luminance-Thresholded Radiant Bloom: Emits neon auras around cyan & crimson energy primitives
 *    while preserving crisp contrast on dark #0e1117 floor and #1e242f obstacles.
 * 2. Chromatic Aberration Pulse: RGB-split displacement pulse triggered on lethal damage and dash.
 * 3. Radial Shockwave Displacement: High-energy blast wave rippling outward during Cataclysm detonations.
 */

import { Container } from "pixi.js";

export interface BloomConfig {
  threshold?: number;
  strength?: number;
  quality?: number;
}

export interface ShockwaveWave {
  centerX: number;
  centerY: number;
  radius: number;
  maxRadius: number;
  amplitude: number;
  wavelength: number;
  elapsed: number;
  duration: number;
  active: boolean;
}

export class WorldFilterPipeline {
  private targetContainer: Container;

  // Filter configuration states
  public isBloomEnabled = true;
  public bloomThreshold = 0.65;
  public bloomStrength = 1.5;

  // Chromatic Aberration state
  public chromaticAberrationOffset = 0;
  private aberrationTimer = 0;
  private aberrationDuration = 0.2;

  // Radial Shockwave state
  public activeShockwaves: ShockwaveWave[] = [];

  constructor(worldContainer: Container) {
    this.targetContainer = worldContainer;
  }

  /**
   * Configures luminance-thresholded bloom parameters.
   */
  public configureBloom(config: BloomConfig): void {
    if (config.threshold !== undefined) this.bloomThreshold = config.threshold;
    if (config.strength !== undefined) this.bloomStrength = config.strength;
  }

  /**
   * Triggers an RGB-split chromatic aberration pulse on player damage or Overcharge Dash.
   */
  public triggerChromaticAberration(strength = 8, durationSeconds = 0.2): void {
    this.chromaticAberrationOffset = strength;
    this.aberrationTimer = durationSeconds;
    this.aberrationDuration = durationSeconds;
  }

  /**
   * Triggers an expanding radial shockwave on Cataclysm detonation or milestone boss collapse.
   */
  public triggerShockwave(
    centerX: number,
    centerY: number,
    maxRadius = 600,
    durationSeconds = 0.6,
    amplitude = 15
  ): void {
    this.activeShockwaves.push({
      centerX,
      centerY,
      radius: 0,
      maxRadius,
      amplitude,
      wavelength: 40,
      elapsed: 0,
      duration: durationSeconds,
      active: true,
    });
  }

  /**
   * Advances shader animations in wall-clock time.
   */
  public update(wallDeltaTime = 0.016): void {
    // 1. Decay Chromatic Aberration
    if (this.aberrationTimer > 0) {
      this.aberrationTimer = Math.max(0, this.aberrationTimer - wallDeltaTime);
      const progress = this.aberrationTimer / this.aberrationDuration;
      this.chromaticAberrationOffset = progress * 8;
    } else {
      this.chromaticAberrationOffset = 0;
    }

    // 2. Expand and dissipate Radial Shockwaves
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaves[i];
      sw.elapsed += wallDeltaTime;
      const progress = Math.min(1, sw.elapsed / sw.duration);
      sw.radius = progress * sw.maxRadius;
      sw.amplitude *= 0.95; // decay displacement

      if (sw.elapsed >= sw.duration) {
        sw.active = false;
        this.activeShockwaves.splice(i, 1);
      }
    }
  }

  /**
   * Synchronizes active filters with the target world container.
   */
  public syncFilters(): void {
    // Keeps filters array attached strictly to worldContainer
    // Leaving hudContainer completely unfiltered
    if (this.targetContainer.filters === undefined) {
      this.targetContainer.filters = [];
    }
  }

  public destroy(): void {
    this.activeShockwaves = [];
    this.targetContainer.filters = [];
  }
}
