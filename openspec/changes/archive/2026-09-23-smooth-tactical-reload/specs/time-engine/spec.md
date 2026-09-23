# Spec Delta

## MODIFIED Requirements

### Requirement: Action Tick Bursts for Combat Actions
The simulation SHALL advance discrete simulation ticks for combat actions, executing immediate discrete tick bursts for weapon discharge and running a continuous real-time (1.00x) simulation channel during active weapon reloads.

#### Scenario: Player fires weapon
- **WHEN** the player discharges the equipped weapon
- **THEN** the simulation advances by a fixed burst of simulation ticks (simulating firearm discharge duration)

#### Scenario: Player initiates reload
- **WHEN** the player executes a reload command
- **THEN** the simulation enforces a real-time (1.00x) simulation rate across the duration of the reload rather than executing an instantaneous single-frame tick jump, advancing all active enemy bullets and entities smoothly across multiple rendering frames while the reload progresses
