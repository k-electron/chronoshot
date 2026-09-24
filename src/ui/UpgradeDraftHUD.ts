/**
 * UpgradeDraftHUD module for ChronoShot.
 *
 * Provides a decoupled Canvas 2D renderer and hit-tester for tactical card draft selection overlays:
 * - Dynamic N-card horizontal distribution and responsive bounding box computation
 * - High-contrast Swiss minimalist glassmorphism card rendering with accent top bars
 * - Key badge prompts ([1], [2], [3], [4]), archetype headers, titles, and stat highlight boxes
 * - Word-wrapped tactical descriptions and interactive install buttons
 * - Exact rectangular mouse click hit-testing (getCardAt)
 */

import type { UpgradeDefinition } from "../upgrades/UpgradeDefinition";
import { truncateText, wrapTextLines } from "./textUtils";
import { getUIFont, UITheme } from "./theme";

export type { UpgradeDefinition };

export interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardLayout {
  readonly cardW: number;
  readonly cardH: number;
  readonly cardY: number;
  readonly gap: number;
  readonly startX: number;
  readonly cards: CardRect[];
}

/**
 * Calculates card width, card height, vertical positioning, gap, horizontal start,
 * and exact rectangular bounding boxes for each card index.
 *
 * Default dimensions for 3 cards: cardW = 260, cardH = 320, cardY = 145, gap = 30, centered horizontally.
 * Scales responsively if cardCount is 1, 2, or 4.
 */
export function computeCardLayout(
  cardCount: number,
  arenaWidth: number,
  arenaHeight: number
): CardLayout {
  if (cardCount <= 0) {
    return {
      cardW: 260,
      cardH: 320,
      cardY: 145,
      gap: 30,
      startX: Math.floor(arenaWidth / 2),
      cards: [],
    };
  }

  let cardW = 260;
  let cardH = 320;
  let cardY = 145;
  let gap = 30;

  if (cardCount === 1) {
    cardW = 280;
    gap = 0;
  } else if (cardCount === 2) {
    cardW = 280;
    gap = 40;
  } else if (cardCount === 3) {
    cardW = 260;
    gap = 30;
  } else if (cardCount === 4) {
    cardW = 200;
    gap = 20;
  } else {
    // 5 or more cards: distribute dynamically
    gap = 16;
    cardW = Math.max(120, Math.floor((arenaWidth - 60 - (cardCount - 1) * gap) / cardCount));
  }

  // Adjust cardY if viewport height is heavily constrained
  if (arenaHeight < cardH + 120) {
    cardY = Math.max(20, Math.floor((arenaHeight - cardH) / 2));
  }

  // Constrain total layout width to available arena width with margins
  let totalWidth = cardCount * cardW + (cardCount - 1) * gap;
  const maxAvailableWidth = arenaWidth - 40;
  if (totalWidth > maxAvailableWidth && maxAvailableWidth > 0) {
    const scale = maxAvailableWidth / totalWidth;
    cardW = Math.max(100, Math.floor(cardW * scale));
    gap = Math.max(8, Math.floor(gap * scale));
    totalWidth = cardCount * cardW + (cardCount - 1) * gap;
  }

  const startX = Math.floor((arenaWidth - totalWidth) / 2);
  const cards: CardRect[] = [];

  for (let i = 0; i < cardCount; i++) {
    cards.push({
      x: startX + i * (cardW + gap),
      y: cardY,
      width: cardW,
      height: cardH,
    });
  }

  return {
    cardW,
    cardH,
    cardY,
    gap,
    startX,
    cards,
  };
}

/**
 * Performs exact mouse coordinate hit-testing against rendered card rectangles.
 * Returns the 0-based card index if (x, y) falls inside a card rectangle, or null if outside.
 */
export function getCardAt(
  x: number,
  y: number,
  cardCount: number,
  arenaWidth: number,
  arenaHeight: number
): number | null {
  if (cardCount <= 0) {
    return null;
  }

  const layout = computeCardLayout(cardCount, arenaWidth, arenaHeight);
  for (let i = 0; i < layout.cards.length; i++) {
    const rect = layout.cards[i];
    if (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    ) {
      return i;
    }
  }

  return null;
}

/**
 * Word-wraps text within a given maximum width and renders it line by line up to maxLines.
 * If lines exceed maxLines, the final line is truncated with an ellipsis.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 5
): void {
  if (!text) return;
  const lines = wrapTextLines(ctx, text, maxWidth, maxLines);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}

/**
 * Renders the tactical augmentation protocol selection overlay with dynamic N-card layout.
 */
export function renderUpgradeDraft(
  ctx: CanvasRenderingContext2D,
  draftOptions: UpgradeDefinition[],
  arenaWidth: number,
  arenaHeight: number,
  hoveredIndex: number | null = null,
  sectorNumber: number = 1
): void {
  ctx.save();

  // 1. Veiled dark translucent backdrop
  ctx.fillStyle = "rgba(7, 10, 15, 0.94)";
  ctx.fillRect(0, 0, arenaWidth, arenaHeight);

  // 2. Header
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = getUIFont(22, "800");
  ctx.fillStyle = UITheme.colors.cyan;
  ctx.fillText("// TACTICAL AUGMENTATION PROTOCOL", arenaWidth / 2, 60);

  // Subhead
  ctx.font = getUIFont(12, "600");
  ctx.fillStyle = UITheme.colors.textSecondary;
  ctx.fillText(
    `SECTOR ${sectorNumber} BOSS NEUTRALIZED — SELECT 1 COMBAT SYSTEM UPGRADE`,
    arenaWidth / 2,
    95
  );

  const cardCount = draftOptions.length;
  if (cardCount === 0) {
    ctx.restore();
    return;
  }

  // 3. Dynamic Card Layout
  const layout = computeCardLayout(cardCount, arenaWidth, arenaHeight);

  for (let i = 0; i < cardCount; i++) {
    const card = draftOptions[i];
    const rect = layout.cards[i];
    const { x: cx, y: cardY, width: cardW, height: cardH } = rect;
    const accent = card.accentColor ?? UITheme.colors.cyan;
    const pad = Math.min(20, Math.max(12, Math.floor(cardW * 0.08)));
    const isHovered = hoveredIndex === i;

    // Card glass background
    ctx.fillStyle = isHovered ? "rgba(20, 26, 38, 0.98)" : "rgba(13, 17, 24, 0.96)";
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.lineWidth = isHovered ? 1.5 : 1;
    ctx.strokeStyle = isHovered ? accent : UITheme.colors.panelBorder;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Accent top bar (4px high if hovered, 3px otherwise)
    ctx.fillStyle = accent;
    ctx.fillRect(cx, cardY, cardW, isHovered ? 4 : 3);

    // Key badge prompt
    const badgeW = 44;
    const badgeH = 24;
    const badgeX = cx + pad;
    const badgeY = cardY + 20;

    ctx.fillStyle = isHovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = accent;
    ctx.fillText(`[${i + 1}]`, badgeX + badgeW / 2, badgeY + badgeH / 2);

    // Archetype subtitle
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(cardW < 220 ? 8 : 9, "bold");
    ctx.fillStyle = UITheme.colors.textMuted;
    const maxArchetypeW = Math.max(20, cardW - 2 * pad - badgeW - 8);
    const archetypeText = truncateText(ctx, card.archetype, maxArchetypeW);
    ctx.fillText(archetypeText, badgeX + badgeW + 8, badgeY + badgeH / 2);

    // Title
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(cardW < 220 ? 13 : 15, "800");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText(card.name, cx + pad, cardY + 76);

    // Stat highlight box
    const boxX = cx + pad;
    const boxY = cardY + 102;
    const boxW = cardW - 2 * pad;
    const boxH = 36;

    ctx.fillStyle = isHovered ? "rgba(0, 240, 255, 0.12)" : "rgba(0, 240, 255, 0.06)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(cardW < 220 ? 11 : 12, "bold");
    ctx.fillStyle = accent;
    ctx.fillText(card.statHighlight, cx + cardW / 2, boxY + boxH / 2);

    // Description text
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(cardW < 220 ? 9 : 10, "normal");
    ctx.fillStyle = UITheme.colors.textSecondary;
    wrapText(ctx, card.description, cx + pad, cardY + 150, cardW - 2 * pad, 15, 5);

    // Select button
    const btnH = 28;
    const btnY = cardY + cardH - 45;
    const btnW = cardW - 2 * pad;

    if (isHovered) {
      // Solid high-visibility accent button on hover
      ctx.fillStyle = accent;
      ctx.fillRect(cx + pad, btnY, btnW, btnH);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + pad, btnY, btnW, btnH);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = getUIFont(11, "800");
      ctx.fillStyle = "#070a0f";
      ctx.fillText(`INSTALL [${i + 1}]`, cx + cardW / 2, btnY + btnH / 2);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(cx + pad, btnY, btnW, btnH);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + pad, btnY, btnW, btnH);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = accent;
      ctx.fillText(`INSTALL [${i + 1}]`, cx + cardW / 2, btnY + btnH / 2);
    }
  }

  // 4. Footer prompt
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = getUIFont(11, "600");
  ctx.fillStyle = UITheme.colors.textMuted;

  const nextSector = sectorNumber + 1;
  let footerPrompt = `PRESS [1], [2], OR [3] OR CLICK A CARD TO INSTALL AND ADVANCE TO ZONE ${nextSector}`;
  if (cardCount === 1) {
    footerPrompt = "PRESS [1] OR CLICK THE CARD TO INSTALL AND ADVANCE";
  } else if (cardCount === 2) {
    footerPrompt = `PRESS [1] OR [2] OR CLICK A CARD TO INSTALL AND ADVANCE TO ZONE ${nextSector}`;
  } else if (cardCount === 4) {
    footerPrompt = `PRESS [1], [2], [3], OR [4] OR CLICK A CARD TO INSTALL AND ADVANCE TO ZONE ${nextSector}`;
  } else if (cardCount > 4) {
    footerPrompt = `PRESS [1] - [${cardCount}] OR CLICK A CARD TO INSTALL AND ADVANCE`;
  }
  ctx.fillText(footerPrompt, arenaWidth / 2, layout.cardY + layout.cardH + 20);

  ctx.restore();
}

/**
 * Decoupled HUD component class for tactical upgrade draft selection overlays.
 */
export class UpgradeDraftHUD {
  public static computeCardLayout(
    cardCount: number,
    arenaWidth: number,
    arenaHeight: number
  ): CardLayout {
    return computeCardLayout(cardCount, arenaWidth, arenaHeight);
  }

  public static getCardAt(
    x: number,
    y: number,
    cardCount: number,
    arenaWidth: number,
    arenaHeight: number
  ): number | null {
    return getCardAt(x, y, cardCount, arenaWidth, arenaHeight);
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    draftOptions: UpgradeDefinition[],
    arenaWidth: number,
    arenaHeight: number,
    hoveredIndex: number | null = null,
    sectorNumber: number = 1
  ): void {
    renderUpgradeDraft(ctx, draftOptions, arenaWidth, arenaHeight, hoveredIndex, sectorNumber);
  }

  public computeCardLayout(
    cardCount: number,
    arenaWidth: number,
    arenaHeight: number
  ): CardLayout {
    return computeCardLayout(cardCount, arenaWidth, arenaHeight);
  }

  public getCardAt(
    x: number,
    y: number,
    cardCount: number,
    arenaWidth: number,
    arenaHeight: number
  ): number | null {
    return getCardAt(x, y, cardCount, arenaWidth, arenaHeight);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    draftOptions: UpgradeDefinition[],
    arenaWidth: number,
    arenaHeight: number,
    hoveredIndex: number | null = null,
    sectorNumber: number = 1
  ): void {
    renderUpgradeDraft(ctx, draftOptions, arenaWidth, arenaHeight, hoveredIndex, sectorNumber);
  }
}
