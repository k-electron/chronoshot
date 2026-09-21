# Spec Delta: Weapon System

## Purpose

Provides a configurable weapon architecture supporting modular firearm configurations, raycast ballistics, magazine capacity tracking, and an interactive revolver cylinder HUD.

## ADDED Requirements

### Requirement: Modular Weapon Configuration Schema
The weapon system SHALL define firearms using a structured configuration specifying magazine capacity, firing tick burst, reload tick burst, cooldown intervals, projectile velocity, and projectile spread.

#### Scenario: Registering a weapon configuration
- **WHEN** a weapon profile is loaded into the weapon system
- **THEN** weapon actions (firing, reloading, cooldowns) execute according to the defined parameters

### Requirement: 6-Round Revolver Mechanics
The system SHALL provide a default revolver weapon profile configured with a 6-round capacity, single-pellet precision firing, and cooldown between consecutive shots.

#### Scenario: Firing revolver with loaded rounds
- **WHEN** the player issues a fire command and the revolver has at least 1 chambered round
- **THEN** one projectile is discharged toward the aim target, ammunition decrements by 1, and the fire cooldown is triggered

#### Scenario: Firing revolver with empty cylinder
- **WHEN** the player issues a fire command when remaining rounds is 0
- **THEN** no projectile is discharged and a reload reminder or dry-fire indicator is triggered

### Requirement: Reload Cycle and Cylinder HUD Display
The system SHALL support reloading back to full capacity and render a real-time cylinder HUD showing loaded and spent chambers.

#### Scenario: Reloading the revolver
- **WHEN** the player triggers reload via the reload key
- **THEN** the cylinder ammunition refills to 6 rounds and the reload time cost is applied to the time engine

#### Scenario: Visualizing chamber states
- **WHEN** the HUD renders the current weapon state
- **THEN** the revolver cylinder visually reflects all available and expended bullet chambers
