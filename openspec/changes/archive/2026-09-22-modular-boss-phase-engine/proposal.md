# Proposal

## Why

Milestone boss encounters in ChronoShot currently rely on hardcoded boolean flags (`isBoss`, `isEnraged`) with a fixed 2-phase transition embedded directly in the entity. 

To enable bosses of escalating tactical complexity—such as multi-stage state machines, bullet-ring novae, escort summon pulses, and phase-shifting mobility—boss encounters need a modular `BossPhaseController` that swaps movement behaviors, attack patterns, and triggers dynamic transition effects as shields or health thresholds deplete.

## What Changes

- **Boss Phase State Machine (`src/entities/boss/BossPhaseController.ts`)**: Introduce an $N$-phase state machine managing active movement, attack behaviors, phase shields, and transition triggers.
- **Phase Transition Actions (`src/entities/boss/BossTransitionAction.ts`)**: Support composable transition events including radial particle shockwaves, camera micro-shake, audio cues, and dynamic escort minion spawns.
- **Radial Nova Attack Behavior (`src/entities/behaviors/attack/RadialNovaBehavior.ts`)**: Implement an omnidirectional ring/bullet-hell discharge behavior for high-intensity boss phases.
- **Phase-Aware Telemetry HUD (`src/ui/BossTelemetryHUD.ts`)**: Extract and enhance boss telemetry from `Arena.ts` to render phase pips, active phase designations, and multi-tier shield durability.
- **Boss Blueprint Definition (`src/entities/boss/BossBlueprint.ts`)**: Enable authoring new milestone bosses (e.g. Goliath-01 Colossus and future bosses) via declarative phase configurations.

## Capabilities

### Modified Capabilities
- `boss-encounters`: Extend boss combat requirements to support arbitrary $N$-phase state transitions, phase transition shockwave actions, radial bullet-hell barrage attacks, and phase-aware telemetry HUDs.

## Impact

- **Source Code**:
  - `src/entities/boss/`: New directory containing `BossPhaseController.ts`, `BossTransitionAction.ts`, and `BossBlueprint.ts`.
  - `src/entities/behaviors/attack/RadialNovaBehavior.ts`: New signature boss attack behavior.
  - `src/ui/BossTelemetryHUD.ts`: Decoupled boss telemetry renderer extracted from `Arena.ts`.
  - `src/entities/Enemy.ts` & `src/entities/Arena.ts`: Integrated with `BossPhaseController`.
- **Tests**:
  - Unit tests for `BossPhaseController`, `RadialNovaBehavior`, and `BossTelemetryHUD`.
  - Full regression testing across `Arena.test.ts` and `Enemy.test.ts`.
