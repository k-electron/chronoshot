# Spec Delta

## MODIFIED Requirements

### Requirement: One-Hit Lethality and Instant Room Reset
The arena SHALL enforce instant lethal elimination for unshielded combat units upon projectile impact or environmental/shockwave damage, enforce hit-count shield durability for shielded units before exposing them to lethal damage, and present an interactive defeat screen upon player elimination that presents a single centered reset card in Sector 1 (Rooms 1–5) or dual interactive cards in later sectors supporting cascading boss checkpoint rollbacks or full run resets. When the player unit is eliminated by any damage source, the arena SHALL synchronize elimination state by emitting player shatter particles, halting combat, and activating the defeat interface.

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
- **THEN** the player shatters, the arena enters defeat state displaying a single centered interactive reset card, and triggering reset (via [R], [Shift+R], or clicking the card) respawns the player at Room 1 with 0 augmentations

#### Scenario: Player eliminated in Sector 2
- **WHEN** the player suffers lethal damage in Rooms 6 through 10 (including during the Chrono-Weaver boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 5 (Goliath-01) with their Room 5 entry loadout (0 augmentations)

#### Scenario: Player eliminated in Sector 3
- **WHEN** the player suffers lethal damage in Rooms 11 through 15 (including during the Vektor-Prime boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 10 (Chrono-Weaver) with their Room 10 entry loadout (1 augmentation)

#### Scenario: Player eliminated in Sector 4
- **WHEN** the player suffers lethal damage in Rooms 16 through 20 (including during the Chrono-Zenith boss encounter)
- **THEN** triggering Rollback respawns the player at the beginning of Room 15 (Vektor-Prime) with their Room 15 entry loadout (2 augmentations)

#### Scenario: Cascading drop-down on repeated defeat
- **WHEN** a player who rolled back to a previous boss dies again in that boss room or subsequent rooms
- **THEN** rollback recalculates from the newly failed room, demoting the player down the checkpoint ladder tier-by-tier until Room 1

#### Scenario: Full run reset from defeat screen
- **WHEN** the player triggers Full Reset (via [Shift+R] or clicking Card 2 in multi-card view, or via [R] / [Shift+R] / clicking the single card in Sector 1) on the defeat screen
- **THEN** the run is abandoned, all augmentations and checkpoint snapshots are cleared, and the game resets to pristine Room 1

#### Scenario: Endless Mode defeat score screen and Apex rollback
- **WHEN** the player is eliminated in Endless Survival Mode
- **THEN** the defeat screen displays the survival performance score (survival time, max threat increment reached, and hostiles eliminated count), Card 1 targets rollback to Room 20 (Chrono-Zenith), and Card 2 targets Full Reset to Room 1
