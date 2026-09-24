/**
 * DefeatHUD module for ChronoShot.
 *
 * Renders the tactical defeat screen:
 * - Sector 1 (Rooms 1–5): Single centered Expedition Reset card ([R], [Shift+R], or mouse click)
 * - Sectors 2–4 & Endless: Dual interactive cards:
 *   - Card 1: Checkpoint Rollback ([R] key or mouse click)
 *   - Card 2: Full Expedition Reset ([Shift+R] key or mouse click)
 * - Hover detection and interactive pointer cursor integration
 * - Endless Mode survival metrics header display
 */

import { RollbackTarget } from "../levels/RollbackCalculator";
import { getUIFont, UITheme } from "./theme";

export interface DefeatCardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DefeatLayout {
  cardW: number;
  cardH: number;
  cardY: number;
  gap: number;
  cards: DefeatCardRect[];
}

export interface DefeatRenderData {
  roomNumber: number;
  totalRooms: number;
  tier: string;
  roomTitle: string;
  rollbackTarget: RollbackTarget;
  isEndless: boolean;
  endlessStats?: {
    survivalTime: string;
    maxThreat: number;
    kills: number;
  };
  hoveredCardIndex: number | null;
}

/**
 * Computes bounding boxes for defeat card(s) centered within the arena.
 * Supports 1 card (Sector 1) or 2 cards (Sectors 2–4 & Endless).
 */
export function computeDefeatLayout(
  arenaWidth = 960,
  arenaHeight = 640,
  cardCount: 1 | 2 = 2
): DefeatLayout {
  const cardW = 280;
  const cardH = 200;
  const gap = 40;
  const cardY = Math.floor(arenaHeight / 2 - 30);

  if (cardCount === 1) {
    const startX = Math.floor((arenaWidth - cardW) / 2);
    return {
      cardW,
      cardH,
      cardY,
      gap,
      cards: [{ x: startX, y: cardY, width: cardW, height: cardH }],
    };
  }

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

export class DefeatHUD {
  /**
   * Returns index of the defeat card under the given mouse coordinates (0 for Rollback or single Reset, 1 for Reset in dual-card mode, or null).
   */
  public static getCardAt(
    mouseX: number,
    mouseY: number,
    arenaWidth = 960,
    arenaHeight = 640,
    cardCount: 1 | 2 = 2
  ): 0 | 1 | null {
    const layout = computeDefeatLayout(arenaWidth, arenaHeight, cardCount);
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
   * Renders the complete defeat overlay onto the Canvas 2D context.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    data: DefeatRenderData,
    arenaWidth = 960,
    arenaHeight = 640
  ): void {
    ctx.save();

    // 1. Semi-transparent dark background
    ctx.fillStyle = "rgba(7, 9, 14, 0.90)";
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = Math.floor(arenaWidth / 2);

    // 2. Top Header & Hairline Separator
    ctx.beginPath();
    ctx.moveTo(centerX - 240, 80);
    ctx.lineTo(centerX + 240, 80);
    ctx.strokeStyle = UITheme.colors.crimsonDim;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = getUIFont(28, "800");
    ctx.fillStyle = UITheme.colors.crimson;
    ctx.fillText(
      data.isEndless ? "ENDLESS PROTOCOL TERMINATED" : "PROTOCOL TERMINATED",
      centerX,
      112
    );

    if (data.isEndless && data.endlessStats) {
      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = UITheme.colors.cyan;
      ctx.fillText(
        `SURVIVED: ${data.endlessStats.survivalTime}  |  MAX THREAT: ${data.endlessStats.maxThreat}  |  HOSTILES NEUTRALIZED: ${data.endlessStats.kills}`,
        centerX,
        144
      );
    } else {
      ctx.font = getUIFont(11, "600");
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText(
        "CRITICAL LETHAL TRAUMA SUSTAINED // SECTOR ATTEMPT FAILED",
        centerX,
        140
      );

      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = UITheme.colors.cyan;
      ctx.fillText(
        `SECTOR: ${data.tier}  |  ${data.roomTitle}  [${data.roomNumber}/${data.totalRooms}]`,
        centerX,
        160
      );
    }

    ctx.beginPath();
    ctx.moveTo(centerX - 240, 185);
    ctx.lineTo(centerX + 240, 185);
    ctx.strokeStyle = UITheme.colors.crimsonDim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Defeat Card(s)
    const isSingleCard = data.roomNumber <= 5;
    const layout = computeDefeatLayout(
      arenaWidth,
      arenaHeight,
      isSingleCard ? 1 : 2
    );

    if (isSingleCard) {
      this.renderResetCard(
        ctx,
        layout.cards[0],
        data.hoveredCardIndex === 0,
        "[ R ]",
        "Restart expedition from Room 01 (0 Augmentations)"
      );
    } else {
      const [card0, card1] = layout.cards;

      // Card 0: Rollback Card
      this.renderRollbackCard(ctx, card0, data, data.hoveredCardIndex === 0);

      // Card 1: Full Reset Card
      this.renderResetCard(ctx, card1, data.hoveredCardIndex === 1);
    }

    ctx.restore();
  }

  private static renderRollbackCard(
    ctx: CanvasRenderingContext2D,
    rect: DefeatCardRect,
    data: DefeatRenderData,
    isHovered: boolean
  ): void {
    ctx.save();

    // Card background
    ctx.fillStyle = isHovered
      ? "rgba(10, 30, 45, 0.92)"
      : "rgba(12, 18, 28, 0.85)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Card Border
    ctx.strokeStyle = isHovered ? UITheme.colors.cyan : UITheme.colors.cyanDim;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Top Accent Bar
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillRect(rect.x, rect.y, rect.width, 4);

    const midX = rect.x + rect.width / 2;

    // Key shortcut badge
    ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
    ctx.fillRect(midX - 25, rect.y + 16, 50, 20);
    ctx.strokeStyle = UITheme.colors.cyan;
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 25, rect.y + 16, 50, 20);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("[ R ]", midX, rect.y + 26);

    // Title
    ctx.font = getUIFont(14, "800");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText(
      data.isEndless ? "APEX ROLLBACK" : "TIMELINE ROLLBACK",
      midX,
      rect.y + 56
    );

    // Destination
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    const destRoomStr = `ROOM ${String(data.rollbackTarget.roomNumber).padStart(2, "0")}`;
    ctx.fillText(`${destRoomStr} // ${data.rollbackTarget.bossName}`, midX, rect.y + 84);

    // Description
    ctx.font = getUIFont(10, "600");
    ctx.fillStyle = UITheme.colors.textSecondary;
    ctx.fillText(data.rollbackTarget.loadoutDescription, midX, rect.y + 116);

    // Action Prompt
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = isHovered ? UITheme.colors.cyan : UITheme.colors.textMuted;
    ctx.fillText(">> CLICK TO RESPAWN <<", midX, rect.y + 164);

    ctx.restore();
  }

  private static renderResetCard(
    ctx: CanvasRenderingContext2D,
    rect: DefeatCardRect,
    isHovered: boolean,
    shortcutText = "[ SHIFT + R ]",
    description = "Abandon run & clear augmentations"
  ): void {
    ctx.save();

    // Card background
    ctx.fillStyle = isHovered
      ? "rgba(40, 15, 20, 0.92)"
      : "rgba(22, 12, 16, 0.85)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Card Border
    ctx.strokeStyle = isHovered ? UITheme.colors.crimson : UITheme.colors.crimsonDim;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Top Accent Bar
    ctx.fillStyle = UITheme.colors.crimson;
    ctx.fillRect(rect.x, rect.y, rect.width, 4);

    const midX = rect.x + rect.width / 2;

    // Key shortcut badge
    const badgeWidth = shortcutText.length > 5 ? 90 : 50;
    ctx.fillStyle = "rgba(255, 42, 68, 0.15)";
    ctx.fillRect(midX - badgeWidth / 2, rect.y + 16, badgeWidth, 20);
    ctx.strokeStyle = UITheme.colors.crimson;
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - badgeWidth / 2, rect.y + 16, badgeWidth, 20);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.crimson;
    ctx.fillText(shortcutText, midX, rect.y + 26);

    // Title
    ctx.font = getUIFont(14, "800");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("EXPEDITION RESET", midX, rect.y + 56);

    // Destination
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.crimson;
    ctx.fillText("ROOM 01 // FRESH START", midX, rect.y + 84);

    // Description
    ctx.font = getUIFont(10, "600");
    ctx.fillStyle = UITheme.colors.textSecondary;
    ctx.fillText(description, midX, rect.y + 116);

    // Action Prompt
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = isHovered ? UITheme.colors.crimson : UITheme.colors.textMuted;
    ctx.fillText(">> CLICK TO RESTART <<", midX, rect.y + 164);

    ctx.restore();
  }
}
