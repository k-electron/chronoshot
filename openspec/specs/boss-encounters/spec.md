# Spec: Boss Encounters

## Purpose

Defines high-threat boss combat units, multi-layer shield mechanics, phase-shifting behaviors, and dedicated in-canvas boss telemetry for milestone encounters.

## Requirements

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

### Requirement: Cataclysm Overload Channel and Line-of-Sight Occlusion
The boss combat system SHALL support a telegraphed Cataclysm Overload channeling state upon shield layer depletion, during which the boss entity anchors in place, gains complete invulnerability to projectile damage, and charges a lethal arena-wide shockwave that detonates after a configured tick duration unless occluded by solid obstacle geometry. Upon detonation, open line-of-sight lethal impact SHALL immediately trigger player elimination with defeat state synchronization in the combat arena.

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
- **THEN** the player receives lethal damage or consumes exactly one reactive shield charge, and if lethal damage is inflicted, the combat arena immediately transitions to the defeat state with full shatter debris and defeat audio

#### Scenario: Pre-fired projectile landing post-channel
- **WHEN** a player discharges a projectile during the overload channel that travels across the arena and impacts the boss after the channel timer has expired and the shockwave has detonated
- **THEN** the boss is no longer invulnerable, and the projectile successfully inflicts damage or decrements the subsequent shield layer

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
- **THEN** it executes a 65-tick Cataclysm Overload channel, detonates the shockwave, materializes one Warden escort as an active combat unit, and transitions to phase three with 2 shield charges, accelerating to 105 px/s while discharging twin counter-rotating 12-pellet radial novae

#### Scenario: Cataclysm transition to Zero-Point Overdrive in phase four
- **WHEN** Chrono-Zenith's remaining 2 shield charges are depleted
- **THEN** it executes a 60-tick Cataclysm Overload channel, detonates the shockwave, and transitions to phase four with an exposed 0-shield core, pursuing the player at 125 px/s while discharging continuous rotating 16-pellet radial novae

#### Scenario: Destruction of Chrono-Zenith core
- **WHEN** a player projectile strikes Chrono-Zenith's exposed core in phase four
- **THEN** the boss is eliminated with a radiant geometric particle supernova, triggers victory audio fanfare, and unlocks the golden exit portal


