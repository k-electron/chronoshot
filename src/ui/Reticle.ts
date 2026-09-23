/**
 * Reticle Module for ChronoShot.
 *
 * Renders an in-canvas tactical hardware crosshair replacing the OS cursor:
 * - Ultra-fine central micro-dot (1.5px) for pixel-precise aiming
 * - Directional hairline tick marks that subtly expand with time dilation acceleration
 * - High-visibility signal crimson flash when attempting to fire an empty weapon
 * - Tactile amber reload arc visualizing active reload progress
 */

import { Vector2D } from "../math/vector";
import { UITheme } from "./theme";

export class Reticle {
  private dryFireFlashTimer: number = 0;

  /**
   * Triggers a momentary crimson warning flash at the reticle point.
   */
  public triggerDryFire(): void {
    this.dryFireFlashTimer = 0.2; // 200ms tactile warning
  }

  /**
   * Advances any internal reticle animation timers with real-world delta time.
   */
  public update(wallDeltaTime: number): void {
    if (this.dryFireFlashTimer > 0) {
      this.dryFireFlashTimer = Math.max(0, this.dryFireFlashTimer - wallDeltaTime);
    }
  }

  /**
   * Renders the hardware reticle directly onto the 2D canvas context.
   *
   * @param ctx - The target Canvas 2D rendering context
   * @param target - Mouse/aim target position
   * @param timeScale - Current time governor scale [0.05 .. 1.0]
   * @param reloadProgress - Optional reload progress [0.0 .. 1.0]
   * @param isReloading - Whether player is actively reloading
   */
  public render(
    ctx: CanvasRenderingContext2D,
    target: Vector2D,
    timeScale: number = 0.05,
    reloadProgress: number = 0,
    isReloading: boolean = false
  ): void {
    const x = target ? target.x : 0;
    const y = target ? target.y : 0;
    const isDryFiring = this.dryFireFlashTimer > 0;

    ctx.save();

    // Expansion offset proportional to time scale speed (4px at rest, up to 8px at max speed)
    const speedFactor = Math.max(0, Math.min(1, (timeScale - 0.05) / 0.95));
    const innerGap = 5 + speedFactor * 3.5;
    const tickLength = 5;

    let strokeColor: string = UITheme.colors.cyan;
    let dotColor: string = UITheme.colors.white;

    if (isDryFiring) {
      strokeColor = UITheme.colors.crimson;
      dotColor = UITheme.colors.crimson;
    } else if (isReloading) {
      strokeColor = UITheme.colors.amber;
      dotColor = UITheme.colors.amber;
    }

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = dotColor;
    ctx.lineWidth = 1.25;

    // 1. Center precision micro-dot
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Directional hairline tick marks (Top, Bottom, Left, Right)
    ctx.beginPath();
    // Top tick
    ctx.moveTo(x, y - innerGap - tickLength);
    ctx.lineTo(x, y - innerGap);
    // Bottom tick
    ctx.moveTo(x, y + innerGap);
    ctx.lineTo(x, y + innerGap + tickLength);
    // Left tick
    ctx.moveTo(x - innerGap - tickLength, y);
    ctx.lineTo(x - innerGap, y);
    // Right tick
    ctx.moveTo(x + innerGap, y);
    ctx.lineTo(x + innerGap + tickLength, y);
    ctx.stroke();

    // 3. Circular Reload Progress Arc when actively reloading
    if (isReloading) {
      const reloadRadius = innerGap + 2;
      const clampedProg = Math.max(0, Math.min(1, reloadProgress));

      // Faint background ring
      ctx.beginPath();
      ctx.arc(x, y, reloadRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 183, 0, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Active progress arc
      if (clampedProg > 0) {
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + clampedProg * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x, y, reloadRadius, startAngle, endAngle);
        ctx.strokeStyle = UITheme.colors.amber;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 4. Dry-fire tactile warning ring
    if (isDryFiring) {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = UITheme.colors.crimson;
      ctx.stroke();
    }

    ctx.restore();
  }
}
