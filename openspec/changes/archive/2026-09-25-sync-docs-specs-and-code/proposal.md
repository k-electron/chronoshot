# Proposal

## Why

Project documentation, specifications, and codebase implementations have drifted out of alignment across several iterations. Specifically:
- `README.md` contains obsolete descriptions of the Vektor-Prime boss (phase names, speeds, and escort mechanics), an outdated 40px pathfinding section instead of the 20px grid architecture, stale test counts and timing, and a campaign overview limited to Sector 1 and Zone 2.
- `package.json` lacks the `npm run test:watch` script referenced across `README.md`, `AGENTS.md`, and `CONTRIBUTING.md`.
- `AGENTS.md` test counts and timings are stale (reflecting 690+ tests instead of the current 704+ tests).
- `openspec/specs/procedural-levels/spec.md` contains a legacy scenario title referencing a "14-room campaign sequence" and stale threat budgets (240–285) that mismatch the actual Room 16–19 threat sums (145–255).
- In pathfinding, the `combat-arena` specification promises swept-circle verification on waypoint shortcuts and an intentional-stop-aware stuck watchdog for kiters, neither of which is present in code.
- In Endless Mode, `EndlessDirector` can overshoot the 8-enemy concurrent cap and the 2-sniper cap under heavy kill churn because materializing units finishing their countdown are temporarily omitted from active tracking counts, and dead enemies are never purged from `Arena.enemies`, causing cumulative performance degradation.

Bringing docs, specs, and code back into alignment ensures engineering truthfulness, robust pathfinding without stuck kiters or corner clipping, and a clean, unbounded Endless Survival Mode.

## What Changes

- **Documentation & Configuration Synchronization**:
  - Update `README.md`: Align the overview to describe the complete 20-room 4-sector campaign and Endless Mode; correct the Vektor-Prime boss entry (Phase 1 "FORTRESS AEGIS" at 50 px/s with 5 shields, summoning Shotgun + Stalker on exit; Phase 2 "PHASE WARP" at 85 px/s with 3 shields alternating laser beams and 3-pellet fan spread, summoning 2 Stalkers on exit; Phase 3 "SINGULARITY NOVA" at 115 px/s discharging 16-pellet novae at 65-tick cadence); update pathfinding section to document the 20px grid A* with cell-center containment, directional surface contact clearance, swept shortcuts, and anti-freeze fallback; update test badge and CI copy to reflect 704+ passing tests.
  - Update `package.json`: Add `"test:watch": "vitest"` script to fulfill references in `README.md`, `AGENTS.md`, and `CONTRIBUTING.md`.
  - Update `AGENTS.md`: Update test count and timing to reflect 704+ tests passing in under 900ms.
- **Specification Corrections**:
  - Update `openspec/specs/procedural-levels/spec.md`: Retitle scenario "Progressing through 14-room campaign sequence" to "Progressing through 20-room campaign sequence", and update Rooms 16–19 threat budget numbers from "240 up to 285 points" to "145 up to 255 points" (Room 16: 145, Room 17: 190, Room 18: 195, Room 19: 255).
  - Clarify Endless Mode concurrent unit cap (at most 8 active/queued units), sniper cap (at most 2 active/queued marksmen/snipers), and dead enemy removal during Endless Mode in the procedural-levels spec.
- **Pathfinding Implementation Alignment**:
  - Implement continuous Minkowski swept-circle shortcut verification (`hasNavigationClearance`) in waypoint navigation for movement behaviors (`DirectAdvanceBehavior` and `KiterBehavior`) so units safely look ahead and shortcut across waypoints without clipping convex corners.
  - Implement intentional-stop-aware movement watchdog in `KiterBehavior`: track spatial displacement over 12 ticks ($< 1.5\text{px}$ displacement threshold) while commanding nonzero velocity, resetting during intentional halts (fire recoil stutter, charging laser, boss overload, or kiter range sweet spot), triggering an immediate repath and tangent breakout slide upon deadlock detection.
- **Endless Mode Concurrency & Garbage Collection Alignment**:
  - Fix `EndlessDirector` accounting: ensure units transitioning from `materializationQueue` to `readyToSpawn` are included in active unit count, sniper count, threat calculation, and spatial proximity checks so concurrent units never exceed 8 and snipers never exceed 2 under heavy kill churn.
  - Fix `Arena` enemy lifecycle: in Endless Mode, prune dead enemies (`enemy.isAlive === false`) from `Arena.enemies` at the end of each simulation step to prevent memory leakage and performance degradation during long runs.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `procedural-levels`: Correct the 20-room campaign sequence scenario title, calibrate the Sector 4 threat budget range to 145–255 points, and formalize strict concurrent unit and sniper caps under churn along with dead enemy pruning in Endless Mode.

## Impact

- **Build & Developer Tooling**: `package.json` gains `"test:watch": "vitest"`.
- **Documentation**: `README.md` and `AGENTS.md` accurately depict current game systems, boss phases, pathfinding resolution, and test metrics.
- **AI & Movement Behaviors**: `src/entities/behaviors/movement/KiterBehavior.ts` and `src/entities/behaviors/movement/DirectAdvanceBehavior.ts` gain swept waypoint lookahead/shortcutting; `KiterBehavior.ts` gains the stuck watchdog.
- **Levels & Endless Runtime**: `src/levels/EndlessDirector.ts` fixes churn counting; `src/entities/Arena.ts` prunes dead enemies in Endless Mode.
- **Tests**: Additional unit tests in `src/levels/EndlessDirector.test.ts`, `src/entities/Arena.test.ts`, and `src/entities/behaviors/movement/KiterBehavior.test.ts`.
