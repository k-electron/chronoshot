# Spec Delta: Procedural Levels

## MODIFIED Requirements

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide an expanded 20-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions culminating in the Room 20 final boss encounter.

#### Scenario: Progressing through 14-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign without a dynamic director
- **THEN** the sequence advances beyond the initial 14 rooms through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), Sector 3 (Rooms 11–14), Milestone Boss 3 (Room 15, Vektor-Prime), and Sector 4 (Rooms 16–20, culminating in Room 20 Milestone Final Boss Chrono-Zenith) before completing the main campaign

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** the level director synthesizes milestone boss encounters for room numbers divisible by 5
- **THEN** it routes milestone bosses based on sector index, selecting Goliath-01 for Sector 1 (Room 5), Chrono-Weaver for Sector 2 (Room 10), Vektor-Prime for Sector 3 (Room 15), and Chrono-Zenith for Sector 4 (Room 20)

### Requirement: Sector 4 Linear Endgame Progression
The level progression system SHALL provide linearly escalating tactical encounters across Rooms 16 through 20 with increasing threat budgets and diverse hostile compositions to test late-game player upgrade synergies.

#### Scenario: Escalating threat budget across Rooms 16 through 19
- **WHEN** Rooms 16, 17, 18, and 19 are generated or loaded
- **THEN** the threat budget escalates linearly from 240 up to 285 points with tactical combinations of Wardens, Marksmen, Shotgun Guards, Stalkers, and Grunts

#### Scenario: Campaign victory upon Room 19 exit
- **WHEN** all active enemies in Room 19 are eliminated and the player enters the unlocked exit portal
- **THEN** the combat arena advances progression to Room 20 (The Apex Redoubt) featuring the Chrono-Zenith final boss encounter

## ADDED Requirements

### Requirement: Endless Survival Mode Protocol and Fair Dynamic Spawning
The combat progression system SHALL support unlocking a continuous Endless Survival Mode upon completing Room 20, granting the player all 7 tactical augmentations, replenishing shields to maximum capacity, and spawning waves of hostile reinforcements dynamically inside an advanced arena layout to satisfy a continuously escalating threat budget while preventing unfair spawn-kill deaths.

#### Scenario: Unlocking and entering Endless Mode from Room 20 portal
- **WHEN** the player defeats Chrono-Zenith in Room 20 and steps into the unlocked radiant golden exit portal
- **THEN** the arena seamlessly transitions into Endless Survival Mode, automatically equips all 7 augmentations (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`), restores player shields to full capacity (`player.shields = player.maxShields`), refills ammunition to 8 rounds, and loads the Apex Colosseum layout

#### Scenario: Escalating threat budget over simulation time
- **WHEN** the player maneuvers and acts in Endless Mode
- **THEN** the target threat budget increases dynamically proportional to elapsed simulation ticks, escalating the encounter intensity over time

#### Scenario: Continuous reinforcement spawning to satisfy threat budget
- **WHEN** the sum of threat costs for all active living hostiles drops below the target threat budget and total active units is below the concurrent capacity limit (8 units)
- **THEN** the dynamic spawner selects and materializes reinforcement hostiles to replenish the threat deficit

#### Scenario: Safe distant spawning with 350px clearance
- **WHEN** a reinforcement hostile candidate position is selected in Endless Mode
- **THEN** the spawner validates that the candidate is at least 350 pixels away from the player's current position, maintains at least 48 pixels separation from other units, and does not overlap any obstacle bounds

#### Scenario: Visual materialization telegraph before unit engagement
- **WHEN** a reinforcement hostile is spawned into the arena
- **THEN** a visual materialization telegraph ring renders at its coordinates for 30 simulation ticks during which the hostile cannot fire or damage the player, providing clear warning before active combat engagement

#### Scenario: In-canvas Endless telemetry HUD
- **WHEN** Endless Mode is active
- **THEN** the in-canvas HUD displays real-time survival telemetry including current threat budget, active elapsed survival time, and count of hostiles eliminated
