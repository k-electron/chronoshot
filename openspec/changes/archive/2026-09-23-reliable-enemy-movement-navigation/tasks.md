# Tasks

## 1. Geometry & Spawn Corrections

- [x] 1.1 Update Room 3 barrier bounds in `src/levels/Room.ts` (shorten `barrier-top` to $y=220$ and start `barrier-bottom` at $y=420$) and verify corridor openings expand to $77.5\text{px}$ with unit test.
- [x] 1.2 Correct enemy spawn coordinates in `src/levels/Room.ts` for Rooms 17, 18, and 20 (shifting units into open lanes) and verify non-overlapping spawn clearance with unit test.

## 2. Directional Contact Clearance

- [x] 2.1 Update `hasNavigationClearance` in `src/math/collision.ts` to evaluate contact normal dot product ($\vec{dir} \cdot \hat{n} \ge -0.05$), allowing clean departure from obstacle surfaces without false-positive clearance loss.
- [x] 2.2 Add comprehensive unit test coverage in `src/math/collision.test.ts` verifying clearance behavior when moving away from, along tangent of, and directly into obstacle contact surfaces.

## 3. Anti-Freeze Fallback Locomotion & Corner Vertex Deflection

- [x] 3.1 Update `DirectAdvanceBehavior.ts` to implement fallback locomotion (direct vector pursuit when optical LOS is clear, or steering toward nearest walkable cell) when A* yields an empty path.
- [x] 3.2 Update `KiterBehavior.ts` to evaluate lateral escape tangents when backwards retreat is blocked by an obstacle boundary, and add fallback locomotion on empty paths.
- [x] 3.3 Update `Enemy.resolveObstacleCollisions()` in `src/entities/Enemy.ts` to deflect velocity along the dominant adjacent face tangent on head-on corner vertex collisions ($\vec{v} \cdot \hat{n} < -0.85$).
- [x] 3.4 Add automated unit tests in `DirectAdvanceBehavior.test.ts`, `KiterBehavior.test.ts`, and `Enemy.test.ts` verifying corner deflection and anti-freeze fallback behaviors.

## 4. 21-Map Comprehensive Verification & Build

- [x] 4.1 Implement a comprehensive 21-map integration test suite verifying exit reachability, spawn clearance, and zero freeze deadlocks over 300 simulation ticks across all 21 maps.
- [x] 4.2 Run complete Vitest suite (`npm test`) and TypeScript production build (`npm run build`) to verify all tests pass with zero regressions.
