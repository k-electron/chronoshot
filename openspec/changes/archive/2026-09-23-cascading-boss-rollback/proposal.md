# Proposal

## Why

Currently, ChronoShot enforces pure permadeath across its 20-room campaign: a single stray bullet in Sector 3 or 4 obliterates all progress and resets the player back to Room 1 with zero augmentations. For a tactical puzzle-shooter with discrete 1-hit lethality, this penalty creates fatigue without added depth.

This change introduces a session-scoped cascading boss checkpoint rollback mechanic and a dual-card defeat interface. When eliminated, players can roll back to the beginning of the preceding sector's boss fight (or Room 1 if in Sector 1), re-proving their mastery against the boss to push forward, while preserving high stakes through cascading demotions upon repeated failure.

## What Changes

- **Cascading Boss Rollback Logic**:
  - Elimination in Rooms 1–5 (including during Goliath-01) rolls back to the beginning of **Room 1** (0 augmentations).
  - Elimination in Rooms 6–10 (including during Chrono-Weaver) rolls back to the beginning of **Room 5** (Goliath-01) with 0 augmentations.
  - Elimination in Rooms 11–15 (including during Vektor-Prime) rolls back to the beginning of **Room 10** (Chrono-Weaver) with 1 augmentation.
  - Elimination in Rooms 16–20 (including during Chrono-Zenith) rolls back to the beginning of **Room 15** (Vektor-Prime) with 2 augmentations.
  - Elimination in Endless Mode rolls back to the beginning of **Room 20** (Chrono-Zenith) with 3 augmentations.
  - **Cascading Drop-down**: Repeated deaths evaluate the room in which the player just died, allowing repeated failure to knock the player down tier-by-tier back to Room 1.
- **Augmentation & Loadout Snapshotting**:
  - Automatically records player augmentations upon first entering each milestone boss room (Rooms 5, 10, 15, and 20).
  - On rollback, restores the player's augmentation set to the target boss room's entry snapshot, enabling fresh drafting upon re-defeating the boss without perk duplication exploits.
- **Dual-Card Defeat Screen UI**:
  - Replaces single restart prompt with two interactive Swiss-style cards:
    - **Card 1: Rollback** (`[R]` key or mouse click) – Respawns at the computed boss checkpoint with targeted sector context.
    - **Card 2: Full Reset** (`[Shift+R]` key or mouse click) – Abandons the run and re-initializes from Room 1.
  - Supports hover highlighting, active cursor updates (`pointer`), and discrete mouse click detection.
- **Endless Mode Survival Score Screen**:
  - On Endless Mode defeat, displays the survival score summary (Max Threat Budget reached, Elapsed Survival Time MM:SS, and Hostiles Neutralized count).
  - Provides the same two defeat cards: Rollback to Room 20 vs Full Reset to Room 1.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `combat-arena`: Modify `One-Hit Lethality and Instant Room Reset` to support cascading boss checkpoint rollbacks, session loadout state restoration, and the interactive dual-card defeat screen (with Endless Mode score breakdown).

## Impact

- **Entities & State**: `Arena.ts` tracks defeat card hover/click bounds, rollback execution, and snapshot loadout restoration; `RoomManager.ts` manages checkpoint target resolution and rollback transitions; `Player.ts` supports restoring specific augmentation configurations.
- **UI & Controls**: `Arena.render()` renders the 2-card defeat overlay for both campaign and Endless mode, and handles `R`, `Shift+R`, mouse move, and mouse click interactions during `defeat`.
- **Tests**: Comprehensive unit test additions covering rollback room calculations, cascading drop-down sequences, loadout snapshotting, and defeat screen card interactions.
