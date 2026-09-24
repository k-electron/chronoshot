/**
 * BossTelemetryHUD module for ChronoShot.
 *
 * Renders real-time decoupled top-center boss telemetry:
 * - Boss designation (e.g. "GOLIATH-01: AEGIS COLOSSUS")
 * - Dynamic phase badge (e.g. "PHASE 1/2" or "PHASE 2/2 // OVERDRIVE")
 * - Phase progression markers
 * - Multi-tier shield charge pips with high-contrast cyan vs spent pips
 * - Signal-crimson overdrive / enraged pulse states
 */

import { measureTextWidth, truncateText } from "./textUtils";
import { getUIFont, UITheme } from "./theme";

export interface BossTelemetryData {
  readonly name: string;
  readonly currentPhase: number;
  readonly totalPhases: number;
  readonly phaseTitle?: string;
  readonly shields: number;
  readonly maxShields: number;
  readonly isAlive: boolean;
  readonly isEnraged?: boolean;
}

export class BossTelemetryHUD {
  /**
   * Formats the phase indicator badge text based on phase indices and active title.
   */
  public static getPhaseBadgeText(data: BossTelemetryData): string {
    const current = Math.max(1, data.currentPhase || 1);
    const total = Math.max(1, data.totalPhases || 1);

    if (data.phaseTitle && data.phaseTitle.trim().length > 0) {
      const titleUpper = data.phaseTitle.trim().toUpperCase();
      if (titleUpper.startsWith("PHASE")) {
        return titleUpper;
      }
      return `PHASE ${current}/${total} // ${titleUpper}`;
    }

    if (data.isEnraged) {
      return `PHASE ${current}/${total} // OVERDRIVE`;
    }

    return `PHASE ${current}/${total}`;
  }

  /**
   * Main static render routine for the Boss Telemetry HUD.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    data: BossTelemetryData,
    arenaWidth: number
  ): void {
    if (data.isAlive === false) {
      return;
    }

    const barW = Math.min(440, Math.max(280, arenaWidth - 32));
    const barH = 44;
    const barX = (arenaWidth - barW) / 2;
    const barY = 16;
    const isEnraged = !!data.isEnraged;

    ctx.save();

    // 1. Backing panel (translucent glass with crimson tint if enraged)
    ctx.fillStyle = isEnraged ? "rgba(22, 9, 13, 0.94)" : "rgba(10, 14, 20, 0.92)";
    ctx.fillRect(barX, barY, barW, barH);

    // Enraged luminous glow fill
    if (isEnraged) {
      ctx.fillStyle = UITheme.colors.crimsonGlow;
      ctx.fillRect(barX, barY, barW, barH);
    }

    // 2. Outer border
    ctx.lineWidth = 1;
    ctx.strokeStyle = isEnraged ? UITheme.colors.crimson : UITheme.colors.panelBorder;
    ctx.strokeRect(barX, barY, barW, barH);

    // 3. Precision corner accent tabs
    const corner = 6;
    ctx.strokeStyle = isEnraged ? UITheme.colors.crimson : UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(barX, barY + corner);
    ctx.lineTo(barX, barY);
    ctx.lineTo(barX + corner, barY);
    // Top-right
    ctx.moveTo(barX + barW - corner, barY);
    ctx.lineTo(barX + barW, barY);
    ctx.lineTo(barX + barW, barY + corner);
    // Bottom-left
    ctx.moveTo(barX, barY + barH - corner);
    ctx.lineTo(barX, barY + barH);
    ctx.lineTo(barX + corner, barY + barH);
    // Bottom-right
    ctx.moveTo(barX + barW - corner, barY + barH);
    ctx.lineTo(barX + barW, barY + barH);
    ctx.lineTo(barX + barW, barY + barH - corner);
    ctx.stroke();

    // 4. Subtle interior divider hairline
    ctx.strokeStyle = isEnraged ? "rgba(255, 51, 68, 0.2)" : "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX + 10, barY + 23);
    ctx.lineTo(barX + barW - 10, barY + 23);
    ctx.stroke();

    // Vertical row centers
    const yRow1 = barY + 12;
    const yRow2 = barY + 33;

    // --- ROW 1: Designation & Threat Status ---
    const rightStatusText = isEnraged
      ? "CORE VULNERABLE // ENRAGED"
      : data.maxShields > 0
      ? "SHIELDS"
      : "UNSHIELDED";
    const rightStatusWidth = measureTextWidth(ctx, rightStatusText);
    const maxTitleWidth = Math.max(80, barW - 32 - rightStatusWidth - 16);

    // Left: Boss Designation
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = isEnraged ? UITheme.colors.crimson : UITheme.colors.cyan;
    const rawBossTitle =
      data.name && data.name.trim().length > 0
        ? data.name
        : "GOLIATH-01: AEGIS COLOSSUS";
    const bossTitle = truncateText(ctx, rawBossTitle, maxTitleWidth);
    ctx.fillText(bossTitle, barX + 16, yRow1);

    // Right: Overdrive status or Shields status label
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    if (isEnraged) {
      ctx.font = getUIFont(10, "bold");
      ctx.fillStyle = UITheme.colors.crimson;
      ctx.fillText(rightStatusText, barX + barW - 16, yRow1);
    } else {
      ctx.font = getUIFont(9, "bold");
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText(rightStatusText, barX + barW - 16, yRow1);
    }

    // --- ROW 2: Phase Badge & Multi-Tier Shield Pips ---
    const maxShields = Math.max(0, data.maxShields ?? 0);
    const currentShields = Math.max(0, Math.min(data.shields ?? 0, maxShields));
    const pipSize = 10;
    const pipGap = 5;
    const totalShieldW = maxShields > 0 ? maxShields * pipSize + (maxShields - 1) * pipGap : 0;

    const currentPhase = Math.max(1, data.currentPhase || 1);
    const totalPhases = Math.max(1, data.totalPhases || 1);
    const phasePipSize = 5;
    const phasePipGap = 4;
    const totalPhasePipsW = totalPhases > 1 ? totalPhases * (phasePipSize + phasePipGap) : 0;

    const maxBadgeWidth = Math.max(60, barW - 32 - totalShieldW - totalPhasePipsW - 20);
    const rawPhaseBadge = BossTelemetryHUD.getPhaseBadgeText(data);
    const phaseBadge = truncateText(ctx, rawPhaseBadge, maxBadgeWidth);

    // Left: Phase Indicator / Badge
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(9, "bold");
    ctx.fillStyle = isEnraged ? UITheme.colors.crimson : UITheme.colors.textSecondary;
    ctx.fillText(phaseBadge, barX + 16, yRow2);

    // Phase Progression Pips (small tick indicators next to phase badge)
    if (totalPhases > 1) {
      const badgeWidth = measureTextWidth(ctx, phaseBadge);
      const phasePipsStartX = barX + 16 + badgeWidth + 10;

      for (let p = 1; p <= totalPhases; p++) {
        const px = phasePipsStartX + (p - 1) * (phasePipSize + phasePipGap);
        const py = yRow2 - phasePipSize / 2;

        if (p < currentPhase) {
          ctx.fillStyle = isEnraged ? UITheme.colors.crimsonDim : UITheme.colors.cyanDim;
          ctx.fillRect(px, py, phasePipSize, phasePipSize);
        } else if (p === currentPhase) {
          ctx.fillStyle = isEnraged ? UITheme.colors.crimson : UITheme.colors.cyan;
          ctx.fillRect(px, py, phasePipSize, phasePipSize);
          ctx.strokeStyle = UITheme.colors.white;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, phasePipSize, phasePipSize);
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(px, py, phasePipSize, phasePipSize);
          ctx.strokeStyle = UITheme.colors.hairline;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, phasePipSize, phasePipSize);
        }
      }
    }

    // Right: Multi-Tier Shield Charge Pips
    if (maxShields > 0) {
      const pipsStartX = barX + barW - 16 - totalShieldW;
      const py = yRow2 - pipSize / 2;

      for (let s = 0; s < maxShields; s++) {
        const px = pipsStartX + s * (pipSize + pipGap);
        if (s < currentShields) {
          ctx.fillStyle = UITheme.colors.cyan;
          ctx.fillRect(px, py, pipSize, pipSize);
          ctx.strokeStyle = UITheme.colors.white;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pipSize, pipSize);
        } else {
          ctx.fillStyle = isEnraged
            ? "rgba(255, 51, 68, 0.08)"
            : "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(px, py, pipSize, pipSize);
          ctx.strokeStyle = isEnraged
            ? UITheme.colors.crimsonDim
            : UITheme.colors.hairline;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pipSize, pipSize);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Instance render method delegating to static render.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    data: BossTelemetryData,
    arenaWidth: number
  ): void {
    BossTelemetryHUD.render(ctx, data, arenaWidth);
  }
}

/**
 * Standalone helper function for rendering boss telemetry.
 */
export function renderBossTelemetry(
  ctx: CanvasRenderingContext2D,
  data: BossTelemetryData,
  arenaWidth: number
): void {
  BossTelemetryHUD.render(ctx, data, arenaWidth);
}
