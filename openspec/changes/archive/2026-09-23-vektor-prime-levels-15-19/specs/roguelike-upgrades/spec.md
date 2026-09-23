# Spec Delta

## ADDED Requirements

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
