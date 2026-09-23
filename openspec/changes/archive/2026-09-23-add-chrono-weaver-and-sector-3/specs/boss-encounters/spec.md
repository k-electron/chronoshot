# Spec Delta: Boss Encounters

## ADDED Requirements

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
