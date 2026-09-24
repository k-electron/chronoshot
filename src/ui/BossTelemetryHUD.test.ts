import { describe, expect, it, vi } from "vitest";
import {
  BossTelemetryData,
  BossTelemetryHUD,
  renderBossTelemetry,
} from "./BossTelemetryHUD";
import { UITheme } from "./theme";

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

describe("BossTelemetryHUD", () => {
  it("renders Phase 1 (shielded) telemetry with full shields and cyan pips", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "GOLIATH-01: AEGIS COLOSSUS",
      currentPhase: 1,
      totalPhases: 2,
      shields: 4,
      maxShields: 4,
      isAlive: true,
      isEnraged: false,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();

    // Verify designation and labels
    expect(ctx.fillText).toHaveBeenCalledWith(
      "GOLIATH-01: AEGIS COLOSSUS",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "PHASE 1/2",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "SHIELDS",
      expect.any(Number),
      expect.any(Number)
    );

    // Verify panel and pip draw calls
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(UITheme.colors.cyan).toBe("#00f0ff");
  });

  it("renders Phase 2 (enraged) telemetry with overdrive badge and warning", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "GOLIATH-01: AEGIS COLOSSUS",
      currentPhase: 2,
      totalPhases: 2,
      shields: 0,
      maxShields: 4,
      isAlive: true,
      isEnraged: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "GOLIATH-01: AEGIS COLOSSUS",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "CORE VULNERABLE // ENRAGED",
      expect.any(Number),
      expect.any(Number)
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "PHASE 2/2 // OVERDRIVE",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders custom phaseTitle when provided in BossTelemetryData", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "GOLIATH-01: AEGIS COLOSSUS",
      currentPhase: 1,
      totalPhases: 3,
      phaseTitle: "Aegis Barricade",
      shields: 3,
      maxShields: 4,
      isAlive: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "PHASE 1/3 // AEGIS BARRICADE",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("preserves phaseTitle if already prefixed with PHASE", () => {
    const data: BossTelemetryData = {
      name: "CHRONO-NEXUS",
      currentPhase: 2,
      totalPhases: 2,
      phaseTitle: "PHASE 2/2 // OVERDRIVE",
      shields: 0,
      maxShields: 0,
      isAlive: true,
    };

    const badge = BossTelemetryHUD.getPhaseBadgeText(data);
    expect(badge).toBe("PHASE 2/2 // OVERDRIVE");
  });

  it("renders partial shield damage with both active and spent pips", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "GOLIATH-01",
      currentPhase: 1,
      totalPhases: 2,
      shields: 2,
      maxShields: 4,
      isAlive: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    // 4 shield pips: 2 active (cyan fill), 2 spent (muted fill)
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("SHIELDS", expect.any(Number), expect.any(Number));
  });

  it("renders unshielded boss with UNSHIELDED status and zero shield pips", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "STALKER ALPHA",
      currentPhase: 1,
      totalPhases: 1,
      shields: 0,
      maxShields: 0,
      isAlive: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.fillText).toHaveBeenCalledWith("UNSHIELDED", expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith("PHASE 1/1", expect.any(Number), expect.any(Number));
  });

  it("does not render if boss is not alive", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "GOLIATH-01",
      currentPhase: 2,
      totalPhases: 2,
      shields: 0,
      maxShields: 4,
      isAlive: false,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it("falls back to default designation when boss name is blank", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "   ",
      currentPhase: 1,
      totalPhases: 2,
      shields: 4,
      maxShields: 4,
      isAlive: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "GOLIATH-01: AEGIS COLOSSUS",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("handles mock contexts where measureText is not implemented", () => {
    const ctx = {
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
    } as unknown as CanvasRenderingContext2D;

    const data: BossTelemetryData = {
      name: "GOLIATH-01",
      currentPhase: 1,
      totalPhases: 3,
      shields: 4,
      maxShields: 4,
      isAlive: true,
    };

    expect(() => BossTelemetryHUD.render(ctx, data, 960)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith("PHASE 1/3", expect.any(Number), expect.any(Number));
  });

  it("exports renderBossTelemetry standalone helper function and instance render", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "TITAN-02",
      currentPhase: 1,
      totalPhases: 1,
      shields: 2,
      maxShields: 2,
      isAlive: true,
    };

    renderBossTelemetry(ctx, data, 800);
    expect(ctx.fillText).toHaveBeenCalledWith("TITAN-02", expect.any(Number), expect.any(Number));

    const hudInstance = new BossTelemetryHUD();
    hudInstance.render(ctx, data, 800);
    expect(ctx.fillText).toHaveBeenCalledWith("TITAN-02", expect.any(Number), expect.any(Number));
  });

  it("truncates excessively long boss names and phase titles with ellipsis to prevent shield pip collisions", () => {
    const ctx = createMockContext();
    const data: BossTelemetryData = {
      name: "CHRONO-ZENITH: ZERO SOVEREIGN OMEGA HYPERION TITAN OF THE VOID",
      currentPhase: 3,
      totalPhases: 3,
      phaseTitle: "CATACLYSM OVERLOAD MATRIX PROTOCOL EXTREME DESTRUCTION",
      shields: 8,
      maxShields: 8,
      isAlive: true,
      isEnraged: true,
    };

    BossTelemetryHUD.render(ctx, data, 960);
    const calls = (ctx.fillText as any).mock.calls;
    const truncatedTitleCall = calls.find((c: any[]) => typeof c[0] === "string" && c[0].startsWith("CHRONO-ZENITH") && c[0].endsWith("…"));
    expect(truncatedTitleCall).toBeDefined();

    const truncatedPhaseCall = calls.find((c: any[]) => typeof c[0] === "string" && c[0].startsWith("PHASE") && c[0].endsWith("…"));
    expect(truncatedPhaseCall).toBeDefined();
  });
});
