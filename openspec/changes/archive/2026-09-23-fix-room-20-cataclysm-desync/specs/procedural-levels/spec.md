# Spec Delta: Procedural Levels

## MODIFIED Requirements

### Requirement: Multi-Sector Campaign Sequence and Sector Milestone Bosses
The level progression system SHALL provide an expanded 20-room campaign sequence spanning Sector 1, Zone 2, Sector 3, and Sector 4, integrating distinct milestone bosses and progressive tactical squad compositions culminating in the Room 20 final boss encounter, while ensuring procedural milestone boss placements maintain verified clearance outside all layout obstacle boundaries.

#### Scenario: Progressing through 14-room campaign sequence
- **WHEN** the player progresses sequentially through the fixed campaign without a dynamic director
- **THEN** the sequence advances beyond the initial 14 rooms through Sector 1 (Rooms 1–5, Boss Goliath-01), Zone 2 (Rooms 6–9), Milestone Boss 2 (Room 10, Chrono-Weaver), Sector 3 (Rooms 11–14), Milestone Boss 3 (Room 15, Vektor-Prime), and Sector 4 (Rooms 16–20, culminating in Room 20 Milestone Final Boss Chrono-Zenith) before completing the main campaign

#### Scenario: Sector-indexed milestone boss injection
- **WHEN** the level director synthesizes milestone boss encounters for room numbers divisible by 5
- **THEN** it routes milestone bosses based on sector index, selecting Goliath-01 for Sector 1 (Room 5), Chrono-Weaver for Sector 2 (Room 10), Vektor-Prime for Sector 3 (Room 15), and Chrono-Zenith for Sector 4 (Room 20)

#### Scenario: Verified clearance for procedural Room 20 milestone boss
- **WHEN** the level director generates the Room 20 Chrono-Zenith encounter using The Apex Redoubt template
- **THEN** the boss spawn position is set to `arenaWidth - 350` (610, 320), maintaining verified separation outside the east pillar (`redoubt-pillar-east` bounds 716..764) and preventing units from spawning embedded in solid cover
