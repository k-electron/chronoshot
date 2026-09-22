/**
 * TimeHUD module for ChronoShot.
 *
 * Renders a top-right minimalist hairline time telemetry gauge:
 * - Dynamic speed multiplier reading (e.g. "CHRONO // 0.05x" to "1.00x")
 * - Razor-thin 2px hairline latency bar
 * - Transient micro-pill action burst badges (+6 Fire, +30 Reload)
 * - Muted status guidance (Micro-creep vs. Active realtime)
 */

import { TimeGovernor } from "../engine/TimeGovernor";
import { getUIFont, UITheme } from "./theme";

export interface TimeHUDConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TimeHUD {
  private config: TimeHUDConfig;
  private lastBurstMessage: string = "";
  private burstMessageTimer: number = 0;
  private maxBurstTimer: number = 0.5;

  constructor(config?: Partial<TimeHUDConfig>) {
    this.config = {
      x: config?.x ?? 776,
      y: config?.y ?? 20,
      width: config?.width ?? 160,
      height: config?.height ?? 3,
    };
  }

  public setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
  }

  public notifyBurst(ticks: number, label: string): void {
    this.lastBurstMessage = `+${ticks} TICKS [${label.toUpperCase()}]`;
    this.burstMessageTimer = this.maxBurstTimer;
  }

  /**
   * Renders the streamlined hairline time telemetry gauge onto the canvas.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    governor: TimeGovernor,
    wallDeltaTime: number = 0.016
  ): void {
    const { x, y, width, height } = this.config;
    const timeScale = governor.getTimeScale();
    const speedMultiplier = timeScale.toFixed(2);

    if (this.burstMessageTimer > 0) {
      this.burstMessageTimer = Math.max(0, this.burstMessageTimer - wallDeltaTime);
    }

    ctx.save();

    // 1. Telemetry Header: "CHRONO // 0.05x"
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = timeScale > 0.5 ? UITheme.colors.white : UITheme.colors.cyan;
    ctx.fillText(`CHRONO // ${speedMultiplier}x`, x, y);

    // 2. Hairline Gauge Track (2px thin track with translucent backing)
    const gaugeY = y + 18;
    ctx.fillStyle = UITheme.colors.panelBorder;
    ctx.fillRect(x, gaugeY, width, height);

    // 3. Active Luminous Fill
    const fillWidth = Math.max(2, Math.min(width, width * timeScale));
    const gradient = ctx.createLinearGradient(x, gaugeY, x + width, gaugeY);
    gradient.addColorStop(0, UITheme.colors.cyanMuted);
    gradient.addColorStop(0.7, UITheme.colors.cyan);
    gradient.addColorStop(1, UITheme.colors.white);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, gaugeY, fillWidth, height);

    // 4. Status Guidance / Action Burst Badge
    const statusY = gaugeY + height + 6;
    ctx.font = getUIFont(10, "600");

    if (this.burstMessageTimer > 0 && this.lastBurstMessage) {
      const alpha = Math.min(1, this.burstMessageTimer / 0.15);
      ctx.fillStyle = `rgba(255, 183, 0, ${alpha})`;
      ctx.fillText(this.lastBurstMessage, x, statusY);
    } else if (timeScale <= 0.08) {
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText("5% MICRO-CREEP", x, statusY);
    } else {
      ctx.fillStyle = UITheme.colors.green;
      ctx.fillText("ACTIVE REALTIME", x, statusY);
    }

    ctx.restore();
  }
}
