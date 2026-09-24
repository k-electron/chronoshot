# Proposal: Campaign Victory Screen & Boss Encounter Flow Alignment

## Why

The 20-room campaign currently culminates in Room 20 without ever displaying the built-in `MISSION ACCOMPLISHED` victory screen because the Room 20 portal logic immediately jumps into Endless Mode, bypassing the campaign victory sequence. Furthermore, defeating Chrono-Zenith currently pops an upgrade draft whose selection is immediately overwritten by Endless Mode's full 7-augmentation injection moments later, and all boss rooms render inactive "zombie" locked portals on the floor that serve no gameplay purpose.

Aligning the boss completion flow ensures that intermediate bosses (Rooms 5, 10, 15) smoothly offer upgrade drafts and advance to the next sector, while the final boss (Room 20) triggers the `MISSION ACCOMPLISHED` victory screen with dual interactive options: launching into Endless Survival Mode or resetting the expedition.

## What Changes

- **Boss Arena Portal Cleanup**: Floor exit portals are suppressed in all boss rooms (Rooms 5, 10, 15, 20) and in Endless Survival Mode (Apex Colosseum), eliminating locked "zombie" portal visual noise during high-intensity combat.
- **Intermediate Boss Flow (Rooms 5, 10, 15)**: Preserves the immediate upgrade draft popup upon boss core destruction, auto-loading the subsequent sector upon card selection without requiring any floor portal.
- **Final Boss Triumph & Victory Screen (Room 20)**:
  - Destroys Chrono-Zenith's core and immediately triggers the `MISSION ACCOMPLISHED` campaign victory screen, celebrating all 20 tactical protocols conquered and all 4 milestone bosses defeated.
  - Suppresses the redundant intermediate upgrade draft in Room 20.
  - Replaces the single restart prompt on the victory screen with interactive dual cards (mirroring the Defeat HUD layout):
    - **Card 1 / Key [E] or [Space]**: "ENTER ENDLESS PROTOCOL" — launches into Endless Survival Mode (Apex Colosseum) with full 7-upgrade loadout injection, 3 shields, and 8 ammo.
    - **Card 2 / Key [R] or [Shift+R]**: "EXPEDITION RESET" — resets the expedition back to Room 1.
- **Spec & Documentation Harmonization**: Resolves the contradiction in `procedural-levels` and `boss-encounters` regarding whether Room 20 concludes with a victory screen or a seamless floor portal warp. Updates documentation (`AGENTS.md`, `README.md`) to reflect the unified lifecycle.

## Capabilities

### Modified Capabilities

- `combat-arena`: Suppresses floor exit portals during boss encounters and Endless Mode, and routes Room 20 final boss destruction directly to the campaign victory sequence instead of floor portal collision.
- `procedural-levels`: Updates Room 20 completion to trigger the multi-card campaign victory screen with selectable Endless Mode handoff, and removes obsolete floor portal stepping requirements for Room 20.
- `boss-encounters`: Updates Chrono-Zenith Phase 4 core destruction behavior to trigger immediate campaign victory rather than unlocking a golden floor portal.

## Impact

- **Affected Systems**: `Arena.ts`, `RoomManager.ts`, `DefeatHUD.ts` / victory card layout, `main.ts`, and associated unit tests (`Arena.test.ts`, `RoomManager.test.ts`).
- **Dependencies**: No external dependencies. Retains deterministic Canvas 2D rendering and procedural Web Audio synthesis.
- **Documentation**: Updates `AGENTS.md` and `README.md` to reflect the clean separation of tactical rooms (portal-based) vs. boss rooms (elimination-based) and the victory-screen gateway to Endless Mode.
