# Tasks

## 1. Static Reachability Test & TDD Baseline

- [x] 1.1 Add static graph reachability test in `src/levels/All21MapsValidation.test.ts` that queries pathfinding from every enemy spawn to player spawn at their true blueprint radii; verify that it executes on current main and fails specifically for Room 16 Warden ($R=18$).

## 2. 20px Grid Pathfinding & Cell-Center Containment

- [x] 2.1 Update `GridPathfinder.ts` default `cellSize` to 20 ($48 \times 32$ grid) and implement cell-center containment range calculations (`Math.ceil`/`Math.floor` offsets) in `updateObstacles`; verify with unit tests in `src/engine/GridPathfinder.test.ts`.
- [x] 2.2 Update pathfinder instantiation in `DirectAdvanceBehavior.ts` and `KiterBehavior.ts` to use the $20\text{px}$ grid at the unit's true blueprint radius; verify that the static connectivity test in `All21MapsValidation.test.ts` turns green across all 21 rooms.

## 3. Anti-Grind Tangent Fallback & Movement Watchdog

- [x] 3.1 Implement obstacle tangent fallback with goal alignment and directional hysteresis in `DirectAdvanceBehavior.ts` and `KiterBehavior.ts` when line-of-sight is blocked and A* yields no path; verify with unit tests in `DirectAdvanceBehavior.test.ts`.
- [x] 3.2 Implement the intentional-stop-aware movement watchdog in `DirectAdvanceBehavior.ts` that monitors displacement during nonzero commanded velocity and triggers immediate repathing and breakout slides on stalls ($< 1.5\text{px}$ over 12 ticks) while resetting on legitimate pauses; verify with unit tests.
- [x] 3.3 Verify that all waypoint shortcuts and direct-vector steering transitions strictly enforce `hasNavigationClearance` continuous Minkowski swept-circle raycasting at the unit's true physical radius to prevent corner clipping.

## 4. Full Integration Verification & Validation

- [x] 4.1 Update the 300-tick dynamic locomotion test in `src/levels/All21MapsValidation.test.ts` with player behind-cover scenarios; verify that Room 16 Warden and Room 20 Chrono-Zenith traverse geometry with 0 freeze deadlocks.
- [x] 4.2 Run the full test suite (`npm test`), execute production build (`npm run build`), and validate OpenSpec change compliance (`openspec validate modularity --strict`).
