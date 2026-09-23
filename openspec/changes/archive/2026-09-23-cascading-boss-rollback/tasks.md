# Tasks

## 1. Rollback Computation & Checkpoint Resolver

- [x] 1.1 Implement `computeRollbackTarget` helper in `src/levels/RollbackCalculator.ts` covering Rooms 1–20 and Endless Mode, and verify with comprehensive unit tests in `src/levels/RollbackCalculator.test.ts`
- [x] 1.2 Integrate rollback resolution and room index jumping into `RoomManager` (`getRollbackTarget()`, `rollbackToCheckpoint()`), and verify with unit tests in `src/levels/RoomManager.test.ts`

## 2. Loadout Snapshotting & Player Augmentation Restoration

- [x] 2.1 Implement boss room entry loadout snapshotting in `Arena` and augmentations restoration in `Player` and `Arena`, ensuring exact snapshot loadouts are restored without perk duplication
- [x] 2.2 Add unit tests in `src/entities/Arena.test.ts` verifying that entering boss rooms captures snapshots and rolling back restores the correct augmentations count (0 for R5, 1 for R10, 2 for R15)

## 3. Dual-Card Defeat Screen & Interactive Controls

- [x] 3.1 Implement dual-card defeat overlay rendering (`Card 1: Rollback` with target boss name/sector, `Card 2: Full Reset`) and card bounding box hit detection in `Arena.render()`
- [x] 3.2 Implement mouse hover detection, dynamic canvas cursor updates (`pointer` over defeat cards), and mouse click triggers in `Arena.step()` and `src/main.ts` for Cards 1 and 2
- [x] 3.3 Implement keyboard triggers in `Arena.step()` and `src/main.ts` distinguishing `[R]` (Rollback) from `[Shift+R]` (Full Reset)
- [x] 3.4 Add unit tests in `src/entities/Arena.test.ts` verifying card bounding box math, mouse click routing, and keyboard shortcut dispatch

## 4. Endless Mode Score Telemetry & Apex Rollback

- [x] 4.1 Update Endless Mode defeat screen rendering to display the survival metrics banner (Survival Time, Max Threat Budget, Kills) alongside the dual defeat cards targeting Room 20 for rollback
- [x] 4.2 Add unit tests in `src/entities/Arena.test.ts` verifying Endless Mode defeat displays survival statistics and rolling back navigates to Room 20

## 5. End-to-End Cascading Drop-down Verification

- [x] 5.1 Add end-to-end integration tests in `src/entities/Arena.test.ts` simulating cascading deaths (dying in R12 -> rolling back to R10 -> dying in R10 -> rolling back to R5 -> dying in R5 -> rolling back to R1)
- [x] 5.2 Run complete test suite via `npm test` and production build via `npm run build` to verify 100% test passing and zero regressions
