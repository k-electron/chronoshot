# Spec: Procedural Levels

## Purpose

Defines the composable room layout geometry templates, hand-crafted tactical encounter progressions, campaign milestone boss sequences, endless survival mode protocol with dynamic reinforcement spawning, and developer playtest bypass hooks.

## Requirements

### Requirement: Composable Cover and Geometry Layout Templates
The level generation system SHALL provide modular layout templates defining geometric obstacle arrangements (perimeter barriers, tactical cover pillars, bunker enclosures, flank corridors) alongside verified player spawn coordinates, exit portal anchors, and safe enemy spawn regions, ensuring all transit corridors maintain passable physical clearance and enemy spawn coordinates reside in open space.

#### Scenario: Instantiating a geometry layout template
- **WHEN** a room layout template is requested for room generation
- **THEN** it generates a set of perimeter walls and interior obstacle bounds with non-overlapping clearance zones for combat units and navigable transit corridors maintaining at least 48 pixels of clearance between adjacent obstacles

#### Scenario: Validating spawn separation distance
- **WHEN** enemy spawn regions and player spawn positions are evaluated in a template
- **THEN** the layout ensures a minimum Euclidean distance of 280 pixels between player spawn and any enemy spawn region to prevent immediate spawn-kill crossfires

#### Scenario: Safe hostile spawn positioning in fixed rooms
- **WHEN** fixed campaign rooms (Rooms 1 through 20) and Endless Mode initialize enemy positions
- **THEN** every initial enemy spawn point is strictly positioned outside all obstacle hitboxes with verified clearance, ensuring no combat unit materializes inside solid geometry

### Requirement: Dynamic RoomManager Integration and Endless Mode
The combat progression system SHALL support sequential room lifecycle management across the 20-room campaign and seamless handoff into Endless Survival Mode upon campaign victory.

#### Scenario: Generating next room on demand
- **WHEN** the player enters an unlocked exit portal in campaign mode
- **THEN** the room manager advances sequentially to the subsequent hand-built room in the 20-room sequence and loads it seamlessly into the combat arena

#### Scenario: Preserving standard campaign sequence
- **WHEN** room manager is initialized
- **THEN** the manager defaults to the 20-room hand-built campaign sequence with verified milestone boss encounters

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide a hand-built 20-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions culminating in the Room 20 final boss encounter, while room victory screens format milestone completions and dual interactive progression choices across multi-line bounds that fit within the viewport frame.

#### Scenario: Progressing through 14-room campaign sequence
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
- **THEN** the threat budget escalates linearly from 240 up to 285 points with tactical combinations of Wardens, Marksmen, Shotgun Guards, Stalkers, and Grunts

#### Scenario: Campaign victory upon Room 19 exit
- **WHEN** all active enemies in Room 19 are eliminated and the player enters the unlocked exit portal
- **THEN** the combat arena advances progression to Room 20 (The Apex Redoubt) featuring the Chrono-Zenith final boss encounter

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

#### Scenario: Visual materialization telegraph ring before unit engagement
- **WHEN** a reinforcement hostile is spawned into the arena
- **THEN** a visual materialization telegraph ring renders at its coordinates for 30 simulation ticks during which the hostile cannot fire or damage the player, providing clear warning before active combat engagement

#### Scenario: In-canvas Endless telemetry HUD
- **WHEN** Endless Mode is active
- **THEN** the in-canvas HUD displays real-time survival telemetry including current threat budget, active elapsed survival time, and count of hostiles eliminated inside a 440px wide card with compacted text spacing, while the room progression header suppresses duplicate survival stats to prevent spatial overlap

### Requirement: Campaign Victory Playtest Bypass
The game initialization system SHALL support a URL playtest parameter (`?skip`) that initializes the combat arena directly into the post-Zenith campaign victory state with completed Room 20 status, active victory overlay, pre-Zenith loadout, and pre-boss checkpoint snapshots, allowing seamless verification of Endless Protocol transitions and expedition resets without replaying Rooms 1–20.

#### Scenario: Initializing combat arena with playtest bypass
- **WHEN** the game is loaded with the `?skip` URL query parameter
- **THEN** the combat arena initializes directly into the post-Zenith victory state with Room 20 completed (`roomManager.isGameCompleted() === true`), active Mission Accomplished overlay, pre-Zenith loadout (Extended Cylinder, Speed Loader, Reactive Shield), and fully interactive victory cards

#### Scenario: Selecting Endless Protocol from playtest bypass
- **WHEN** the operative activates Card 0 (Endless Protocol) from the bypass victory screen via `[E]`, `[Space]`, or mouse click
- **THEN** the combat arena transitions seamlessly into Endless Survival Mode in the Apex Colosseum, equips all 7 combat augmentations, restores shields to 3, sets ammo capacity to 8 rounds, and begins dynamic reinforcement wave spawning matching a natural campaign completion run

#### Scenario: Selecting Expedition Reset from playtest bypass
- **WHEN** the operative activates Card 1 (Expedition Reset) from the bypass victory screen via `[R]`, `[Shift+R]`, or mouse click
- **THEN** the combat arena resets progression back to Room 1 with a clean starter loadout (0 augmentations, 6 rounds, 0 shields) matching a natural reset
