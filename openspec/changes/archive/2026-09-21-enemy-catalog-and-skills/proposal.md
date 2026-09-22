# Proposal

## Why

Currently, hostiles in ChronoShot are completely stationary and 1-hit kill targets, which limits the combat puzzle space to basic line-of-sight checks and static cover shooting. Introducing a catalog of 5 differentiated enemy archetypes with 40px grid A* pathfinding, hit-count shield durability, distinct ballistic profiles, and telegraphed firing behaviors deepens tactical decision-making, elevates revolver cylinder management, and expands puzzle progression to a full 5-room campaign.

## What Changes

- **Enemy Catalog & Archetypes**: Introduce 5 distinct enemy archetypes (Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, and Marksman Sniper) differentiated simultaneously across mobility, shields, weapons, and firing behaviors.
- **Pathing AI & Navigation**: Implement a 40px tile grid A* pathfinder navigating obstacles with unit clearance buffers when line-of-sight is blocked, transitioning to smooth line-of-sight vector steering when unblocked.
- **Shield Durability System**: Implement hit-count shield barriers that absorb discrete projectile hits with procedural visual barrier rings and audio deflection feedback before units become vulnerable to lethal elimination.
- **Ballistic Profiles & Telegraphing**: Support variable weapon cadences, high-velocity sniper fire, and telegraphed charge states (e.g. charging red sightline laser for Marksman and discharge stutter steps).
- **Audio & Particle FX**: Add procedural audio synthesis (`playShieldDeflect`, `playShieldBreak`, `playSniperCharge`) and radiant barrier impact/shatter spark systems with zero external audio assets.
- **5-Room Campaign Redesign**: Expand room progression from 3 to 5 tactical puzzle rooms, redesigning layouts to showcase each archetype and teach advanced time dilation, cylinder economy, and cover mechanics.
- **BREAKING**: Modify the universal 1-hit kill rule to account for shield durability on shielded enemy units. Player lethality remains strictly 1-hit.

## Capabilities

### Modified Capabilities
- `combat-arena`: Modify enemy archetype behaviors, navigation/pathing requirements, shield durability rules, and 5-room tactical puzzle progression.

## Impact

- `src/entities/Enemy.ts`: Extends `EnemyConfig` and `Enemy` class with movement velocity, pathing state, shield hitpoints, weapon profiles, and telegraphed firing states.
- `src/engine/GridPathfinder.ts` (new): 24x16 tile grid A* pathfinder with obstacle inflation.
- `src/entities/Projectile.ts`: Updates unit collision resolution to support shield damage before lethal elimination.
- `src/entities/Arena.ts`: Coordinates enemy movement physics, shield rendering, laser telegraph rendering, and 5-room win conditions.
- `src/audio/SoundSynthesizer.ts`: Adds procedural Web Audio synthesizers for shield hits, shield breaks, and sniper laser charges.
- `src/entities/ParticleSystem.ts`: Adds radiant barrier spark effects.
- `src/levels/Room.ts` & `src/levels/RoomManager.ts`: Expands from 3 to 5 room configs and updates level progression tests.
