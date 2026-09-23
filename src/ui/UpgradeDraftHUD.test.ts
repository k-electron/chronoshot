import { describe, expect, it, vi } from "vitest";
import type { UpgradeDefinition } from "../upgrades/UpgradeDefinition";
import { UITheme } from "./theme";
import {
  computeCardLayout,
  getCardAt,
  renderUpgradeDraft,
  UpgradeDraftHUD,
  wrapText,
} from "./UpgradeDraftHUD";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  } as unknown as CanvasRenderingContext2D;
}

const mockDraftOptions: UpgradeDefinition[] = [
  {
    id: "extended-cylinder",
    name: "EXTENDED CYLINDER",
    archetype: "FIREPOWER // CAPACITY",
    statHighlight: "6 → 8 CHAMBERS",
    description:
      "Expands revolver capacity by +2 chambers. Neutralize multiple heavily armored hostiles without mid-combat reload vulnerability.",
    accentColor: UITheme.colors.cyan,
  },
  {
    id: "speed-loader",
    name: "SPEED LOADER",
    archetype: "TEMPO // CYCLING",
    statHighlight: "+15 TICK RELOAD",
    description:
      "Halves ammunition cycle exposure from 30 ticks to 15 ticks. Enables aggressive repositioning and rapid tactical recovery under fire.",
    accentColor: "#ffb703",
  },
  {
    id: "reactive-shield",
    name: "REACTIVE SHIELD",
    archetype: "DEFENSE // RESILIENCE",
    statHighlight: "+1 SHIELD HIT BUFFER",
    description:
      "Deploys a kinetic deflection barrier that absorbs 1 lethal projectile impact per room before shattering. Crucial for permadeath runs.",
    accentColor: "#06d6a0",
  },
];

describe("UpgradeDraftHUD", () => {
  describe("computeCardLayout", () => {
    it("computes default 3-card layout matching specifications", () => {
      const layout = computeCardLayout(3, 960, 640);

      expect(layout.cardW).toBe(260);
      expect(layout.cardH).toBe(320);
      expect(layout.cardY).toBe(145);
      expect(layout.gap).toBe(30);
      expect(layout.startX).toBe(60);
      expect(layout.cards).toHaveLength(3);

      // Card 0: 60..320
      expect(layout.cards[0]).toEqual({
        x: 60,
        y: 145,
        width: 260,
        height: 320,
      });

      // Card 1: 350..610
      expect(layout.cards[1]).toEqual({
        x: 350,
        y: 145,
        width: 260,
        height: 320,
      });

      // Card 2: 640..900
      expect(layout.cards[2]).toEqual({
        x: 640,
        y: 145,
        width: 260,
        height: 320,
      });
    });

    it("computes single card layout centered horizontally", () => {
      const layout = computeCardLayout(1, 960, 640);

      expect(layout.cardW).toBe(280);
      expect(layout.cardH).toBe(320);
      expect(layout.cardY).toBe(145);
      expect(layout.cards).toHaveLength(1);
      // startX = (960 - 280) / 2 = 340
      expect(layout.startX).toBe(340);
      expect(layout.cards[0]).toEqual({
        x: 340,
        y: 145,
        width: 280,
        height: 320,
      });
    });

    it("computes 2-card layout centered with gap", () => {
      const layout = computeCardLayout(2, 960, 640);

      expect(layout.cardW).toBe(280);
      expect(layout.cardH).toBe(320);
      expect(layout.cardY).toBe(145);
      expect(layout.gap).toBe(40);
      expect(layout.cards).toHaveLength(2);
      // total = 2 * 280 + 40 = 600. startX = (960 - 600) / 2 = 180
      expect(layout.startX).toBe(180);
      expect(layout.cards[0]).toEqual({
        x: 180,
        y: 145,
        width: 280,
        height: 320,
      });
      expect(layout.cards[1]).toEqual({
        x: 500,
        y: 145,
        width: 280,
        height: 320,
      });
    });

    it("computes 4-card layout scaled to fit viewport width", () => {
      const layout = computeCardLayout(4, 960, 640);

      expect(layout.cardW).toBe(200);
      expect(layout.cardH).toBe(320);
      expect(layout.cardY).toBe(145);
      expect(layout.gap).toBe(20);
      expect(layout.cards).toHaveLength(4);
      // total = 4 * 200 + 3 * 20 = 860. startX = (960 - 860) / 2 = 50
      expect(layout.startX).toBe(50);
      expect(layout.cards[0]).toEqual({
        x: 50,
        y: 145,
        width: 200,
        height: 320,
      });
      expect(layout.cards[1]).toEqual({
        x: 270,
        y: 145,
        width: 200,
        height: 320,
      });
      expect(layout.cards[2]).toEqual({
        x: 490,
        y: 145,
        width: 200,
        height: 320,
      });
      expect(layout.cards[3]).toEqual({
        x: 710,
        y: 145,
        width: 200,
        height: 320,
      });

      // Right edge margin should be 50px
      const rightEdge = layout.cards[3].x + layout.cards[3].width;
      expect(960 - rightEdge).toBe(50);
    });

    it("handles zero or negative cardCount gracefully", () => {
      const layoutZero = computeCardLayout(0, 960, 640);
      expect(layoutZero.cards).toHaveLength(0);

      const layoutNeg = computeCardLayout(-2, 960, 640);
      expect(layoutNeg.cards).toHaveLength(0);
    });

    it("scales cards down when viewport is narrow", () => {
      const layout = computeCardLayout(3, 600, 640);
      // Available width is 560; 3 * 260 + 60 = 840 > 560, so it scales down
      const totalWidth =
        layout.cards[2].x + layout.cards[2].width - layout.cards[0].x;
      expect(totalWidth).toBeLessThanOrEqual(560);
      expect(layout.cardW).toBeLessThan(260);
    });
  });

  describe("getCardAt hit-testing", () => {
    it("returns 0, 1, 2 for points inside cards and null for points outside", () => {
      // 3 cards on 960x640:
      // Card 0: [60..320, 145..465]
      // Card 1: [350..610, 145..465]
      // Card 2: [640..900, 145..465]

      // Inside Card 0
      expect(getCardAt(100, 200, 3, 960, 640)).toBe(0);
      expect(getCardAt(60, 145, 3, 960, 640)).toBe(0); // Top-left edge
      expect(getCardAt(320, 465, 3, 960, 640)).toBe(0); // Bottom-right edge

      // Inside Card 1
      expect(getCardAt(480, 250, 3, 960, 640)).toBe(1);
      expect(getCardAt(350, 145, 3, 960, 640)).toBe(1);
      expect(getCardAt(610, 465, 3, 960, 640)).toBe(1);

      // Inside Card 2
      expect(getCardAt(700, 200, 3, 960, 640)).toBe(2);
      expect(getCardAt(640, 145, 3, 960, 640)).toBe(2);
      expect(getCardAt(900, 465, 3, 960, 640)).toBe(2);

      // Between Card 0 and Card 1 (in gap: 321..349)
      expect(getCardAt(335, 200, 3, 960, 640)).toBeNull();

      // Between Card 1 and Card 2 (in gap: 611..639)
      expect(getCardAt(625, 200, 3, 960, 640)).toBeNull();

      // Outside to the left
      expect(getCardAt(30, 200, 3, 960, 640)).toBeNull();

      // Outside to the right
      expect(getCardAt(920, 200, 3, 960, 640)).toBeNull();

      // Outside above cards
      expect(getCardAt(100, 50, 3, 960, 640)).toBeNull();

      // Outside below cards
      expect(getCardAt(100, 500, 3, 960, 640)).toBeNull();
    });

    it("returns null when cardCount is zero or negative", () => {
      expect(getCardAt(100, 200, 0, 960, 640)).toBeNull();
      expect(getCardAt(100, 200, -1, 960, 640)).toBeNull();
    });

    it("hit-tests accurately for 4-card layout", () => {
      // Card 0: [50..250]
      // Card 1: [270..470]
      // Card 2: [490..690]
      // Card 3: [710..910]
      expect(getCardAt(150, 200, 4, 960, 640)).toBe(0);
      expect(getCardAt(350, 200, 4, 960, 640)).toBe(1);
      expect(getCardAt(550, 200, 4, 960, 640)).toBe(2);
      expect(getCardAt(750, 200, 4, 960, 640)).toBe(3);
      expect(getCardAt(260, 200, 4, 960, 640)).toBeNull(); // Gap
    });
  });

  describe("renderUpgradeDraft", () => {
    it("renders complete 3-card draft overlay with header, cards, and prompts", () => {
      const ctx = createMockContext();

      renderUpgradeDraft(ctx, mockDraftOptions, 960, 640);

      // Context state preservation
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();

      // Backdrop fill
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 960, 640);

      // Header text
      expect(ctx.fillText).toHaveBeenCalledWith(
        "// TACTICAL AUGMENTATION PROTOCOL",
        480,
        60
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "SECTOR 1 BOSS NEUTRALIZED — SELECT 1 COMBAT SYSTEM UPGRADE",
        480,
        95
      );

      // Key badges
      expect(ctx.fillText).toHaveBeenCalledWith("[1]", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("[2]", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("[3]", expect.any(Number), expect.any(Number));

      // Archetype labels
      expect(ctx.fillText).toHaveBeenCalledWith("FIREPOWER // CAPACITY", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("TEMPO // CYCLING", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("DEFENSE // RESILIENCE", expect.any(Number), expect.any(Number));

      // Card titles
      expect(ctx.fillText).toHaveBeenCalledWith("EXTENDED CYLINDER", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("SPEED LOADER", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("REACTIVE SHIELD", expect.any(Number), expect.any(Number));

      // Stat highlights
      expect(ctx.fillText).toHaveBeenCalledWith("6 → 8 CHAMBERS", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("+15 TICK RELOAD", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("+1 SHIELD HIT BUFFER", expect.any(Number), expect.any(Number));

      // Install button labels
      expect(ctx.fillText).toHaveBeenCalledWith("INSTALL [1]", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("INSTALL [2]", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("INSTALL [3]", expect.any(Number), expect.any(Number));

      // Footer prompt
      expect(ctx.fillText).toHaveBeenCalledWith(
        "PRESS [1], [2], OR [3] OR CLICK A CARD TO INSTALL AND ADVANCE TO ZONE 2",
        480,
        expect.any(Number)
      );
    });

    it("falls back to cyan accent when accentColor is omitted", () => {
      const ctx = createMockContext();
      const optionsWithoutAccent: UpgradeDefinition[] = [
        {
          id: "custom-mod",
          name: "CUSTOM MOD",
          archetype: "TACTICAL // SPECIAL",
          statHighlight: "+10% VELOCITY",
          description: "Increases baseline movement velocity.",
        },
      ];

      renderUpgradeDraft(ctx, optionsWithoutAccent, 960, 640);

      expect(ctx.fillText).toHaveBeenCalledWith("CUSTOM MOD", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("+10% VELOCITY", expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith("[1]", expect.any(Number), expect.any(Number));
    });

    it("handles empty draft options array without throwing", () => {
      const ctx = createMockContext();

      expect(() => renderUpgradeDraft(ctx, [], 960, 640)).not.toThrow();
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 960, 640);
    });

    it("handles mock contexts where measureText is undefined", () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      expect(() =>
        renderUpgradeDraft(ctx, mockDraftOptions, 960, 640)
      ).not.toThrow();
      expect(ctx.fillText).toHaveBeenCalledWith("EXTENDED CYLINDER", expect.any(Number), expect.any(Number));
    });
  });

  describe("wrapText helper", () => {
    it("splits long text across multiple lines", () => {
      const ctx = createMockContext();
      wrapText(
        ctx,
        "Expands revolver capacity by +2 chambers. Neutralize multiple hostiles.",
        20,
        100,
        150,
        16
      );

      // Should have called fillText multiple times for wrapped lines
      expect(ctx.fillText).toHaveBeenCalled();
      const callCount = (ctx.fillText as any).mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
    });

    it("handles empty string gracefully", () => {
      const ctx = createMockContext();
      wrapText(ctx, "", 20, 100, 150, 16);
      expect(ctx.fillText).not.toHaveBeenCalled();
    });
  });

  describe("UpgradeDraftHUD class wrapper", () => {
    it("exposes static and instance methods delegating to functions", () => {
      const ctx = createMockContext();
      const hud = new UpgradeDraftHUD();

      // Static methods
      const staticLayout = UpgradeDraftHUD.computeCardLayout(3, 960, 640);
      expect(staticLayout.cards).toHaveLength(3);

      const staticCard = UpgradeDraftHUD.getCardAt(100, 200, 3, 960, 640);
      expect(staticCard).toBe(0);

      UpgradeDraftHUD.render(ctx, mockDraftOptions, 960, 640);
      expect(ctx.save).toHaveBeenCalled();

      // Instance methods
      const instanceLayout = hud.computeCardLayout(3, 960, 640);
      expect(instanceLayout.cards).toHaveLength(3);

      const instanceCard = hud.getCardAt(100, 200, 3, 960, 640);
      expect(instanceCard).toBe(0);

      hud.render(ctx, mockDraftOptions, 960, 640);
      expect(ctx.restore).toHaveBeenCalled();
    });
  });
});
