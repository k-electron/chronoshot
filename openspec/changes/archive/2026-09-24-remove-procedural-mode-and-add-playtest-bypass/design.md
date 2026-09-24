# Design

## Context

ChronoShot's progression engine is built around discrete room transitions, milestone boss battles, and an endgame survival mode. Previously, `RoomManager` supported two competing modes: an array of 20 hand-built `RoomConfig`s, or a dynamic procedural generator (`LevelDirector`). When `LevelDirector` was used via `?mode=endless`, Room 20 could never complete normally: upon boss elimination, `advanceRoom()` generated Room 21+ rather than setting `gameCompleted = true` and displaying the Mission Accomplished overlay.

See `proposal.md` for motivation and scope boundaries.

## Goals / Non-Goals

**Goals:**
- Eliminate `LevelDirector`, `EncounterDirector`, Mulberry32 PRNG, and 5 unused layout templates without regressing the 20-room campaign or Endless Protocol.
- Make `EndlessDirector` completely self-contained by hosting its own threat costs and archetype timing configurations.
- Provide a clean, testable `Arena.bypassToCampaignVictory()` method that configures the combat arena into the exact post-Zenith state as beating Room 20.
- Wire `urlParams.has("skip")` in `main.ts` to trigger this bypass on startup.

**Non-Goals:**
- Modifying the combat mechanics of Rooms 1–20 or milestone bosses.
- Modifying the wave escalation math or candidate spawner algorithms in `EndlessDirector`.
- Modifying the layout or visual presentation of `VictoryHUD`.

## Decisions

### Decision 1: Relocate `THREAT_COSTS` & `ARCHETYPE_CONFIGS` into `EndlessDirector.ts`
- **Rationale**: `EndlessDirector` is the only active system that relies on these values (for summing active threat load and scheduling materialization delays). Placing them directly in `EndlessDirector.ts` avoids creating a pointless intermediate file and allows `EncounterDirector.ts` to be completely removed.
- **Alternatives Considered**:
  - *Keep `EncounterDirector.ts` as a constants file*: Leaves confusing legacy naming for what is now just two dictionaries.
  - *Move constants to `Enemy.ts`*: Adds level-spawner threat cost metadata to core unit physics definitions.

### Decision 2: Implement `Arena.bypassToCampaignVictory()`
- **Rationale**: Providing a first-class method on `Arena` ensures the bypass state is fully unit-testable and reusable without relying on synthetic browser events.
- **Implementation State**:
  - `roomManager.currentRoomIndex` set to 19 (Room 20).
  - `roomManager.advanceRoom()` invoked on Room 20 (or manually setting `gameCompleted = true`).
  - `arena.loadRoom(roomManager.getCurrentRoom())` loads Room 20 (The Apex Redoubt) geometry.
  - `arena.enemies` cleared / marked non-alive.
  - `arena.player.setLoadoutFromIds(["extended-cylinder", "speed-loader", "reactive-shield"])`.
  - `arena.player.weapon.ammo = 8`.
  - `arena.player.shields = 1`.
  - Pre-boss checkpoint loadouts populated:
    - Room 5: `[]`
    - Room 10: `["extended-cylinder"]`
    - Room 15: `["extended-cylinder", "speed-loader"]`
    - Room 20: `["extended-cylinder", "speed-loader", "reactive-shield"]`
  - `arena.status = "victory"`.
- **Alternatives Considered**:
  - *Fast-forward simulation through Rooms 1–20*: Slow, non-deterministic, and fragile.
  - *Mock URL inside `main.ts` without Arena method*: Untestable in Vitest without full browser DOM mocks.

### Decision 3: Clean `RoomManager` into a Strict Sequence Coordinator
- **Rationale**: Without procedural mode, `RoomManager` only needs to maintain an array of `RoomConfig`s, advance from index 0 to 19, flag `gameCompleted = true` on index 19, and transition to Room 21 upon `startEndlessMode()`.
- **Changes**:
  - Constructor: `constructor(rooms?: RoomConfig[])` defaulting to `createStandardRoomSequence()`.
  - Remove property `public readonly levelDirector?: LevelDirector`.
  - Simplify `isEndlessMode()`: `return this.endlessDirector !== undefined;`.
  - Simplify `hasNextRoom()`: `return this.endlessDirector !== undefined || this.currentRoomIndex < this.rooms.length - 1;`.
  - Remove all dynamic generation loops in `advanceRoom()`, `rollbackToCheckpoint()`, and `restartGame()`.

### Decision 4: Delete 5 Unused Layout Templates
- **Rationale**: `CenterPillarsTemplate`, `TwinBunkersTemplate`, `SplitCorridorTemplate`, `KillboxLanesTemplate`, and `ArenaQuadrantTemplate` were only sampled by `LevelDirector`. None of the 20 handcrafted rooms use them.
- **Preserved Templates**:
  - `ApexRedoubtTemplate`: Obstacles used by Room 20.
  - `ApexColosseumTemplate`: Obstacles, spawn points, and portal coordinates used by Room 21 (Endless Protocol).

```
========================================================================================
                          TARGET PROGRESSION LIFECYCLE
========================================================================================

  [ ?skip Flag ] ----------------------------------------------+
                                                               |
  [ New Game ] ---> [ Rooms 01-19 ]                            v
                           |                         +-------------------+
                     (Portal Enter)                  |  POST-ZENITH R20  |
                           |                         |  VICTORY STATE    |
                           v                         |                   |
                    [ Room 20: Apex Redoubt ]        | - status: victory |
                           |                         | - gameCompleted   |
                    (Eliminate Zenith)               | - 3 Augmentations |
                           |                         +-------------------+
                           +---------------------------------->|
                                                               |
                                            +------------------+------------------+
                                            |                                     |
                                            v                                     v
                                    [ CARD 0: ENDLESS ]                   [ CARD 1: RESET ]
                                     (Key [E] / [Space])                   (Key [R] / [Shift+R])
                                            |                                     |
                                            v                                     v
                                    [ Room 21 Colosseum ]                 [ Room 01 Reset ]
                                    - All 7 Augmentations                 - Clean Loadout
                                    - 3 Shields / 8 Ammo                  - 0 Augmentations
                                    - EndlessDirector Spawning            - 6-chamber revolver
```

## Risks / Trade-offs

- **[Risk] Test suite failures from missing `LevelDirector` or template imports** → *Mitigation*: Audit all test imports before deletion. Remove obsolete test suites (`LevelDirector.test.ts`, `EncounterDirector.test.ts`) and prune obsolete template test cases from `templates.test.ts`.
- **[Risk] Regression in `EndlessDirector` threat scaling** → *Mitigation*: Ensure `THREAT_COSTS` and `ARCHETYPE_CONFIGS` transferred into `EndlessDirector.ts` match existing numerical values exactly. Verify with `EndlessDirector.test.ts`.
- **[Risk] State discrepancy when transitioning from bypass to Endless Protocol** → *Mitigation*: Automated integration tests verify that selecting Card 0 after bypass produces identical player stats (all 7 augmentations, 3 shields, 8 ammo) and room configuration as a real victory.
