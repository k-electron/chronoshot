import { describe, expect, it, vi } from "vitest";
import { vec2 } from "../../math/vector";
import { AttackBehavior, AttackContext } from "../behaviors/attack/AttackBehavior";
import { DirectAdvanceBehavior } from "../behaviors/movement/DirectAdvanceBehavior";
import { KiterBehavior } from "../behaviors/movement/KiterBehavior";
import { Projectile } from "../Projectile";
import {
  BossContext,
  BossPhaseConfig,
  BossPhaseController,
} from "./BossPhaseController";

class MockAttack implements AttackBehavior {
  public readonly fireCadenceTicks: number = 30;
  public fireCooldownTicks: number = 30;
  public isChargingLaser: boolean = false;
  public stutterTimerTicks: number = 0;
  public updateCalls: number = 0;
  public resetCalls: number = 0;

  constructor(public readonly tag: string = "default") {}

  update(_ctx: AttackContext, _hasLineOfSight: boolean, deltaTicks: number): Projectile[] {
    this.updateCalls += deltaTicks;
    return [];
  }

  discharge(_ctx: AttackContext): Projectile[] {
    return [];
  }

  reset(): void {
    this.resetCalls++;
    this.fireCooldownTicks = this.fireCadenceTicks;
  }
}

function createTestPhase(
  index: number,
  overrides?: Partial<BossPhaseConfig>
): BossPhaseConfig {
  return {
    phaseIndex: index,
    phaseTitle: `PHASE ${index + 1} // TEST`,
    maxShields: 3,
    speed: 60 + index * 20,
    movement: () => (index % 2 === 0 ? new DirectAdvanceBehavior() : new KiterBehavior()),
    attack: () => new MockAttack(`phase-${index}`),
    transitionTrigger: (ctx: BossContext) => ctx.shields <= 0,
    ...overrides,
  };
}

describe("BossPhaseController", () => {
  describe("initialization", () => {
    it("throws an error when configured with empty phases array", () => {
      expect(() => new BossPhaseController([])).toThrowError(
        "BossPhaseController requires at least one phase configuration."
      );
    });

    it("initializes to phase 0 with correct defaults and properties", () => {
      const p0 = createTestPhase(0, { phaseTitle: "PHASE 1 // AEGIS SHIELD", maxShields: 4, speed: 70 });
      const p1 = createTestPhase(1, { phaseTitle: "PHASE 2 // OVERDRIVE", maxShields: 0, speed: 100 });
      const controller = new BossPhaseController([p0, p1], vec2(100, 200));

      expect(controller.currentPhaseIndex).toBe(0);
      expect(controller.phaseElapsedTicks).toBe(0);
      expect(controller.shields).toBe(4);
      expect(controller.maxShields).toBe(4);
      expect(controller.speed).toBe(70);
      expect(controller.phaseTitle).toBe("PHASE 1 // AEGIS SHIELD");
      expect(controller.totalPhases).toBe(2);
      expect(controller.hasNextPhase).toBe(true);
      expect(controller.isFinalPhase).toBe(false);
      expect(controller.currentPhase).toBe(p0);
      expect(controller.activeMovement).toBeInstanceOf(DirectAdvanceBehavior);
      expect(controller.activeAttack).toBeInstanceOf(MockAttack);
    });

    it("correctly identifies single-phase configurations as final phase", () => {
      const p0 = createTestPhase(0, { maxShields: 2 });
      const controller = new BossPhaseController([p0]);

      expect(controller.totalPhases).toBe(1);
      expect(controller.hasNextPhase).toBe(false);
      expect(controller.isFinalPhase).toBe(true);
    });
  });

  describe("update and tick tracking", () => {
    it("increments phaseElapsedTicks on each update call", () => {
      const p0 = createTestPhase(0);
      const controller = new BossPhaseController([p0]);

      controller.update(1, vec2(100, 100));
      expect(controller.phaseElapsedTicks).toBe(1);

      controller.update(5, vec2(110, 100));
      expect(controller.phaseElapsedTicks).toBe(6);
    });

    it("returns false when transitionTrigger is not met", () => {
      const p0 = createTestPhase(0, {
        transitionTrigger: (ctx) => ctx.phaseElapsedTicks >= 60,
      });
      const p1 = createTestPhase(1);
      const controller = new BossPhaseController([p0, p1]);

      const transitioned = controller.update(30, vec2(100, 100));
      expect(transitioned).toBe(false);
      expect(controller.currentPhaseIndex).toBe(0);
    });

    it("triggers phase transition when time-based transitionTrigger evaluates to true", () => {
      const onEnterSpy = vi.fn();
      const onExitSpy = vi.fn();

      const p0 = createTestPhase(0, {
        transitionTrigger: (ctx) => ctx.phaseElapsedTicks >= 60,
        onPhaseExit: onExitSpy,
      });
      const p1 = createTestPhase(1, {
        onPhaseEnter: onEnterSpy,
      });

      const controller = new BossPhaseController([p0, p1]);

      // 40 ticks - should not transition
      expect(controller.update(40, vec2(200, 300))).toBe(false);
      expect(controller.currentPhaseIndex).toBe(0);
      expect(onExitSpy).not.toHaveBeenCalled();

      // 20 more ticks - total 60 ticks reaches threshold
      expect(controller.update(20, vec2(205, 305))).toBe(true);
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.phaseElapsedTicks).toBe(0); // Resets elapsed ticks in new phase

      expect(onExitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 205, y: 305 },
          currentPhase: 0,
          nextPhase: 1,
        })
      );
      expect(onEnterSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 205, y: 305 },
          currentPhase: 0,
          nextPhase: 1,
        })
      );
    });

    it("does not evaluate transition triggers if already on final phase", () => {
      const triggerSpy = vi.fn(() => true);
      const p0 = createTestPhase(0, { transitionTrigger: triggerSpy });
      const controller = new BossPhaseController([p0]);

      const transitioned = controller.update(1, vec2(100, 100));
      expect(transitioned).toBe(false);
      expect(triggerSpy).not.toHaveBeenCalled();
    });
  });

  describe("takeDamage and shield absorption", () => {
    it("absorbs damage when shields are active without triggering transition if shields remain", () => {
      const p0 = createTestPhase(0, { maxShields: 3 });
      const p1 = createTestPhase(1, { maxShields: 0 });
      const controller = new BossPhaseController([p0, p1]);

      const result = controller.takeDamage(1, 3);
      expect(result).toEqual({
        remainingShields: 2,
        absorbed: true,
        eliminated: false,
        transitioned: false,
      });
      expect(controller.shields).toBe(2);
      expect(controller.currentPhaseIndex).toBe(0);
    });

    it("absorbs multi-point damage correctly", () => {
      const p0 = createTestPhase(0, { maxShields: 5 });
      const p1 = createTestPhase(1, { maxShields: 0 });
      const controller = new BossPhaseController([p0, p1]);

      const result = controller.takeDamage(3, 5);
      expect(result).toEqual({
        remainingShields: 2,
        absorbed: true,
        eliminated: false,
        transitioned: false,
      });
      expect(controller.shields).toBe(2);
    });

    it("triggers phase transition when shields deplete to zero and transitionTrigger fires", () => {
      const onEnterSpy = vi.fn();
      const onExitSpy = vi.fn();

      const p0 = createTestPhase(0, {
        maxShields: 1,
        transitionTrigger: (ctx) => ctx.shields <= 0,
        onPhaseExit: onExitSpy,
      });
      const p1 = createTestPhase(1, {
        maxShields: 2,
        phaseTitle: "PHASE 2 // ENRAGED",
        onPhaseEnter: onEnterSpy,
      });

      const controller = new BossPhaseController([p0, p1], vec2(300, 400));

      const result = controller.takeDamage(1, 1);
      expect(result).toEqual({
        remainingShields: 2, // Reset to new phase's maxShields
        absorbed: true,
        eliminated: false,
        transitioned: true,
      });

      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.shields).toBe(2);
      expect(controller.phaseTitle).toBe("PHASE 2 // ENRAGED");
      expect(onExitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 300, y: 400 },
          currentPhase: 0,
          nextPhase: 1,
        })
      );
      expect(onEnterSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 300, y: 400 },
          currentPhase: 0,
          nextPhase: 1,
        })
      );
    });

    it("eliminates boss when hit on final phase with zero shields", () => {
      const p0 = createTestPhase(0, { maxShields: 1 });
      const p1 = createTestPhase(1, { maxShields: 0 });
      const controller = new BossPhaseController([p0, p1]);

      // Phase 0: 1 shield -> 0 shields -> transitions to Phase 1
      const hit1 = controller.takeDamage(1, 1);
      expect(hit1.transitioned).toBe(true);
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.shields).toBe(0);

      // Phase 1 (final phase, 0 shields): next hit is lethal
      const hit2 = controller.takeDamage(1, 0);
      expect(hit2).toEqual({
        remainingShields: 0,
        absorbed: false,
        eliminated: true,
        transitioned: false,
      });
      expect(controller.shields).toBe(0);
    });

    it("updates lastBossPosition if bossPos is provided in takeDamage", () => {
      const onEnterSpy = vi.fn();
      const p0 = createTestPhase(0, { maxShields: 1 });
      const p1 = createTestPhase(1, { maxShields: 0, onPhaseEnter: onEnterSpy });
      const controller = new BossPhaseController([p0, p1], vec2(0, 0));

      controller.takeDamage(1, 1, vec2(450, 250));
      expect(onEnterSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 450, y: 250 },
        })
      );
    });
  });

  describe("behavior swapping across phases", () => {
    it("swaps active movement and attack behavior instances on transition", () => {
      const p0 = createTestPhase(0, {
        movement: () => new DirectAdvanceBehavior(),
        attack: () => new MockAttack("p0-attack"),
      });
      const p1 = createTestPhase(1, {
        movement: () => new KiterBehavior(),
        attack: () => new MockAttack("p1-attack"),
      });

      const controller = new BossPhaseController([p0, p1]);

      expect(controller.activeMovement).toBeInstanceOf(DirectAdvanceBehavior);
      expect((controller.activeAttack as MockAttack).tag).toBe("p0-attack");

      controller.transitionToPhase(1);

      expect(controller.activeMovement).toBeInstanceOf(KiterBehavior);
      expect((controller.activeAttack as MockAttack).tag).toBe("p1-attack");
    });
  });

  describe("transitionToPhase manual calls", () => {
    it("returns false for invalid phase indices", () => {
      const p0 = createTestPhase(0);
      const p1 = createTestPhase(1);
      const controller = new BossPhaseController([p0, p1]);

      expect(controller.transitionToPhase(-1)).toBe(false);
      expect(controller.transitionToPhase(5)).toBe(false);
      expect(controller.transitionToPhase(0)).toBe(false); // Same phase
    });

    it("passes extraContext to transition hooks", () => {
      const onEnterSpy = vi.fn();
      const p0 = createTestPhase(0);
      const p1 = createTestPhase(1, { onPhaseEnter: onEnterSpy });
      const controller = new BossPhaseController([p0, p1]);

      controller.transitionToPhase(1, vec2(100, 200), { customTag: "test-tag" });

      expect(onEnterSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 100, y: 200 },
          currentPhase: 0,
          nextPhase: 1,
          customTag: "test-tag",
        })
      );
    });

    it("merges transitionContextExtras when set on controller", () => {
      const onEnterSpy = vi.fn();
      const p0 = createTestPhase(0);
      const p1 = createTestPhase(1, { onPhaseEnter: onEnterSpy });
      const controller = new BossPhaseController([p0, p1]);
      controller.transitionContextExtras = { extraPayload: 42 };

      controller.takeDamage(1, 0); // Trigger transition if phase 0 trigger checks shields

      // Or manual transition:
      controller.transitionToPhase(1);
      expect(onEnterSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          extraPayload: 42,
        })
      );
    });
  });

  describe("N-phase sequential progression", () => {
    it("progresses cleanly through 3 distinct phases to elimination", () => {
      const p0 = createTestPhase(0, { phaseTitle: "PHASE 1", maxShields: 2 });
      const p1 = createTestPhase(1, { phaseTitle: "PHASE 2", maxShields: 2 });
      const p2 = createTestPhase(2, { phaseTitle: "PHASE 3", maxShields: 0 });

      const controller = new BossPhaseController([p0, p1, p2]);

      // Phase 0
      expect(controller.currentPhaseIndex).toBe(0);
      expect(controller.takeDamage(1, 2).transitioned).toBe(false);
      expect(controller.shields).toBe(1);
      const toP1 = controller.takeDamage(1, 1);
      expect(toP1.transitioned).toBe(true);
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.shields).toBe(2);

      // Phase 1
      expect(controller.takeDamage(1, 2).transitioned).toBe(false);
      expect(controller.shields).toBe(1);
      const toP2 = controller.takeDamage(1, 1);
      expect(toP2.transitioned).toBe(true);
      expect(controller.currentPhaseIndex).toBe(2);
      expect(controller.shields).toBe(0);
      expect(controller.isFinalPhase).toBe(true);

      // Phase 2 (final)
      const lethal = controller.takeDamage(1, 0);
      expect(lethal.eliminated).toBe(true);
      expect(lethal.absorbed).toBe(false);
    });
  });

  describe("reset", () => {
    it("resets state, elapsed ticks, shields, and behaviors back to phase 0", () => {
      const p0 = createTestPhase(0, { maxShields: 3 });
      const p1 = createTestPhase(1, { maxShields: 1 });
      const controller = new BossPhaseController([p0, p1]);

      controller.update(100, vec2(50, 50));
      controller.takeDamage(3, 3); // Transitions to phase 1
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.shields).toBe(1);

      controller.reset();

      expect(controller.currentPhaseIndex).toBe(0);
      expect(controller.phaseElapsedTicks).toBe(0);
      expect(controller.shields).toBe(3);
      expect(controller.maxShields).toBe(3);
      expect(controller.isFinalPhase).toBe(false);
    });
  });

  describe("overloadChannelTicks and invulnerability", () => {
    it("initializes overload channel ticks from phase 0 when configured", () => {
      const p0 = createTestPhase(0, { overloadChannelTicks: 50, speed: 60 });
      const controller = new BossPhaseController([p0]);

      expect(controller.overloadTicksRemaining).toBe(50);
      expect(controller.isOverloading).toBe(true);
      expect(controller.isInvulnerable).toBe(true);
      expect(controller.speed).toBe(0); // Zero velocity while overloading
    });

    it("decrements overload ticks on update and restores speed when channel finishes", () => {
      const p0 = createTestPhase(0, { overloadChannelTicks: 20, speed: 80 });
      const controller = new BossPhaseController([p0]);

      controller.update(10, vec2(100, 100));
      expect(controller.overloadTicksRemaining).toBe(10);
      expect(controller.isOverloading).toBe(true);
      expect(controller.isInvulnerable).toBe(true);
      expect(controller.speed).toBe(0);

      controller.update(10, vec2(100, 100));
      expect(controller.overloadTicksRemaining).toBe(0);
      expect(controller.isOverloading).toBe(false);
      expect(controller.isInvulnerable).toBe(false);
      expect(controller.speed).toBe(80);
    });

    it("deflects damage during active overload channel without reducing shields", () => {
      const p0 = createTestPhase(0, { maxShields: 3, overloadChannelTicks: 30 });
      const controller = new BossPhaseController([p0]);

      expect(controller.isInvulnerable).toBe(true);
      const res = controller.takeDamage(1, 3);
      expect(res.deflected).toBe(true);
      expect(res.absorbed).toBe(true);
      expect(res.remainingShields).toBe(3);
      expect(controller.shields).toBe(3);

      // Advance past overload
      controller.update(30, vec2(100, 100));
      expect(controller.isInvulnerable).toBe(false);

      const hit = controller.takeDamage(1, 3);
      expect(hit.deflected).toBeUndefined();
      expect(hit.remainingShields).toBe(2);
      expect(controller.shields).toBe(2);
    });

    it("initiates overload channel on transitioning into subsequent phase", () => {
      const p0 = createTestPhase(0, { maxShields: 1 });
      const p1 = createTestPhase(1, { maxShields: 2, overloadChannelTicks: 75, speed: 90 });
      const controller = new BossPhaseController([p0, p1]);

      expect(controller.isOverloading).toBe(false);
      controller.takeDamage(1, 1); // Breaks p0 shield -> transitions to p1
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.overloadTicksRemaining).toBe(75);
      expect(controller.isOverloading).toBe(true);
      expect(controller.isInvulnerable).toBe(true);
      expect(controller.speed).toBe(0);

      const deflect = controller.takeDamage(1, 2);
      expect(deflect.deflected).toBe(true);
      expect(controller.shields).toBe(2);
    });

    it("triggers onOverloadDetonate precisely when overload channel expires", () => {
      const onDetonateSpy = vi.fn();
      const p0 = createTestPhase(0, {
        maxShields: 1,
      });
      const p1 = createTestPhase(1, {
        maxShields: 2,
        overloadChannelTicks: 30,
        onOverloadDetonate: onDetonateSpy,
      });

      const controller = new BossPhaseController([p0, p1], vec2(400, 300));
      controller.transitionContextExtras = { customExtra: "test-val" };

      // Transition to phase 1
      controller.takeDamage(1, 1);
      expect(controller.currentPhaseIndex).toBe(1);
      expect(controller.isOverloading).toBe(true);
      expect(onDetonateSpy).not.toHaveBeenCalled();

      // Tick 29: still active, should not trigger yet
      controller.update(29, vec2(405, 305));
      expect(controller.overloadTicksRemaining).toBe(1);
      expect(controller.isOverloading).toBe(true);
      expect(onDetonateSpy).not.toHaveBeenCalled();

      // Tick 30: channel reaches 0, triggers detonation
      controller.update(1, vec2(410, 310));
      expect(controller.overloadTicksRemaining).toBe(0);
      expect(controller.isOverloading).toBe(false);
      expect(onDetonateSpy).toHaveBeenCalledTimes(1);
      expect(onDetonateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bossPosition: { x: 410, y: 310 },
          currentPhase: 1,
          nextPhase: 1,
          customExtra: "test-val",
        })
      );

      // Subsequent update should not trigger again
      controller.update(10, vec2(410, 310));
      expect(onDetonateSpy).toHaveBeenCalledTimes(1);
    });
  });
});

