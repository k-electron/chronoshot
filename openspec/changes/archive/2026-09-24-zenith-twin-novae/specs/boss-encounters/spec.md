# Spec Delta: Boss Encounters

## MODIFIED Requirements

### Requirement: Chrono-Zenith Zero Sovereign Milestone Final Boss
The boss combat system SHALL support the Chrono-Zenith Zero Sovereign milestone final boss encounter for Room 20, featuring a 4-phase state machine with escalating offensive armaments, telegraphed Cataclysm Overload transitions, active speed acceleration across phases, and high-velocity core pursuit, with transition escort minions spawned as active combat entities.

#### Scenario: Citadel Bastion defense in phase one
- **WHEN** Chrono-Zenith engages the player in phase one
- **THEN** it advances at 45 px/s with 5 shield charges, firing heavy pinpoint slugs and 3-pellet fan spreads supported by two Grunt escorts

#### Scenario: Cataclysm transition to Temporal Warp in phase two
- **WHEN** Chrono-Zenith's initial 5 shield charges are depleted
- **THEN** it executes a 75-tick Cataclysm Overload channel, materializes one Shotgun Guard and one Stalker escort as active combat units upon detonation, and transitions to phase two with 3 shield charges, accelerating to 95 px/s kiting movement and charging 25-tick telegraphed sniper laser beams

#### Scenario: Cataclysm transition to Singularity Tempest in phase three
- **WHEN** Chrono-Zenith's secondary 3 shield charges are depleted
- **THEN** it executes a 65-tick Cataclysm Overload channel, detonates the shockwave, materializes one Warden escort as an active combat unit, and transitions to phase three with 2 shield charges, accelerating to 105 px/s while discharging twin counter-rotating 12-pellet radial novae (24 projectiles per volley at 60-tick cadence, rotating in opposite directions with interleaved angular offsets)

#### Scenario: Cataclysm transition to Zero-Point Overdrive in phase four
- **WHEN** Chrono-Zenith's remaining 2 shield charges are depleted
- **THEN** it executes a 60-tick Cataclysm Overload channel, detonates the shockwave, and transitions to phase four with an exposed 0-shield core, pursuing the player at 125 px/s while discharging continuous rotating 16-pellet radial novae

#### Scenario: Destruction of Chrono-Zenith core
- **WHEN** a player projectile strikes Chrono-Zenith's exposed core in phase four
- **THEN** the boss is eliminated with a radiant geometric particle supernova, triggers victory audio fanfare, and unlocks the golden exit portal
