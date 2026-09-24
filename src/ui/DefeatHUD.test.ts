import { describe, expect, it, vi } from "vitest";
import {
  computeDefeatLayout,
  DefeatHUD,
  DefeatRenderData,
  formatDescriptionLines,
} from "./DefeatHUD";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("DefeatHUD", () => {
  it("computes two centered cards for 960x640 canvas in dual-card mode", () => {
    const layout = computeDefeatLayout(960, 640, 2);
    expect(layout.cards).toHaveLength(2);
    const [card0, card1] = layout.cards;

    // Card 0 (Rollback) on left, Card 1 (Reset) on right
    expect(card0.x).toBeLessThan(card1.x);
    expect(card0.width).toBe(280);
    expect(card1.width).toBe(280);
    expect(card0.height).toBe(200);
    expect(card1.height).toBe(200);

    // Total width is 600, centered in 960 => startX = 180
    expect(card0.x).toBe(180);
    expect(card1.x).toBe(180 + 280 + 40); // 500
  });

  it("computes one centered card for 960x640 canvas in single-card mode", () => {
    const layout = computeDefeatLayout(960, 640, 1);
    expect(layout.cards).toHaveLength(1);
    const [card0] = layout.cards;

    expect(card0.width).toBe(280);
    expect(card0.height).toBe(200);

    // Total width is 280, centered in 960 => startX = (960 - 280) / 2 = 340
    expect(card0.x).toBe(340);
  });

  it("detects mouse hit inside card 0 and card 1, and null elsewhere in dual-card mode", () => {
    // Card 0 bounds: x in [180..460], y in [290..490]
    expect(DefeatHUD.getCardAt(250, 350, 960, 640, 2)).toBe(0);

    // Card 1 bounds: x in [500..780], y in [290..490]
    expect(DefeatHUD.getCardAt(600, 350, 960, 640, 2)).toBe(1);

    // Outside (in the gap between cards)
    expect(DefeatHUD.getCardAt(480, 350, 960, 640, 2)).toBeNull();

    // Outside (above or below)
    expect(DefeatHUD.getCardAt(250, 100, 960, 640, 2)).toBeNull();
    expect(DefeatHUD.getCardAt(250, 550, 960, 640, 2)).toBeNull();
  });

  it("detects mouse hit inside single card, and null outside in single-card mode", () => {
    // Single card bounds: x in [340..620], y in [290..490]
    expect(DefeatHUD.getCardAt(480, 350, 960, 640, 1)).toBe(0);
    expect(DefeatHUD.getCardAt(350, 350, 960, 640, 1)).toBe(0);
    expect(DefeatHUD.getCardAt(610, 350, 960, 640, 1)).toBe(0);

    // Outside bounds (e.g. left of card or right of card)
    expect(DefeatHUD.getCardAt(250, 350, 960, 640, 1)).toBeNull();
    expect(DefeatHUD.getCardAt(700, 350, 960, 640, 1)).toBeNull();
    expect(DefeatHUD.getCardAt(480, 100, 960, 640, 1)).toBeNull();
    expect(DefeatHUD.getCardAt(480, 550, 960, 640, 1)).toBeNull();
  });

  it("renders Sector 1 defeat overlay with a single reset card", () => {
    const ctx = createMockContext();
    const data: DefeatRenderData = {
      roomNumber: 3,
      totalRooms: 20,
      tier: "TIER 1",
      roomTitle: "BASIC COVER",
      rollbackTarget: {
        roomNumber: 1,
        roomIndex: 0,
        bossName: "BASIC COVER",
        loadoutDescription: "Full expedition reset (0 Augmentations)",
        requiredAugmentationCount: 0,
      },
      isEndless: false,
      hoveredCardIndex: 0,
    };

    expect(() => DefeatHUD.render(ctx, data, 960, 640)).not.toThrow();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith(
      "[ R ]",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "EXPEDITION RESET",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders campaign defeat overlay with dual cards for Sector 2+", () => {
    const ctx = createMockContext();
    const data: DefeatRenderData = {
      roomNumber: 8,
      totalRooms: 20,
      tier: "TIER 2",
      roomTitle: "KILLBOX ENCLOSURE",
      rollbackTarget: {
        roomNumber: 5,
        roomIndex: 4,
        bossName: "GOLIATH-01",
        loadoutDescription: "Restores Sector 1 entry loadout (0 Augmentations)",
        requiredAugmentationCount: 0,
      },
      isEndless: false,
      hoveredCardIndex: 0,
    };

    expect(() => DefeatHUD.render(ctx, data, 960, 640)).not.toThrow();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith(
      "[ SHIFT + R ]",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "TIMELINE ROLLBACK",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders endless mode defeat overlay with survival stats without throwing", () => {
    const ctx = createMockContext();
    const data: DefeatRenderData = {
      roomNumber: 21,
      totalRooms: 20,
      tier: "APEX",
      roomTitle: "APEX COLOSSEUM",
      rollbackTarget: {
        roomNumber: 20,
        roomIndex: 19,
        bossName: "CHRONO-ZENITH",
        loadoutDescription: "Restores Sector 4 loadout (3 Augmentations)",
        requiredAugmentationCount: 3,
      },
      isEndless: true,
      endlessStats: {
        survivalTime: "03:45",
        maxThreat: 285,
        kills: 42,
      },
      hoveredCardIndex: 1,
    };

    expect(() => DefeatHUD.render(ctx, data, 960, 640)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  describe("formatDescriptionLines", () => {
    it("splits strings with parenthetical augmentation suffixes into two lines", () => {
      const ctx = createMockContext();
      const lines = formatDescriptionLines(
        ctx,
        "Restores Sector 1 entry loadout (0 Augmentations)"
      );
      expect(lines).toEqual([
        "Restores Sector 1 entry loadout",
        "(0 Augmentations)",
      ]);
    });

    it("splits Sector 1 reset description into two lines", () => {
      const ctx = createMockContext();
      const lines = formatDescriptionLines(
        ctx,
        "Restart expedition from Room 01 (0 Augmentations)"
      );
      expect(lines).toEqual([
        "Restart expedition from Room 01",
        "(0 Augmentations)",
      ]);
    });

    it("returns single line or wraps text without parentheticals", () => {
      const ctx = createMockContext();
      const lines = formatDescriptionLines(
        ctx,
        "Abandon run & clear augmentations"
      );
      expect(lines).toEqual(["Abandon run & clear augmentations"]);
    });

    it("handles empty string gracefully", () => {
      const ctx = createMockContext();
      expect(formatDescriptionLines(ctx, "")).toEqual([]);
    });
  });

  it("renders two-line descriptions for rollback and reset cards", () => {
    const ctx = createMockContext();
    const data: DefeatRenderData = {
      roomNumber: 8,
      totalRooms: 20,
      tier: "TIER 2",
      roomTitle: "KILLBOX ENCLOSURE",
      rollbackTarget: {
        roomNumber: 5,
        roomIndex: 4,
        bossName: "GOLIATH-01",
        loadoutDescription: "Restores Sector 1 entry loadout (0 Augmentations)",
        requiredAugmentationCount: 0,
      },
      isEndless: false,
      hoveredCardIndex: 0,
    };

    DefeatHUD.render(ctx, data, 960, 640);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "Restores Sector 1 entry loadout",
      expect.any(Number),
      110 + 290
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "(0 Augmentations)",
      expect.any(Number),
      126 + 290
    );
  });
});
