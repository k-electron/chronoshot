import { describe, expect, it } from "vitest";
import {
  BOSS_BLUEPRINTS,
  CHRONO_WEAVER_BLUEPRINT,
  CHRONO_ZENITH_BLUEPRINT,
  createBossPhaseController,
  GOLIATH_01_BLUEPRINT,
  VEKTOR_PRIME_BLUEPRINT,
} from "./BossBlueprint";
import { vec2 } from "../../math/vector";
import { AlternatingAttackBehavior } from "../behaviors/attack/AlternatingAttackBehavior";
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

  it("Chrono-Weaver phase 1 exit triggers combined shockwave, minion escort, and audio cues", () => {
    const bp = CHRONO_WEAVER_BLUEPRINT;
    const p1 = bp.phases[0];
    expect(p1.onPhaseExit).toBeDefined();

    const spawnedMinions: any[] = [];
    const emittedShatters: any[] = [];
    let playedShieldBreak = false;

    const mockCtx = {
      previousPhaseIndex: 0,
      newPhaseIndex: 1,
      bossPosition: vec2(600, 320),
      shields: 0,
      maxShields: 3,
      speed: 70,
      particles: {
        emitShatter: (pos: any, count: number, color: string, speed: number) => {
          emittedShatters.push({ pos, count, color, speed });
        },
      },
      soundSynth: {
        playShieldBreak: () => {
          playedShieldBreak = true;
        },
      },
      spawnMinion: (minion: any) => {
        spawnedMinions.push(minion);
      },
    };

    p1.onPhaseExit!(mockCtx as any);

    // Verify shockwave particles
    expect(emittedShatters).toHaveLength(1);
    expect(emittedShatters[0].count).toBe(32);
    expect(emittedShatters[0].color).toBe("#00f0ff");

    // Verify minion escort spawn
    expect(spawnedMinions).toHaveLength(1);
    expect(spawnedMinions[0].type).toBe("stalker");
    expect(spawnedMinions[0].x).toBe(600 - 120);
    expect(spawnedMinions[0].y).toBe(320);

    // Verify audio cue
    expect(playedShieldBreak).toBe(true);
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

  it("Vektor-Prime blueprint configures 3-phase Step Function progression", () => {
    const bp = VEKTOR_PRIME_BLUEPRINT;
    expect(bp.id).toBe("vektor-prime");
    expect(bp.radius).toBe(26);
    expect(bp.phases).toHaveLength(3);

    // Phase 1: Fortress Aegis (5 shields, 50 px/s, SingleSlug)
    const p1 = bp.phases[0];
    expect(p1.phaseTitle).toBe("FORTRESS AEGIS");
    expect(p1.maxShields).toBe(5);
    expect(p1.speed).toBe(50);
    expect(p1.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p1.attack()).toBeInstanceOf(SingleSlugBehavior);

    // Phase 2: Phase Warp (3 shields, 85 px/s, Kiter, Alternating)
    const p2 = bp.phases[1];
    expect(p2.phaseTitle).toBe("PHASE WARP");
    expect(p2.maxShields).toBe(3);
    expect(p2.speed).toBe(85);
    expect(p2.movement()).toBeInstanceOf(KiterBehavior);
    expect(p2.attack()).toBeInstanceOf(AlternatingAttackBehavior);

    // Phase 3: Singularity Nova (0 shields, 115 px/s, DirectAdvance, 16-pellet nova)
    const p3 = bp.phases[2];
    expect(p3.phaseTitle).toBe("SINGULARITY NOVA");
    expect(p3.maxShields).toBe(0);
    expect(p3.speed).toBe(115);
    expect(p3.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p3.attack()).toBeInstanceOf(RadialNovaBehavior);
  });

  it("Vektor-Prime phase transitions trigger shockwaves and dynamic escort summons", () => {
    const bp = VEKTOR_PRIME_BLUEPRINT;
    const p1 = bp.phases[0];
    const p2 = bp.phases[1];

    const spawnedMinions: any[] = [];
    const emittedShatters: any[] = [];

    const mockCtx = {
      bossPosition: vec2(600, 320),
      particles: {
        emitShatter: (pos: any, count: number, color: string, speed: number) => {
          emittedShatters.push({ pos, count, color, speed });
        },
      },
      soundSynth: {
        playShieldBreak: () => {},
      },
      spawnMinion: (minion: any) => {
        spawnedMinions.push(minion);
      },
    };

    // Phase 1 exit
    p1.onPhaseExit!(mockCtx as any);
    expect(emittedShatters).toHaveLength(1);
    expect(emittedShatters[0].color).toBe("#a855f7");
    expect(spawnedMinions).toHaveLength(2); // Shotgun + Stalker
    expect(spawnedMinions[0].type).toBe("shotgun");
    expect(spawnedMinions[1].type).toBe("stalker");

    // Phase 2 exit
    p2.onPhaseExit!(mockCtx as any);
    expect(emittedShatters).toHaveLength(2);
    expect(emittedShatters[1].color).toBe("#ff1744");
    expect(spawnedMinions).toHaveLength(4); // 2 more stalkers
  });

  it("BOSS_BLUEPRINTS registry contains registered blueprints", () => {
    expect(BOSS_BLUEPRINTS["goliath-01"]).toBeDefined();
    expect(BOSS_BLUEPRINTS["chrono-weaver"]).toBeDefined();
    expect(BOSS_BLUEPRINTS["vektor-prime"]).toBeDefined();
    expect(BOSS_BLUEPRINTS["chrono-zenith"]).toBeDefined();
  });

  it("Chrono-Zenith blueprint configures 4-phase final boss state machine with Cataclysm Overload", () => {
    const bp = CHRONO_ZENITH_BLUEPRINT;
    expect(bp.id).toBe("chrono-zenith");
    expect(bp.name).toBe("CHRONO-ZENITH: ZERO SOVEREIGN");
    expect(bp.radius).toBe(28);
    expect(bp.chassis).toBe("star");
    expect(bp.phases).toHaveLength(4);

    // Phase 1: Citadel Bastion (5 shields, 45 px/s, alternating single slug + fan spread)
    const p1 = bp.phases[0];
    expect(p1.phaseTitle).toBe("CITADEL BASTION");
    expect(p1.maxShields).toBe(5);
    expect(p1.speed).toBe(45);
    expect(p1.onPhaseExit).toBeUndefined();
    expect(p1.onOverloadDetonate).toBeUndefined();
    expect(p1.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p1.attack()).toBeInstanceOf(AlternatingAttackBehavior);

    // Phase 2: Temporal Warp (3 shields, 95 px/s, 75-tick overload channel, kiter + beam)
    const p2 = bp.phases[1];
    expect(p2.phaseTitle).toBe("TEMPORAL WARP");
    expect(p2.maxShields).toBe(3);
    expect(p2.speed).toBe(95);
    expect(p2.overloadChannelTicks).toBe(75);
    expect(p2.onOverloadDetonate).toBeDefined();
    expect(p2.movement()).toBeInstanceOf(KiterBehavior);
    expect(p2.attack()).toBeInstanceOf(TelegraphedBeamBehavior);

    // Phase 3: Singularity Tempest (2 shields, 105 px/s, 65-tick overload channel, radial nova)
    const p3 = bp.phases[2];
    expect(p3.phaseTitle).toBe("SINGULARITY TEMPEST");
    expect(p3.maxShields).toBe(2);
    expect(p3.speed).toBe(105);
    expect(p3.overloadChannelTicks).toBe(65);
    expect(p3.onOverloadDetonate).toBeDefined();
    expect(p3.movement()).toBeInstanceOf(KiterBehavior);
    expect(p3.attack()).toBeInstanceOf(RadialNovaBehavior);

    // Phase 4: Zero-Point Overdrive (0 shields, 125 px/s, 60-tick overload channel, direct advance 16-pellet nova)
    const p4 = bp.phases[3];
    expect(p4.phaseTitle).toBe("ZERO-POINT OVERDRIVE");
    expect(p4.maxShields).toBe(0);
    expect(p4.speed).toBe(125);
    expect(p4.overloadChannelTicks).toBe(60);
    expect(p4.onOverloadDetonate).toBeDefined();
    expect(p4.movement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(p4.attack()).toBeInstanceOf(RadialNovaBehavior);
  });
});
