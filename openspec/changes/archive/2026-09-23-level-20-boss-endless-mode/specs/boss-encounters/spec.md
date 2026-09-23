# Spec Delta: Boss Encounters

## ADDED Requirements

### Requirement: Cataclysm Overload Channel and Line-of-Sight Occlusion
The boss combat system SHALL support a telegraphed Cataclysm Overload channeling state upon shield layer depletion, during which the boss entity anchors in place, gains complete invulnerability to projectile damage, and charges a lethal arena-wide shockwave that detonates after a configured tick duration unless occluded by solid obstacle geometry.

#### Scenario: Boss enters overload channel upon shield depletion
- **WHEN** a boss entity configured with Cataclysm Overload suffers a shield break
- **THEN** the boss anchors at its current position, becomes immune to all incoming projectile damage, emits an expanding hazard aura telegraph, and begins counting down a 75-simulation-tick channel timer

#### Scenario: Projectile deflection during overload channel
- **WHEN** a player projectile strikes the boss while its overload channel is actively counting down
- **THEN** the projectile is deflected without inflicting damage or decrementing shields, producing procedural deflection sparks and a metallic audio ping

#### Scenario: Line-of-sight shockwave occlusion behind cover
- **WHEN** the overload channel timer elapses and the Cataclysm shockwave discharges
- **THEN** the combat arena performs raycast line-of-sight collision checks between the boss center and the player hitbox against all arena obstacles; if line-of-sight is obstructed by an obstacle, the player takes 0 damage and deflection sparks emit at the obstacle perimeter

#### Scenario: Lethal shockwave impact in open line-of-sight
- **WHEN** the Cataclysm shockwave discharges while line-of-sight between the boss and player is unobstructed by any obstacle
- **THEN** the player receives lethal damage or consumes exactly one reactive shield charge

#### Scenario: Pre-fired projectile landing post-channel
- **WHEN** a player discharges a projectile during the overload channel that travels across the arena and impacts the boss after the channel timer has expired and the shockwave has detonated
- **THEN** the boss is no longer invulnerable, and the projectile successfully inflicts damage or decrements the subsequent shield layer

### Requirement: Chrono-Zenith Zero Sovereign Milestone Final Boss
The boss combat system SHALL support the Chrono-Zenith Zero Sovereign milestone final boss encounter for Room 20, featuring a 4-phase state machine with escalating offensive armaments, telegraphed Cataclysm Overload transitions, and high-velocity core pursuit.

#### Scenario: Citadel Bastion defense in phase one
- **WHEN** Chrono-Zenith engages the player in phase one
- **THEN** it advances at 45 px/s with 5 shield charges, firing heavy pinpoint slugs and 3-pellet fan spreads supported by two Grunt escorts

#### Scenario: Cataclysm transition to Temporal Warp in phase two
- **WHEN** Chrono-Zenith's initial 5 shield charges are depleted
- **THEN** it executes a 75-tick Cataclysm Overload channel, summons one Shotgun Guard and one Stalker escort upon detonation, and transitions to phase two with 3 shield charges, maintaining 95 px/s kiting movement and charging 25-tick telegraphed sniper laser beams

#### Scenario: Cataclysm transition to Singularity Tempest in phase three
- **WHEN** Chrono-Zenith's secondary 3 shield charges are depleted
- **THEN** it executes a 65-tick Cataclysm Overload channel, detonates the shockwave, and transitions to phase three with 2 shield charges, strafing at 105 px/s while discharging twin counter-rotating 12-pellet radial novae

#### Scenario: Cataclysm transition to Zero-Point Overdrive in phase four
- **WHEN** Chrono-Zenith's remaining 2 shield charges are depleted
- **THEN** it executes a 60-tick Cataclysm Overload channel, detonates the shockwave, and transitions to phase four with an exposed 0-shield core, pursuing the player at 125 px/s while discharging continuous rotating 16-pellet radial novae

#### Scenario: Destruction of Chrono-Zenith core
- **WHEN** a player projectile strikes Chrono-Zenith's exposed core in phase four
- **THEN** the boss is eliminated with a radiant geometric particle supernova, triggers victory audio fanfare, and unlocks the golden exit portal
