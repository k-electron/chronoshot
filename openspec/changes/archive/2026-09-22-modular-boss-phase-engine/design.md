# Design

## Context

ChronoShot features high-threat milestone boss encounters (such as Room 5's Goliath-01 Aegis Colossus) requiring multi-layer shield stripping, dodging signature heavy weapon barrages, and responding to enraged combat escalation. In Phase 1 (`composable-enemy-behaviors`), enemy movement and attack patterns were decoupled into modular Strategy components. 

Currently, boss phase logic is still hardcoded as a binary boolean flag (`isEnraged`) toggled when shields reach zero. To support bosses of arbitrary stage count and diverse tactical mechanics, we introduce a dedicated `BossPhaseController` that drives entity state transitions through modular building blocks.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Implement a declarative `BossPhaseController` supporting arbitrary $N$-phase state machines.
- Support composable transition actions (radial particle shockwaves, dynamic audio cues, and minion escort summons).
- Implement `RadialNovaBehavior` providing omnidirectional 360-degree projectile rings for bullet-hell attack phases.
- Extract boss telemetry rendering from `Arena.ts` into a dedicated, phase-aware `BossTelemetryHUD.ts`.
- Retain 100% backward compatibility with Goliath-01 Aegis Colossus and ensure all existing unit tests in `Arena.test.ts` and `Enemy.test.ts` pass without regressions.

**Non-Goals:**
- Overhauling player augmentations or roguelike card draft UI (Phase 3: `extensible-upgrade-pipeline`).
- Procedural level or puzzle generation (Phase 4: `modular-level-director`).

## Decisions

### 1. Boss Phase State Machine Contract
```ts
export interface BossContext {
  position: Vector2D;
  shields: number;
  maxShields: number;
  isAlive: boolean;
  phaseElapsedTicks: number;
}

export interface BossTransitionContext {
  boss: Enemy;
  arena?: Arena;
  soundSynth?: SoundSynthesizer;
  particles?: ParticleSystem;
}

export interface BossPhaseConfig {
  readonly phaseIndex: number;
  readonly phaseTitle: string;
  readonly maxShields: number;
  readonly speed: number;
  readonly movement: () => MovementBehavior;
  readonly attack: () => AttackBehavior;
  readonly transitionTrigger: (ctx: BossContext) => boolean;
  readonly onPhaseEnter?: (context: BossTransitionContext) => void;
  readonly onPhaseExit?: (context: BossTransitionContext) => void;
}
```
- **Rationale**: Keeps phase definitions completely declarative. Any new boss can be authored by assembling phases without writing custom classes or modifying the core game loop.

### 2. Radial Nova Attack Behavior
- **Decision**: Create `src/entities/behaviors/attack/RadialNovaBehavior.ts` implementing `AttackBehavior`.
- **Details**:
  - Configurable `pellets` (e.g. 8, 12, 16), `bulletSpeed`, `fireCadenceTicks`, and optional `angularOffsetStep` (for rotating spiral nova patterns).
  - Pre-allocates math scratch variables to ensure zero garbage collection in 60Hz physics ticks.

### 3. Decoupling Boss Telemetry into `BossTelemetryHUD`
- **Decision**: Extract `renderBossTelemetry` from `Arena.ts` into `src/ui/BossTelemetryHUD.ts`.
- **Features**:
  - Displays boss codename, phase indicator (e.g. `PHASE 2/2 // OVERDRIVE`), and remaining shield charge pips.
  - Retains high-contrast cyan/crimson styling tokenized via `UITheme`.

## Risks / Trade-offs

- **[Risk] State desynchronization between BossPhaseController and Enemy entity**  
  → *Mitigation*: `Enemy` delegates its `movement`, `attack`, `speed`, and `shields` directly to `BossPhaseController` when configured with a phase controller, ensuring a single source of truth.
- **[Risk] Phase transition shockwave allocations creating frame drops**  
  → *Mitigation*: Reuse the existing pre-allocated `ParticleSystem` pool for all shockwave emissions; no new objects created at runtime.
