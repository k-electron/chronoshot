# Spec Delta: Combat Arena

## ADDED Requirements

### Requirement: Enemy Pathing and Intelligent Navigation
The combat arena SHALL navigate mobile enemy units through obstacle geometry using a 40px grid A* pathfinding algorithm when line-of-sight to the player is obstructed, and transition to direct line-of-sight vector steering when an unobstructed sightline is established.

#### Scenario: Enemy paths around cover when line-of-sight is blocked
- **WHEN** an enemy detects that obstacles block direct line-of-sight to the player
- **THEN** the enemy calculates a waypoint path across walkable 40px grid cells and traverses toward the player position around intervening walls and pillars

#### Scenario: Enemy switches to direct vector steering upon acquiring line-of-sight
- **WHEN** an enemy establishes an unobstructed sightline to the player
- **THEN** the enemy bypasses grid waypoint steps and steers smoothly along the line-of-sight vector according to its behavioral archetype (closing distance for rushers, maintaining distance for kiters)

#### Scenario: Unit radius obstacle clearance
- **WHEN** an enemy navigates near obstacle corners
- **THEN** pathfinding enforces entity radius clearance to prevent units from penetrating or clipping into obstacle boundaries

## MODIFIED Requirements

### Requirement: Enemy Archetypes and Behaviors
The arena SHALL support distinct enemy archetypes including Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, and Marksman Sniper that engage the player with archetype-specific movement speeds, firing cadences, ballistic spreads, and firing styles.

#### Scenario: Enemy acquires line-of-sight
- **WHEN** an enemy detects the player without intervening obstacles
- **THEN** the enemy aims and discharges projectiles according to its firing cadence and behavioral firing style

#### Scenario: Pistol Grunt skirmishing
- **WHEN** a Pistol Grunt acquires line-of-sight
- **THEN** it advances at moderate speed (120 px/s), pauses briefly for a 6-tick stutter when discharging, and fires single lethal bullets at a 50-tick cadence

#### Scenario: Shotgun Guard area denial
- **WHEN** a Shotgun Guard engages the player
- **THEN** it advances steadily at 90 px/s with 1 shield hit absorption and discharges a 5-pellet buckshot spread at an 80-tick cadence

#### Scenario: Stalker high-speed rush
- **WHEN** a Stalker detects the player
- **THEN** it sprints aggressively at 210 px/s using run-and-gun continuous fire with a rapid 32-tick cadence without halting

#### Scenario: Aegis Warden frontline push
- **WHEN** an Aegis Warden enters combat
- **THEN** it marches forward at 60 px/s with 2 shield hit absorption and discharges heavy slugs at a 65-tick cadence

#### Scenario: Marksman sniper telegraphed charge
- **WHEN** a Marksman acquires line-of-sight at distance
- **THEN** it halts movement, projects a charging red sightline laser for 30 ticks, and discharges a high-velocity precision bullet at a 110-tick cadence

### Requirement: One-Hit Lethality and Instant Room Reset
The arena SHALL enforce instant lethal elimination for unshielded combat units upon projectile impact, enforce hit-count shield durability for shielded units before exposing them to lethal damage, and provide instantaneous room restart capability.

#### Scenario: Player struck by projectile
- **WHEN** an enemy projectile impacts the player hitbox
- **THEN** the player entity shatters, a defeat state is triggered, and the player can immediately reset the room via keypress

#### Scenario: Enemy struck by player bullet
- **WHEN** a player projectile impacts an enemy hitbox with zero remaining shields
- **THEN** the enemy entity is eliminated and shatters into geometric debris

#### Scenario: Projectile strikes enemy shield barrier
- **WHEN** a player projectile impacts an enemy unit possessing remaining shield hits
- **THEN** the projectile is absorbed, one shield hit is consumed, radiant shield impact sparks are produced, and the unit remains alive

### Requirement: Puzzle Room Clearance and Transition
The arena SHALL track room completion state across a 5-room progression sequence and unlock the exit portal once all active enemies in the current room are eliminated.

#### Scenario: All enemies eliminated
- **WHEN** the last remaining enemy in a room is destroyed
- **THEN** the room exit unlocks, allowing the player to step into the exit to load the next room layout

#### Scenario: Stepping into portal in room 1 through 4
- **WHEN** the player enters the unlocked exit portal in rooms 1 through 4
- **THEN** the next room layout is loaded, resetting player ammunition and advancing room progression

#### Scenario: Stepping into portal in room 5
- **WHEN** the player enters the unlocked exit portal in room 5
- **THEN** the campaign completion victory sequence is triggered
