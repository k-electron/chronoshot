/**
 * CylinderHUD module for ChronoShot.
 *
 * Renders a minimalist hairline Canvas 2D revolver cylinder HUD:
 * - Ultra-clean circular dial with 1px hairline borders and dark glass backing
 * - 6 micro-chamber pips: radiant cyan for loaded, hollow slate rings for spent
 * - Animated cylinder rotation tracking the active firing chamber
 * - Sleek chamber index alignment notch at the firing hammer
 * - Clean status typography ([R] RELOAD warning vs. READY vs. CYCLING status)
 */

import { Revolver } from "../weapons/Revolver";
import { ChamberState } from "../weapons/Weapon";
import { getUIFont, UITheme } from "./theme";

export interface CylinderHUDConfig {
  x: number;
  y: number;
  radius: number;
  chamberRadius: number;
}

export class CylinderHUD {
  private config: CylinderHUDConfig;
  private currentRotation: number = 0;

  constructor(config?: Partial<CylinderHUDConfig>) {
    this.config = {
      x: config?.x ?? 70,
      y: config?.y ?? 570,
      radius: config?.radius ?? 28,
      chamberRadius: config?.chamberRadius ?? 5.5,
    };
  }

  public setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
  }

  /**
   * Renders the minimalist cylinder graphic and weapon status.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    revolver: Revolver,
    wallDeltaTime = 0.016,
    isDashReady = false
  ): void {
    const { x, y, radius, chamberRadius } = this.config;
    const chambers = revolver.getChambers();
    const activeIndex = revolver.getCurrentChamberIndex();
    const ammo = revolver.getAmmo();
    const magSize = revolver.getMagSize();
    const isDryFired = revolver.wasDryFired();
    const isReloading = revolver.isReloading();

    // Smooth rotation interpolation towards active chamber angle
    const targetRotation = (activeIndex / Math.max(1, chambers.length)) * Math.PI * 2;
    const rotDiff = targetRotation - this.currentRotation;
    this.currentRotation += rotDiff * Math.min(1, wallDeltaTime * 18);

    ctx.save();

    // 1. Outer dial translucent glass backing
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = UITheme.colors.panelBg;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDryFired
      ? UITheme.colors.crimson
      : isReloading
      ? UITheme.colors.amber
      : UITheme.colors.hairline;
    ctx.stroke();

    // Outer accent tick ring (ultra-faint)
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = isDryFired
      ? UITheme.colors.crimsonDim
      : isReloading
      ? "rgba(255, 183, 0, 0.2)"
      : "rgba(255, 255, 255, 0.05)";
    ctx.stroke();

    // 2. Chambers arranged radially with rotation offset
    const totalChambers = chambers.length;
    // Scale chamber geometry dynamically for higher capacity (e.g. 8 chambers) to preserve crisp spacing
    const effectiveChamberRadius = totalChambers > 6 ? chamberRadius * 0.82 : chamberRadius;
    const chamberRingRadius = totalChambers > 6 ? radius * 0.60 : radius * 0.58;

    for (let i = 0; i < totalChambers; i++) {
      const baseAngle = (i / totalChambers) * Math.PI * 2 - Math.PI / 2;
      const angle = baseAngle - this.currentRotation;
      const cx = x + Math.cos(angle) * chamberRingRadius;
      const cy = y + Math.sin(angle) * chamberRingRadius;
      const state: ChamberState = chambers[i];
      const isActive = i === activeIndex;

      ctx.beginPath();
      ctx.arc(cx, cy, effectiveChamberRadius, 0, Math.PI * 2);

      if (state === "loaded") {
        // High-energy radiant cyan pip
        ctx.fillStyle = isActive ? UITheme.colors.cyan : UITheme.colors.cyanMuted;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = UITheme.colors.white;
        ctx.stroke();

        // White micro-core center
        ctx.beginPath();
        ctx.arc(cx, cy, effectiveChamberRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = UITheme.colors.white;
        ctx.fill();
      } else {
        // Expended hollow socket
        ctx.fillStyle = "#0a0d12";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = UITheme.colors.hairline;
        ctx.stroke();
      }

      // Active chamber alignment ring
      if (isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, effectiveChamberRadius + (totalChambers > 6 ? 2.0 : 2.5), 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDryFired
          ? UITheme.colors.crimson
          : isReloading
          ? UITheme.colors.amber
          : UITheme.colors.cyanDim;
        ctx.stroke();
      }
    }

    // 3. Central spindle axle
    ctx.beginPath();
    ctx.arc(x, y, effectiveChamberRadius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#161c26";
    ctx.fill();
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Hammer alignment notch at 12 o'clock
    ctx.beginPath();
    ctx.moveTo(x, y - radius - 1);
    ctx.lineTo(x, y - radius + 4);
    ctx.strokeStyle = isDryFired
      ? UITheme.colors.crimson
      : isReloading
      ? UITheme.colors.amber
      : UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Typography & Status labels
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const textOffsetX = x + radius + 16;

    // Ammunition counter (e.g. "6 / 6" or "8 / 8")
    ctx.font = getUIFont(15, "bold");
    if (isReloading) {
      ctx.fillStyle = UITheme.colors.amber;
      ctx.fillText(`${ammo} / ${magSize} [CYCLING]`, textOffsetX, y - 8);
    } else {
      ctx.fillStyle = ammo === 0 || isDryFired ? UITheme.colors.crimson : UITheme.colors.textPrimary;
      ctx.fillText(`${ammo} / ${magSize}`, textOffsetX, y - 8);
    }

    const reloadTicks = typeof (revolver as any).getReloadTickBurst === "function"
      ? (revolver as any).getReloadTickBurst()
      : revolver.config.reloadTickBurst;

    // Tactical action prompt
    ctx.font = getUIFont(10, "600");
    if (isReloading) {
      const rem = revolver.getReloadTicksRemaining();
      const tot = revolver.getReloadTicksTotal();
      if (isDashReady) {
        ctx.fillStyle = UITheme.colors.cyan;
        ctx.fillText(`CYCLING // ${rem}/${tot} [[SPACE] DASH TO ABORT]`, textOffsetX, y + 12);
      } else {
        ctx.fillStyle = UITheme.colors.amber;
        ctx.fillText(`CYCLING // ${rem}/${tot} TICKS`, textOffsetX, y + 12);
      }
    } else if (ammo === 0 || isDryFired) {
      ctx.fillStyle = UITheme.colors.crimson;
      ctx.fillText(`[R] RELOAD (+${reloadTicks} TICKS)`, textOffsetX, y + 12);
    } else if (ammo < magSize) {
      ctx.fillStyle = UITheme.colors.textSecondary;
      ctx.fillText(`[R] RELOAD (+${reloadTicks} TICKS)`, textOffsetX, y + 12);
    } else {
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText("READY", textOffsetX, y + 12);
    }

    ctx.restore();
  }
}
