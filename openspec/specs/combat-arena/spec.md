# Spec: Combat Arena

## Purpose

Defines the top-down tactical arena environment, player inputs, enemy combat behaviors, obstacle collisions, 1-hit lethality, and bite-sized puzzle room progression.

## Requirements

### Requirement: Player Navigation and Aim Controls
The combat arena SHALL receive keyboard inputs (WASD) for 2D omnidirectional movement and mouse coordinates for free continuous 360-degree aiming.

#### Scenario: Aiming crosshair
- **WHEN** the player moves the mouse cursor across the canvas
- **THEN** the player entity rotates continuously to align its directional sightline with the crosshair position without advancing time

### Requirement: Obstacle Collision and Projectile Cover
The arena SHALL render geometric obstacles (walls and pillars) that impede entity movement and absorb incoming projectiles.

#### Scenario: Projectile strikes obstacle
- **WHEN** a player or enemy bullet impacts a wall or pillar
- **THEN** the projectile is destroyed without penetrating and produces an impact effect

### Requirement: Enemy Archetypes and Behaviors
The arena SHALL support distinct enemy archetypes including single-shot pistol grunts and multi-pellet shotgun guards that target and engage the player with line-of-sight tracking.

#### Scenario: Enemy acquires line-of-sight
- **WHEN** an enemy detects the player without intervening obstacles
- **THEN** the enemy aims and discharges projectiles according to its firing cadence

### Requirement: One-Hit Lethality and Instant Room Reset
The arena SHALL enforce lethal combat where a single bullet impact destroys the targeted entity, with instant room restart capability upon player death.

#### Scenario: Player struck by projectile
- **WHEN** an enemy projectile impacts the player hitbox
- **THEN** the player entity shatters, a defeat state is triggered, and the player can immediately reset the room via keypress

#### Scenario: Enemy struck by player bullet
- **WHEN** a player projectile impacts an enemy hitbox
- **THEN** the enemy entity is eliminated and shatters into geometric debris

### Requirement: Puzzle Room Clearance and Transition
The arena SHALL track room completion state and unlock the exit portal once all active enemies are eliminated.

#### Scenario: All enemies eliminated
- **WHEN** the last remaining enemy in a room is destroyed
- **THEN** the room exit unlocks, allowing the player to step into the exit to load the next room layout

### Requirement: In-Canvas Tactical Reticle
The combat arena SHALL render an in-canvas precision hardware reticle aligned with the player's aim target coordinates, replacing the operating system mouse cursor, with dynamic visual feedback for time acceleration and dry-fire warnings.

#### Scenario: Precision aim tracking
- **WHEN** the player moves the mouse cursor over the combat arena
- **THEN** an in-canvas reticle comprising a central point and directional micro-ticks is drawn at the exact aim coordinates with zero operating system cursor overlap

#### Scenario: Dynamic reticle pulse on time dilation
- **WHEN** the player moves and global time scale increases
- **THEN** the reticle micro-ticks subtly expand outward to signal active realtime pacing

#### Scenario: Dry-fire flash indicator
- **WHEN** the player issues a fire command with an empty cylinder
- **THEN** the reticle flashes signal crimson to provide instantaneous tactile aimpoint feedback

### Requirement: Simulation Pause and Minimalist Control Card
The combat arena SHALL support a toggleable pause state triggered by the Escape key that suspends physics simulation and displays an in-canvas minimalist control card, while hiding control listings during active combat except for an unobtrusive pause hint.

#### Scenario: Pausing the simulation
- **WHEN** the player presses the Escape key during active gameplay
- **THEN** the game enters a paused state, simulation ticks halt, and a minimalist control matrix overlay appears

#### Scenario: Resuming combat from pause
- **WHEN** the player presses the Escape key or clicks within the paused arena
- **THEN** the pause overlay is dismissed and real-time/micro-creep combat resumes immediately

#### Scenario: Minimalist HUD during active play
- **WHEN** the game is in active combat mode
- **THEN** all control hints are hidden from the primary display with the exception of a subtle corner pause key indicator

