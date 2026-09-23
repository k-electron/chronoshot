# Spec Delta

## MODIFIED Requirements

### Requirement: Enemy Pathing and Intelligent Navigation
The combat arena SHALL navigate mobile enemy units through obstacle geometry using a 40px grid A* pathfinding algorithm when line-of-sight or physical navigation clearance to the player is obstructed, and transition to direct vector pursuit only when both unobstructed optical sightline and physical chassis clearance are established.

#### Scenario: Enemy paths around cover when line-of-sight is blocked
- **WHEN** an enemy detects that obstacles block direct line-of-sight to the player
- **THEN** the enemy calculates a waypoint path across walkable 40px grid cells and traverses toward the player position around intervening walls and pillars

#### Scenario: Enemy switches to direct vector steering upon acquiring line-of-sight
- **WHEN** an enemy establishes both an unobstructed optical sightline and physical chassis navigation clearance to the player
- **THEN** the enemy bypasses grid waypoint steps and steers smoothly along the direct vector according to its behavioral archetype (closing distance for rushers, maintaining distance for kiters)

#### Scenario: Unit radius obstacle clearance
- **WHEN** an enemy navigates near obstacle corners or begins pathfinding from an impassable boundary cell
- **THEN** pathfinding enforces entity radius clearance to prevent units from penetrating or clipping into obstacle boundaries, and snaps impassable start or target endpoints to the nearest walkable grid cell to prevent deadlock
