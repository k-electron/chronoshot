# Proposal

## Why

In the current implementation of Chrono-Zenith (Room 20 climax), the Cataclysm Overload shockwave and escort minion spawns execute immediately upon shield break rather than at the conclusion of the overload channel. This inverts the encounter sequence: players in the open die with zero warning, players behind cover are safe before the channel even begins, and the warning aura appears after the blast instead of before it. Aligning this sequence with the `boss-encounters` specification restores player agency and re-establishes the core tactical mechanic: budgeting simulation movement ticks to sprint behind cover while the boss channels.

## What Changes

- **Boss Phase Controller Lifecycle**: Add an `onOverloadDetonate` lifecycle hook to `BossPhaseConfig` and invoke it in `BossPhaseController.update()` when `overloadTicksRemaining` transitions from `> 0` to `0`.
- **Chrono-Zenith Blueprint Reconfiguration**: Move `createCataclysmPulse`, `createMinionEscortSpawn`, and transition audio cues out of `onPhaseExit` of preceding phases and into `onOverloadDetonate` for Phase 1 (75 ticks), Phase 2 (65 ticks), and Phase 3 (60 ticks).
- **Encounter Synchronization**: Ensure the hazard warning aura (`"⚠ CATACLYSM OVERLOAD // SEEK COVER ⚠"`) pulses during the active channel leading up to the detonation blast and escort arrival.
- **Architectural Documentation**: Update `AGENTS.md` and related docs to describe the modular `onOverloadDetonate` hook and the Chrono-Zenith channel-then-detonate lifecycle.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `boss-encounters`: Clarifies the precise execution sequence of Cataclysm Overload transitions, ensuring the hazard aura and projectile invulnerability occur during the countdown channel, followed by shockwave line-of-sight detonation and escort materialization strictly upon timer expiration.

## Impact

- **Affected Files**:
  - `src/entities/boss/BossPhaseController.ts`: `BossPhaseConfig` interface and `update()` countdown check.
  - `src/entities/boss/BossBlueprint.ts`: `CHRONO_ZENITH_BLUEPRINT` phase hooks.
  - `AGENTS.md`: Boss architecture documentation.
- **Tests**:
  - Unit tests in `BossPhaseController.test.ts` for `onOverloadDetonate` timing.
  - Blueprint tests in `BossBlueprint.test.ts`.
  - Integration tests in `Enemy.test.ts` and `Arena.test.ts` for full channel-to-detonation tactical flow.
