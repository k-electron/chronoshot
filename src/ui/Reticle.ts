/**
 * Reticle Module for ChronoShot.
 *
 * Renders an in-canvas tactical hardware crosshair replacing the OS cursor:
 * - Ultra-fine central micro-dot (1.5px) for pixel-precise aiming
 * - Directional hairline tick marks that subtly expand with time dilation acceleration
 * - High-visibility signal crimson flash when attempting to fire an empty weapon
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
   */
  public render(
    ctx: CanvasRenderingContext2D,
    target: Vector2D,
    timeScale: number = 0.05
  ): void {
    const x = target ? target.x : 0;
    const y = target ? target.y : 0;
    const isDryFiring = this.dryFireFlashTimer > 0;

    ctx.save();

    // Expansion offset proportional to time scale speed (4px at rest, up to 8px at max speed)
    const speedFactor = Math.max(0, Math.min(1, (timeScale - 0.05) / 0.95));
    const innerGap = 5 + speedFactor * 3.5;
    const tickLength = 5;

    const strokeColor = isDryFiring ? UITheme.colors.crimson : UITheme.colors.cyan;
    const dotColor = isDryFiring ? UITheme.colors.crimson : UITheme.colors.white;

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

    // 3. Dry-fire tactile warning ring
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
