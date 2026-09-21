/**
 * TimeHUD module for ChronoShot.
 *
 * Renders an interactive Canvas 2D time scale gauge showing:
 * - Dynamic time scale gauge [5% micro-creep .. 100% full speed]
 * - Current percentage reading
 * - Tactical action tick burst indicator (+6 Fire, +30 Reload)
 * - "TIME MOVES ONLY WHEN YOU MOVE" status guidance
 */

import { TimeGovernor } from "../engine/TimeGovernor";

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

  constructor(config?: Partial<TimeHUDConfig>) {
    this.config = {
      x: config?.x ?? 20,
      y: config?.y ?? 20,
      width: config?.width ?? 200,
      height: config?.height ?? 12,
    };
  }

  public notifyBurst(ticks: number, label: string): void {
    this.lastBurstMessage = `+${ticks} TICKS [${label.toUpperCase()}]`;
    this.burstMessageTimer = 0.6; // show for 600ms
  }

  /**
   * Renders the dynamic time scale meter onto the canvas.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    governor: TimeGovernor,
    wallDeltaTime: number = 0.016
  ): void {
    const { x, y, width, height } = this.config;
    const timeScale = governor.getTimeScale();
    const percent = Math.round(timeScale * 100);

    if (this.burstMessageTimer > 0) {
      this.burstMessageTimer = Math.max(0, this.burstMessageTimer - wallDeltaTime);
    }

    ctx.save();

    // 1. Text header: TIME SCALE: XX%
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = timeScale > 0.5 ? "#ffffff" : "#00e5ff";
    ctx.fillText(`TIME DILATION: ${percent}%`, x, y);

    // 2. Gauge Background
    const gaugeY = y + 18;
    ctx.fillStyle = "#151a21";
    ctx.fillRect(x, gaugeY, width, height);

    ctx.strokeStyle = "#27313f";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, gaugeY, width, height);

    // 3. Gauge Fill Bar
    const fillWidth = Math.max(2, Math.min(width, width * timeScale));
    const gradient = ctx.createLinearGradient(x, gaugeY, x + width, gaugeY);
    gradient.addColorStop(0, "#00bcd4");
    gradient.addColorStop(0.5, "#00e5ff");
    gradient.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradient;
    ctx.fillRect(x, gaugeY, fillWidth, height);

    // 4. Subtle status or Action Burst flash
    const statusY = gaugeY + height + 6;
    ctx.font = "10px monospace";

    if (this.burstMessageTimer > 0 && this.lastBurstMessage) {
      ctx.fillStyle = "#ffb700";
      ctx.fillText(this.lastBurstMessage, x, statusY);
    } else if (timeScale <= 0.08) {
      ctx.fillStyle = "#6a7b8f";
      ctx.fillText("TIME MOVES ONLY WHEN YOU MOVE", x, statusY);
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.fillText("ACTIVE REALTIME", x, statusY);
    }

    ctx.restore();
  }
}
