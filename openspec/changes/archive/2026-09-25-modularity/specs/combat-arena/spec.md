# Spec Delta

## MODIFIED Requirements

### Requirement: Enemy Pathing and Intelligent Navigation
The combat arena SHALL navigate mobile enemy units through obstacle geometry using a 20px grid A* pathfinding algorithm with cell-center obstacle containment at the unit's true blueprint radius when line-of-sight or physical navigation clearance to the player is obstructed, verify physical swept-circle navigation clearance on all waypoint shortcuts and sightline transitions, evaluate physical navigation clearance with respect to surface contact normals to allow departure from obstacle bounds, apply anti-freeze tangent fallback locomotion with goal alignment and hysteresis when pathfinding returns no waypoints, monitor active locomotion with an intentional-stop-aware stuck watchdog, and transition to direct vector pursuit only when both unobstructed optical sightline and physical chassis clearance are established.

#### Scenario: Enemy paths around cover when line-of-sight is blocked
- **WHEN** an enemy detects that obstacles block direct line-of-sight to the player
- **THEN** the enemy calculates a waypoint path across walkable 20px grid cells at the unit's true blueprint radius and traverses toward the player position around intervening walls and pillars

#### Scenario: Enemy switches to direct vector steering upon acquiring line-of-sight
- **WHEN** an enemy establishes both an unobstructed optical sightline and physical chassis navigation clearance to the player
- **THEN** the enemy bypasses grid waypoint steps and steers smoothly along the direct vector according to its behavioral archetype (closing distance for rushers, maintaining distance for kiters)

#### Scenario: Unit radius obstacle clearance
- **WHEN** an enemy initializes or updates pathfinding grid obstacles
- **THEN** pathfinding enforces entity radius clearance via cell-center containment to prevent units from penetrating or clipping into obstacle boundaries, marking a cell impassable if and only if its cell center falls within the obstacle bounds inflated by the unit's true radius, and snaps impassable start or target endpoints to the nearest walkable grid cell center to prevent deadlocks

#### Scenario: Directional surface contact clearance
- **WHEN** an enemy evaluates physical navigation clearance while in physical contact with an obstacle boundary
- **THEN** clearance is evaluated relative to the contact normal such that movement directed away from or parallel to the surface ($\vec{dir} \cdot \hat{n} \ge -0.05$) is permitted without false-positive clearance failure

#### Scenario: Anti-freeze fallback on empty path
- **WHEN** an enemy has line-of-sight to the player obstructed or clear and grid pathfinding yields an empty path
- **THEN** the enemy does not halt at zero velocity but falls back to goal-aligned obstacle tangent deflection with directional hysteresis when out of sight or direct vector steering when in sight, relying on continuous obstacle collision resolution to slide along intervening obstacles

#### Scenario: Corner vertex deflection
- **WHEN** an advancing combat unit collides head-on with an obstacle corner vertex where velocity opposes the diagonal vertex normal
- **THEN** collision resolution deflects velocity along the dominant adjacent face tangent rather than canceling velocity to zero, preventing corner-pinning deadlocks

#### Scenario: Kiter lateral wall escape
- **WHEN** a distance-keeping hostile's direct backwards retreat is obstructed by an obstacle boundary
- **THEN** the unit evaluates lateral wall tangents to slide along the obstacle rather than freezing at zero velocity

#### Scenario: Swept-circle shortcut verification
- **WHEN** an enemy evaluates waypoint lookahead, chord smoothing, or transitions from grid pathfinding to direct vector steering
- **THEN** the direct path is validated using continuous Minkowski swept-circle raycasting at the unit's true physical radius, ensuring waypoints brushing obstacle perimeters do not cause corner clipping

#### Scenario: Intentional-stop-aware stuck watchdog
- **WHEN** an enemy commands nonzero desired locomotion velocity but fails to achieve spatial displacement (displacement < 1.5px over 12 ticks) while not held by intentional stationary states (fire stutter, laser sightline charging, boss overload channel, arrival radius, corridor queuing, or kiter range holding)
- **THEN** the watchdog identifies a deadlock, forces an immediate A* repath, and executes a tangent breakout slide
