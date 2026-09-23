import { describe, expect, it } from "vitest";
import {
  BOSS_BLUEPRINTS,
  CHRONO_WEAVER_BLUEPRINT,
  createBossPhaseController,
  GOLIATH_01_BLUEPRINT,
} from "./BossBlueprint";
import { vec2 } from "../../math/vector";
import { DirectAdvanceBehavior } from "../behaviors/movement/DirectAdvanceBehavior";
import { KiterBehavior } from "../behaviors/movement/KiterBehavior";
import { SingleSlugBehavior } from "../behaviors/attack/SingleSlugBehavior";
import { FanSpreadBehavior } from "../behaviors/attack/FanSpreadBehavior";
import { RadialNovaBehavior } from "../behaviors/attack/RadialNovaBehavior";
import { TelegraphedBeamBehavior } from "../behaviors/attack/TelegraphedBeamBehavior";

describe("BossBlueprint & Multi-Phase Archetypes", () => {
  it("Goliath-01 blueprint configures 2-phase Colossus progression", () => {
    const bp = GOLIATH_01_BLUEPRINT;
    expect(bp.id).toBe("goliath-01");
    expect(bp.radius).toBe(24);
    expect(bp.chassis).toBe("octagon");
    expect(bp.phases).toHaveLength(2);

    // Phase 1: Fortress
    const p1 = bp.phases[0];
    expect(p1.phaseTitle).toBe("AEGIS FORTRESS");
    expect(p1.maxShields).toBe(4);
    expect(p1.speed).toBe(55);
    expect(p1.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p1.attack()).toBeInstanceOf(SingleSlugBehavior);

    // Phase 2: Overdrive Ram
    const p2 = bp.phases[1];
    expect(p2.phaseTitle).toBe("OVERDRIVE RAM");
    expect(p2.maxShields).toBe(0);
    expect(p2.speed).toBe(95);
    expect(p2.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p2.attack()).toBeInstanceOf(FanSpreadBehavior);
  });

  it("Chrono-Weaver blueprint configures Kiter -> Radial Nova progression", () => {
    const bp = CHRONO_WEAVER_BLUEPRINT;
    expect(bp.id).toBe("chrono-weaver");
    expect(bp.radius).toBe(22);
    expect(bp.chassis).toBe("star");
    expect(bp.phases).toHaveLength(2);

    // Phase 1: Stasis Orbit (Kiter + Beam)
    const p1 = bp.phases[0];
    expect(p1.movement()).toBeInstanceOf(KiterBehavior);
    expect(p1.attack()).toBeInstanceOf(TelegraphedBeamBehavior);
    expect(p1.maxShields).toBe(3);

    // Phase 2: Temporal Nova (Radial Nova ring)
    const p2 = bp.phases[1];
    expect(p2.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p2.attack()).toBeInstanceOf(RadialNovaBehavior);
  });

  it("createBossPhaseController initializes and transitions through blueprint phases", () => {
    const controller = createBossPhaseController(GOLIATH_01_BLUEPRINT, vec2(500, 300));
    expect(controller.currentPhaseIndex).toBe(0);
    expect(controller.shields).toBe(4);
    expect(controller.speed).toBe(55);

    // Strip 4 shields
    const res = controller.takeDamage(4, 4, vec2(500, 300));
    expect(res.transitioned).toBe(true);
    expect(controller.currentPhaseIndex).toBe(1);
    expect(controller.speed).toBe(95);
    expect(controller.shields).toBe(0);

    // Reset restores phase 0
    controller.reset();
    expect(controller.currentPhaseIndex).toBe(0);
    expect(controller.shields).toBe(4);
    expect(controller.speed).toBe(55);
  });

  it("BOSS_BLUEPRINTS registry contains registered blueprints", () => {
    expect(BOSS_BLUEPRINTS["goliath-01"]).toBeDefined();
    expect(BOSS_BLUEPRINTS["chrono-weaver"]).toBeDefined();
  });
});
