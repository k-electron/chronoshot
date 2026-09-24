# Spec Delta

## MODIFIED Requirements

### Requirement: Cataclysm Overload Channel and Line-of-Sight Occlusion
The boss combat system SHALL support a telegraphed Cataclysm Overload channeling state upon shield layer depletion, during which the boss entity anchors in place, gains complete invulnerability to projectile damage, and charges a lethal arena-wide shockwave that detonates after a configured tick duration unless occluded by solid obstacle geometry. During the channel countdown, the combat arena SHALL display an active hazard telegraph warning aura advising players to seek cover. Escort reinforcements configured for the transition and the lethal shockwave discharge SHALL occur strictly upon channel timer expiration. Upon detonation, open line-of-sight lethal impact SHALL immediately trigger player elimination with defeat state synchronization in the combat arena.

#### Scenario: Boss enters overload channel upon shield depletion
- **WHEN** a boss entity configured with Cataclysm Overload suffers a shield break
- **THEN** the boss anchors at its current position, becomes immune to all incoming projectile damage, emits an expanding hazard aura telegraph, and begins counting down a configured simulation-tick channel timer (75 ticks in phase one)

#### Scenario: Hazard warning telegraph displays throughout channel countdown
- **WHEN** the boss entity is actively counting down an overload channel timer
- **THEN** the combat arena renders a pulsating hazard aura and perimeter warning with seek-cover advisory text, which terminates immediately upon channel detonation

#### Scenario: Projectile deflection during overload channel
- **WHEN** a player projectile strikes the boss while its overload channel is actively counting down
- **THEN** the projectile is deflected without inflicting damage or decrementing shields, producing procedural deflection sparks and a metallic audio ping

#### Scenario: Line-of-sight shockwave occlusion behind cover
- **WHEN** the overload channel timer elapses and the Cataclysm shockwave discharges
- **THEN** the combat arena performs raycast line-of-sight collision checks between the boss center and the player hitbox against all arena obstacles; if line-of-sight is obstructed by an obstacle, the player takes 0 damage and deflection sparks emit at the obstacle perimeter

#### Scenario: Lethal shockwave impact in open line-of-sight
- **WHEN** the Cataclysm shockwave discharges while line-of-sight between the boss and player is unobstructed by any obstacle
- **THEN** the player receives lethal damage or consumes exactly one reactive shield charge, and if lethal damage is inflicted, the combat arena immediately transitions to the defeat state with full shatter debris and defeat audio

#### Scenario: Escort minion materialization upon channel detonation
- **WHEN** the overload channel timer expires and the shockwave detonates
- **THEN** configured escort minion reinforcements materialize into the arena as active combat units with initial attack delays

#### Scenario: Pre-fired projectile landing post-channel
- **WHEN** a player discharges a projectile during the overload channel that travels across the arena and impacts the boss after the channel timer has expired and the shockwave has detonated
- **THEN** the boss is no longer invulnerable, and the projectile successfully inflicts damage or decrements the subsequent shield layer
