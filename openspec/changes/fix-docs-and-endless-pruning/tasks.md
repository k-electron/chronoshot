# Tasks

## 1. Documentation Metrics & Room Telemetry Reconciliation

- [x] 1.1 Update Vitest test suite duration metric in `AGENTS.md` from "under 900ms" to "~1.5s", and verify markdown formatting.
- [x] 1.2 Correct Room 9 tactical tip and docstrings in `src/levels/Room.ts` from "6 enemy shield hits to break" to "4 enemy shield hits to break", and verify with `npm test src/levels/Room.test.ts`.
- [x] 1.3 Update Room 9 tactical tip assertion in `src/levels/RoomManager.test.ts` to expect "4 enemy shield hits to break", and verify `npm test src/levels/RoomManager.test.ts` passes.
- [x] 1.4 Update `README.md` to reflect 4 shield breaks for Room 09 ("The Iron Gate") and reconcile Room 09 and Room 11 summaries with their exact in-engine squad compositions and difficulty progression.

## 2. In-Place Zero-Allocation Endless Hostile Pruning

- [x] 2.1 Refactor dead enemy pruning in `src/entities/Arena.ts` (`step` / `fixedUpdate`) to use two-pointer in-place array compaction without allocating new arrays during simulation ticks.
- [x] 2.2 Add unit tests in `src/entities/Arena.test.ts` verifying that dead hostiles are pruned in Endless Mode, the `enemies` array reference identity is preserved, and trailing elements are cleanly cleared.
- [x] 2.3 Run full test suite (`npm test`) and production build check (`npm run build`) to ensure all 712+ tests pass with zero regressions.
