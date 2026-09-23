# Proposal

## Why

Currently, `Enemy.ts` is a monolithic 540-line class with tightly coupled `switch(type)` branching for movement, firing cadences, laser charging, pathfinding, and boss phases. Furthermore, enemy rendering is embedded directly in a 150-line procedural drawing ladder inside `Arena.ts`. 

To support scalable enemy variations, elite variants, multi-phase bosses, and dynamic encounter generation, enemy capabilities must be deconstructed into composable, reusable building blocks (movement behaviors, attack behaviors, and procedural hull renderers) without breaking any of the existing 166 tests or altering baseline archetype combat balance.

## What Changes

- **Extract Movement Behaviors (`src/entities/behaviors/movement/`)**: Implement pluggable steering strategies including `DirectAdvanceBehavior`, `KiterBehavior`, and `AStarPathfollowerBehavior` adhering to a common `MovementBehavior` contract.
- **Extract Attack Behaviors (`src/entities/behaviors/attack/`)**: Implement modular discharge mechanisms including `SingleSlugBehavior`, `FanSpreadBehavior`, and `TelegraphedBeamBehavior` with charging telegraph state adhering to an `AttackBehavior` contract.
- **Deconstruct Procedural Hull Rendering (`src/ui/EnemyRenderer.ts`)**: Decouple canvas rendering from `Arena.ts` into a modular procedural hull renderer supporting chassis primitives (diamond, hexagon, cross-star), muzzles, charging laser lines, and shield pips.
- **Entity Blueprint & Archetype Factory (`src/entities/EnemyFactory.ts`)**: Introduce data-driven `EnemyBlueprint` configuration to define archetypes via composition rather than hardcoded subclasses or switch ladders.
- **Refactor `Enemy.ts`**: Delegate movement integration, weapon discharge, and line-of-sight responses to active behavior components while preserving the existing public interface (`update()`, `discharge()`, `takeDamage()`, `reset()`, `id`, `type`, `speed`, `shields`).

## Capabilities

### Modified Capabilities
- `combat-arena`: Extend enemy combat behavior specifications to support modular movement behaviors, attack patterns, and procedural hull rendering while maintaining full behavioral parity for baseline archetypes (Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper, and Goliath-01 Colossus).

## Impact

- **Source Code**:
  - `src/entities/Enemy.ts`: Refactored to delegate to composable behavior strategies.
  - `src/entities/behaviors/`: New directory containing movement, attack, and defense behavior strategies.
  - `src/ui/EnemyRenderer.ts`: New module encapsulating procedural canvas drawing for all enemy archetypes.
  - `src/entities/Arena.ts`: Replaces the inline drawing ladder with `EnemyRenderer.render()`.
- **Tests**:
  - `src/entities/Enemy.test.ts`: Extended with behavior unit tests and regression tests ensuring 100% backward compatibility.
  - `src/entities/Arena.test.ts`: Verifies decoupled rendering passes.
- **Performance**: Pre-allocates vectors inside behaviors to preserve 60Hz zero-garbage allocation standards in hot simulation loops.
