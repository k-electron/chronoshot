# Tasks

## 1. Geometry & Navigation Clearance Utility

- [x] 1.1 Implement `hasNavigationClearance(from: Vector2D, to: Vector2D, radius: number, obstacles: readonly Obstacle[]): boolean` in `src/math/collision.ts` checking swept-circle passage against expanded obstacle bounds
- [x] 1.2 Add unit tests in `src/math/collision.test.ts` verifying clearance checks for direct sightlines with corner interference, clear corridors, and grazing angles

## 2. Dual-Sided Pathfinding Endpoint Snapping

- [x] 2.1 Update `DirectAdvanceBehavior.update` to resolve both `startPos` and `targetPos` via `pf.findNearestWalkable` when starting in impassable clearance cells
- [x] 2.2 Update `KiterBehavior.update` to resolve both `startPos` and `targetPos` via `pf.findNearestWalkable` when starting in impassable clearance cells
- [x] 2.3 Add unit tests in `src/entities/behaviors/movement/DirectAdvanceBehavior.test.ts` and `KiterBehavior.test.ts` confirming units starting adjacent to obstacle corners generate non-empty escape paths instead of freezing with `(0, 0)` velocity

## 3. Decoupled Locomotion Clearance Integration

- [x] 3.1 Update `DirectAdvanceBehavior.update` to gate direct vector pursuit behind `hasNavigationClearance`, continuing along A* waypoints when physical clearance around corners is blocked
- [x] 3.2 Update `KiterBehavior.update` to evaluate `hasNavigationClearance` during advance/retreat states, preventing corner clipping
- [x] 3.3 Add unit tests in `DirectAdvanceBehavior.test.ts` demonstrating that an enemy acquiring optical line-of-sight around an obstacle corner remains on A* waypoints until physical clearance is established

## 4. Verification & Validation

- [x] 4.1 Run complete test suite (`npm test`) and verify all tests pass without regressions
- [x] 4.2 Run `openspec validate fix-enemy-corner-pathfinding --strict` to ensure complete specification compliance
