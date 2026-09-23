/**
 * EndlessTelemetryHUD for ChronoShot.
 *
 * Renders real-time Endless Survival Mode telemetry:
 * - Current climbing threat budget
 * - Elapsed survival duration (MM:SS)
 * - Hostile kill counter
 * - Minimalist hairline styling with cyber-cyan accents
 */

import { getUIFont, UITheme } from "./theme";

export interface EndlessTelemetryData {
  threatBudget: number;
  survivalTime: string;
  kills: number;
  activeThreat?: number;
}

export class EndlessTelemetryHUD {
  /**
   * Renders the Endless Telemetry badge anchored at top-center.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    data: EndlessTelemetryData,
    arenaWidth: number = 960
  ): void {
    const cardWidth = 360;
    const cardHeight = 44;
    const x = (arenaWidth - cardWidth) / 2;
    const y = 14;

    ctx.save();

    // 1. Frosted Cyber Background Panel
    ctx.fillStyle = "rgba(7, 9, 14, 0.82)";
    ctx.fillRect(x, y, cardWidth, cardHeight);

    // Hairline border
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    // Accent corner brackets
    ctx.strokeStyle = UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    const bracket = 5;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + bracket);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracket, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + cardWidth - bracket, y);
    ctx.lineTo(x + cardWidth, y);
    ctx.lineTo(x + cardWidth, y + bracket);
    ctx.stroke();

    // 2. Header
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(9, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("ENDLESS PROTOCOL // SURVIVAL TELEMETRY", arenaWidth / 2, y + 6);

    // 3. Telemetry Stats Line
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = UITheme.colors.textPrimary;

    const threatText = `THREAT: ${data.threatBudget}`;
    const timeText = `SURVIVED: ${data.survivalTime}`;
    const killsText = `KILLS: ${data.kills}`;

    const textY = y + 22;
    ctx.fillText(`${threatText}    |    ${timeText}    |    ${killsText}`, arenaWidth / 2, textY);

    ctx.restore();
  }
}
