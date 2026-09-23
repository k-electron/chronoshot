# Spec Delta: Boss Encounters

## ADDED Requirements

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
