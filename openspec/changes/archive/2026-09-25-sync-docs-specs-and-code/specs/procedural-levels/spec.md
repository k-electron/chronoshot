# Spec Delta: Procedural Levels

## MODIFIED Requirements

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide a hand-built 20-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions culminating in the Room 20 final boss encounter, while room victory screens format milestone completions and dual interactive progression choices across multi-line bounds that fit within the viewport frame.

#### Scenario: Progressing through 20-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign
- **THEN** the sequence advances through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), Sector 3 (Rooms 11–14), Milestone Boss 3 (Room 15, Vektor-Prime), and Sector 4 (Rooms 16–20, culminating in Room 20 Milestone Final Boss Chrono-Zenith) before completing the main campaign

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** milestone boss encounters are loaded for room numbers divisible by 5
- **THEN** the campaign sequence routes distinct milestone bosses for each sector: Goliath-01 for Sector 1 (Room 5), Chrono-Weaver for Sector 2 (Room 10), Vektor-Prime for Sector 3 (Room 15), and Chrono-Zenith for Sector 4 (Room 20)

#### Scenario: Verified clearance for procedural Room 20 milestone boss
- **WHEN** Room 20 Chrono-Zenith encounter initializes in The Apex Redoubt
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

### Requirement: Sector 4 Linear Endgame Progression
The level progression system SHALL provide linearly escalating tactical encounters across Rooms 16 through 20 with increasing threat budgets and diverse hostile compositions to test late-game player upgrade synergies.

#### Scenario: Escalating threat budget across Rooms 16 through 19
- **WHEN** Rooms 16, 17, 18, and 19 are generated or loaded
- **THEN** the threat budget escalates from 145 up to 255 points (Room 16: 145, Room 17: 190, Room 18: 195, Room 19: 255) with tactical combinations of Wardens, Marksmen, Shotgun Guards, Stalkers, and Grunts

#### Scenario: Campaign victory upon Room 19 exit
- **WHEN** all active enemies in Room 19 are eliminated and the player enters the unlocked exit portal
- **THEN** the combat arena advances progression to Room 20 (The Apex Redoubt) featuring the Chrono-Zenith final boss encounter

### Requirement: Endless Survival Mode Protocol and Fair Dynamic Spawning
The combat progression system SHALL support unlocking a continuous Endless Survival Mode upon completing Room 20, granting the player all 7 tactical augmentations, replenishing shields to maximum capacity, and spawning waves of hostile reinforcements dynamically inside an advanced arena layout to satisfy a continuously escalating threat budget while preventing unfair spawn-kill deaths. Total concurrent active and materializing hostiles SHALL never exceed 8 units, and active or queued snipers SHALL never exceed 2 units regardless of kill churn rate. Inactive eliminated hostiles SHALL be pruned from entity collections during Endless Mode to maintain deterministic simulation performance.

#### Scenario: Unlocking and entering Endless Mode from Room 20 portal
- **WHEN** the player completes Room 20 and triggers Endless Survival Mode from the campaign victory screen
- **THEN** the arena seamlessly transitions into Endless Survival Mode, automatically equips all 7 augmentations (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`), restores player shields to full capacity (`player.shields = player.maxShields`), refills ammunition to 8 rounds, loads the Apex Colosseum layout, and initiates dynamic wave spawning

#### Scenario: Escalating threat budget over simulation time
- **WHEN** the player maneuvers and acts in Endless Mode
- **THEN** the target threat budget increases dynamically proportional to elapsed simulation ticks, escalating the encounter intensity over time

#### Scenario: Continuous reinforcement spawning to satisfy threat budget
- **WHEN** the sum of threat costs for all active living hostiles drops below the target threat budget and total active units is below the concurrent capacity limit (8 units)
- **THEN** the dynamic spawner selects and materializes reinforcement hostiles to replenish the threat deficit

#### Scenario: Strict concurrent unit capacity limit under kill churn
- **WHEN** enemies are rapidly eliminated in Endless Mode while materialization countdowns complete
- **THEN** the spawner strictly bounds the sum of active living enemies, materializing units ready to spawn this tick, and pending queued units to at most 8 units, preventing wave overshoots

#### Scenario: Concurrent sniper capacity enforcement under kill churn
- **WHEN** reinforcement candidates are evaluated during high enemy turnover
- **THEN** the total count of living marksmen/snipers, marksmen/snipers transitioning into combat this tick, and queued marksmen/snipers is strictly capped at 2 units

#### Scenario: Safe distant spawning with 350px clearance
- **WHEN** a reinforcement hostile candidate position is selected in Endless Mode
- **THEN** the spawner validates that the candidate is at least 350 pixels away from the player's current position, maintains at least 48 pixels separation from other units (including units ready to enter combat this tick), and does not overlap any obstacle bounds

#### Scenario: Visual materialization telegraph ring before unit engagement
- **WHEN** a reinforcement hostile is spawned into the arena
- **THEN** a visual materialization telegraph ring renders at its coordinates for 30 simulation ticks during which the hostile cannot fire or damage the player, providing clear warning before active combat engagement

#### Scenario: In-canvas Endless telemetry HUD
- **WHEN** Endless Mode is active
- **THEN** the in-canvas HUD displays real-time survival telemetry including current threat budget, active elapsed survival time, and count of hostiles eliminated inside a 440px wide card with compacted text spacing, while the room progression header suppresses duplicate survival stats to prevent spatial overlap

#### Scenario: Eliminated hostile unit collection pruning
- **WHEN** enemies are eliminated in Endless Mode
- **THEN** the arena purges non-living enemy instances from the active enemy roster at the end of each simulation step, preventing unbounded memory growth and iteration overhead
