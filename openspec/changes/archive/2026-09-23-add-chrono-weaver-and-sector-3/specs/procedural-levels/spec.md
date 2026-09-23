# Spec Delta: Procedural Levels

## ADDED Requirements

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide an expanded 14-room campaign sequence spanning Sector 1, Zone 2, and Sector 3, integrating distinct milestone bosses and progressive tactical squad compositions.

#### Scenario: Progressing through 14-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign without a dynamic director
- **THEN** the sequence advances through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), and Sector 3 (Rooms 11–14) before awarding overall campaign victory

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** the level director synthesizes milestone boss encounters for room numbers divisible by 5
- **THEN** it routes milestone bosses based on sector index, selecting Goliath-01 for Sector 1 and Chrono-Weaver for Sector 2 and beyond

## MODIFIED Requirements

### Requirement: Dynamic RoomManager Integration and Endless Mode
The combat progression system SHALL support supplying dynamic room generators to the room manager, enabling continuous room generation upon portal entry.

#### Scenario: Generating next room on demand
- **WHEN** the player enters an exit portal in endless progression mode
- **THEN** the room manager invokes the level director to generate the subsequent room with escalated threat budget and loads it seamlessly into the combat arena

#### Scenario: Preserving standard campaign sequence
- **WHEN** room manager is initialized without a dynamic director
- **THEN** the manager defaults to the 14-room campaign sequence with zero behavioral regression
