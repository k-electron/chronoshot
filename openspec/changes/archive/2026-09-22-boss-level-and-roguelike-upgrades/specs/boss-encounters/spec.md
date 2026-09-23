# Spec: Boss Encounters

## Purpose

Defines high-threat boss combat units, multi-layer shield mechanics, phase-shifting behaviors, and dedicated in-canvas boss telemetry for milestone encounters.

## ADDED Requirements

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
