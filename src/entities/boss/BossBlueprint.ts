/**
 * Boss Blueprint definitions for ChronoShot.
 *
 * Provides declarative configurations for multi-phase milestone bosses,
 * defining phase sequences, behavior constructors, shield pools, and transition actions.
 */

import { Vector2D } from "../../math/vector";
import { EnemyChassisType } from "../../ui/EnemyRenderer";
import { AlternatingAttackBehavior } from "../behaviors/attack/AlternatingAttackBehavior";
import { FanSpreadBehavior } from "../behaviors/attack/FanSpreadBehavior";
import { RadialNovaBehavior } from "../behaviors/attack/RadialNovaBehavior";
import { SingleSlugBehavior } from "../behaviors/attack/SingleSlugBehavior";
import { TelegraphedBeamBehavior } from "../behaviors/attack/TelegraphedBeamBehavior";
import { DirectAdvanceBehavior } from "../behaviors/movement/DirectAdvanceBehavior";
import { KiterBehavior } from "../behaviors/movement/KiterBehavior";
import { BossPhaseConfig, BossPhaseController } from "./BossPhaseController";
import {
  combineTransitionActions,
  createAudioCue,
  createMinionEscortSpawn,
  createShockwavePulse,
} from "./BossTransitionAction";

export interface BossBlueprint {
  readonly id: string;
  readonly name: string;
  readonly radius: number;
  readonly chassis: EnemyChassisType;
  readonly phases: BossPhaseConfig[];
}

/**
 * Milestone Boss 1: Goliath-01 Aegis Colossus
 * Phase 1: Heavy armored fortress with 4-hit shield durability and heavy pinpoint slugs.
 * Phase 2: Exposed enraged overdrive core with boosted speed (95 px/s) and 3-pellet fan spread barrage.
 */
export const GOLIATH_01_BLUEPRINT: BossBlueprint = {
  id: "goliath-01",
  name: "GOLIATH-01: AEGIS COLOSSUS",
  radius: 24,
  chassis: "octagon",
  phases: [
    {
      phaseIndex: 0,
      phaseTitle: "AEGIS FORTRESS",
      maxShields: 4,
      speed: 55,
      movement: () => new DirectAdvanceBehavior(),
      attack: () =>
        new SingleSlugBehavior({
          fireCadenceTicks: 60,
          bulletSpeed: 520,
          spreadAngle: 0.05,
          stutterTicks: 10,
        }),
      transitionTrigger: (ctx) => ctx.shields <= 0,
      onPhaseExit: (ctx) => {
        const shockwave = createShockwavePulse(24, 260, "#ff1744");
        shockwave(ctx);
      },
    },
    {
      phaseIndex: 1,
      phaseTitle: "OVERDRIVE RAM",
      maxShields: 0,
      speed: 95,
      movement: () => new DirectAdvanceBehavior(),
      attack: () =>
        new FanSpreadBehavior({
          fireCadenceTicks: 60,
          bulletSpeed: 520,
          spreadAngle: 0.35,
          pellets: 3,
          stutterTicks: 10,
        }),
      transitionTrigger: () => false,
    },
  ],
};

/**
 * Milestone Boss 2: Chrono-Weaver Temporal Anchor
 * Phase 1: High-precision standoff kiting with telegraphed charging beams and 3 shield charges.
 * Phase 2: High-speed temporal overdrive discharging 12-pellet 360-degree rotating radial novae.
 */
export const CHRONO_WEAVER_BLUEPRINT: BossBlueprint = {
  id: "chrono-weaver",
  name: "CHRONO-WEAVER: TEMPORAL ANCHOR",
  radius: 22,
  chassis: "star",
  phases: [
    {
      phaseIndex: 0,
      phaseTitle: "STASIS ORBIT",
      maxShields: 3,
      speed: 70,
      movement: () => new KiterBehavior({ minDist: 300, maxDist: 480 }),
      attack: () =>
        new TelegraphedBeamBehavior({
          fireCadenceTicks: 80,
          bulletSpeed: 800,
          spreadAngle: 0.01,
          laserChargeTicks: 25,
        }),
      transitionTrigger: (ctx) => ctx.shields <= 0,
      onPhaseExit: (ctx) => {
        const action = combineTransitionActions(
          createShockwavePulse(32, 300, "#00f0ff"),
          createMinionEscortSpawn([
            {
              type: "stalker",
              offsetX: -120,
              offsetY: 0,
              fireCadenceTicks: 32,
              initialDelayTicks: 25,
            },
          ]),
          createAudioCue("shieldBreak")
        );
        action(ctx);
      },
    },
    {
      phaseIndex: 1,
      phaseTitle: "TEMPORAL NOVA",
      maxShields: 0,
      speed: 100,
      movement: () => new DirectAdvanceBehavior(),
      attack: () =>
        new RadialNovaBehavior({
          fireCadenceTicks: 70,
          bulletSpeed: 400,
          pellets: 12,
          stutterTicks: 10,
          angularOffsetStep: 0.15,
        }),
      transitionTrigger: () => false,
    },
  ],
};

/**
 * Milestone Boss 3: Vektor-Prime Phase Sovereign (Room 15 Step Function)
 * Phase 1: Fortress Aegis with 5-hit shield durability and pinpoint heavy slugs.
 * Phase 2: Standoff kiter with 3-hit shield durability alternating sniper beam and fan spread.
 * Phase 3: Aggressive Singularity Nova Overdrive core discharging 16-pellet rotating novae.
 */
export const VEKTOR_PRIME_BLUEPRINT: BossBlueprint = {
  id: "vektor-prime",
  name: "VEKTOR-PRIME: PHASE SOVEREIGN",
  radius: 26,
  chassis: "star",
  phases: [
    {
      phaseIndex: 0,
      phaseTitle: "FORTRESS AEGIS",
      maxShields: 5,
      speed: 50,
      movement: () => new DirectAdvanceBehavior(),
      attack: () =>
        new SingleSlugBehavior({
          fireCadenceTicks: 50,
          bulletSpeed: 550,
          spreadAngle: 0.03,
          stutterTicks: 8,
        }),
      transitionTrigger: (ctx) => ctx.shields <= 0,
      onPhaseExit: (ctx) => {
        const action = combineTransitionActions(
          createShockwavePulse(36, 320, "#a855f7"),
          createMinionEscortSpawn([
            {
              type: "shotgun",
              offsetX: -100,
              offsetY: -80,
              maxShields: 1,
              fireCadenceTicks: 75,
              initialDelayTicks: 25,
            },
            {
              type: "stalker",
              offsetX: -100,
              offsetY: 80,
              fireCadenceTicks: 32,
              initialDelayTicks: 20,
            },
          ]),
          createAudioCue("shieldBreak")
        );
        action(ctx);
      },
    },
    {
      phaseIndex: 1,
      phaseTitle: "PHASE WARP",
      maxShields: 3,
      speed: 85,
      movement: () => new KiterBehavior({ minDist: 280, maxDist: 460 }),
      attack: () =>
        new AlternatingAttackBehavior({
          behaviors: [
            new TelegraphedBeamBehavior({
              fireCadenceTicks: 70,
              bulletSpeed: 820,
              spreadAngle: 0.01,
              laserChargeTicks: 25,
            }),
            new FanSpreadBehavior({
              fireCadenceTicks: 70,
              bulletSpeed: 500,
              spreadAngle: 0.3,
              pellets: 3,
              stutterTicks: 6,
            }),
          ],
        }),
      transitionTrigger: (ctx) => ctx.shields <= 0,
      onPhaseExit: (ctx) => {
        const action = combineTransitionActions(
          createShockwavePulse(48, 380, "#ff1744"),
          createMinionEscortSpawn([
            {
              type: "stalker",
              offsetX: -120,
              offsetY: -60,
              fireCadenceTicks: 32,
              initialDelayTicks: 15,
            },
            {
              type: "stalker",
              offsetX: -120,
              offsetY: 60,
              fireCadenceTicks: 32,
              initialDelayTicks: 20,
            },
          ]),
          createAudioCue("shieldBreak")
        );
        action(ctx);
      },
    },
    {
      phaseIndex: 2,
      phaseTitle: "SINGULARITY NOVA",
      maxShields: 0,
      speed: 115,
      movement: () => new DirectAdvanceBehavior(),
      attack: () =>
        new RadialNovaBehavior({
          fireCadenceTicks: 65,
          bulletSpeed: 420,
          pellets: 16,
          stutterTicks: 8,
          angularOffsetStep: 0.12,
        }),
      transitionTrigger: () => false,
    },
  ],
};

export const BOSS_BLUEPRINTS: Record<string, BossBlueprint> = {
  "goliath-01": GOLIATH_01_BLUEPRINT,
  "chrono-weaver": CHRONO_WEAVER_BLUEPRINT,
  "vektor-prime": VEKTOR_PRIME_BLUEPRINT,
};

/**
 * Creates a BossPhaseController initialized from a given BossBlueprint.
 */
export function createBossPhaseController(
  blueprint: BossBlueprint,
  initialPosition: Vector2D = { x: 0, y: 0 }
): BossPhaseController {
  return new BossPhaseController(blueprint.phases, initialPosition);
}
