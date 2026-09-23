# Proposal

## Why

Enemies frequently become stuck or permanently frozen on the corners of arena obstacles (pillars and walls). This occurs due to two compounding issues: (1) optical line-of-sight uses a zero-width raycast that prematurely triggers direct steering into obstacle corners before the enemy's physical chassis (14–24px) has cleared the geometry, and (2) when an enemy is adjacent to an obstacle, grid inflation marks its cell as impassable, causing A* pathfinding to fail with an empty path and zero velocity because the fallback only resolves `nearestTarget` rather than `nearestStart`.

Resolving these issues ensures enemies navigate fluidly around obstacles, prevents permanent combat stalls, and maintains clean modular separation between optical targeting, navigation clearance, and pathfinding.

## What Changes

- **Dual-Sided Walkable Endpoint Snapping**: When calculating A* paths in movement behaviors (`DirectAdvanceBehavior` and `KiterBehavior`), both `startPos` and `targetPos` resolve to the nearest walkable grid cell when located in impassable clearance zones, preventing pathfinding deadlocks.
- **Physical Navigation Clearance Check**: Introduce a modular swept-circle / hull-clearance check that verifies whether an entity's circular chassis has unobstructed straight-line passage to the target before transitioning from A* waypoints to direct vector pursuit.
- **Optical vs. Locomotion Decoupling**: Preserve optical line-of-sight for weapon aiming, charging, and firing, while requiring physical navigation clearance for direct vector locomotion.
- **Modular Architecture**: Keep clearance evaluation decoupled in a reusable collision/navigation utility, keeping movement behaviors lean, testable, and deterministic.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `combat-arena`: Updates the "Enemy Pathing and Intelligent Navigation" requirement to specify that direct vector pursuit requires physical unit clearance (preventing corner-cutting), and that pathfinding recovers from obstacle adjacency without freezing.

## Impact

- **Affected Systems**: `src/entities/behaviors/movement/DirectAdvanceBehavior.ts`, `src/entities/behaviors/movement/KiterBehavior.ts`, `src/engine/GridPathfinder.ts`, and `src/math/collision.ts`.
- **APIs**: Extends collision/movement utilities with modular hull-clearance testing; enhances pathfinding endpoint resolution.
- **Backwards Compatibility**: Fully preserved; no breaking changes to enemy blueprints, attack behaviors, or arena interfaces.
