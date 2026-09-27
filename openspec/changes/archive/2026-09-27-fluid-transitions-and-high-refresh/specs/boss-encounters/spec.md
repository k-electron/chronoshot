# Spec Delta

## ADDED Requirements

### Requirement: Boss Defeat Continuous Slow-Motion Decay and Ballistic Peril
When a milestone boss entity's final health/shield layer is depleted, the combat arena SHALL enter an active slow-motion disintegration sequence (~400–600ms wall time) rather than instantly freezing the simulation or immediately opening reward menus. During this slow-motion collapse, all in-flight boss projectiles and active hazards SHALL remain live, simulating, and lethal to the player, enforcing continuous ballistic evasion. If the player survives the slow-motion aftermath until the boss shatter fully clears, the combat arena SHALL then smoothly transition to the Upgrade Draft HUD (Rooms 5, 10, 15) or Campaign Victory HUD (Room 20). If a lingering projectile strikes the player during the collapse, standard damage, shield deflection, and player elimination rules SHALL apply.

#### Scenario: Active ballistic simulation during boss disintegration
- **WHEN** a milestone boss suffers lethal elimination while hostile projectiles remain in flight
- **THEN** the combat arena initiates a continuous slow-motion collapse, procedural shatter debris expands from the boss hull, and all in-flight projectiles continue moving and resolving collision checks against the player

#### Scenario: Player eliminated by lingering boss fire during defeat decay
- **WHEN** an in-flight boss projectile strikes the player during the boss defeat slow-motion sequence with 0 shields remaining
- **THEN** the player is eliminated, the arena aborts reward presentation, and transitions to the defeat state

#### Scenario: Smooth transition to reward presentation after ballistic clearing
- **WHEN** the slow-motion collapse completes and the player has survived all active projectile hazards
- **THEN** the combat arena smoothly brings up the Upgrade Draft HUD (for intermediate bosses) or Campaign Victory HUD (for final boss) over living, drifting background debris

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
- **THEN** the boss begins an active slow-motion supernova collapse with living projectile ballistics, triggers victory audio fanfare, suppresses intermediate upgrade drafts, and smoothly transitions to the campaign victory sequence upon completion of the collapse
