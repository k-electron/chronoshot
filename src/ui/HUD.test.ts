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
    moveTo: vi.fn(),
    lineTo: vi.fn(),
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
    expect(ctx.fillText).toHaveBeenCalledWith("6 / 6", 144, 92);
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
    expect(ctx.fillText).toHaveBeenCalledWith("0 / 6", 144, 92);
    expect(ctx.fillText).toHaveBeenCalledWith("[R] RELOAD (+30 TICKS)", 144, 112);
  });

  it("renders CylinderHUD with 8 chambers (extended cylinder) without throwing", () => {
    const revolver = new Revolver({ magSize: 8, reloadTickBurst: 15 });
    const hud = new CylinderHUD({ x: 100, y: 100 });
    const ctx = createMockContext();

    expect(() => hud.render(ctx, revolver)).not.toThrow();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("8 / 8", 144, 92);
    expect(ctx.fillText).toHaveBeenCalledWith("READY", 144, 112);

    // Drain one round and verify prompt displays speedLoader reload burst
    revolver.fire();
    hud.render(ctx, revolver);
    expect(ctx.fillText).toHaveBeenCalledWith("7 / 8", 144, 92);
    expect(ctx.fillText).toHaveBeenCalledWith("[R] RELOAD (+15 TICKS)", 144, 112);
  });

  it("renders TimeHUD scale gauge and burst notifications", () => {
    const governor = new TimeGovernor();
    const hud = new TimeHUD({ x: 20, y: 20, width: 200, height: 3 });
    const ctx = createMockContext();

    expect(() => hud.render(ctx, governor)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith("CHRONO // 0.05x", 20, 20);

    hud.notifyBurst(30, "reload");
    hud.render(ctx, governor);
    expect(ctx.fillText).toHaveBeenCalledWith("+30 TICKS [RELOAD]", 20, 47);
  });

  it("renders Reticle and triggers dry-fire flash", async () => {
    const { Reticle } = await import("./Reticle");
    const reticle = new Reticle();
    const ctx = createMockContext();

    reticle.render(ctx, { x: 200, y: 150 }, 0.05);
    expect(ctx.arc).toHaveBeenCalledWith(200, 150, 1.5, 0, Math.PI * 2);

    // Trigger dry fire and verify warning ring
    reticle.triggerDryFire();
    reticle.render(ctx, { x: 200, y: 150 }, 0.05);
    expect(ctx.arc).toHaveBeenCalledWith(200, 150, 12, 0, Math.PI * 2);
  });

  it("renders EndlessTelemetryHUD with active threat, survival time, and kill counter", async () => {
    const { EndlessTelemetryHUD } = await import("./EndlessTelemetryHUD");
    const ctx = createMockContext();

    EndlessTelemetryHUD.render(
      ctx,
      {
        threatBudget: 85,
        survivalTime: "02:40",
        kills: 14,
      },
      960
    );

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("ENDLESS PROTOCOL // SURVIVAL TELEMETRY"),
      480,
      20
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("THREAT: 85  |  SURVIVED: 02:40  |  KILLS: 14"),
      480,
      36
    );
  });

  it("renders Reticle circular reload progress sweep and amber state during active reload", async () => {
    const { Reticle } = await import("./Reticle");
    const reticle = new Reticle();
    const ctx = createMockContext();

    reticle.render(ctx, { x: 200, y: 150 }, 0.05, 0.5, true);
    expect(ctx.arc).toHaveBeenCalledWith(200, 150, 1.5, 0, Math.PI * 2);
    // Background ring and progress arc
    expect(ctx.arc).toHaveBeenCalledWith(200, 150, expect.any(Number), 0, Math.PI * 2);
    expect(ctx.arc).toHaveBeenCalledWith(
      200,
      150,
      expect.any(Number),
      -Math.PI / 2,
      expect.any(Number)
    );
  });

  it("renders CylinderHUD with cycling status text and dash abort prompt when reloading", () => {
    const revolver = new Revolver();
    revolver.fire();
    revolver.update(10);
    revolver.startReload(30);

    const hud = new CylinderHUD({ x: 100, y: 100 });
    const ctx = createMockContext();

    // Without dash ready
    hud.render(ctx, revolver, 0.016, false);
    expect(ctx.fillText).toHaveBeenCalledWith("5 / 6 [CYCLING]", 144, 92);
    expect(ctx.fillText).toHaveBeenCalledWith("CYCLING // 30/30 TICKS", 144, 112);

    // With dash ready
    const ctxWithDash = createMockContext();
    hud.render(ctxWithDash, revolver, 0.016, true);
    expect(ctxWithDash.fillText).toHaveBeenCalledWith(
      "CYCLING // 30/30 [[SPACE] DASH TO ABORT]",
      144,
      112
    );
  });
});


