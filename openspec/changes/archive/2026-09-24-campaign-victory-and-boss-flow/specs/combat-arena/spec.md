# Spec Delta: Combat Arena

## MODIFIED Requirements

### Requirement: Puzzle Room Clearance and Transition
The arena SHALL track room completion state across a 20-room progression sequence, trigger intermediate boss encounters in Rooms 5, 10, and 15, trigger the final boss encounter in Room 20, advance through escalated sectors, suppress floor exit portal rendering during boss encounters and Endless Mode, and unlock the floor exit portal once all active enemies in standard puzzle rooms are eliminated.

#### Scenario: All enemies eliminated
- **WHEN** the last remaining enemy in a standard puzzle room is destroyed
- **THEN** the room exit portal unlocks and transitions to radiant cyan, allowing progression to advance

#### Scenario: Stepping into portal in room 1 through 4
- **WHEN** the player enters the unlocked exit portal in rooms 1 through 4
- **THEN** the next room layout is loaded, resetting player ammunition and advancing room progression

#### Scenario: Stepping into portal in room 5
- **WHEN** the Level 5 boss unit is destroyed
- **THEN** the simulation freezes into a triumph state, presents the tactical augmentation upgrade selection without requiring a floor exit portal, and loads Room 6 upon selection

#### Scenario: Stepping into portal in rooms 6 through 8
- **WHEN** the player enters the unlocked exit portal in rooms 6 through 8
- **THEN** the next Zone 2 room layout is loaded, preserving the active tactical augmentation upgrade and reloading ammunition

#### Scenario: Stepping into portal in room 9
- **WHEN** the player enters the unlocked exit portal in room 9
- **THEN** progression advances to Room 10 (Chrono-Weaver)

#### Scenario: Intermediate boss elimination in Rooms 10 and 15
- **WHEN** Chrono-Weaver in Room 10 or Vektor-Prime in Room 15 is destroyed
- **THEN** the simulation freezes into a triumph state, presents the tactical augmentation upgrade selection without requiring a floor exit portal, and loads the subsequent sector room upon selection

#### Scenario: Final boss elimination in Room 20
- **WHEN** the final milestone boss unit (Chrono-Zenith in Room 20) is destroyed
- **THEN** the arena immediately triggers the campaign completion victory sequence without opening an upgrade draft or requiring a floor exit portal

#### Scenario: Floor portal suppression in boss encounters and Endless Mode
- **WHEN** the arena renders a room containing an active boss encounter (Rooms 5, 10, 15, 20) or Endless Survival Mode
- **THEN** floor exit portal rendering is suppressed, preventing locked or inactive portal barriers from appearing on the arena floor
