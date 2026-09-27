# Tasks

## 1. Modular Flash Controller & 2D Shadow Projection

- [x] 1.1 Implement `CataclysmFlashController` in `src/entities/boss/CataclysmFlashController.ts` supporting state progression (`idle`, `ramping_up`, `apex`, `ramping_down`), asymmetric ramp durations (~250ms ramp-up, ~70ms ramp-down), and phase-specific color palettes, verified by unit tests in `src/entities/boss/CataclysmFlashController.test.ts`.
- [x] 1.2 Implement 2D visibility polygon / shadow cone geometry projection in `CataclysmFlashController` calculating silhouette horizon vertices from rectangular obstacles, verified by unit tests confirming points in obstacle shadow cones are excluded from the illuminated polygon.
- [x] 1.3 Implement Canvas 2D occluded flash rendering in `CataclysmFlashController.render()` with alpha bloom and shadow masking, verified by mock Canvas 2D context unit tests.

## 2. Wall-Clock Real-Time Channel & Immunity Lifecycle

- [x] 2.1 Update `BossPhaseController` in `src/entities/boss/BossPhaseController.ts` to advance overload channel timing using unscaled wall-clock delta time, triggering flash ramp-up during the final channel window (~250ms), verified by unit tests in `src/entities/boss/BossPhaseController.test.ts`.
- [x] 2.2 Ensure boss invulnerability in `BossPhaseController` remains 100% active throughout the channel and ramp-up, terminating strictly at the Apex detonation ($t = 0$), verified by damage deflection tests in `src/entities/boss/BossPhaseController.test.ts`.

## 3. Absolute Lethality & Obstacle Impact Feedback

- [x] 3.1 Update `createCataclysmPulse` in `src/entities/boss/BossTransitionAction.ts` to enforce absolute lethal wipe (bypassing player shield charges) when operative is in open line of sight at Apex, verified by unit tests in `src/entities/boss/BossTransitionAction.test.ts`.
- [x] 3.2 Update `createCataclysmPulse` to spawn deflection sparks and impact feedback across the obstacle face facing the boss when operative is safely in shadow, verified by unit tests in `src/entities/boss/BossTransitionAction.test.ts`.

## 4. Arena Integration & End-to-End Verification

- [x] 4.1 Wire `CataclysmFlashController` into `Arena.ts` step and render loops, passing wall-clock delta time and obstacle geometry, verified by mock render tests in `src/entities/Arena.test.ts`.
- [x] 4.2 Update and run the full Vitest suite (`npm test`) across `Arena.test.ts`, `Enemy.test.ts`, `BossTransitionAction.test.ts`, and `BossPhaseController.test.ts` to guarantee 100% test pass rate with zero regressions.
