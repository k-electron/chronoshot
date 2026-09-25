# Tasks

## 1. Math Utilities & Unit Collision Primitives

- [x] 1.1 Implement `testCircleCircle(c1, r1, c2, r2)` and `resolveCircleCircleCollision(posA, radiusA, weightA, posB, radiusB, weightB)` in `src/math/collision.ts`, providing penetration depth, contact normal, and mass-weighted displacement vectors; verify with unit tests in `src/math/collision.test.ts`.
- [x] 1.2 Implement relative velocity damping along contact normal `applyInelasticCircleImpulse(velA, weightA, velB, weightB, normal)` in `src/math/collision.ts` to cancel inward normal velocity while preserving tangential slide; verify with unit tests in `src/math/collision.test.ts`.

## 2. Multi-Agent Steering Behaviors

- [x] 2.1 Update `MovementBehavior.update` signature and `MovementContext` to accept optional array of nearby active hostiles `neighbors?: Enemy[]` without breaking existing call sites; verify existing movement tests pass.
- [x] 2.2 Implement surface-distance arrival in `DirectAdvanceBehavior.ts`, halting forward thrust when $d \le r_{\text{self}} + r_{\text{target}} + 2\text{px}$; verify with unit tests in `DirectAdvanceBehavior.test.ts`.
- [x] 2.3 Implement quadratic separation flocking in `DirectAdvanceBehavior.ts` across open sightlines within $R_{\text{sep}} = 64\text{px}$; verify that converging units fan out into an arc in `DirectAdvanceBehavior.test.ts`.
- [x] 2.4 Implement lead unit sensing and corridor queueing in `DirectAdvanceBehavior.ts`, suppressing lateral separation and clamping velocity to lead unit when lateral obstacle clearance is blocked; verify with corridor queueing unit tests.
- [x] 2.5 Update `KiterBehavior.ts` to include neighboring hostile hitboxes in retreat clearance probes; verify with unit tests in `KiterBehavior.test.ts`.

## 3. Arena Physics & Multi-Pass Constraint Relaxation

- [x] 3.1 Implement `resolveUnitCollisions(player, enemies, obstacles, bounds, iterations)` in `src/entities/Arena.ts` executing 3-pass relaxation (Unit-Unit circle MTV, Unit-Obstacle AABB resolution, and perimeter clamping); verify with unit tests in `src/entities/Arena.test.ts`.
- [x] 3.2 Integrate `resolveUnitCollisions` into `Arena.fixedUpdate` following position integration; verify that stacked or overlapping enemies are automatically pushed apart and remain outside obstacles without jitter in `src/entities/Arena.test.ts`.
- [x] 3.3 Verify non-damaging contact semantics: ensure physical contact between player and enemies deals zero damage, consumes no shield charges, and leaves point-blank bullet spawn gaps; verify in `src/entities/Arena.test.ts`.

## 4. Overcharge Dash Shove & Boss Deflection

- [x] 4.1 Update `Arena` collision resolution to identify when player is in `dashActiveTicks > 0`, applying dominant kinetic mass ($w_P = 0.1, w_E = 0.9$) to shove standard hostiles along contact normal and dash tangent; verify with dash collision unit tests in `src/entities/Arena.test.ts`.
- [x] 4.2 Enforce infinite mass for milestone bosses ($w_{\text{boss}} = 0, w_P = 1.0$), ensuring the dashing player deflects smoothly along the curved boss hull with zero penetration; verify in `src/entities/boss/BossPhaseController.test.ts` and `src/entities/Arena.test.ts`.

## 5. Safe Dynamic Entity Materialization

- [x] 5.1 Implement `resolveSafeSpawnPosition(candidate, radius, obstacles, existingUnits, bounds)` in `src/entities/boss/BossTransitionAction.ts` with radial candidate probe search when default offset is obstructed; verify with unit tests in `src/entities/boss/BossTransitionAction.test.ts`.
- [x] 5.2 Integrate safe spawn resolution into `createMinionEscortSpawn` and `Arena.spawnEnemy`, triggering an immediate relaxation pass upon dynamic entity instantiation; verify in `src/entities/boss/BossTransitionAction.test.ts` and `src/entities/Arena.test.ts`.

## 6. Regression Testing & Integration Verification

- [x] 6.1 Validate that all 21 rooms in `src/levels/All21MapsValidation.test.ts` initialize with zero overlapping entity spawns.
- [x] 6.2 Execute full test suite (`npm test`) and production build (`npm run build`) to ensure all tests pass and zero memory allocations occur in the hot loop.
