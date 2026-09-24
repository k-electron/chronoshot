# Spec Delta: Procedural Levels

## REMOVED Requirements

### Requirement: Deterministic Seeded Room Generation
**Reason**: Procedural room generation mode behind `?mode=endless` is removed to maintain a strict two-phase game architecture: a 20-room hand-built campaign followed by Endless Protocol in the Apex Colosseum.
**Migration**: Play the 20-room hand-built campaign sequence or jump directly to the post-Zenith campaign victory screen via the `?skip` playtest bypass.

### Requirement: Threat-Budget Tactical Encounter Generation
**Reason**: Squad point-buy spawner was used exclusively by `LevelDirector` for random procedural rooms. Fixed campaign rooms feature hand-crafted squad compositions in `Room.ts`, and Endless Protocol uses its own dedicated dynamic wave spawner in `EndlessDirector`.
**Migration**: Dynamic wave threats in Endless Survival Mode are governed by `Endless Survival Mode Protocol and Fair Dynamic Spawning`.

## MODIFIED Requirements

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

## ADDED Requirements

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
