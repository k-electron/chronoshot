/**
 * VictoryHUD module for ChronoShot.
 *
 * Renders the triumphant campaign completion overlay:
 * - Mission Accomplished headline & 20-protocol conquest banner
 * - 4-milestone boss defeat checkmarks formatted across balanced rows
 * - Dual interactive Swiss-style cards:
 *   - Card 0: Enter Endless Protocol ([E], [Space], or mouse click)
 *   - Card 1: Expedition Reset ([R], [Shift+R], or mouse click)
 * - Mouse hover detection and interactive pointer cursor integration
 */

import { getUIFont, UITheme } from "./theme";

export interface VictoryCardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VictoryLayout {
  cardW: number;
  cardH: number;
  cardY: number;
  gap: number;
  cards: VictoryCardRect[];
}

/**
 * Computes bounding boxes for the dual victory cards centered within the arena.
 */
export function computeVictoryLayout(
  arenaWidth = 960,
  _arenaHeight = 640
): VictoryLayout {
  const cardW = 290;
  const cardH = 190;
  const gap = 40;
  const cardY = 295;

  const totalW = cardW * 2 + gap;
  const startX = Math.floor((arenaWidth - totalW) / 2);

  return {
    cardW,
    cardH,
    cardY,
    gap,
    cards: [
      { x: startX, y: cardY, width: cardW, height: cardH },
      { x: startX + cardW + gap, y: cardY, width: cardW, height: cardH },
    ],
  };
}

export class VictoryHUD {
  /**
   * Returns index of the victory card under the given mouse coordinates (0 for Endless, 1 for Reset, or null).
   */
  public static getCardAt(
    mouseX: number,
    mouseY: number,
    arenaWidth = 960,
    arenaHeight = 640
  ): 0 | 1 | null {
    const layout = computeVictoryLayout(arenaWidth, arenaHeight);
    for (let i = 0; i < layout.cards.length; i++) {
      const c = layout.cards[i];
      if (
        mouseX >= c.x &&
        mouseX <= c.x + c.width &&
        mouseY >= c.y &&
        mouseY <= c.y + c.height
      ) {
        return i as 0 | 1;
      }
    }
    return null;
  }

  /**
   * Renders the complete campaign victory overlay onto the Canvas 2D context.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    arenaWidth = 960,
    arenaHeight = 640,
    hoveredCardIndex: number | null = null
  ): void {
    ctx.save();

    // 1. Semi-transparent dark frosted background
    ctx.fillStyle = "rgba(7, 10, 15, 0.94)";
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = Math.floor(arenaWidth / 2);

    // 2. Minimalist hairline frame with corner tabs
    const pad = 50;
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, arenaWidth - pad * 2, arenaHeight - pad * 2);

    const cornerSize = 14;
    ctx.strokeStyle = UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    // Top-right
    ctx.moveTo(arenaWidth - pad - cornerSize, pad);
    ctx.lineTo(arenaWidth - pad, pad);
    ctx.lineTo(arenaWidth - pad, pad + cornerSize);
    // Bottom-left
    ctx.moveTo(pad, arenaHeight - pad - cornerSize);
    ctx.lineTo(pad, arenaHeight - pad);
    ctx.lineTo(pad + cornerSize, arenaHeight - pad);
    // Bottom-right
    ctx.moveTo(arenaWidth - pad - cornerSize, arenaHeight - pad);
    ctx.lineTo(arenaWidth - pad, arenaHeight - pad);
    ctx.lineTo(arenaWidth - pad, arenaHeight - pad - cornerSize);
    ctx.stroke();

    // 3. Header title
    ctx.font = getUIFont(32, "800");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("MISSION ACCOMPLISHED", centerX, 115);

    // Subtitle
    ctx.font = getUIFont(12, "600");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("ALL 20 TACTICAL PROTOCOLS CONQUERED", centerX, 150);

    // Decorative separator line
    ctx.beginPath();
    ctx.moveTo(centerX - 220, 175);
    ctx.lineTo(centerX + 220, 175);
    ctx.strokeStyle = UITheme.colors.cyanDim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Milestone boss achievements (2 balanced rows)
    ctx.font = getUIFont(11, "600");
    ctx.fillStyle = UITheme.colors.green;
    ctx.fillText(
      "✓ Goliath-01 Defeated    |    ✓ Chrono-Weaver Neutralized",
      centerX,
      200
    );
    ctx.fillText(
      "✓ Vektor-Prime Obliterated    |    ✓ Chrono-Zenith Overthrown",
      centerX,
      224
    );

    // Separator line before cards
    ctx.beginPath();
    ctx.moveTo(centerX - 220, 252);
    ctx.lineTo(centerX + 220, 252);
    ctx.strokeStyle = UITheme.colors.cyanDim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Dual interactive cards
    const layout = computeVictoryLayout(arenaWidth, arenaHeight);
    const [card0, card1] = layout.cards;

    this.renderEndlessCard(ctx, card0, hoveredCardIndex === 0);
    this.renderResetCard(ctx, card1, hoveredCardIndex === 1);

    // 5. Bottom tip
    ctx.font = getUIFont(11, "normal");
    ctx.fillStyle = UITheme.colors.textMuted;
    ctx.fillText("SELECT AN OBJECTIVE PROTOCOL TO ADVANCE", centerX, 535);

    ctx.restore();
  }

  private static renderEndlessCard(
    ctx: CanvasRenderingContext2D,
    rect: VictoryCardRect,
    isHovered: boolean
  ): void {
    ctx.save();

    // Card background
    ctx.fillStyle = isHovered
      ? "rgba(10, 36, 52, 0.94)"
      : "rgba(12, 20, 30, 0.88)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Border
    ctx.strokeStyle = isHovered ? UITheme.colors.cyan : UITheme.colors.cyanDim;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Top accent bar
    ctx.fillStyle = isHovered ? UITheme.colors.cyan : UITheme.colors.cyanDim;
    ctx.fillRect(rect.x + 20, rect.y, rect.width - 40, 3);

    const centerX = rect.x + rect.width / 2;

    // Card Title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(14, "800");
    ctx.fillStyle = isHovered ? UITheme.colors.cyan : UITheme.colors.textPrimary;
    ctx.fillText("ENDLESS PROTOCOL", centerX, rect.y + 36);

    // Key prompt badge
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = isHovered ? "#ffffff" : UITheme.colors.cyan;
    ctx.fillText("[ E ]  OR  [ SPACE ]", centerX, rect.y + 68);

    // Separator line inside card
    ctx.beginPath();
    ctx.moveTo(rect.x + 35, rect.y + 92);
    ctx.lineTo(rect.x + rect.width - 35, rect.y + 92);
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Description text
    ctx.font = getUIFont(11, "normal");
    ctx.fillStyle = UITheme.colors.textSecondary;
    ctx.fillText("Continuous survival gauntlet in", centerX, rect.y + 118);
    ctx.fillText("Apex Colosseum with all 7", centerX, rect.y + 138);

    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("TACTICAL AUGMENTATIONS", centerX, rect.y + 160);

    ctx.restore();
  }

  private static renderResetCard(
    ctx: CanvasRenderingContext2D,
    rect: VictoryCardRect,
    isHovered: boolean
  ): void {
    ctx.save();

    // Card background
    ctx.fillStyle = isHovered
      ? "rgba(28, 20, 24, 0.94)"
      : "rgba(18, 16, 22, 0.88)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Border
    ctx.strokeStyle = isHovered ? "#ff6075" : UITheme.colors.panelBorder;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Top accent bar
    ctx.fillStyle = isHovered ? "#ff4460" : UITheme.colors.panelBorder;
    ctx.fillRect(rect.x + 20, rect.y, rect.width - 40, 3);

    const centerX = rect.x + rect.width / 2;

    // Card Title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(14, "800");
    ctx.fillStyle = isHovered ? "#ffffff" : UITheme.colors.textPrimary;
    ctx.fillText("EXPEDITION RESET", centerX, rect.y + 36);

    // Key prompt badge
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = isHovered ? "#ff6075" : UITheme.colors.textMuted;
    ctx.fillText("[ R ]  OR  [ SHIFT+R ]", centerX, rect.y + 68);

    // Separator line inside card
    ctx.beginPath();
    ctx.moveTo(rect.x + 35, rect.y + 92);
    ctx.lineTo(rect.x + rect.width - 35, rect.y + 92);
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Description text
    ctx.font = getUIFont(11, "normal");
    ctx.fillStyle = UITheme.colors.textSecondary;
    ctx.fillText("Conclude campaign sequence and", centerX, rect.y + 118);
    ctx.fillText("restart expedition at Sector 1", centerX, rect.y + 138);

    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("ROOM 01 // CLEAN LOADOUT", centerX, rect.y + 160);

    ctx.restore();
  }
}
