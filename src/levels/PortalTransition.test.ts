import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../math/vector";
import {
  PortalTransitionController,
  PortalTransitionPhase,
} from "./PortalTransition";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe("PortalTransitionController", () => {
  it("initializes in idle state with default configuration", () => {
    const controller = new PortalTransitionController();

    expect(controller.getPhase()).toBe<PortalTransitionPhase>("none");
    expect(controller.isActive()).toBe(false);
    expect(controller.getProgress()).toBe(0);
    expect(controller.getRadius()).toBe(750);
  });

  it("respects custom configuration parameters", () => {
    const controller = new PortalTransitionController({
      ingressDuration: 0.2,
      egressDuration: 0.3,
      maxIrisRadius: 900,
    });

    expect(controller.getRadius()).toBe(900);
    controller.startIngress(vec2(500, 300));
    expect(controller.isActive()).toBe(true);
    expect(controller.getPhase()).toBe("ingress");

    const playerPos = vec2(400, 300);
    controller.update(0.1, playerPos, () => {});
    expect(controller.getProgress()).toBeCloseTo(0.5, 3);
    expect(controller.getRadius()).toBeCloseTo(450, 1);
  });

  it("manages ingress phase: magnetic pull, contraction, and midpoint trigger", () => {
    const controller = new PortalTransitionController({
      ingressDuration: 0.14,
      egressDuration: 0.14,
      maxIrisRadius: 700,
    });

    const portalCenter = vec2(800, 320);
    controller.startIngress(portalCenter);

    expect(controller.getPhase()).toBe("ingress");
    expect(controller.isActive()).toBe(true);
    expect(controller.getProgress()).toBe(0);
    expect(controller.getRadius()).toBe(700);

    const playerPos = vec2(700, 320);
    const onMidpoint = vi.fn().mockReturnValue(vec2(150, 320));
    const onComplete = vi.fn();

    // Advance 0.07s (halfway through ingress)
    controller.update(0.07, playerPos, onMidpoint, onComplete);

    expect(controller.getPhase()).toBe("ingress");
    expect(controller.getProgress()).toBeCloseTo(0.5, 3);
    expect(controller.getRadius()).toBeCloseTo(350, 1);
    // Player should have been pulled toward portal center (between 700 and 800)
    expect(playerPos.x).toBeGreaterThan(700);
    expect(playerPos.x).toBeLessThan(800);
    expect(onMidpoint).not.toHaveBeenCalled();

    // Advance another 0.07s to reach ingressDuration (midpoint)
    controller.update(0.07, playerPos, onMidpoint, onComplete);

    expect(playerPos.x).toBe(portalCenter.x);
    expect(playerPos.y).toBe(portalCenter.y);
    expect(onMidpoint).toHaveBeenCalledTimes(1);
    expect(controller.getPhase()).toBe("egress");
    expect(controller.isActive()).toBe(true);
    expect(controller.getProgress()).toBe(0);
    expect(controller.getRadius()).toBe(0);
  });

  it("manages egress phase: expansion and completion callback", () => {
    const controller = new PortalTransitionController({
      ingressDuration: 0.1,
      egressDuration: 0.1,
      maxIrisRadius: 600,
    });

    const portalCenter = vec2(800, 400);
    const newSpawn = vec2(120, 240);
    controller.startIngress(portalCenter);

    const playerPos = vec2(750, 400);
    const onMidpoint = vi.fn().mockReturnValue(newSpawn);
    const onComplete = vi.fn();

    // Complete ingress
    controller.update(0.1, playerPos, onMidpoint, onComplete);
    expect(controller.getPhase()).toBe("egress");
    expect(controller.getProgress()).toBe(0);
    expect(controller.getRadius()).toBe(0);

    // Halfway through egress
    controller.update(0.05, playerPos, onMidpoint, onComplete);
    expect(controller.getPhase()).toBe("egress");
    expect(controller.getProgress()).toBeCloseTo(0.5, 3);
    expect(controller.getRadius()).toBeCloseTo(300, 1);
    expect(onComplete).not.toHaveBeenCalled();

    // Complete egress
    controller.update(0.05, playerPos, onMidpoint, onComplete);
    expect(controller.getPhase()).toBe("none");
    expect(controller.isActive()).toBe(false);
    expect(controller.getProgress()).toBe(0);
    expect(controller.getRadius()).toBe(600);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("handles void return from onMidpoint by defaulting egressCenter to player position", () => {
    const controller = new PortalTransitionController({
      ingressDuration: 0.1,
      egressDuration: 0.1,
    });

    controller.startIngress(vec2(800, 320));
    const playerPos = vec2(800, 320);
    const onMidpoint = vi.fn().mockReturnValue(undefined);

    controller.update(0.1, playerPos, onMidpoint);
    expect(controller.getPhase()).toBe("egress");
  });

  it("resets immediately back to idle when reset() is invoked", () => {
    const controller = new PortalTransitionController();
    controller.startIngress(vec2(500, 300));
    expect(controller.isActive()).toBe(true);

    controller.reset();
    expect(controller.getPhase()).toBe("none");
    expect(controller.isActive()).toBe(false);
    expect(controller.getProgress()).toBe(0);
  });

  it("renders nothing when inactive", () => {
    const controller = new PortalTransitionController();
    const ctx = createMockContext();

    controller.render(ctx, 960, 640);
    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("renders dark shroud, octagonal rim, and aperture blades during active transition", () => {
    const controller = new PortalTransitionController({
      ingressDuration: 0.1,
      maxIrisRadius: 500,
    });
    controller.startIngress(vec2(480, 320));

    const playerPos = vec2(400, 320);
    // Advance halfway so radius is ~250
    controller.update(0.05, playerPos, () => {});

    const ctx = createMockContext();
    controller.render(ctx, 960, 640);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 960, 640);
    expect(ctx.fillStyle).toBe("rgba(11, 13, 17, 0.95)");
    expect(ctx.fill).toHaveBeenCalledWith("evenodd");

    // Octagonal rim stroked with radiant cyan
    expect(ctx.strokeStyle).toBe("rgba(0, 240, 255, 0.6)"); // last assigned strokeStyle
    expect(ctx.stroke).toHaveBeenCalledTimes(2); // once for rim, once for blades
    expect(ctx.restore).toHaveBeenCalled();
  });
});
