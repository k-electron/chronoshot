# Spec Delta: Procedural Levels

## Purpose

Defines the modular level director, composable room layout geometry templates, threat-budget tactical encounter spawning, and deterministic procedural room generation for dynamic campaigns and endless runs.

## ADDED Requirements

### Requirement: Composable Cover and Geometry Layout Templates
The level generation system SHALL provide modular layout templates defining geometric obstacle arrangements (perimeter barriers, tactical cover pillars, bunker enclosures, flank corridors) alongside verified player spawn coordinates, exit portal anchors, and safe enemy spawn regions.

#### Scenario: Instantiating a geometry layout template
- **WHEN** a room layout template is requested for room generation
- **THEN** it generates a set of perimeter walls and interior obstacle bounds with non-overlapping clearance zones for combat units and navigable lanes

#### Scenario: Validating spawn separation distance
- **WHEN** enemy spawn regions and player spawn positions are evaluated in a template
- **THEN** the layout ensures a minimum Euclidean distance of 280 pixels between player spawn and any enemy spawn region to prevent immediate spawn-kill crossfires

### Requirement: Threat-Budget Tactical Encounter Generation
The level generation system SHALL synthesize enemy encounters by allocating an escalating numerical threat budget across available hostile archetypes, enforcing tactical composition constraints and role diversity.

#### Scenario: Allocating threat budget across archetypes
- **WHEN** an encounter is generated for a specified room difficulty tier and threat budget
- **THEN** enemy units are selected from available archetypes (Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper) whose combined threat costs do not exceed the allocated budget

#### Scenario: Enforcing sniper composition cap
- **WHEN** an encounter generates long-range Marksman Sniper units
- **THEN** the encounter spawner limits Marksman units to a maximum of 2 per room and requires at least one mobile frontline escort unit (Grunt, Guard, or Rusher) to prevent static sniper cheese

#### Scenario: Spacing enemy initial positions
- **WHEN** enemy positions are placed within designated spawn zones
- **THEN** units are separated by at least 48 pixels from each other and placed outside obstacle collision bounds

### Requirement: Deterministic Seeded Room Generation
The level generation system SHALL support deterministic generation of complete room configurations from a numeric or string seed using a seedable pseudo-random number generator (PRNG).

#### Scenario: Reproducible generation from identical seed
- **WHEN** two rooms are generated using the same seed, difficulty tier, and template pool
- **THEN** both rooms produce identical obstacle placements, enemy archetypes, enemy coordinates, and exit portal positions

#### Scenario: Distinct variation across different seeds
- **WHEN** rooms are generated using distinct seeds
- **THEN** the director selects varying layout templates and squad configurations appropriate for the requested difficulty tier

### Requirement: Dynamic RoomManager Integration and Endless Mode
The combat progression system SHALL support supplying dynamic room generators to the room manager, enabling continuous room generation upon portal entry.

#### Scenario: Generating next room on demand
- **WHEN** the player enters an exit portal in endless progression mode
- **THEN** the room manager invokes the level director to generate the subsequent room with escalated threat budget and loads it seamlessly into the combat arena

#### Scenario: Preserving standard campaign sequence
- **WHEN** room manager is initialized without a dynamic director
- **THEN** the manager defaults to the classic 9-room campaign sequence with zero behavioral regression
