# Spec Delta

## MODIFIED Requirements

### Requirement: Cataclysm Overload Channel and Line-of-Sight Occlusion
The boss combat system SHALL support a telegraphed Cataclysm Overload channeling state upon shield layer depletion, during which the boss entity anchors in place, gains complete invulnerability to projectile damage, and charges a lethal arena-wide blast that detonates at the Apex of an occluded screen flash unless occluded by solid obstacle geometry. The overload channel and detonation flash sequence SHALL execute strictly in real wall-clock time, unaffected by player locomotion or micro-creep time dilation. During the final window of the channel, the combat arena SHALL render a smooth screen flash ramp-up (~250ms) that is geometrically occluded behind solid obstacles, casting distinct blast shadows across covered safe zones. At the exact moment of channel expiration ($t = 0$), the flash SHALL reach its maximum luminance Apex, where open line-of-sight raycast checks evaluate absolute lethal damage (fatal regardless of player shield charges), escort reinforcements materialize, and boss invulnerability terminates. Following the Apex, the flash SHALL dissipate rapidly along a snappy ramp-down curve (~60–80ms) to restore active combat visibility.

#### Scenario: Boss enters overload channel upon shield depletion
- **WHEN** a boss entity configured with Cataclysm Overload suffers a shield break
- **THEN** the boss anchors at its current position, becomes immune to all incoming projectile damage, emits a hazard aura telegraph, and begins counting down a configured wall-clock channel timer (75 wall-ticks / ~1.25s) that advances in real time regardless of player movement speed or stationary micro-creep

#### Scenario: Hazard warning telegraph displays throughout channel countdown
- **WHEN** the boss entity is actively counting down an overload channel timer
- **THEN** the combat arena renders a pulsating hazard aura and seek-cover advisory text while the boss deflects all incoming projectiles without taking damage, terminating immunity precisely upon channel expiration and Apex detonation

#### Scenario: Projectile deflection during overload channel
- **WHEN** a player projectile strikes the boss while its overload channel or flash ramp-up is actively counting down
- **THEN** the projectile is deflected without inflicting damage or decrementing shields, producing procedural deflection sparks and a metallic audio ping

#### Scenario: Line-of-sight shockwave occlusion behind cover
- **WHEN** the Cataclysm flash reaches its Apex at channel expiration while line-of-sight between the boss and player is obstructed by a solid obstacle
- **THEN** the player is situated within the un-flashed blast shadow, takes 0 damage, consumes 0 shield charges, and deflection sparks erupt across the obstacle face facing the boss

#### Scenario: Lethal shockwave impact in open line-of-sight
- **WHEN** the Cataclysm flash reaches its Apex at channel expiration while line-of-sight between the boss and player is unobstructed by any obstacle
- **THEN** the player receives lethal elimination regardless of remaining reactive shield charges, immediately transitioning the combat arena to the defeat state with full shatter debris and defeat audio

#### Scenario: Escort minion materialization upon channel detonation
- **WHEN** the overload channel timer expires and the flash reaches Apex
- **THEN** configured escort minion reinforcements materialize into the arena as active combat units with initial attack delays

#### Scenario: Pre-fired projectile landing post-channel
- **WHEN** a player discharges a projectile during the overload channel that travels across the arena and impacts the boss after the channel timer has expired and the Apex has detonated
- **THEN** the boss is no longer invulnerable, and the projectile successfully inflicts damage or decrements the subsequent shield layer

#### Scenario: Asymmetric occluded screen flash ramp-up and shadow casting
- **WHEN** the overload channel enters its final duration window (~250ms before detonation)
- **THEN** the combat arena renders a luminous screen flash ramping up from 0 to maximum intensity at Apex, projected from the boss origin and masked against arena obstacles such that visually occluded areas behind cover receive no flash

#### Scenario: Snappy flash dissipation post-Apex
- **WHEN** the detonation Apex occurs and active phase combat begins
- **THEN** the screen flash fades out along a fast ramp-down curve (~60–80ms) that is significantly faster than the ramp-up, rapidly clearing arena visibility as escort minions engage
