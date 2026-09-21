/**
 * CylinderHUD module for ChronoShot.
 *
 * Renders an interactive Canvas 2D revolver cylinder HUD displaying:
 * - 6 physical chamber states (loaded, spent, reloading)
 * - Revolver cylinder rotation aligned with the active firing chamber
 * - Ammunition status and [R] Reload prompt with action tick cost (+30 ticks)
 * - Dry-fire tactile warning
 */

import { Revolver } from "../weapons/Revolver";
import { ChamberState } from "../weapons/Weapon";

export interface CylinderHUDConfig {
  x: number;
  y: number;
  radius: number;
  chamberRadius: number;
}

export class CylinderHUD {
  private config: CylinderHUDConfig;

  constructor(config?: Partial<CylinderHUDConfig>) {
    this.config = {
      x: config?.x ?? 80,
      y: config?.y ?? 560,
      radius: config?.radius ?? 32,
      chamberRadius: config?.chamberRadius ?? 7,
    };
  }

  public setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
  }

  /**
   * Renders the cylinder graphic and weapon state onto the 2D canvas context.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    revolver: Revolver,
    _wallDeltaTime = 0.016
  ): void {
    const { x, y, radius, chamberRadius } = this.config;
    const chambers = revolver.getChambers();
    const activeIndex = revolver.getCurrentChamberIndex();
    const ammo = revolver.getAmmo();
    const magSize = revolver.getMagSize();
    const isDryFired = revolver.wasDryFired();

    ctx.save();

    // 1. Draw outer cylinder body (metallic wheel)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#151a21";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isDryFired ? "#ff3344" : "#2e3b4e";
    ctx.stroke();

    // 2. Draw 6 chambers arranged in a circle
    const chamberRingRadius = radius * 0.58;
    const totalChambers = chambers.length;

    for (let i = 0; i < totalChambers; i++) {
      // Rotate chambers around the cylinder
      const angle = (i / totalChambers) * Math.PI * 2 - Math.PI / 2;
      const cx = x + Math.cos(angle) * chamberRingRadius;
      const cy = y + Math.sin(angle) * chamberRingRadius;
      const state: ChamberState = chambers[i];
      const isActive = i === activeIndex;

      // Chamber socket
      ctx.beginPath();
      ctx.arc(cx, cy, chamberRadius, 0, Math.PI * 2);

      if (state === "loaded") {
        // High-energy cyan bullet primer
        ctx.fillStyle = isActive ? "#00f0ff" : "#00bcd4";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Inner brass bullet center
        ctx.beginPath();
        ctx.arc(cx, cy, chamberRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = "#e0f7fa";
        ctx.fill();
      } else {
        // Spent empty shell socket
        ctx.fillStyle = "#0c0f14";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#27313f";
        ctx.stroke();

        // Small spent primer indentation
        ctx.beginPath();
        ctx.arc(cx, cy, chamberRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#1f2630";
        ctx.fill();
      }

      // If active chamber under the hammer, draw an alignment pip
      if (isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, chamberRadius + 3, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDryFired ? "#ff4455" : "rgba(0, 240, 255, 0.6)";
        ctx.stroke();
      }
    }

    // 3. Central spindle axle
    ctx.beginPath();
    ctx.arc(x, y, chamberRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#27313f";
    ctx.fill();
    ctx.strokeStyle = "#405066";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Text status & reload hint
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Ammo count display
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = ammo === 0 ? "#ff4455" : "#e0e6ed";
    ctx.fillText(`${ammo} / ${magSize}`, x + radius + 16, y - 8);

    // Contextual action prompt
    ctx.font = "11px monospace";
    if (ammo === 0 || isDryFired) {
      ctx.fillStyle = "#ff4455";
      ctx.fillText("[R] RELOAD (+30 TICKS)", x + radius + 16, y + 12);
    } else if (ammo < magSize) {
      ctx.fillStyle = "#8899a6";
      ctx.fillText("[R] RELOAD (+30 TICKS)", x + radius + 16, y + 12);
    } else {
      ctx.fillStyle = "#5c6b7d";
      ctx.fillText("READY", x + radius + 16, y + 12);
    }

    ctx.restore();
  }
}
