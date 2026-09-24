# Spec Delta: Procedural Levels

## MODIFIED Requirements

### Requirement: Composable Cover and Geometry Layout Templates
The level generation system SHALL provide modular layout templates defining geometric obstacle arrangements (perimeter barriers, tactical cover pillars, bunker enclosures, flank corridors) alongside verified player spawn coordinates, exit portal anchors, and safe enemy spawn regions, ensuring all transit corridors maintain passable physical clearance and enemy spawn coordinates reside in open space.

#### Scenario: Instantiating a geometry layout template
- **WHEN** a room layout template is requested for room generation
- **THEN** it generates a set of perimeter walls and interior obstacle bounds with non-overlapping clearance zones for combat units and navigable transit corridors maintaining at least 48 pixels of clearance between adjacent obstacles

#### Scenario: Validating spawn separation distance
- **WHEN** enemy spawn regions and player spawn positions are evaluated in a template
- **THEN** the layout ensures a minimum Euclidean distance of 280 pixels between player spawn and any enemy spawn region to prevent immediate spawn-kill crossfires

#### Scenario: Safe hostile spawn positioning in fixed rooms
- **WHEN** fixed campaign rooms (Rooms 1 through 20) and Endless Mode initialize enemy positions
- **THEN** every initial enemy spawn point is strictly positioned outside all obstacle hitboxes with verified clearance, ensuring no combat unit materializes inside solid geometry
