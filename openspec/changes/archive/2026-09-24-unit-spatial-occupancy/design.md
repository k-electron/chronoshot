# Design

## Context

ChronoShot's simulation coordinates entities in `Arena.fixedUpdate` using a discrete 60 Hz fixed timestep. Currently, player and hostile movement routines resolve collisions solely against static AABB obstacles (`Obstacle`). Units are treated as phantom point-masses with respect to each other, allowing multiple enemies and the player to occupy the exact same physical coordinates. (See `proposal.md` for motivation).

```
+-----------------------------------------------------------------------------+
|                     CURRENT SIMULATION TICK PIPELINE                        |
+-----------------------------------------------------------------------------+
|                                                                             |
| 1. player.update(...)             --> Resolves obstacles only               |
| 2. enemy.update(...)              --> Resolves obstacles only               |
| 3. bullet.update(...)             --> CCD raycasts against obstacles & units|
| 4. particles.update(...)                                                    |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## Goals / Non-Goals

**Goals:**
- Enforce circular spatial occupancy for all units ($r = 13\text{--}26\text{px}$), strictly maintaining $\|\vec{p}_A - \vec{p}_B\| \ge r_A + r_B$ on every simulation tick.
- Resolve inter-unit contact smoothly via non-lethal, inelastic sliding (zero melee contact damage).
- Give Overcharge Dash kinetic shove authority over standard hostiles while smoothly deflecting around immovable milestone bosses.
- Equip hostile steering with surface-distance arrival, quadratic separation flocking, and single-file corridor queueing to prevent conga lines and movement jitter.
- Guarantee collision-free dynamic spawning for boss escort reinforcements and Endless Mode waves.
- Maintain zero garbage allocation in the 60 Hz simulation loop and preserve sub-millisecond test suite execution.

**Non-Goals:**
- Implementing a heavyweight general-purpose 2D physics engine (Box2D, Matter.js).
- Adding melee attack behaviors or contact damage hazards.
- RVO/ORCA velocity-space linear programming (unnecessary and fragile in tight obstacle grids).
- Modifying weapon ballistics, cylinder mechanics, or time dilation curves.

## Decisions

### 1. Multi-Pass Positional Overlap Relaxation (The Safety Net)
**Decision**: In `Arena.fixedUpdate`, execute a 3-pass relaxation loop after unit position integration:
1. **Unit-Unit Circle Relaxation**: For each pair $(A, B)$ where $d < r_A + r_B$, calculate overlap depth $\Delta = (r_A + r_B) - d$ and normal $\hat{n} = (\vec{p}_A - \vec{p}_B) / d$. Displace positions according to mass weights and project relative velocities along the tangent to cancel inward normal velocity.
2. **Obstacle Collision Resolution**: Immediately resolve each unit against arena `obstacles` via `resolveObstacleCollisions()`.
3. **Perimeter Clamping**: Clamp each unit within arena bounds `[radius, width - radius]` and `[radius, height - radius]`.

```
Iterative Constraint Loop (3 iterations):
+--------------------+        +---------------------+        +--------------------+
|  Unit-Unit Circle  | -----> | Unit-Obstacle AABB  | -----> | Perimeter Boundary |
|  Push-Apart (MTV)  |        | Relaxation (Walls)  |        | Clamping           |
+--------------------+        +---------------------+        +--------------------+
```

*Rationale*: Guarantees zero penetration even under extreme velocities (dash $480\text{px/s}$) and solves the "wall sandwich" problem (a unit pushed against a wall by another unit cannot penetrate the wall; obstacle resolution pushes back, distributing displacement to the pusher).

*Alternatives Considered*:
- *Single-pass solver*: Causes units pushed into walls to clip through obstacle boundaries.
- *Velocity-only avoidance*: Fails when units spawn close or make sudden high-speed turns.

---

### 2. Contact Dynamics and Mass Hierarchy
**Decision**: Physical contact is non-damaging and governed by mass weighting:
- **Regular vs Regular Enemy**: Mass ratio $1 : 1$ ($w_A = 0.5, w_B = 0.5$). Equal displacement and tangent sliding.
- **Milestone Boss**: Infinite mass ($w_{\text{boss}} = 0, w_{\text{other}} = 1.0$). Boss is immovable; other units take $100\%$ displacement.
- **Player Walking vs Regular Enemy**: Mass ratio $1 : 1$ ($w_P = 0.5, w_E = 0.5$). Smooth mutual sliding.
- **Overcharge Dash vs Regular Enemy**: Kinetic shove. Player has dominant momentum ($w_P = 0.1, w_E = 0.9$). Regular enemy is shoved outward along contact normal/tangent; player continues dash without penetrating.
- **Overcharge Dash vs Milestone Boss**: Boss is immovable ($w_{\text{boss}} = 0, w_P = 1.0$). Player dash velocity normal component is canceled; player slides along curved boss hull.

*Rationale*: Aligns with tactical game feel. Bosses feel like monolithic fortresses; dashing feels punchy and impactful; regular units slide naturally around each other like solid cylinders.

---

### 3. Surface-Distance Arrival in DirectAdvanceBehavior
**Decision**: Replace target-center steering with surface arrival distance:
$$d_{\text{arrive}} = r_{\text{self}} + r_{\text{target}} + 2\text{px}$$
If current distance $d \le d_{\text{arrive}}$, forward velocity drops to zero.

*Rationale*: Prevents enemies from driving into the player's center coordinates once in weapon/contact proximity, eliminating continuous forward collision pressure.

---

### 4. Multi-Agent Separation Flocking & Corridor Queueing
**Decision**: In `MovementBehavior.update`, accept an optional array of nearby active hostiles.
- **Open Sightlines (Separation Flocking)**:
  For each neighbor $j$ within $R_{\text{sep}} = 64\text{px}$, compute quadratic repulsion:
  $$\vec{f}_j = \frac{\vec{p}_i - \vec{p}_j}{d_{ij}} \cdot \left(1 - \frac{d_{ij}}{R_{\text{sep}}}\right)^2$$
  Blend $\vec{v}_{\text{desired}} = \vec{v}_{\text{goal}} + w_{\text{sep}} \sum \vec{f}_j$.
  Units naturally fan out into an encircling tactical arc.
- **Constrained Corridors (Queueing Mode)**:
  Probe forward along $\vec{v}_{\text{goal}}$ at distance $2 \times r_{\text{self}}$. If a lead friendly unit is detected and lateral clearance from obstacles is blocked ($< r_{\text{self}} + 4\text{px}$), suppress lateral separation and clamp forward speed to the lead unit's velocity, trailing at standoff distance $(r_i + r_j + 6\text{px})$.

```
Open Sightlines (Flocking)               Constrained Corridor (Queueing)
        ( Player )                                +--------------------+ Wall
         ^      ^                                   --> [B] --> [A] -->
        /        \                                +--------------------+ Wall
     [ A ] <--> [ B ] (Fan out)                   (Lead clamp, no jitter)
```

*Rationale*: Prevents the notorious jitter/deadlock failure mode where separation forces fight against corridor walls.

---

### 5. Safe Spatial Materialization for Dynamic Reinforcements
**Decision**: In `BossTransitionAction.ts`, upgrade `resolveEscortDefinitions` to check spatial clearance against obstacles and active units. If the default relative offset is obstructed, execute a radial candidate probe (stepping outward in $15^\circ$ increments, radius $24\text{--}48\text{px}$) to select the nearest legal, unoccupied arena coordinate before instantiation.

*Rationale*: Eliminates the bug where boss escorts materialize inside pillars, walls, or the operative.

## Risks / Trade-offs

- **[Performance / Allocation]**: Pairwise distance checks in 60 Hz loop.
  *Mitigation*: $N \le 10$ active units in any room. $N(N-1)/2 \le 45$ checks per pass. 3 passes $= 135$ scalar arithmetic operations. Scratch vector pooling ensures zero heap allocation.
- **[Wall Pinning / Oscillation]**: Units squeezed between walls and other units could vibrate.
  *Mitigation*: Multi-pass relaxation combined with normal velocity cancellation ensures velocities into contact normals are zeroed, yielding smooth sliding instead of bouncing.
- **[A* Pathfinding Interaction]**: Does pathfinding need to track moving units as static grid obstacles?
  *Mitigation*: No. High-level A* continues to plan around static walls, while mid-level separation and low-level relaxation handle dynamic units. This avoids expensive grid rebuilds and prevents path thrashing.
