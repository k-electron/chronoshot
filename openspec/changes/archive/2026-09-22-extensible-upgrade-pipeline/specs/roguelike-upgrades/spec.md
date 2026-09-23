# Spec Delta: Roguelike Upgrades

## ADDED Requirements

### Requirement: Data-Driven Upgrade Definitions and Registry
The tactical upgrade system SHALL support registering modular upgrade definitions with unique identifiers, visual display metadata (name, archetype, description, stat highlights, accent colors, rarity tiers), stat modifier configurations, and lifecycle hooks (`onAcquire`, `onRoomStart`, `onTick`, `onDischarge`).

#### Scenario: Registering and retrieving custom upgrade definitions
- **WHEN** an upgrade definition is registered with the upgrade registry
- **THEN** it is indexed by its unique identifier and becomes available for draft selection and direct player acquisition

#### Scenario: Sampling dynamic draft pools from registry
- **WHEN** a draft pool is requested for a milestone reward
- **THEN** the registry draws a specified count of distinct available upgrade definitions excluding exhausted or non-stackable active player upgrades

### Requirement: Extensible Player Upgrade Pipeline
The player combat system SHALL manage active tactical augmentations through an extensible upgrade pipeline that aggregates continuous combat stat modifiers (cylinder capacity, reload duration, shield buffers, movement speed, projectile speed) and dispatches lifecycle events across rooms.

#### Scenario: Aggregating multiple active upgrade modifiers
- **WHEN** multiple augmentations providing stat modifiers are installed on the player
- **THEN** the player entity calculates net effective attributes (revolver chamber capacity, reload tick duration, shield charges, speed) by compounding base attributes with active modifiers

#### Scenario: Executing upgrade lifecycle callbacks on room transitions
- **WHEN** the player enters a new combat room
- **THEN** the upgrade pipeline dispatches room-start lifecycle events to all installed augmentations, refreshing replenishable buffers such as reactive shields

### Requirement: Decoupled Dynamic Draft Card UI
The combat arena SHALL render the tactical card draft overlay dynamically from any sampled array of upgrade definitions, presenting visual archetype headers, key prompts, stat highlights, and responsive hit-testing for mouse selection.

#### Scenario: Dynamically rendering sampled draft cards
- **WHEN** an upgrade draft overlay is rendered with $N$ active draft options
- **THEN** the in-canvas overlay dynamically distributes $N$ cards evenly across the viewport with distinct accent colors, key badges, and stat highlight boxes

#### Scenario: Selecting a draft card via mouse click hit-testing
- **WHEN** the player clicks within the rectangular bounding box of a rendered draft card
- **THEN** the corresponding upgrade option is identified, installed on the player entity, and the arena transitions to the subsequent room
