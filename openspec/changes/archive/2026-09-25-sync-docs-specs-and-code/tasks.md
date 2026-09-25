# Tasks

## 1. Documentation & Tooling Alignment

- [x] 1.1 Add `"test:watch": "vitest"` to `package.json` scripts and verify command availability
- [x] 1.2 Update `README.md` overview, Vektor-Prime boss profile, 20px grid A* pathfinding section, test badge, and CI description to match current code and specs
- [x] 1.3 Update `AGENTS.md` test suite count (704+ tests) and execution timing (< 900ms)
- [x] 1.4 Update `openspec/specs/procedural-levels/spec.md` scenario title to 20 rooms and calibrate Rooms 16–19 threat budget numbers to 145–255

## 2. Pathfinding Implementation Alignment

- [x] 2.1 Implement swept-circle lookahead shortcutting (`hasNavigationClearance`) in `src/entities/behaviors/movement/DirectAdvanceBehavior.ts` and `src/entities/behaviors/movement/KiterBehavior.ts`
- [x] 2.2 Implement intentional-stop-aware movement watchdog in `src/entities/behaviors/movement/KiterBehavior.ts` with 12-tick stall detection, sweet-spot hold exemptions, repath resets, and tangent breakout slides
- [x] 2.3 Add unit tests in `src/entities/behaviors/movement/KiterBehavior.test.ts` and `DirectAdvanceBehavior.test.ts` verifying swept shortcut execution and kiter watchdog stall recovery

## 3. Endless Mode Concurrency & Garbage Collection

- [x] 3.1 Fix `EndlessDirector.update` accounting in `src/levels/EndlessDirector.ts` so `readyToSpawn` units are included in active unit count, sniper count, threat budget, and spawn spatial checks
- [x] 3.2 Implement simulation-step dead enemy pruning in `src/entities/Arena.ts` when in Endless Mode
- [x] 3.3 Add unit tests in `src/levels/EndlessDirector.test.ts` and `src/entities/Arena.test.ts` verifying the strict 8-unit concurrent limit, 2-sniper cap under heavy kill churn, and dead enemy roster pruning

## 4. Verification & Validation

- [x] 4.1 Run full Vitest suite (`npm test`) and verify all tests pass with zero regressions
- [x] 4.2 Run TypeScript compilation and production build (`npm run build`) to confirm strict type safety
- [x] 4.3 Validate OpenSpec change with `openspec validate sync-docs-specs-and-code --strict`

