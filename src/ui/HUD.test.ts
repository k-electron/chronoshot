import { describe, expect, it, vi } from "vitest";
import { TimeGovernor } from "../engine/TimeGovernor";
import { Revolver } from "../weapons/Revolver";
import { CylinderHUD } from "./CylinderHUD";
import { TimeHUD } from "./TimeHUD";

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
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  } as unknown as CanvasRenderingContext2D;
}

describe("HUD Rendering", () => {
  it("renders CylinderHUD with 6 chambers without throwing", () => {
    const revolver = new Revolver();
    const hud = new CylinderHUD({ x: 100, y: 100 });
    const ctx = createMockContext();

    expect(() => hud.render(ctx, revolver)).not.toThrow();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("6 / 6", 148, 92);
  });

  it("updates CylinderHUD prompt when ammunition is depleted", () => {
    const revolver = new Revolver();
    for (let i = 0; i < 6; i++) {
      revolver.fire();
      revolver.update(10);
    }
    const hud = new CylinderHUD({ x: 100, y: 100 });
    const ctx = createMockContext();

    hud.render(ctx, revolver);
    expect(ctx.fillText).toHaveBeenCalledWith("0 / 6", 148, 92);
    expect(ctx.fillText).toHaveBeenCalledWith("[R] RELOAD (+30 TICKS)", 148, 112);
  });

  it("renders TimeHUD scale gauge and burst notifications", () => {
    const governor = new TimeGovernor();
    const hud = new TimeHUD({ x: 20, y: 20, width: 200, height: 12 });
    const ctx = createMockContext();

    expect(() => hud.render(ctx, governor)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith("TIME DILATION: 5%", 20, 20);

    hud.notifyBurst(30, "reload");
    hud.render(ctx, governor);
    expect(ctx.fillText).toHaveBeenCalledWith("+30 TICKS [RELOAD]", 20, 56);
  });
});
