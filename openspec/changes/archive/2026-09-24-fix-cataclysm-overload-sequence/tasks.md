# Tasks

## 1. Boss Phase Controller Lifecycle Hook

- [x] 1.1 Add `onOverloadDetonate` hook to `BossPhaseConfig` interface in `src/entities/boss/BossPhaseController.ts` and verify TypeScript compilation with `npm run build`
- [x] 1.2 Implement detonation trigger in `BossPhaseController.update()` when `overloadTicksRemaining` transitions from `> 0` to `0`, constructing and passing `BossTransitionContext` with `transitionContextExtras`
- [x] 1.3 Add unit tests in `src/entities/boss/BossPhaseController.test.ts` verifying `onOverloadDetonate` triggers precisely upon channel expiration, does not fire prematurely, and provides transition extras, verifying with `npx vitest run src/entities/boss/BossPhaseController.test.ts`

## 2. Chrono-Zenith Blueprint Re-wiring & Safe Arena AI Iteration

- [x] 2.1 Reconfigure `CHRONO_ZENITH_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` by removing premature `onPhaseExit` shockwave actions and wiring Cataclysm pulses, escort spawns, and audio cues to `onOverloadDetonate` on Phases 1, 2, and 3
- [x] 2.2 Update `Arena.ts` enemy AI update loop to iterate a shallow copy `[...this.enemies]` so dynamic escort spawns during channel detonation do not mutate active loop iteration
- [x] 2.3 Update `src/entities/boss/BossBlueprint.test.ts` to assert that `onOverloadDetonate` is configured on Chrono-Zenith phases 1, 2, and 3, and verify with `npx vitest run src/entities/boss/BossBlueprint.test.ts`

## 3. End-to-End Tactical Flow Tests

- [x] 3.1 Add integration tests in `src/entities/Enemy.test.ts` covering the complete Cataclysm Overload sequence: Phase 0 shield break -> 75-tick channel with deflection and zero damage -> line-of-sight cover occlusion vs open lethal damage at tick 75 -> escort materialization -> Phase 1 sniper combat, verifying with `npx vitest run src/entities/Enemy.test.ts`
- [x] 3.2 Add test in `src/entities/Arena.test.ts` verifying that the Cataclysm hazard aura (`"⚠ CATACLYSM OVERLOAD // SEEK COVER ⚠"`) is visible during active overload countdown and vanishes upon detonation, verifying with `npx vitest run src/entities/Arena.test.ts`

## 4. Documentation & Verification

- [x] 4.1 Update `AGENTS.md` boss phase engine section to document the `onOverloadDetonate` lifecycle hook and the Chrono-Zenith channel-then-detonate sequence
- [x] 4.2 Run complete test suite and OpenSpec validation via `npm test` and `openspec validate fix-cataclysm-overload-sequence --strict` to verify zero regressions
