# Spec Delta

## MODIFIED Requirements

### Requirement: Dynamic RoomManager Integration and Endless Mode
The combat progression system SHALL support supplying dynamic room generators to the room manager, enabling continuous room generation upon portal entry.

#### Scenario: Generating next room on demand
- **WHEN** the player enters an exit portal in endless progression mode
- **THEN** the room manager invokes the level director to generate the subsequent room with escalated threat budget and loads it seamlessly into the combat arena

#### Scenario: Preserving standard campaign sequence
- **WHEN** room manager is initialized without a dynamic director
- **THEN** the manager defaults to the 19-room campaign sequence with zero behavioral regression

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide an expanded 19-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions.

#### Scenario: Progressing through 14-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign without a dynamic director
- **THEN** the sequence advances beyond the initial 14 rooms through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), Sector 3 (Rooms 11–14), Milestone Boss 3 (Room 15, Vektor-Prime), and Sector 4 (Rooms 16–19) before awarding overall campaign victory

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** the level director synthesizes milestone boss encounters for room numbers divisible by 5
- **THEN** it routes milestone bosses based on sector index, selecting Goliath-01 for Sector 1, Chrono-Weaver for Sector 2, and Vektor-Prime for Sector 3 and beyond

## ADDED Requirements

### Requirement: Sector 4 Linear Endgame Progression
The level progression system SHALL provide linearly escalating tactical encounters across Rooms 16 through 19 with increasing threat budgets and diverse hostile compositions to test late-game player upgrade synergies.

#### Scenario: Escalating threat budget across Rooms 16 through 19
- **WHEN** Rooms 16, 17, 18, and 19 are generated or loaded
- **THEN** the threat budget escalates linearly from 240 up to 285 points with tactical combinations of Wardens, Marksmen, Shotgun Guards, Stalkers, and Grunts

#### Scenario: Campaign victory upon Room 19 exit
- **WHEN** all active enemies in Room 19 are eliminated and the player enters the unlocked exit portal
- **THEN** the combat arena triggers mission victory and renders the updated campaign completion telemetry celebrating all 19 tactical protocols conquered
