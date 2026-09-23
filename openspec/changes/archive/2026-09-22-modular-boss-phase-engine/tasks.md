# Tasks

## 1. Signature Boss Attack Behaviors

- [x] 1.1 Implement `RadialNovaBehavior` in `src/entities/behaviors/attack/RadialNovaBehavior.ts` supporting omnidirectional 360-degree projectile rings with configurable pellet count, bullet speed, and spiral angular offsets. Verify with unit tests in `RadialNovaBehavior.test.ts`.

## 2. Boss Phase State Machine & Transition Actions

- [x] 2.1 Implement `BossPhaseController` in `src/entities/boss/BossPhaseController.ts` supporting $N$-phase state transitions, trigger evaluations, dynamic behavior swaps, and phase state resets. Verify with unit tests in `BossPhaseController.test.ts`.
- [x] 2.2 Implement `BossTransitionAction` in `src/entities/boss/BossTransitionAction.ts` supporting radial particle shockwave bursts, audio synthesis cues, and dynamic escort minion summons. Verify with unit tests in `BossTransitionAction.test.ts`.

## 3. Decoupled Boss Telemetry HUD

- [x] 3.1 Create `src/ui/BossTelemetryHUD.ts` rendering real-time boss designation, active phase title, phase progression pips, and multi-tier shield charges. Verify with mock Canvas 2D unit tests in `BossTelemetryHUD.test.ts`.
- [x] 3.2 Refactor `src/entities/Arena.ts` to delegate boss telemetry rendering to `BossTelemetryHUD.render()`. Verify existing boss telemetry tests in `Arena.test.ts` pass.

## 4. Boss Blueprints & Integration

- [x] 4.1 Implement `BossBlueprint` definitions in `src/entities/boss/BossBlueprint.ts` for Goliath-01 Colossus and multi-phase archetype blueprints. Verify with unit tests in `BossBlueprint.test.ts`.
- [x] 4.2 Integrate `BossPhaseController` into `src/entities/Enemy.ts` and `src/entities/EnemyFactory.ts` so milestone bosses operate via the phase engine while preserving existing public API and test compatibility.
- [x] 4.3 Run full test suite (`npm test`) and typecheck (`npm run build`) to verify all 250+ unit tests pass with zero regressions.
