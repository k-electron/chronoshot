# Spec Delta: Combat Arena

## MODIFIED Requirements

### Requirement: Puzzle Room Clearance and Transition
The arena SHALL track room completion state across a 9-room progression sequence, trigger a boss encounter in Room 5, advance through an escalated Zone 2 baseline across Rooms 6 through 9, and unlock the exit portal once all active enemies in the current room are eliminated.

#### Scenario: All enemies eliminated
- **WHEN** the last remaining enemy in a room is destroyed
- **THEN** the room exit portal unlocks or boss defeat sequence triggers, allowing progression to advance

#### Scenario: Stepping into portal in room 1 through 4
- **WHEN** the player enters the unlocked exit portal in rooms 1 through 4
- **THEN** the next room layout is loaded, resetting player ammunition and advancing room progression

#### Scenario: Stepping into portal in room 5
- **WHEN** the Level 5 boss unit is destroyed
- **THEN** the simulation freezes into a triumph state, presents the tactical augmentation upgrade selection, and loads Room 6 upon selection

#### Scenario: Stepping into portal in rooms 6 through 8
- **WHEN** the player enters the unlocked exit portal in rooms 6 through 8
- **THEN** the next Zone 2 room layout is loaded, preserving the active tactical augmentation upgrade and reloading ammunition

#### Scenario: Stepping into portal in room 9
- **WHEN** the player enters the unlocked exit portal in room 9
- **THEN** the campaign completion victory sequence is triggered

### Requirement: One-Hit Lethality and Instant Room Reset
The arena SHALL enforce instant lethal elimination for unshielded combat units upon projectile impact, enforce hit-count shield durability for shielded units before exposing them to lethal damage, and enforce pure permadeath run reset to Room 1 upon player elimination.

#### Scenario: Player struck by projectile
- **WHEN** an enemy projectile impacts the player hitbox with zero remaining shields
- **THEN** the player entity shatters, a defeat state is triggered displaying run statistics, and pressing restart resets progression back to Room 1 with all augmentations cleared

#### Scenario: Player struck by projectile with reactive shield online
- **WHEN** an enemy projectile impacts a player possessing an active reactive shield
- **THEN** the projectile is absorbed, the shield is consumed with a deflection shatter effect, and the player remains alive without taking lethal damage

#### Scenario: Enemy struck by player bullet
- **WHEN** a player projectile impacts an enemy hitbox with zero remaining shields
- **THEN** the enemy entity is eliminated and shatters into geometric debris

#### Scenario: Projectile strikes enemy shield barrier
- **WHEN** a player projectile impacts an enemy unit possessing remaining shield hits
- **THEN** the projectile is absorbed, one shield hit is consumed, radiant shield impact sparks are produced, and the unit remains alive

## ADDED Requirements

### Requirement: Zone 2 Step-Function Baseline Escalation
The combat arena SHALL enforce an escalated baseline challenge floor across Rooms 6 through 9 with multi-archetype enemy squads, reduced initial engagement delays, and coordinated crossfires calibrated for an augmented player.

#### Scenario: Loading a Zone 2 room
- **WHEN** the arena loads any room between Room 6 and Room 9
- **THEN** multiple distinct enemy archetypes spawn simultaneously in tactical formations including flankers, area-denial guards, and sightline snipers
