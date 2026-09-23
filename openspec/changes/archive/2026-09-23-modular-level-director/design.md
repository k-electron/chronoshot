# Design: Modular Level Director & Procedural Room Generator

## Context

ChronoShot's core gameplay loop revolves around high-stakes tactical positioning where time advances only when the player moves. In Phases 1–3, enemy movement/attack behaviors, boss phase state machines, and player tactical upgrades were refactored into composable, data-driven building blocks. 

Currently, level progression in `src/levels/Room.ts` is composed of 9 handcrafted static functions (`createRoom1` to `createRoom9`). While these teach mechanics effectively, they cannot produce varied or endless encounters. By introducing modular room layout templates, a threat-budget encounter director, and a deterministic level generator, ChronoShot gains infinite procedural replayability while preserving the curated campaign intact.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Define a declarative `RoomLayoutTemplate` interface supporting tactical cover generation, validated player spawn points, exit portals, and dedicated enemy spawn zones.
- Implement a library of tactical geometry templates (`CenterPillars`, `TwinBunkers`, `SplitCorridor`, `KillboxLanes`, `ArenaQuadrant`).
- Implement `EncounterDirector` with a threat-budget point-buy system (Grunt = 10, Shotgun = 20, Stalker = 25, Warden = 35, Sniper = 40) enforcing tactical composition rules (min player distance 280px, max 2 snipers, escort rules, 48px enemy separation).
- Implement `LevelDirector` with a seedable PRNG (Mulberry32) for reproducible daily runs, dynamic sector scaling, and milestone boss injection.
- Extend `RoomManager` to optionally consume a `LevelDirector` or dynamic generator for endless room progression.
- Maintain 100% backward compatibility for all existing room definitions, campaign runs, and tests.

**Non-Goals:**
- Freeform 2D grid dungeon crawling or interconnected multi-door room graphs (ChronoShot is an arena-to-arena tactical shooter).
- Destructible cover or procedural terrain deformation (walls remain static geometric obstacles).

## Decisions

### 1. Declarative Layout Templates & Spawn Zones
```ts
export interface SpawnZone {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RoomLayoutTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly playerSpawn: Vector2D;
  readonly exitPortal: ExitPortal;
  readonly buildObstacles: (arenaWidth: number, arenaHeight: number) => Obstacle[];
  readonly enemySpawnZones: SpawnZone[];
}
```
- **Rationale**: Separates structural geometry (cover barriers, entrance, exit) from enemy squad composition. Spawn zones guarantee that enemies never spawn inside walls or right next to the player, eliminating spawn frags.
- **Alternatives Considered**: Random obstacle placement with collision rejection. Rejected because random polygons often generate unfair choke points, block line-of-sight unfairly, or trap units. Hand-authored modular templates guarantee high tactical quality.

### 2. Threat-Budget Encounter Generation (`EncounterDirector`)
```ts
export const THREAT_COSTS: Record<EnemyType, number> = {
  grunt: 10,
  shotgun: 20,
  stalker: 25,
  warden: 35,
  sniper: 40,
  boss: 120,
};
```
- **Budget Scaling Formula**:
  $$\text{Budget}(N) = 15 + N \times 15$$
  - Room 1 ($N=0$): Budget 15 -> 1 Grunt (10)
  - Room 2 ($N=1$): Budget 30 -> 1 Shotgun Guard (20) + 1 Grunt (10)
  - Room 3 ($N=2$): Budget 45 -> 1 Stalker (25) + 2 Grunts (20)
  - Room 5 ($N=4$): Milestone Boss (Goliath-01 + Escorts)
- **Tactical Composition Rules**:
  - `maxSnipers = 2`: Prevents unnavigable sniper bullet hell.
  - `requireEscort`: If snipers are picked, ensure at least one aggressive frontliner is spawned.
  - `minPlayerDistance = 280px`: Enforces fair reaction window upon room start.
  - `minUnitSeparation = 48px`: Prevents unit overlap.

### 3. Deterministic Seedable PRNG & `LevelDirector`
```ts
export class LevelDirector {
  constructor(config?: LevelDirectorConfig);
  public generateRoom(roomNumber: number, seed?: string | number): RoomConfig;
  public generateSector(sectorNumber: number, roomCount?: number, seed?: string | number): RoomConfig[];
}
```
- **PRNG**: Mulberry32 (32-bit state, fast, zero external dependencies, perfectly reproducible across all browser platforms).
- **Milestone Boss Injection**: Every 5th room is automatically configured as a milestone boss encounter using `BossBlueprint` (e.g. `GOLIATH_01_BLUEPRINT` or `CHRONO_WEAVER_BLUEPRINT`) with scaled escorts and post-defeat upgrade draft triggers.

### 4. Dynamic `RoomManager` Extension
- `RoomManager` constructor updated to optionally accept:
  ```ts
  constructor(roomsOrDirector?: RoomConfig[] | LevelDirector);
  ```
- If a `LevelDirector` is supplied:
  - `hasNextRoom()` always returns `true` (enabling endless survival mode).
  - `advanceRoom()` generates the next room dynamically and increments `currentRoomIndex`.
- If an array of `RoomConfig` is supplied (or omitted):
  - Preserves existing behavior identically with the 9-room campaign.

## Risks / Trade-offs

- **[Risk] Enemies spawning inside obstacle geometry or out of arena bounds**  
  → *Mitigation*: `EncounterDirector` validates candidate coordinates against the template's obstacle AABBs and circles using `testCircleAABB`, retrying up to 20 attempts per unit or falling back to safe zone centers.
- **[Risk] Unbeatable encounter generation at high budgets**  
  → *Mitigation*: Hard caps on elite units (max 2 marksmen, max 2 wardens) and max unit density per room (cap at 6 units) ensure readable, twitch-puzzle combat.
- **[Risk] Regression in existing campaign tests**  
  → *Mitigation*: `createStandardRoomSequence()` and default `new RoomManager()` remain completely unchanged.
