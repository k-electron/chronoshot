# Design

## Context

In ChronoShot's discrete 60 Hz physics loop, enemy combat units rely on `GridPathfinder` when optical line-of-sight (LOS) or physical clearance to the player is obstructed. As detailed in `proposal.md`, the current $40\text{px}$ tile grid with AABB obstacle inflation over-blocks narrow channels for units with larger collision hulls (Aegis Warden with $R=18$, Bosses with $R \in [24, 28]$). When A* fails and LOS is blocked, fallback locomotion steers directly into the intervening obstacle, resulting in permanent corner deadlocks.

This design introduces a high-resolution $20\text{px}$ grid pathfinder with cell-center containment, an anti-grind tangent fallback with directional hysteresis, an intentional-stop-aware movement watchdog, and swept-circle shortcut verification.

## Goals / Non-Goals

**Goals:**
- Eliminate pathfinding-induced deadlocks in Room 16, Room 18, Room 20, and all other rooms at true unit blueprint radii ($R=18$ for Warden, $R=24\text{--}28$ for Bosses).
- Retain exact spatial truth: never lie to the planner or clamp clearance below actual entity radii.
- Ensure fallback locomotion deflects along obstacle tangents towards the goal when A* yields no path, avoiding head-on wall grinding.
- Detect abnormal locomotion stalls with a displacement watchdog without false-triggering during intentional stops.
- Validate all shortcut chords and direct-vector transitions with continuous Minkowski swept-circle raycasting (`hasNavigationClearance`).
- Preserve all 21 handcrafted room geometries and encounter balances without altering wall or pillar coordinates.
- Maintain deterministic, sub-second execution across the Vitest test suite.

**Non-Goals:**
- Altering room geometry, barrier dimensions, or pillar coordinates in `Room.ts` or `ApexRedoubtTemplate.ts`.
- Introducing third-party navigation libraries or complex navigation meshes.
- Modifying combat AI archetypes, firing cadences, or damage models.

## Decisions

### 1. 20px Grid Pathfinding with Cell-Center Inflation

**Choice**: Transition default `GridPathfinder` cell size from $40\text{px}$ ($24 \times 16 = 384$ cells) to $20\text{px}$ ($48 \times 32 = 1,536$ cells), and mark cells as impassable if and only if the cell center falls inside the inflated obstacle bounds.

**Formula**:
For an obstacle with bounds $[ox, oy, ox+ow, oy+oh]$ inflated by entity radius $R$:
$$\text{minX} = ox - R, \quad \text{maxX} = ox + ow + R$$
A cell $(gx, gy)$ with center $((gx + 0.5) \cdot C, (gy + 0.5) \cdot C)$ satisfies $\text{minX} \le \text{cx} \le \text{maxX}$ if and only if:
$$\text{startGx} = \max\left(0, \left\lceil \frac{\text{minX}}{C} - 0.5 \right\rceil\right), \quad \text{endGx} = \min\left(\text{cols} - 1, \left\lfloor \frac{\text{maxX}}{C} - 0.5 \right\rfloor\right)$$
(and identically for $gy$ with $\text{minY}, \text{maxY}$).

**Rationale**:
Because A* waypoints are placed at cell centers, a circular hull of radius $R$ centered at $(cx, cy)$ is collision-free with respect to the obstacle if and only if $(cx, cy)$ is outside the Minkowski-inflated obstacle bounds. Previous AABB bounding box overlap marked cells blocked if even $0.001\text{px}$ of the cell corner touched the inflated box, introducing up to $40\text{px}$ of phantom obstacle padding. Cell-center containment eliminates this phantom padding while preserving complete mathematical safety. Combined with a $20\text{px}$ cell size, waypoints can step through physical channels as narrow as $2R + 1\text{px}$.

**Alternatives Considered**:
- *Clamping clearance to 14px on 40px grid*: Rejected because it misleads the planner into routing large units through gaps narrower than their physical diameter, shifting deadlocks into physical corners.
- *40px grid with cell-center inflation*: Passes connectivity, but $20\text{px}$ spacing provides twice the waypoint contouring resolution around tight pillars.

### 2. Anti-Grind Tangent Fallback with Goal Alignment & Hysteresis

**Choice**: When optical LOS is blocked and A* returns an empty path, rather than steering toward `fallbackGoal` through the wall, identify the obstacle contact normal $\hat{n}$ and deflect velocity along the tangent $\hat{t} \in \{(-n_y, n_x), (n_y, -n_x)\}$ that aligns with the target direction ($\vec{d}_{\text{goal}} \cdot \hat{t} > 0$).

**Hysteresis**:
- Retain the active tangent direction $\hat{t}_{\text{active}}$ across frames.
- Switch to the opposing tangent only if the alternative tangent score exceeds the current score by a margin ($\vec{d}_{\text{goal}} \cdot \hat{t}_{\text{alt}} > \vec{d}_{\text{goal}} \cdot \hat{t}_{\text{curr}} + 0.25$) or if the active tangent direction is obstructed ahead by an obstacle boundary.
- Enforce a minimum direction lock of 8 ticks before allowing polarity reversal to eliminate 60 Hz corner chatter.

**Rationale**:
When an enemy is pressed against a barrier, the vector to the player points directly into the wall. Collision resolution zeroes out normal velocity, leaving the unit motionless. Steering along the goal-aligned tangent causes the unit to slide along the obstacle boundary toward the open corner, re-establishing line-of-sight or reaching a walkable cell.

### 3. Intentional-Stop-Aware Movement Watchdog

**Choice**: Implement a displacement watchdog in `DirectAdvanceBehavior` (and `KiterBehavior`) that increments a stall counter when:
$$\|\vec{v}_{\text{desired}}\| > 10^{-3} \quad \text{AND} \quad \|\vec{p}_t - \vec{p}_{t-12}\| < 1.5\text{px}$$
If the counter reaches 12 ticks ($0.2\text{s}$):
- Reset `repathCooldownTicks = 0` to force an immediate A* path search.
- Trigger an emergency lateral tangent breakout nudge.

**Zero-Reset on Intentional Stops**:
The stall counter immediately resets to 0 whenever the unit is intentionally motionless:
1. Weapon fire recoil stutter (`stutterTimerTicks > 0`)
2. Laser sightline charge (`isChargingLaser === true`)
3. Cataclysm Overload channel (`isOverloading === true`)
4. Arrival at target (`dist <= radius + target.radius + 2`)
5. Corridor queuing (lead unit sensing clamps velocity to 0)
6. Kiter distance holding (`dist >= minDist && dist <= maxDist` with LOS)

**Rationale**:
This provides an active runtime failsafe against unexpected deadlocks (such as multi-unit dynamic crowding or player shoves) while strictly avoiding false-positive triggers during legitimate combat pauses.

### 4. Swept-Circle Shortcut Gating

**Choice**: Ensure all waypoint-to-waypoint chords, lookahead shortcuts, and transitions from pathfinding to direct vector steering are gated by `hasNavigationClearance(from, to, ctx.radius, obstacles)`.

**Rationale**:
Because cell-center containment permits cell perimeters to touch obstacle boundaries, straight-line chords between non-adjacent waypoints could clip convex corners. Minkowski swept-circle raycasting at the unit's true radius guarantees units never take shortcuts through obstacle edges.

### 5. Two-Tier Verification Suite in `All21MapsValidation.test.ts`

**Choice**: Structure map validation into two complementary test suites:
1. **Static Graph Reachability Check**: Instantiates a $20\text{px}$ pathfinder with cell-center containment for every enemy in all 21 rooms at true blueprint radii, asserting an unbroken path exists to player spawn without running simulation ticks (runs in $\approx 10\text{ms}$).
2. **300-Tick Dynamic Locomotion Test**: Steps 60 Hz physics across all 21 rooms with moving player scenarios, verifying units actively traverse geometry with 0 freeze deadlocks.

## Risks / Trade-offs

- **[Higher grid cell count (384 $\to$ 1,536 cells)]** $\to$ *Mitigation*: 1.5 KB memory allocation per pathfinder instance. The entire 21-map static connectivity test runs in 11ms, and Vitest test suite runtime remains under 900ms.
- **[Corner chatter during tangent sliding]** $\to$ *Mitigation*: Directional hysteresis threshold (0.25 margin) and minimum tick hold prevent rapid polarity flips.
- **[Waypoint shortcut corner clipping]** $\to$ *Mitigation*: `hasNavigationClearance` performs continuous swept-circle Minkowski raycasting at true physical radius.
