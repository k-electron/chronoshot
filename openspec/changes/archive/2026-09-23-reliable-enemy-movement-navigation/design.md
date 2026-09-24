# Design

## Context

See `proposal.md` for motivation. Combat units in ChronoShot use a combination of continuous collision detection, swept-circle navigation clearance, and a 40px grid A* pathfinder. In active combat, units frequently freeze or stick on corners due to false-positive clearance checks on obstacle contact, velocity cancellation on corner vertices, zeroing out velocity when A* paths are empty, and geometric bottlenecks in Room 3.

The user explicitly requested:
- Keep the existing map layouts intact with minimal necessary tweaks.
- Preserve system modularity (decoupled collision, movement behaviors, and pathfinding).
- Provide a detailed movement design with rigorous validation across all 21 maps to prevent regressions.

## Goals / Non-Goals

**Goals:**
- Guarantee that mobile combat units never freeze at `(0, 0)` velocity during active engagement unless intentionally holding position.
- Eliminate corner-pinning deadlocks at obstacle vertices.
- Allow units touching or sliding along an obstacle to retain direct pursuit clearance when steering away from the obstacle into open space.
- Preserve Room 3's chicane design and tactical feel while widening the bottleneck from $17.5\text{px}$ to $77.5\text{px}$.
- Correct embedded spawn points in Rooms 17, 18, and 20 by shifting them into open lanes.
- Validate all 21 maps with automated connectivity, spawn clearance, and live simulation tests.

**Non-Goals:**
- Redesigning or replacing existing room layouts.
- Adding complex multi-agent flocking or dynamic avoidance between enemies.
- Modifying projectile ballistics, weapon cadences, or damage models.

## Decisions

### 1. Directional Contact Normal Filtering in `hasNavigationClearance`

**Decision**: In `src/math/collision.ts`, when checking `hasNavigationClearance(from, to, radius, obstacles)`, test if the entity is in contact with an obstacle. If in contact, evaluate the travel direction $\vec{dir} = \text{normalize}(to - from)$ against the obstacle's contact normal $\hat{n}$.

**Rule**:
```ts
const contact = testCircleAABB(from, radius, min, max);
if (contact && contact.collided) {
  // If moving away or along tangent (dot >= -0.05), obstacle does not impede forward motion
  if (vecDot(dir, contact.normal) < -0.05) {
    return false; // Moving into obstacle
  }
  // Otherwise, ignore this obstacle from broad/narrow phase tests since entity is departing it
  continue;
}
```
*Rationale*: When an entity slides along a wall, `testCircleAABB` returns `collided: true` with zero depth. Unconditional rejection prevented enemies from chasing players in the open. Filtering by the contact normal ensures that departure from obstacles is clean.

*Alternatives Considered*:
- *Displacing `from` along normal by $\epsilon$*: Fails if adjacent to two obstacles (e.g. corner) or inside a narrow corridor.
- *Removing contact check entirely*: Allows entities that are deeply embedded inside obstacles to falsely claim clearance.

### 2. Anti-Freeze Fallback Locomotion in Movement Behaviors

**Decision**: In `DirectAdvanceBehavior` and `KiterBehavior`, if A* returns an empty path (`currentPath.length === 0`):
- If `ctx.hasLineOfSight` is true, fall back to direct pursuit $\vec{v} = \text{normalize}(\text{target} - \text{pos}) \times \text{speed}$. The continuous collision solver (`resolveObstacleCollisions`) will slide the unit along walls naturally.
- If optical line of sight is blocked, steer toward `findNearestWalkable(target)`.
- Never set `resultVelocity = (0, 0)` unless the unit is intentionally holding ground (e.g. Kiter in sweet spot or Sniper charging laser).

*Rationale*: Grid pathfinding can occasionally return an empty path if the target is momentarily positioned on an inflated boundary cell. Dropping velocity to zero turns active hostiles into static targets. Falling back to direct pursuit or nearest-walkable steering keeps units active.

### 3. Corner Vertex Tangent Deflection

**Decision**: In `Enemy.resolveObstacleCollisions()`, when a collision occurs with a corner vertex ($|n_x| > 0.1 \land |n_y| > 0.1$) and the desired velocity directly opposes the outward diagonal normal ($\vec{v} \cdot \hat{n} < -0.85$):
- Deflect velocity along the dominant adjacent face tangent: if $|v_x| \ge |v_y|$, set velocity to $(v_x, 0)$; otherwise set velocity to $(0, v_y)$.

*Rationale*: Symmetrical head-on corner collisions cancel both $x$ and $y$ velocity components during normal projection ($\vec{v}_{\text{tangent}} = \vec{v} - (\vec{v} \cdot \hat{n})\hat{n} \approx 0$). Deflecting along the dominant face breaks symmetry and guides the unit smoothly around the corner point onto the adjacent flat wall.

### 4. Kiter Lateral Wall Escape

**Decision**: In `KiterBehavior`, when the player is within $minDist$ and backwards retreat is obstructed by an obstacle boundary:
- Evaluate the two lateral wall tangents: $\vec{t}_1 = (-\hat{n}_y, \hat{n}_x)$ and $\vec{t}_2 = (\hat{n}_y, -\hat{n}_x)$.
- Probe each lateral vector with `hasNavigationClearance`.
- If clear, steer along the tangent that maximizes distance from the player.

*Rationale*: Prevents marksmen and snipers from freezing against back walls when rushed, enabling agile wall-sliding evasions.

### 5. Minimal Chicane Geometry Adjustment (Room 3)

**Decision**: In `createRoom3()` ([`src/levels/Room.ts`](file:///Users/karim/Documents/repos/chronoshot/src/levels/Room.ts)), keep all three obstacles at their exact positions, but adjust barrier vertical bounds:
- `barrier-top`: $x=380, y=0, w=24, h=220$ (ends at $y=220$, formerly $280$).
- `barrier-bottom`: $x=520, y=420, w=24, h=220$ (starts at $y=420$, formerly $360$).
- `pillar-mid`: centered at $(450, 320)$ with size $45\text{px}$.

*Rationale*: Expands the gaps above and below `pillar-mid` from $17.5\text{px}$ to $77.5\text{px}$ (nearly 2 full grid cells). Completely preserves the visual look and chicane feel while allowing units (diameters $26\text{--}30\text{px}$) and the player to pass through without collision.

### 6. Correcting Spawn Coordinate Typos (Rooms 17, 18, 20)

**Decision**: In `src/levels/Room.ts`:
- **Room 17**: Shift `guard-upper` from $(600, 220)$ to $(520, 220)$ and `guard-lower` from $(600, 420)$ to $(520, 420)$ (positioned at bunker entrances).
- **Room 18**: Shift `stalker-3` from $(620, 320)$ to $(620, 240)$ (in the lane beside the choke pillar).
- **Room 20**: Shift `boss-chrono-zenith` from $(740, 320)$ to $(680, 320)$ (centered in the command redoubt courtyard).

## Risks / Trade-offs

- **[Risk] Direct pursuit fallback causing units to run into walls when A* fails** → *Mitigation*: Fallback direct pursuit only occurs when optical sightline is clear, where continuous collision resolution (`resolveObstacleCollisions`) slides units along walls toward the player.
- **[Risk] Lateral escape kiting moving snipers closer to player** → *Mitigation*: The lateral candidate direction is selected by evaluating which tangent maximizes Euclidean distance to the player.
- **[Risk] Performance degradation in 60Hz loop** → *Mitigation*: Directional normal check in `hasNavigationClearance` replaces expensive sub-step raycasts with a single dot product ($O(1)$) and avoids redundant A* path queries on obstacle departure.
