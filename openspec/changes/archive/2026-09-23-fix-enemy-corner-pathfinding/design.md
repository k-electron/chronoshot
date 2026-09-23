# Design

## Context

See `proposal.md` for motivation. In ChronoShot's discrete 60Hz physics loop, enemy combat units use `GridPathfinder` (40px A* search) when out of sight, and switch to direct vector pursuit when sightlines open. Two geometric mismatches create corner hangs:
1. `checkLineOfSight` performs a zero-width raycast from center to center; switching to direct steering when this ray clears an obstacle corner causes the unit's circular chassis (radius 14–24px) to collide with the obstacle corner.
2. `GridPathfinder.updateObstacles` inflates obstacle AABBs by entity radius into the 40px grid. Units adjacent to obstacles find themselves in an impassable grid cell (`grid[...] === 0`), causing `findPath` to fail and return an empty path, paralyzing the unit with `(0, 0)` velocity.

## Goals / Non-Goals

**Goals:**
- Provide reliable, deadlock-free navigation around obstacle corners for all enemy archetypes and milestone bosses.
- Decouple optical sightlines (aiming/firing) from physical navigation clearance (locomotion).
- Stay modular: keep collision/clearance checks cleanly separated from movement behavior logic and pathfinding algorithms.
- Guarantee that units starting inside inflated obstacle cells recover cleanly to the nearest walkable cell.
- Maintain strict zero-allocation performance in the 60Hz simulation loop.

**Non-Goals:**
- Complex tangential steering or dynamic corner friction physics (Option C was explicitly rejected to avoid jitter and behavioral brittleness).
- Dynamic obstacle avoidance between enemy units (enemies do not push or collide with each other).
- Altering weapon firing cadences, laser charging telegraphs, or bullet raycasts.

## Decisions

### 1. Modular Swept-Circle Clearance Utility (`hasNavigationClearance`)

**Decision**: Implement a modular geometry function `hasNavigationClearance(from: Vector2D, to: Vector2D, radius: number, obstacles: readonly Obstacle[]): boolean` in `src/math/collision.ts`.

**Mechanism**:
- For each obstacle, test if the line segment from `from` to `to` intersects the obstacle's Minkowski sum (the AABB expanded by `radius` on all sides: `[min.x - radius, max.x + radius] x [min.y - radius, max.y + radius]`).
- Using `rayIntersectsAABB` against the expanded bounds provides a fast, conservative clearance check that prevents entities from grazing or clipping corner vertices.
- *Alternatives Considered*:
  - *Full capsule-to-box continuous collision solver*: Overkill for axis-aligned bounding boxes and computationally heavier.
  - *Increasing arrival radius on waypoints*: Does not fix the premature line-of-sight path cancellation.

### 2. Decouple Optical Sightline from Locomotion Pursuit

**Decision**: In `DirectAdvanceBehavior` (and `KiterBehavior`), maintain optical `hasLineOfSight` for weapon aiming and attack state, but gate the transition to direct vector steering behind `hasNavigationClearance`.

**Rule**:
- If `ctx.hasLineOfSight` is true BUT `hasNavigationClearance` is false: the enemy aims and shoots at the target, but **continues following its A* waypoint path** around the corner.
- Once the enemy reaches a waypoint where `hasNavigationClearance` evaluates to true (its entire body has cleared the corner), it switches to direct vector steering.
- *Alternatives Considered*:
  - *Extending `checkLineOfSight` with radius directly*: Would prevent enemies from shooting or charging lasers through narrow gaps or past corners where sight is clear, compromising combat aggression.

### 3. Dual-Sided Endpoint Snapping in Pathfinding (`nearestStart` + `nearestTarget`)

**Decision**: In `DirectAdvanceBehavior` and `KiterBehavior`, resolve both `startPos` and `targetPos` against `pf.isWalkable` before path generation.

**Rule**:
```ts
let startPos = ctx.position;
const startGrid = pf.worldToGrid(startPos);
if (!pf.isWalkable(startGrid.gx, startGrid.gy)) {
  const nearest = pf.findNearestWalkable(startPos);
  if (nearest) startPos = nearest;
}

let targetPos = target.position;
const targetGrid = pf.worldToGrid(targetPos);
if (!pf.isWalkable(targetGrid.gx, targetGrid.gy)) {
  const nearest = pf.findNearestWalkable(targetPos);
  if (nearest) targetPos = nearest;
}

let path = pf.findPath(startPos, targetPos);
```
- If an entity starts in an unwalkable cell (e.g. pushed into an obstacle boundary), `path[0]` is the adjacent walkable cell center, directing the entity **out of the clearance zone and back into open space**.

## Risks / Trade-offs

- **[Risk] Slight delay in direct chase when rounding corners** → Mitigation: Enemies still aim and fire as soon as sightlines open; waiting until clearance is verified prevents the far worse outcome of getting permanently stuck.
- **[Risk] Performance cost of clearance testing against obstacles** → Mitigation: Ray-to-expanded-AABB testing is fast arithmetic (slab method) and early-exits on the first intersecting obstacle; arena rooms typically contain 2–6 obstacles.
