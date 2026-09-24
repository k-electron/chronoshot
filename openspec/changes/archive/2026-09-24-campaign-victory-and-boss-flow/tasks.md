# Tasks: Campaign Victory Screen & Boss Encounter Flow Alignment

## 1. Boss Arena Floor Portal Suppression

- [x] 1.1 Update `RoomManager.renderPortal()` in `src/levels/RoomManager.ts` to suppress floor portal rendering when `isBossRoom()` or `isEndlessMode()` is true, and verify with unit tests in `src/levels/RoomManager.test.ts`.
- [x] 1.2 Deprecate or remove unused golden portal rendering logic from `RoomManager.ts`, ensuring standard rooms render normally and boss rooms remain clean.

## 2. Final Boss Elimination Flow & Campaign Victory Trigger

- [x] 2.1 Update `Arena.ts` lethal projectile collision logic to distinguish intermediate bosses (Rooms 5, 10, 15) from final boss Chrono-Zenith (Room 20), suppressing the intermediate upgrade draft on Zenith defeat and immediately triggering `this.status = "victory"` and `roomManager.advanceRoom()`.
- [x] 2.2 Verify intermediate boss defeat continues to invoke `this.openUpgradeDraft()` and auto-advances to the subsequent sector room upon upgrade selection in `src/entities/Arena.test.ts`.

## 3. Modular Dual-Card Campaign Victory HUD & Input Integration

- [x] 3.1 Design and implement modular dual-card victory overlay in `src/ui/VictoryHUD.ts` (or `RoomManager.renderGameVictory()`), rendering the 20-protocol headline, 4 milestone boss checkmarks, and dual interactive cards:
  - Card 1: `ENTER ENDLESS PROTOCOL` (`[E]` / `[Space]` / mouse click)
  - Card 2: `EXPEDITION RESET` (`[R]` / `[Shift+R]` / mouse click)
  - With hover bounding box checks and Swiss-style hairline highlights.
- [x] 3.2 Wire mouse hover, pointer cursor, click detection, and keyboard handlers (`[E]`, `[Space]`, `[R]`, `[Shift+R]`) for victory state in `src/entities/Arena.ts` and `src/main.ts`.
- [x] 3.3 Add unit tests in `src/entities/Arena.test.ts` and `src/levels/RoomManager.test.ts` validating card bounding boxes, hover tracking, cursor state, endless launch via Card 1, and expedition reset via Card 2.

## 4. Documentation & Markdown Updates

- [x] 4.1 Update `AGENTS.md` to reflect the updated progression architecture: portal-based regular rooms vs. elimination-based boss rooms, the elimination of zombie portals, and the victory screen gateway into Endless Survival Mode.
- [x] 4.2 Update `README.md` to clarify the 20-room campaign victory flow, milestone achievements, and post-campaign Endless Mode entry.
- [x] 4.3 Run `openspec validate campaign-victory-and-boss-flow --strict` and `npm test` to ensure full spec compliance and complete test suite passes.
