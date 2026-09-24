# Spec Delta: Procedural Levels

## MODIFIED Requirements

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide an expanded 20-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions culminating in the Room 20 final boss encounter, while ensuring procedural milestone boss placements maintain verified clearance outside all layout obstacle boundaries and room victory screens format milestone completions and dual interactive progression choices across multi-line bounds that fit within the viewport frame.

#### Scenario: Progressing through 14-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign without a dynamic director
- **THEN** the sequence advances beyond the initial 14 rooms through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), Sector 3 (Rooms 11–14), Milestone Boss 3 (Room 15, Vektor-Prime), and Sector 4 (Rooms 16–20, culminating in Room 20 Milestone Final Boss Chrono-Zenith) before completing the main campaign

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** the level director synthesizes milestone boss encounters for room numbers divisible by 5
- **THEN** it routes milestone bosses based on sector index, selecting Goliath-01 for Sector 1 (Room 5), Chrono-Weaver for Sector 2 (Room 10), Vektor-Prime for Sector 3 (Room 15), and Chrono-Zenith for Sector 4 (Room 20)

#### Scenario: Verified clearance for procedural Room 20 milestone boss
- **WHEN** the level director generates the Room 20 Chrono-Zenith encounter using The Apex Redoubt template
- **THEN** the boss spawn position is set to `arenaWidth - 350` (610, 320), maintaining verified separation outside the east pillar (`redoubt-pillar-east` bounds 716..764) and preventing units from spawning embedded in solid cover

#### Scenario: Multi-row victory checkmark display
- **WHEN** the player conquers Room 20 and the campaign victory screen is rendered
- **THEN** the 4 milestone boss achievements are rendered across two balanced rows within the 840px frame boundary without overflowing the perimeter borders

#### Scenario: Interactive campaign victory screen choices
- **WHEN** the player conquers Room 20 and the campaign victory screen is rendered
- **THEN** the screen displays dual interactive cards: Card 1 targeting Endless Survival Mode with full 7-upgrade loadout injection (via [E], [Space], or mouse click), and Card 2 targeting full expedition reset back to Room 1 (via [R], [Shift+R], or mouse click)

#### Scenario: Room header width clamping during boss encounters
- **WHEN** an active milestone boss is present in the arena
- **THEN** the room progression header clamps or suppresses tactical guidance text to prevent spatial overlap with the centered boss telemetry HUD

### Requirement: Endless Survival Mode Protocol and Fair Dynamic Spawning
The combat progression system SHALL support unlocking a continuous Endless Survival Mode upon completing Room 20, granting the player all 7 tactical augmentations, replenishing shields to maximum capacity, and spawning waves of hostile reinforcements dynamically inside an advanced arena layout to satisfy a continuously escalating threat budget while preventing unfair spawn-kill deaths.

#### Scenario: Unlocking and entering Endless Mode from Room 20 portal
- **WHEN** the player completes Room 20 and triggers Endless Survival Mode from the campaign victory screen
- **THEN** the arena seamlessly transitions into Endless Survival Mode, automatically equips all 7 augmentations (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`), restores player shields to full capacity (`player.shields = player.maxShields`), refills ammunition to 8 rounds, loads the Apex Colosseum layout, and initiates dynamic wave spawning

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
- **THEN** the in-canvas HUD displays real-time survival telemetry including current threat budget, active elapsed survival time, and count of hostiles eliminated inside a 440px wide card with compacted text spacing, while the room progression header suppresses duplicate survival stats to prevent spatial overlap
