# Spec: Boss Encounters

## Purpose

Defines high-threat boss combat units, multi-layer shield mechanics, phase-shifting behaviors, and dedicated in-canvas boss telemetry for milestone encounters.

## Requirements

### Requirement: Boss Unit Entities and Multi-Phase Combat
The combat arena SHALL support boss entities with enlarged hitboxes, multi-layer hit absorption shields, signature heavy weaponry, and combat phase transitions triggered by shield depletion.

#### Scenario: Boss absorbs projectile damage with multi-layer shields
- **WHEN** a player projectile strikes a boss unit possessing multiple shield charges
- **THEN** exactly one shield charge is consumed, radiant deflection sparks are emitted, and the remaining shield count decrements without damaging the core

#### Scenario: Boss phase transition upon final shield break
- **WHEN** the last remaining shield of a boss unit is broken
- **THEN** the boss transitions to an enraged secondary phase with increased movement velocity, modified discharge fire patterns, and a lethal exposed core

#### Scenario: Boss lethal destruction
- **WHEN** a player projectile strikes an unshielded boss core
- **THEN** the boss unit is eliminated, emits high-density geometric shatter particles, and triggers immediate encounter victory

### Requirement: Boss Telemetry HUD
The combat arena SHALL render real-time boss telemetry anchored at top-center during boss encounters, displaying the boss designation and visual shield charge pips.

#### Scenario: Rendering active boss telemetry
- **WHEN** a room containing an active boss entity is rendered
- **THEN** an in-canvas telemetry bar displays the boss codename and remaining shield pips in high-contrast cyan/crimson styling

#### Scenario: Telemetry dismiss upon boss elimination
- **WHEN** the boss entity is eliminated
- **THEN** the boss telemetry bar is dismissed or transitions to a neutralized state

### Requirement: Modular Boss Phase State Machine
The boss combat system SHALL support configuring boss units with arbitrary multi-phase state sequences, where each phase defines distinct movement behaviors, attack patterns, hit-count shield durability, and transition triggers.

#### Scenario: Transitioning across configured boss phases
- **WHEN** a boss unit satisfies the transition condition of its current phase (e.g. shield depletion, health loss, or tick timer)
- **THEN** the boss unit transitions to the subsequent phase, updating its active movement behavior, attack behavior, and shield threshold while emitting transition effects

#### Scenario: Triggering phase transition shockwave actions
- **WHEN** a boss transitions from one phase to another
- **THEN** configured transition actions execute, including particle shockwave bursts, audio cue triggers, and dynamic escort minion spawns

### Requirement: Radial Bullet-Hell Nova Barrage
The boss combat system SHALL support omnidirectional radial nova attacks discharging multiple projectiles simultaneously in an expanding 360-degree ring pattern during high-intensity combat phases.

#### Scenario: Discharging radial nova projectile ring
- **WHEN** an attack behavior configured with radial nova discharges
- **THEN** an evenly distributed angular ring of hostile projectiles radiates outward from the boss unit's perimeter

### Requirement: Phase-Aware Dynamic Telemetry HUD
The boss telemetry HUD SHALL render real-time boss phase indicators, phase designations, and tiered shield pips synchronized with the active boss phase controller.

#### Scenario: Synchronizing telemetry with active boss phase
- **WHEN** an active boss entity updates its phase
- **THEN** the in-canvas top-center telemetry bar updates its phase title and shield pip displays to reflect the newly active phase parameters

### Requirement: Chrono-Weaver Standoff Boss Encounter
The boss combat system SHALL support the Chrono-Weaver milestone boss encounter combining standoff laser kiting, dynamic escort minion reinforcement upon shield break, and high-intensity radial nova overdrive.

#### Scenario: Telegraphed standoff kiting in phase one
- **WHEN** Chrono-Weaver engages the player in phase one with active shields
- **THEN** it maintains standoff distance between 300 and 480 pixels using kiting movement while charging precision high-velocity telegraphed laser beams

#### Scenario: Reinforcement summon on phase transition
- **WHEN** Chrono-Weaver's shields are fully depleted
- **THEN** it triggers a transition action spawning high-speed Stalker escort reinforcements while emitting a radial particle shockwave

#### Scenario: Omnidirectional radial nova overdrive in phase two
- **WHEN** Chrono-Weaver enters phase two with an exposed core
- **THEN** it actively advances toward the player discharging 12-pellet 360-degree radial novae with rotational angular offsets

