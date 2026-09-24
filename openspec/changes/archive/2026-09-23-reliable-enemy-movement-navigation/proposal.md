# Proposal

## Why

Combat units currently experience full locomotion freezes and corner-pinning deadlocks:
1. In Room 3, a geometric flaw places a 45px pillar in an 80px gap between barriers, leaving two 17.5px gaps that completely partition the arena and prevent any entity (dia 26–30px) or player from passing through or pathfinding.
2. `hasNavigationClearance` unconditionally fails whenever an entity touches an obstacle (`testCircleAABB !== null`), even when steering away into open space, triggering false-positive clearance loss and forcing redundant A* queries.
3. Movement behaviors (`DirectAdvanceBehavior` and `KiterBehavior`) drop velocity to zero on empty A* paths rather than using fallback steering or tangent wall sliding.
4. Corner vertex collisions cancel forward velocity to zero during head-on corner impacts.
5. In Rooms 17, 18, and 20, four enemies spawn directly embedded inside obstacle hitboxes.

Resolving these issues ensures smooth, deadlock-free combat navigation while preserving modularity, keeping map layouts intact with minimal dimensional tweaks, and validating all 21 maps against strict invariants.

## What Changes

- **Directional Contact Clearance**: Refine `hasNavigationClearance` so contact with an obstacle only fails clearance if movement is directed into the obstacle ($\vec{dir} \cdot \hat{n} < -0.05$). Movement parallel to or away from the contact surface preserves clearance.
- **Anti-Freeze Locomotion Fallbacks**: Update `DirectAdvanceBehavior` and `KiterBehavior` so an empty A* path falls back to direct pursuit when optical LOS is clear, or steers toward the nearest walkable cell, never stalling at `(0, 0)` velocity during active engagement.
- **Corner Vertex Deflection**: Update obstacle collision sliding in `Enemy` so head-on corner vertex collisions deflect along the dominant tangent rather than canceling velocity to zero.
- **Kiter Lateral Wall Escape**: In `KiterBehavior`, when backwards retreat is obstructed by a wall, test perpendicular lateral escape vectors to slide along cover instead of freezing against the barrier.
- **Room 3 Chicane Opening**: Shorten `barrier-top` to $y=220$ and start `barrier-bottom` at $y=420$, expanding the openings around `pillar-mid` from $17.5\text{px}$ to $77.5\text{px}$ while preserving the exact 3-obstacle arrangement and visual feel.
- **Spawn Coordinate Corrections**: Shift enemy spawn coordinates in Rooms 17, 18, and 20 by $40\text{--}60\text{px}$ so hostiles spawn in open lanes outside obstacle hitboxes.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `combat-arena`: Refine requirement 8 to specify that navigation clearance respects contact normals (allowing departure from obstacle surfaces), fallback locomotion avoids velocity zeroing when optical sightlines exist, and corner sliding prevents vertex deadlocks.
- `procedural-levels`: Update level specifications to require all room layouts (including Room 3 chicane) to maintain at least $48\text{px}$ passable corridors between obstacles, and ensure fixed room enemy spawns have clean physical clearance.

## Impact

- **Affected Files**:
  - `src/math/collision.ts`: Directional contact handling in `hasNavigationClearance`.
  - `src/entities/behaviors/movement/DirectAdvanceBehavior.ts`: Anti-freeze fallback locomotion.
  - `src/entities/behaviors/movement/KiterBehavior.ts`: Anti-freeze fallback and lateral wall escape.
  - `src/entities/Enemy.ts`: Corner vertex deflection in `resolveObstacleCollisions`.
  - `src/levels/Room.ts`: Room 3 barrier heights and Rooms 17, 18, 20 spawn coordinates.
- **APIs & Modularity**: Completely preserves modular interfaces (`MovementBehavior`, `CombatUnit`, `GridPathfinder`, `hasNavigationClearance`). No breaking API changes.
- **Performance**: Zero-allocation math in 60Hz physics update loop.
