/**
 * Modular Boss Phase State Machine for ChronoShot.
 *
 * Implements declarative N-phase state transitions, trigger evaluations,
 * dynamic movement and attack behavior swaps, hit-count shield durability per phase,
 * and phase state resets.
 */

import { Vector2D } from "../../math/vector";
import { AttackBehavior } from "../behaviors/attack/AttackBehavior";
import { MovementBehavior } from "../behaviors/movement/MovementBehavior";

/**
 * Contextual state snapshot passed to transition triggers.
 */
export interface BossContext {
  position: Vector2D;
  shields: number;
  maxShields: number;
  isAlive: boolean;
  phaseElapsedTicks: number;
}

/**
 * Context provided to phase enter and exit lifecycle hooks.
 */
export interface BossTransitionContext {
  bossPosition: Vector2D;
  currentPhase: number;
  nextPhase: number;
  [key: string]: any;
}

/**
 * Declarative configuration for an individual boss phase.
 */
export interface BossPhaseConfig {
  phaseIndex: number;
  phaseTitle: string;
  maxShields: number;
  speed: number;
  movement: () => MovementBehavior;
  attack: () => AttackBehavior;
  transitionTrigger: (ctx: BossContext) => boolean;
  onPhaseEnter?: (ctx: BossTransitionContext) => void;
  onPhaseExit?: (ctx: BossTransitionContext) => void;
}

/**
 * Result returned upon applying damage to the boss phase controller.
 */
export interface BossDamageResult {
  remainingShields: number;
  absorbed: boolean;
  eliminated: boolean;
  transitioned: boolean;
}

/**
 * Manages boss phase progression, behavior swapping, and shield pools.
 */
export class BossPhaseController {
  public readonly phases: readonly BossPhaseConfig[];
  public currentPhaseIndex: number = 0;
  public phaseElapsedTicks: number = 0;
  public shields: number = 0;

  private _movement!: MovementBehavior;
  private _attack!: AttackBehavior;
  private lastBossPosition: Vector2D = { x: 0, y: 0 };

  /**
   * Optional contextual extras included in BossTransitionContext on phase changes.
   */
  public transitionContextExtras?: Record<string, any>;

  constructor(phases: BossPhaseConfig[], initialPosition: Vector2D = { x: 0, y: 0 }) {
    if (!phases || phases.length === 0) {
      throw new Error("BossPhaseController requires at least one phase configuration.");
    }

    this.phases = [...phases];
    this.lastBossPosition = { ...initialPosition };
    this.currentPhaseIndex = 0;
    this.phaseElapsedTicks = 0;
    this.shields = this.phases[0].maxShields;
    this._movement = this.phases[0].movement();
    this._attack = this.phases[0].attack();
  }

  /**
   * The currently active phase configuration.
   */
  public get currentPhase(): BossPhaseConfig {
    return this.phases[this.currentPhaseIndex];
  }

  /**
   * The active movement behavior instance for the current phase.
   */
  public get movement(): MovementBehavior {
    return this._movement;
  }

  public get activeMovement(): MovementBehavior {
    return this._movement;
  }

  /**
   * The active attack behavior instance for the current phase.
   */
  public get attack(): AttackBehavior {
    return this._attack;
  }

  public get activeAttack(): AttackBehavior {
    return this._attack;
  }

  /**
   * Movement speed of the active phase.
   */
  public get speed(): number {
    return this.currentPhase.speed;
  }

  /**
   * Maximum shields for the active phase.
   */
  public get maxShields(): number {
    return this.currentPhase.maxShields;
  }

  /**
   * Title/designation of the active phase.
   */
  public get phaseTitle(): string {
    return this.currentPhase.phaseTitle;
  }

  /**
   * Total number of configured phases.
   */
  public get totalPhases(): number {
    return this.phases.length;
  }

  /**
   * True if there is a subsequent phase configured.
   */
  public get hasNextPhase(): boolean {
    return this.currentPhaseIndex < this.phases.length - 1;
  }

  /**
   * True if currently in the final configured phase.
   */
  public get isFinalPhase(): boolean {
    return this.currentPhaseIndex >= this.phases.length - 1;
  }

  /**
   * Advances phase elapsed ticks and checks transition triggers.
   *
   * @param deltaTicks Number of simulation ticks elapsed.
   * @param bossPos Current position of the boss unit.
   * @returns true if a phase transition occurred during this update.
   */
  public update(deltaTicks: number, bossPos: Vector2D): boolean {
    this.lastBossPosition.x = bossPos.x;
    this.lastBossPosition.y = bossPos.y;
    this.phaseElapsedTicks += deltaTicks;

    if (!this.hasNextPhase) {
      return false;
    }

    const ctx: BossContext = {
      position: bossPos,
      shields: this.shields,
      maxShields: this.currentPhase.maxShields,
      isAlive: true,
      phaseElapsedTicks: this.phaseElapsedTicks,
    };

    if (this.currentPhase.transitionTrigger(ctx)) {
      return this.transitionToPhase(this.currentPhaseIndex + 1, bossPos);
    }

    return false;
  }

  /**
   * Applies damage to shields and evaluates phase transition triggers or elimination.
   *
   * @param damage Amount of damage to apply (default: 1).
   * @param currentShields Optional current shield count to synchronize with.
   * @param bossPos Optional current boss position for transition context.
   */
  public takeDamage(
    damage: number = 1,
    currentShields: number = this.shields,
    bossPos?: Vector2D
  ): BossDamageResult {
    if (bossPos) {
      this.lastBossPosition.x = bossPos.x;
      this.lastBossPosition.y = bossPos.y;
    }

    if (currentShields > 0) {
      const newShields = Math.max(0, currentShields - damage);
      this.shields = newShields;

      const ctx: BossContext = {
        position: this.lastBossPosition,
        shields: newShields,
        maxShields: this.currentPhase.maxShields,
        isAlive: true,
        phaseElapsedTicks: this.phaseElapsedTicks,
      };

      if (this.hasNextPhase && this.currentPhase.transitionTrigger(ctx)) {
        this.transitionToPhase(this.currentPhaseIndex + 1, this.lastBossPosition);
        return {
          remainingShields: this.shields,
          absorbed: true,
          eliminated: false,
          transitioned: true,
        };
      }

      return {
        remainingShields: newShields,
        absorbed: true,
        eliminated: false,
        transitioned: false,
      };
    }

    // Shields are depleted (currentShields <= 0)
    this.shields = 0;

    const ctx: BossContext = {
      position: this.lastBossPosition,
      shields: 0,
      maxShields: this.currentPhase.maxShields,
      isAlive: false,
      phaseElapsedTicks: this.phaseElapsedTicks,
    };

    if (this.hasNextPhase && this.currentPhase.transitionTrigger(ctx)) {
      this.transitionToPhase(this.currentPhaseIndex + 1, this.lastBossPosition);
      return {
        remainingShields: this.shields,
        absorbed: true,
        eliminated: false,
        transitioned: true,
      };
    }

    return {
      remainingShields: 0,
      absorbed: false,
      eliminated: true,
      transitioned: false,
    };
  }

  /**
   * Transitions immediately to the specified phase index.
   *
   * @param nextPhaseIndex Index of the target phase.
   * @param bossPos Position of the boss during transition.
   * @param extraContext Optional additional data to pass to lifecycle hooks.
   * @returns true if transition succeeded, false if invalid index.
   */
  public transitionToPhase(
    nextPhaseIndex: number,
    bossPos: Vector2D = this.lastBossPosition,
    extraContext?: Record<string, any>
  ): boolean {
    if (
      nextPhaseIndex < 0 ||
      nextPhaseIndex >= this.phases.length ||
      nextPhaseIndex === this.currentPhaseIndex
    ) {
      return false;
    }

    const prevPhase = this.currentPhase;
    const prevIndex = this.currentPhaseIndex;

    this.lastBossPosition.x = bossPos.x;
    this.lastBossPosition.y = bossPos.y;

    const transitionCtx: BossTransitionContext = {
      bossPosition: { ...bossPos },
      currentPhase: prevIndex,
      nextPhase: nextPhaseIndex,
      ...this.transitionContextExtras,
      ...extraContext,
    };

    prevPhase.onPhaseExit?.(transitionCtx);

    this.currentPhaseIndex = nextPhaseIndex;
    this.phaseElapsedTicks = 0;
    this._movement = this.currentPhase.movement();
    this._attack = this.currentPhase.attack();
    this.shields = this.currentPhase.maxShields;

    this.currentPhase.onPhaseEnter?.(transitionCtx);

    return true;
  }

  /**
   * Resets phase state machine to phase 0 with pristine shields and behaviors.
   */
  public reset(): void {
    this.currentPhaseIndex = 0;
    this.phaseElapsedTicks = 0;
    this.shields = this.phases[0].maxShields;
    this._movement = this.phases[0].movement();
    this._attack = this.phases[0].attack();
    this._movement.reset();
    this._attack.reset();
  }
}
