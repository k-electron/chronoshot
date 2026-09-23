# Tasks

## 1. Behavior Interfaces & Contracts

- [x] 1.1 Create `src/entities/behaviors/movement/MovementBehavior.ts` defining `MovementBehavior`, `MovementContext`, and pre-allocated scratch vector pooling. Verify TypeScript compiles without errors.
- [x] 1.2 Create `src/entities/behaviors/attack/AttackBehavior.ts` defining `AttackBehavior`, `AttackContext`, and weapon firing signatures. Verify TypeScript compiles without errors.

## 2. Movement Behaviors

- [x] 2.1 Implement `DirectAdvanceBehavior` in `src/entities/behaviors/movement/DirectAdvanceBehavior.ts` handling direct line-of-sight vector closing and 40px grid A* obstacle pathfinding. Verify with unit tests in `DirectAdvanceBehavior.test.ts`.
- [x] 2.2 Implement `KiterBehavior` in `src/entities/behaviors/movement/KiterBehavior.ts` handling distance-keeping standoff, retreat, and sweet-spot holding. Verify with unit tests in `KiterBehavior.test.ts`.

## 3. Attack Behaviors

- [x] 3.1 Implement `SingleSlugBehavior` in `src/entities/behaviors/attack/SingleSlugBehavior.ts` supporting configurable fire cadence, bullet speed, spread angle, and discharge stutter ticks. Verify with unit tests in `SingleSlugBehavior.test.ts`.
- [x] 3.2 Implement `FanSpreadBehavior` in `src/entities/behaviors/attack/FanSpreadBehavior.ts` supporting multi-pellet buckshot spread. Verify with unit tests in `FanSpreadBehavior.test.ts`.
- [x] 3.3 Implement `TelegraphedBeamBehavior` in `src/entities/behaviors/attack/TelegraphedBeamBehavior.ts` managing charging laser sightline ticks and hyper-velocity discharge. Verify with unit tests in `TelegraphedBeamBehavior.test.ts`.

## 4. Decoupled Procedural Hull Renderer

- [x] 4.1 Create `src/ui/EnemyRenderer.ts` with procedural drawing functions for chassis shapes (diamond, hexagon, cross-star), muzzles, hit-count shield pips, and laser charging telegraphs. Verify rendering with mock context unit tests in `EnemyRenderer.test.ts`.
- [x] 4.2 Refactor `src/entities/Arena.ts` to replace the inline procedural drawing ladder with `EnemyRenderer.render()`. Verify all existing rendering tests in `Arena.test.ts` pass.

## 5. Enemy Composition & Integration

- [x] 5.1 Implement `src/entities/EnemyFactory.ts` with `EnemyBlueprint` definitions and factory methods for baseline archetypes (Grunt, Shotgun Guard, Stalker, Warden, Marksman, and Goliath-01). Verify archetype creation via unit tests.
- [x] 5.2 Refactor `src/entities/Enemy.ts` to delegate movement steering, pathfinding, and attack discharge to composed behaviors while preserving its full public interface (`update()`, `discharge()`, `takeDamage()`, `reset()`, etc.).
- [x] 5.3 Run full test suite (`npm test`) and typecheck (`npm run build`) to verify all 166+ unit tests pass with zero regressions across all 9 puzzle rooms.
