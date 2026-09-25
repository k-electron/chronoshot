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
The arena SHALL enforce instant lethal elimination for unshielded combat units upon projectile impact or environmental/shockwave damage, enforce hit-count shield durability for shielded units before exposing them to lethal damage, and present an interactive defeat screen upon player elimination that presents a single centered reset card in Sector 1 (Rooms 1–5) or dual interactive cards in later sectors supporting cascading boss checkpoint rollbacks or full run resets with multi-line bounded text formatting that prevents text from overflowing card boundaries. When the player unit is eliminated by any damage source, the arena SHALL synchronize elimination state by emitting player shatter particles, halting combat, and activating the defeat interface.

#### Scenario: Player struck by projectile
- **WHEN** an enemy projectile impacts the player hitbox with zero remaining shields
- **THEN** the player entity shatters, a defeat state is triggered displaying run statistics and interactive defeat card(s), suppressing in-canvas reticle, and restoring pointer cursor interaction

#### Scenario: Player eliminated by non-projectile lethal shockwave
- **WHEN** an arena-wide shockwave or environmental effect inflicts lethal damage on a player with zero remaining shields
- **THEN** the arena immediately triggers the defeat state, emits cyan crystalline shatter particles, plays the shatter audio effect, and displays the defeat HUD

#### Scenario: Player struck by projectile with reactive shield online
- **WHEN** an enemy projectile impacts a player possessing an active reactive shield
- **THEN** the projectile is absorbed, the shield is consumed with a deflection shatter effect, and the player remains alive without taking lethal damage

#### Scenario: Enemy struck by player bullet
- **WHEN** a player projectile impacts an enemy hitbox with zero remaining shields
- **THEN** the enemy entity is eliminated and shatters into geometric debris

#### Scenario: Projectile strikes enemy shield barrier
- **WHEN** a player projectile impacts an enemy unit possessing remaining shield hits
- **THEN** the projectile is absorbed, one shield hit is consumed, radiant shield impact sparks are produced, and the unit remains alive

#### Scenario: Player eliminated in Sector 1
- **WHEN** the player suffers lethal damage in Rooms 1 through 5 (including during the Goliath-01 boss encounter)
- **THEN** the player shatters, the arena enters defeat state displaying a single centered interactive reset card with bounded multi-line text that does not overflow the card width, and triggering reset (via [R], [Shift+R], or clicking the card) respawns the player at Room 1 with 0 augmentations

#### Scenario: Player eliminated in Sector 2
- **WHEN** the player suffers lethal damage in Rooms 6 through 10 (including during the Chrono-Weaver boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 5 (Goliath-01) with their Room 5 entry loadout (0 augmentations), rendered with bounded multi-line description text contained within the card rectangle

#### Scenario: Player eliminated in Sector 3
- **WHEN** the player suffers lethal damage in Rooms 11 through 15 (including during the Vektor-Prime boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 10 (Chrono-Weaver) with their Room 10 entry loadout (1 augmentation), rendered with bounded multi-line description text contained within the card rectangle

#### Scenario: Player eliminated in Sector 4
- **WHEN** the player suffers lethal damage in Rooms 16 through 20 (including during the Chrono-Zenith boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 15 (Vektor-Prime) with their Room 15 entry loadout (2 augmentations), rendered with bounded multi-line description text contained within the card rectangle

#### Scenario: Cascading drop-down on repeated defeat
- **WHEN** a player who rolled back to a previous boss dies again in that boss room or subsequent rooms
- **THEN** rollback recalculates from the newly failed room, demoting the player down the checkpoint ladder tier-by-tier until Room 1

#### Scenario: Full run reset from defeat screen
- **WHEN** the player triggers Full Reset (via [Shift+R] or clicking Card 2 in multi-card view, or via [R] / [Shift+R] / clicking the single card in Sector 1) on the defeat screen
- **THEN** the run is abandoned, all augmentations and checkpoint snapshots are cleared, and the game resets to pristine Room 1

#### Scenario: Endless Mode defeat score screen and Apex rollback
- **WHEN** the player is eliminated in Endless Survival Mode
- **THEN** the defeat screen displays the survival performance score (survival time, max threat increment reached, and hostiles eliminated count), Card 1 targets rollback to Room 20 (Chrono-Zenith), and Card 2 targets Full Reset to Room 1

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

### Requirement: In-Canvas Tactical Reticle
The combat arena SHALL render an in-canvas precision hardware reticle aligned with the player's aim target coordinates, replacing the operating system mouse cursor during active combat, while dynamically restoring native cursor visibility during modal UI overlays.

#### Scenario: Precision aim tracking
- **WHEN** the player moves the mouse cursor over the combat arena during active gameplay
- **THEN** an in-canvas reticle comprising a central point and directional micro-ticks is drawn at the exact aim coordinates with zero operating system cursor overlap and `cursor: none` active

#### Scenario: Dynamic reticle pulse on time dilation
- **WHEN** the player moves and global time scale increases
- **THEN** the reticle micro-ticks subtly expand outward to signal active realtime pacing

#### Scenario: Dry-fire flash indicator
- **WHEN** the player issues a fire command with an empty cylinder
- **THEN** the reticle flashes signal crimson to provide instantaneous tactile aimpoint feedback

#### Scenario: Cursor restoration during modal UI overlays
- **WHEN** the arena enters a modal overlay state (upgrade draft, pause menu, victory screen, or defeat screen)
- **THEN** in-canvas reticle rendering is suppressed, and visible native cursor styling (`default` or `pointer`) is restored on the canvas

### Requirement: Simulation Pause and Minimalist Control Card
The combat arena SHALL support a toggleable pause state triggered by the Escape key that suspends physics simulation and displays an in-canvas minimalist control card, while hiding control listings during active combat except for an unobtrusive pause hint positioned below top-right time telemetry on a distinct vertical baseline to prevent baseline text collision.

#### Scenario: Pausing the simulation
- **WHEN** the player presses the Escape key during active gameplay
- **THEN** the game enters a paused state, simulation ticks halt, and a minimalist control matrix overlay appears

#### Scenario: Resuming combat from pause
- **WHEN** the player presses the Escape key or clicks within the paused arena
- **THEN** the pause overlay is dismissed and real-time/micro-creep combat resumes immediately

#### Scenario: Minimalist HUD during active play
- **WHEN** the game is in active combat mode
- **THEN** all control hints are hidden from the primary display with the exception of a subtle corner pause key indicator rendered below the time telemetry gauge without vertical baseline overlap

### Requirement: Enemy Pathing and Intelligent Navigation
The combat arena SHALL navigate mobile enemy units through obstacle geometry using a 20px grid A* pathfinding algorithm with cell-center obstacle containment at the unit's true blueprint radius when line-of-sight or physical navigation clearance to the player is obstructed, verify physical swept-circle navigation clearance on all waypoint shortcuts and sightline transitions, evaluate physical navigation clearance with respect to surface contact normals to allow departure from obstacle bounds, apply anti-freeze tangent fallback locomotion with goal alignment and hysteresis when pathfinding returns no waypoints, monitor active locomotion with an intentional-stop-aware stuck watchdog, and transition to direct vector pursuit only when both unobstructed optical sightline and physical chassis clearance are established.

#### Scenario: Enemy paths around cover when line-of-sight is blocked
- **WHEN** an enemy detects that obstacles block direct line-of-sight to the player
- **THEN** the enemy calculates a waypoint path across walkable 20px grid cells at the unit's true blueprint radius and traverses toward the player position around intervening walls and pillars

#### Scenario: Enemy switches to direct vector steering upon acquiring line-of-sight
- **WHEN** an enemy establishes both an unobstructed optical sightline and physical chassis navigation clearance to the player
- **THEN** the enemy bypasses grid waypoint steps and steers smoothly along the direct vector according to its behavioral archetype (closing distance for rushers, maintaining distance for kiters)

#### Scenario: Unit radius obstacle clearance
- **WHEN** an enemy initializes or updates pathfinding grid obstacles
- **THEN** pathfinding enforces entity radius clearance via cell-center containment to prevent units from penetrating or clipping into obstacle boundaries, marking a cell impassable if and only if its cell center falls within the obstacle bounds inflated by the unit's true radius, and snaps impassable start or target endpoints to the nearest walkable grid cell center to prevent deadlocks

#### Scenario: Directional surface contact clearance
- **WHEN** an enemy evaluates physical navigation clearance while in physical contact with an obstacle boundary
- **THEN** clearance is evaluated relative to the contact normal such that movement directed away from or parallel to the surface ($\vec{dir} \cdot \hat{n} \ge -0.05$) is permitted without false-positive clearance failure

#### Scenario: Anti-freeze fallback on empty path
- **WHEN** an enemy has line-of-sight to the player obstructed or clear and grid pathfinding yields an empty path
- **THEN** the enemy does not halt at zero velocity but falls back to goal-aligned obstacle tangent deflection with directional hysteresis when out of sight or direct vector steering when in sight, relying on continuous obstacle collision resolution to slide along intervening obstacles

#### Scenario: Corner vertex deflection
- **WHEN** an advancing combat unit collides head-on with an obstacle corner vertex where velocity opposes the diagonal vertex normal
- **THEN** collision resolution deflects velocity along the dominant adjacent face tangent rather than canceling velocity to zero, preventing corner-pinning deadlocks

#### Scenario: Kiter lateral wall escape
- **WHEN** a distance-keeping hostile's direct backwards retreat is obstructed by an obstacle boundary
- **THEN** the unit evaluates lateral wall tangents to slide along the obstacle rather than freezing at zero velocity

#### Scenario: Swept-circle shortcut verification
- **WHEN** an enemy evaluates waypoint lookahead, chord smoothing, or transitions from grid pathfinding to direct vector steering
- **THEN** the direct path is validated using continuous Minkowski swept-circle raycasting at the unit's true physical radius, ensuring waypoints brushing obstacle perimeters do not cause corner clipping

#### Scenario: Intentional-stop-aware stuck watchdog
- **WHEN** an enemy commands nonzero desired locomotion velocity but fails to achieve spatial displacement (displacement < 1.5px over 12 ticks) while not held by intentional stationary states (fire stutter, laser sightline charging, boss overload channel, arrival radius, corridor queuing, or kiter range holding)
- **THEN** the watchdog identifies a deadlock, forces an immediate A* repath, and executes a tangent breakout slide

### Requirement: Zone 2 Step-Function Baseline Escalation
The combat arena SHALL enforce an escalated baseline challenge floor across Rooms 6 through 9 with multi-archetype enemy squads, reduced initial engagement delays, and coordinated crossfires calibrated for an augmented player.

#### Scenario: Loading a Zone 2 room
- **WHEN** the arena loads any room between Room 6 and Room 9
- **THEN** multiple distinct enemy archetypes spawn simultaneously in tactical formations including flankers, area-denial guards, and sightline snipers

### Requirement: Composable Enemy Behavior Components
The combat system SHALL support constructing enemy combat units from modular movement behaviors (direct advance, distance-keeping kiter, obstacle grid A* navigation) and attack behaviors (single slug, fan spread buckshot, telegraphed charging beam), allowing custom and baseline archetypes to be assembled from interchangeable behavior strategies.

#### Scenario: Composing an enemy with custom movement and attack behaviors
- **WHEN** an enemy unit is initialized with a distinct combination of movement and attack behavior components
- **THEN** during simulation updates the unit executes the assigned movement strategy for locomotion and the assigned attack strategy for aiming and projectile discharge

#### Scenario: Preserving baseline archetype combat behavior
- **WHEN** standard enemy archetypes (Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper) are spawned in the arena
- **THEN** their composed behavior strategies produce identical movement speeds, line-of-sight tracking, firing cadences, spread angles, and laser charge telegraphs to their baseline specifications

### Requirement: Decoupled Procedural Hull and Telegraph Rendering
The combat arena rendering system SHALL delegate enemy visual drawing to a modular procedural hull renderer that renders unit chassis geometries (diamond, hexagon, cross-star), weapon hardpoints, hit-count shield auras, and charging laser telegraphs independently of the core arena loop.

#### Scenario: Rendering an enemy with procedural hull profile
- **WHEN** an active enemy unit is rendered on the canvas
- **THEN** its assigned chassis shape, directional orientation, barrel hardpoint, and any active shield buffer or charging sightline laser are drawn according to its visual profile

### Requirement: Dynamic Hostile Entity Spawning
The combat arena SHALL provide an explicit enemy instantiation and registration method (`spawnEnemy`) that constructs and activates fully featured combat units dynamically during combat simulation, supporting mid-encounter boss reinforcements and wave spawners.

#### Scenario: Spawning dynamic reinforcement entity
- **WHEN** a transition hook or wave spawner invokes `spawnEnemy` with an enemy configuration
- **THEN** an active `Enemy` instance is constructed, configured with active lifecycle state (`isAlive = true`), registered in the arena's active enemy roster, and integrated into subsequent AI updates, collision passes, and rendering

### Requirement: Physical Unit Spatial Occupancy and Non-Lethal Contact
The combat arena SHALL enforce physical spatial occupancy for all active combat units (operative, baseline hostiles, and milestone bosses) through circular collision hulls that prevent mutual interpenetration across all simulation ticks, resolving physical contact via non-damaging inelastic sliding.

#### Scenario: Hostiles maintain physical separation
- **WHEN** multiple mobile enemies pursue the player or navigate toward identical locations
- **THEN** their circular collision hulls cannot interpenetrate, maintaining center-to-center distance $d \ge r_A + r_B$ at all times

#### Scenario: Non-damaging kinematic contact sliding
- **WHEN** the operative and an active hostile come into physical contact
- **THEN** the contact does not inflict damage or consume shields, relative velocity along the contact normal is canceled, and both entities slide smoothly along their tangential boundaries

#### Scenario: Point-blank hostile gunfire safety gap
- **WHEN** an enemy fires its weapon while in physical contact with the operative
- **THEN** the projectile materializes in the clearance gap between the enemy muzzle hardpoint ($r_E + 6\text{px}$) and the operative chassis ($d \ge r_P + r_E$), allowing standard continuous collision detection and reactive shield deflection to resolve normally

#### Scenario: Wall and obstacle sandwich equilibrium
- **WHEN** a unit is pushed against a solid obstacle by another unit
- **THEN** multi-pass constraint relaxation resolves both obstacle bounds and unit-unit boundaries, keeping the sandwiched unit outside obstacle geometry and separated from the pushing unit

### Requirement: Dash Impact Kinetic Shove and Boss Deflection
The combat arena SHALL resolve Overcharge Dash collisions with combat units based on mass hierarchy, imparting kinetic shove displacement against standard hostiles while smoothly deflecting the dashing operative around immovable milestone bosses without penetrating either entity.

#### Scenario: Dashing into standard hostiles
- **WHEN** the operative executes an Overcharge Dash into one or more standard enemies
- **THEN** the dashing operative does not penetrate enemy hitboxes, and impacted enemies are shoved outward along the contact normal and dash tangent while sliding cleanly along any adjacent obstacles

#### Scenario: Dashing into milestone bosses
- **WHEN** the operative executes an Overcharge Dash directly into a milestone boss
- **THEN** the boss remains anchored and immovable, the operative does not enter the boss hitbox, and the operative's dash velocity deflects smoothly along the curved boss hull

### Requirement: Multi-Agent Locomotion, Separation, and Corridor Queueing
The combat AI navigation system SHALL incorporate surface-distance arrival, multi-agent separation steering, and single-file corridor queueing to prevent hostile stacking, conga-line clustering, and movement jitter.

#### Scenario: Surface-distance arrival at operative perimeter
- **WHEN** an advancing hostile reaches surface contact proximity ($d \le r_{\text{self}} + r_{\text{target}} + 2\text{px}$) to its target
- **THEN** forward pursuit thrust drops to zero instead of continuously driving into the target center

#### Scenario: Separation steering in open space
- **WHEN** multiple hostiles advance toward the operative across open sightlines
- **THEN** mutual separation repulsion forces fan the units out laterally into an encircling tactical firing arc

#### Scenario: Corridor queueing without jitter
- **WHEN** a trailing hostile pursues a target through a narrow corridor where lateral clearance is blocked by obstacles
- **THEN** lateral separation forces are suppressed and forward velocity is clamped to match the leading unit's speed, queueing in single file without wall-grinding or oscillation

### Requirement: Safe Dynamic Entity Materialization
The combat system SHALL validate spatial candidate coordinates for mid-encounter dynamic spawns and boss escort summons to prevent entities from materializing inside obstacles, the operative, or other active units.

#### Scenario: Spawning boss escort reinforcements
- **WHEN** a boss phase transition or cataclysm detonation triggers minion escort summoning
- **THEN** candidate spawn locations are evaluated for obstacle clearance and unit separation, radially probing outward if the default offset is obstructed, ensuring summoned units materialize only in legal, unoccupied arena space


