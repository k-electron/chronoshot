# Spec: Roguelike Upgrades

## Purpose

Defines the roguelike tactical augmentation system, immediate post-boss freeze-frame draft selection, and persistent combat stat modifiers for the player across rooms.

## Requirements

### Requirement: Post-Boss Upgrade Draft Selection
The combat arena SHALL freeze simulation ticks immediately upon the destruction of a milestone boss and present an interactive in-canvas card draft offering three distinct tactical upgrade archetypes.

#### Scenario: Boss destroyed triggers freeze-frame draft
- **WHEN** the milestone boss unit is destroyed
- **THEN** simulation ticks freeze immediately, combat input is suspended, and a 3-card augmentation selection overlay is displayed

#### Scenario: Selecting an upgrade via keyboard or mouse
- **WHEN** the player presses keys 1, 2, or 3 or clicks an upgrade card
- **THEN** the selected augmentation is installed on the player entity, an audio synthesis confirmation cue is triggered, and the arena transitions to the subsequent room

### Requirement: Tactical Augmentation Modifiers
The combat system SHALL support distinct combat augmentations modifying ammunition capacity, reload duration, and player shield defenses.

#### Scenario: Extended Cylinder augmentation active
- **WHEN** the Extended Cylinder upgrade is active
- **THEN** the player revolver capacity increases from 6 to 8 chambers, and the cylinder HUD dial renders 8 radial pips

#### Scenario: Speed Loader augmentation active
- **WHEN** the Speed Loader upgrade is active
- **THEN** executing a reload queues 15 simulation ticks onto the TimeGovernor instead of 30 ticks

#### Scenario: Reactive Shield augmentation active
- **WHEN** the Reactive Shield upgrade is active
- **THEN** the player entity starts each room with 1 energy shield charge capable of absorbing one lethal projectile impact

### Requirement: Persistent Run Modifiers and Reset
Active tactical augmentations SHALL persist across room transitions within the current run and reset completely upon run defeat.

#### Scenario: Transitioning across rooms with active upgrade
- **WHEN** the player advances from one room to the next
- **THEN** the installed augmentation remains active with full functionality

#### Scenario: Run reset upon player defeat
- **WHEN** the player is defeated and initiates a run restart
- **THEN** all installed augmentations are cleared and the player resets to baseline parameters in Room 1

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

### Requirement: Overcharge Dash Tactical Locomotion Augmentation
The combat system SHALL support the Overcharge Dash tactical locomotion augmentation, providing key-activated kinetic burst translation, simulation tick queuing, projectile deflection frames, and cooldown tracking.

#### Scenario: Activating overcharge dash with key input
- **WHEN** the player has installed the Overcharge Dash augmentation and presses Space or Shift while off cooldown
- **THEN** the player executes an instantaneous burst impulse translating at high velocity (480 px/s) along the current movement direction or facing angle, leaving radiant afterimage ghost particles

#### Scenario: Overcharge dash action burst queuing on TimeGovernor
- **WHEN** Overcharge Dash is triggered
- **THEN** exactly 12 simulation ticks are queued onto the TimeGovernor as a discrete action burst

#### Scenario: Overcharge dash cooldown and HUD feedback
- **WHEN** Overcharge Dash is activated
- **THEN** a 90-tick cooldown is initiated, preventing re-triggering until the timer elapses, with the cooldown state rendered via HUD telemetry

#### Scenario: Phase deflection and damage immunity during dash
- **WHEN** an incoming hostile projectile strikes the player during active Overcharge Dash translation frames
- **THEN** the projectile is deflected or phased through without inflicting damage or consuming shield charges

