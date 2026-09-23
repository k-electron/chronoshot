# Spec: Roguelike Upgrades

## Purpose

Defines the roguelike tactical augmentation system, immediate post-boss freeze-frame draft selection, and persistent combat stat modifiers for the player across rooms.

## ADDED Requirements

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
