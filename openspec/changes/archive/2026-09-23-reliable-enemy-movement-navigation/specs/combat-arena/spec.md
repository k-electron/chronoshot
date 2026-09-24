# Spec Delta: Combat Arena

## MODIFIED Requirements

### Requirement: Enemy Pathing and Intelligent Navigation
The combat arena SHALL navigate mobile enemy units through obstacle geometry using a 40px grid A* pathfinding algorithm when line-of-sight or physical navigation clearance to the player is obstructed, evaluate physical navigation clearance with respect to surface contact normals to allow departure from obstacle bounds, apply anti-freeze fallback locomotion when pathfinding returns no waypoints, and transition to direct vector pursuit only when both unobstructed optical sightline and physical chassis clearance are established.

#### Scenario: Enemy paths around cover when line-of-sight is blocked
- **WHEN** an enemy detects that obstacles block direct line-of-sight to the player
- **THEN** the enemy calculates a waypoint path across walkable 40px grid cells and traverses toward the player position around intervening walls and pillars

#### Scenario: Enemy switches to direct vector steering upon acquiring line-of-sight
- **WHEN** an enemy establishes both an unobstructed optical sightline and physical chassis navigation clearance to the player
- **THEN** the enemy bypasses grid waypoint steps and steers smoothly along the direct vector according to its behavioral archetype (closing distance for rushers, maintaining distance for kiters)

#### Scenario: Unit radius obstacle clearance
- **WHEN** an enemy navigates near obstacle corners or begins pathfinding from an impassable boundary cell
- **THEN** pathfinding enforces entity radius clearance to prevent units from penetrating or clipping into obstacle boundaries, and snaps impassable start or target endpoints to the nearest walkable grid cell to prevent deadlock

#### Scenario: Directional surface contact clearance
- **WHEN** an enemy evaluates physical navigation clearance while in physical contact with an obstacle boundary
- **THEN** clearance is evaluated relative to the contact normal such that movement directed away from or parallel to the surface ($\vec{dir} \cdot \hat{n} \ge -0.05$) is permitted without false-positive clearance failure

#### Scenario: Anti-freeze fallback on empty path
- **WHEN** an enemy has clear optical line-of-sight to the player but grid pathfinding yields an empty path
- **THEN** the enemy does not halt at zero velocity but falls back to direct vector steering toward the target, relying on continuous obstacle collision resolution to slide along intervening obstacles

#### Scenario: Corner vertex deflection
- **WHEN** an advancing combat unit collides head-on with an obstacle corner vertex where velocity opposes the diagonal vertex normal
- **THEN** collision resolution deflects velocity along the dominant adjacent face tangent rather than canceling velocity to zero, preventing corner-pinning deadlocks

#### Scenario: Kiter lateral wall escape
- **WHEN** a distance-keeping hostile's direct backwards retreat is obstructed by an obstacle boundary
- **THEN** the unit evaluates lateral wall tangents to slide along the obstacle rather than freezing at zero velocity
