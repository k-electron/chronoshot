# Spec: Time Engine

## Purpose

Governs global time dilation in ChronoShot, scaling simulation speed dynamically between idle micro-creep and full velocity based on player movement while executing discrete tick bursts for combat actions.

## Requirements

### Requirement: Baseline Micro-Creep Time Progression
The simulation SHALL maintain a minimal time progression rate (default 5% speed) when the player is stationary so that in-flight projectiles and entities creep forward continuously.

#### Scenario: Player stationary in arena
- **WHEN** the player issues no movement inputs and takes no combat actions
- **THEN** simulation time progresses at the baseline micro-creep rate (5% speed)

### Requirement: Movement-Driven Time Scale Ramping
The simulation SHALL scale time dynamically between the baseline rate and 100% real-time speed proportional to the player's movement velocity, smoothly accelerating as keys are held and decelerating when released.

#### Scenario: Player moves with directional keys
- **WHEN** the player presses and holds WASD keys to move
- **THEN** the time scale ramps smoothly up to 100% as the player reaches maximum movement speed

#### Scenario: Player releases directional keys
- **WHEN** the player releases active movement keys
- **THEN** the player decelerates and the time scale ramps smoothly back down to the 5% baseline rate

### Requirement: Action Tick Bursts for Combat Actions
The simulation SHALL immediately advance a discrete burst of simulation ticks whenever the player fires a weapon or initiates a reload, regardless of movement status.

#### Scenario: Player fires weapon
- **WHEN** the player discharges the equipped weapon
- **THEN** the simulation advances by a fixed burst of simulation ticks (simulating firearm discharge duration)

#### Scenario: Player initiates reload
- **WHEN** the player executes a reload command
- **THEN** the simulation advances by a larger discrete block of simulation ticks, advancing all active enemy bullets and entities while the reload completes
