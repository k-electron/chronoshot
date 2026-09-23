# Design

## Context

ChronoShot's existing elimination workflow in `Arena.ts` and `RoomManager.ts` unconditionally resets progress:
1. `takeDamage()` sets `this.status = "defeat"`.
2. `render()` renders a static "PROTOCOL TERMINATED" defeat screen.
3. Any press of `KeyR` or mouse down triggers `restart()`, which invokes `roomManager.restartGame()` (setting `currentRoomIndex = 0`) and `player.clearAugmentations()`.

To fulfill the requirements outlined in [proposal.md](proposal.md) and [specs/combat-arena/spec.md](specs/combat-arena/spec.md), we introduce a modular checkpoint and rollback architecture decoupled across `RoomManager`, `Arena`, and `Player`.

## Goals / Non-Goals

**Goals:**
- Provide a deterministic rollback resolution function mapping `(currentRoomNumber, isEndless)` to the appropriate target boss room (or Room 1).
- Implement clean loadout snapshotting upon entering milestone boss rooms (Rooms 5, 10, 15, and 20) so rolling back restores the exact pre-boss upgrade slate.
- Deliver an interactive, responsive dual-card defeat screen (`Card 1: Rollback` vs `Card 2: Full Reset`) supporting keyboard shortcuts (`R`, `Shift+R`), mouse hover glows, and mouse click activation.
- Display a comprehensive Endless Mode score summary on defeat (Survival Time, Max Threat reached, Hostiles Neutralized) with an Apex Rollback targeting Room 20.

**Non-Goals:**
- Persistent cloud or disk saves: Checkpoint state is session-scoped (in-memory for the active runtime session).
- Mid-room state checkpoints: Checkpoints always restore to the beginning of the target room with full health/shields and refilled revolver cylinders.

## Decisions

### Decision 1: Pure Function for Cascading Rollback Target Resolution
We introduce a standalone resolution helper in `RoomManager` (or `levels/RollbackCalculator.ts`):
```typescript
export interface RollbackTarget {
  roomNumber: number;
  roomIndex: number;
  bossName: string;
  loadoutDescription: string;
}

export function computeRollbackTarget(currentRoomNumber: number, isEndless: boolean): RollbackTarget {
  if (isEndless) {
    return {
      roomNumber: 20,
      roomIndex: 19,
      bossName: "CHRONO-ZENITH",
      loadoutDescription: "Restores Sector 4 loadout (3 Augmentations)",
    };
  }
  if (currentRoomNumber <= 5) {
    return {
      roomNumber: 1,
      roomIndex: 0,
      bossName: "BASIC COVER",
      loadoutDescription: "Full expedition reset (0 Augmentations)",
    };
  }
  if (currentRoomNumber <= 10) {
    return {
      roomNumber: 5,
      roomIndex: 4,
      bossName: "GOLIATH-01",
      loadoutDescription: "Restores Sector 1 entry loadout (0 Augmentations)",
    };
  }
  if (currentRoomNumber <= 15) {
    return {
      roomNumber: 10,
      roomIndex: 9,
      bossName: "CHRONO-WEAVER",
      loadoutDescription: "Restores Sector 2 entry loadout (1 Augmentation)",
    };
  }
  return {
    roomNumber: 15,
    roomIndex: 14,
    bossName: "VEKTOR-PRIME",
    loadoutDescription: "Restores Sector 3 entry loadout (2 Augmentations)",
  };
}
```
*Rationale*: A pure function is easily tested with 100% branch coverage and ensures single-source-of-truth across HUD rendering and execution logic.

### Decision 2: Loadout Snapshotting on Boss Room Ingress
In `Arena.loadRoom(room)`:
Whenever `room.roomNumber` is one of `[5, 10, 15, 20]` (or `room.enemies.some(e => e.type === "boss")`), if no snapshot exists yet for this room in `this.checkpointLoadouts`, we record:
```typescript
this.checkpointLoadouts.set(room.roomNumber, [...this.player.upgradePipeline.getActiveIds()]);
```
When rolling back:
1. `Arena.rollbackToCheckpoint()` retrieves the target from `computeRollbackTarget`.
2. It sets `roomManager` to the target room index.
3. It clears the player's augmentations, and re-applies each upgrade ID present in `this.checkpointLoadouts.get(targetRoomNumber) ?? []`.
4. It calls `this.loadRoom(targetRoom)`.

*Alternative considered*: Keeping whatever upgrades the player currently has upon rollback.
*Rejected because*: Re-defeating the boss would trigger a new upgrade draft, multiplying player upgrades and breaking game balance.

### Decision 3: Dual-Card UI & Cursor Routing
In `Arena.render()` during `this.status === "defeat"`:
- Render two distinct rectangular cards side-by-side:
  - **Left Card (Rollback)**: Center `(width / 2 - 120)`, dimensions `220x150`. Cyan accent border, glowing cyan when hovered.
  - **Right Card (Full Reset)**: Center `(width / 2 + 120)`, dimensions `220x150`. Crimson accent border, glowing crimson when hovered.
- `Arena.getDesiredCursor(mousePos)` returns `"pointer"` when `this.status === "defeat"` and mouse coordinates overlap either card.
- `Arena.step()` detects card clicks: clicking Left Card initiates Rollback; clicking Right Card initiates Full Reset.
- Keyboard: `input.restart` without Shift triggers Rollback; with Shift triggers Full Reset.

### Decision 4: Endless Score Telemetry on Defeat Screen
When `this.endlessDirector` is active or was active at death:
- Render header banner:
  `SURVIVED: MM:SS // MAX THREAT: <budget> // HOSTILES ELIMINATED: <kills>`
- Rollback card dynamically targets Room 20: `APEX ROLLBACK // ROOM 20 (CHRONO-ZENITH)`.

## Risks / Trade-offs

- **[Risk] Accidental Full Reset**: Players might press `R` expecting a reset and inadvertently skip rollback, or vice versa.
  → *Mitigation*: `R` defaults to the forgiving action (**Rollback**). A full run reset requires intentional `Shift+R` or an explicit click on Card 2.
- **[Risk] Boss Progression Desync in Dynamic LevelDirector**: If LevelDirector is generating rooms dynamically, indexing must remain aligned.
  → *Mitigation*: Milestone boss rooms in `LevelDirector` are fixed at room numbers divisible by 5 (5, 10, 15, 20), identically matching `computeRollbackTarget`.
