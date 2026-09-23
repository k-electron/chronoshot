/**
 * ChronoAnchorRenderer module for ChronoShot.
 *
 * Renders in-world ground chrono-anchor clamps, locking brackets,
 * and a 360-degree radial reload progress sweep around the player chassis.
 */

import { Vector2D } from "../math/vector";
import { UITheme } from "./theme";

export interface ChronoAnchorRenderOptions {
  position: Vector2D;
  radius: number;
  progress: number; // 0.0 to 1.0
  isReloading: boolean;
}

export class ChronoAnchorRenderer {
  /**
   * Renders in-world ground chrono-anchor clamps and radial progress sweep
   * around the player chassis during an active reload sequence.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    options: ChronoAnchorRenderOptions
  ): void {
    if (!options.isReloading) {
      return;
    }

    const { position, radius, progress } = options;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const anchorRadius = radius + 10;

    ctx.save();
    ctx.translate(position.x, position.y);

    // 1. Ground Anchor Base Track Ring
    ctx.beginPath();
    ctx.arc(0, 0, anchorRadius, 0, Math.PI * 2);
    ctx.strokeStyle = UITheme.colors.hairline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Three Ground Anchor Clamps arranged at 120-degree intervals
    const clampAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
    ctx.fillStyle = UITheme.colors.amber;
    ctx.strokeStyle = UITheme.colors.white;
    ctx.lineWidth = 1;

    for (const angle of clampAngles) {
      const clampDist = anchorRadius + 3;
      const cx = Math.cos(angle) * clampDist;
      const cy = Math.sin(angle) * clampDist;

      // Anchor pin
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hairline bracket to base ring
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (anchorRadius - 2), Math.sin(angle) * (anchorRadius - 2));
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = UITheme.colors.amber;
      ctx.stroke();
    }

    // 3. Radial Progress Sweep Arc (-PI/2 to -PI/2 + 2*PI*progress)
    if (clampedProgress > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + clampedProgress * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(0, 0, anchorRadius, startAngle, endAngle);
      ctx.strokeStyle = UITheme.colors.amber;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Leading sweep head
      const leadX = Math.cos(endAngle) * anchorRadius;
      const leadY = Math.sin(endAngle) * anchorRadius;
      ctx.beginPath();
      ctx.arc(leadX, leadY, 3, 0, Math.PI * 2);
      ctx.fillStyle = UITheme.colors.white;
      ctx.fill();
    }

    ctx.restore();
  }
}
