import { describe, expect, it, vi } from "vitest";
import { computeVictoryLayout, VictoryHUD } from "./VictoryHUD";

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

describe("VictoryHUD", () => {
  it("computes two centered cards for 960x640 canvas", () => {
    const layout = computeVictoryLayout(960, 640);
    expect(layout.cards).toHaveLength(2);
    const [card0, card1] = layout.cards;

    // Card 0 (Endless) on left, Card 1 (Reset) on right
    expect(card0.x).toBeLessThan(card1.x);
    expect(card0.width).toBe(290);
    expect(card1.width).toBe(290);
    expect(card0.height).toBe(190);
    expect(card1.height).toBe(190);

    // Total width is 290 * 2 + 40 = 620, centered in 960 => startX = (960 - 620) / 2 = 170
    expect(card0.x).toBe(170);
    expect(card1.x).toBe(170 + 290 + 40); // 500
    expect(card0.y).toBe(295);
  });

  it("detects mouse coordinates inside Card 0 (Endless), Card 1 (Reset), or null outside", () => {
    // Card 0 bounds: x in [170..460], y in [295..485]
    expect(VictoryHUD.getCardAt(250, 350, 960, 640)).toBe(0);

    // Card 1 bounds: x in [500..790], y in [295..485]
    expect(VictoryHUD.getCardAt(600, 350, 960, 640)).toBe(1);

    // Outside coordinates
    expect(VictoryHUD.getCardAt(100, 100, 960, 640)).toBeNull();
    expect(VictoryHUD.getCardAt(480, 350, 960, 640)).toBeNull(); // in the gap
    expect(VictoryHUD.getCardAt(250, 520, 960, 640)).toBeNull(); // below cards
  });

  it("renders victory screen with header, checkmarks, and dual cards without throwing", () => {
    const ctx = createMockContext();
    expect(() => VictoryHUD.render(ctx, 960, 640, null)).not.toThrow();

    expect(ctx.fillText).toHaveBeenCalledWith(
      "MISSION ACCOMPLISHED",
      480,
      115
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "ALL 20 TACTICAL PROTOCOLS CONQUERED",
      480,
      150
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Goliath-01"),
      480,
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Chrono-Zenith"),
      480,
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "ENDLESS PROTOCOL",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "EXPEDITION RESET",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders highlighted cards when hoveredCardIndex is specified", () => {
    const ctx0 = createMockContext();
    VictoryHUD.render(ctx0, 960, 640, 0);
    expect(ctx0.fillRect).toHaveBeenCalled();

    const ctx1 = createMockContext();
    VictoryHUD.render(ctx1, 960, 640, 1);
    expect(ctx1.fillRect).toHaveBeenCalled();
  });
});
