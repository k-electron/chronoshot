# Spec Delta

## ADDED Requirements

### Requirement: Vektor-Prime Step-Function Milestone Boss Encounter
The combat system SHALL support the Vektor-Prime Phase Sovereign milestone boss encounter featuring a 3-phase modular state machine with escalating shield durability, high-speed standoff laser and buckshot kiting, mid-battle escort reinforcement transitions, and 16-pellet rotating radial nova overdrive.

#### Scenario: Fortress Aegis shield defense in phase one
- **WHEN** Vektor-Prime engages the player in phase one with active shields
- **THEN** it advances at 50 px/s with 5 shield charges, discharging pinpoint heavy slugs (cadence 50 ticks, speed 550 px/s) supported by two Grunt escorts

#### Scenario: Transition to Phase Warp with reinforcement summon
- **WHEN** Vektor-Prime's initial 5 shield charges are depleted
- **THEN** it transitions to phase two, emitting a radial violet particle shockwave, triggering a shield break audio cue, and spawning one Shotgun Guard and one Stalker escort reinforcement

#### Scenario: Standoff laser and buckshot kiting in phase two
- **WHEN** Vektor-Prime engages the player in phase two
- **THEN** it maintains standoff distance between 280 and 460 pixels at 85 px/s with 3 shield charges, alternating 25-tick telegraphed laser charging beams with 3-pellet fan spread buckshot discharges

#### Scenario: Transition to Singularity Nova Overdrive with escort rush
- **WHEN** Vektor-Prime's secondary 3 shield charges are depleted
- **THEN** it transitions to phase three, emitting a high-density radial crimson shockwave, triggering an overdrive audio cue, and summoning two high-speed Stalker reinforcements

#### Scenario: Singularity Nova 16-pellet bullet hell in phase three
- **WHEN** Vektor-Prime enters phase three with an exposed core
- **THEN** it relentlessly advances toward the player at 115 px/s with zero shields, discharging 16-pellet 360-degree radial novae with rotational angular offsets at 65-tick cadence
