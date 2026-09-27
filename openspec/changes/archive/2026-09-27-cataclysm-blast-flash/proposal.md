# Proposal

## Why

During the Room 20 Chrono-Zenith final boss encounter, the Cataclysm Overload explosion has no visual blast indication, creating an invisible hitscan elimination that leaves players confused about how they died or why cover protected them. Furthermore, reactive shield charges can currently absorb the blast, dulling the intended cover-or-die tactical tension, and time dilation slows down what should be an urgent real-time scramble for cover.

## What Changes

- **Occluded Screen Flash**: Replace the invisible hitscan/local particle burst with an arena-wide screen flash that respects obstacle geometry; areas visually blocked behind bastions receive zero flash, creating distinct dark "blast shadow cones" that make the safe zones and lethal blast volume immediately clear.
- **Asymmetric Flash Timing & Channel Bound**: The flash ramp-up (~250ms) occurs during the final window of the overload channel; the Apex (maximum luminance) hits precisely at channel expiration ($t = 0$), where the line-of-sight check is evaluated; the ramp-down (~60–80ms) dissipates rapidly so players immediately regain active combat vision.
- **Lethal Regardless of Shields**: Open line-of-sight exposure at the Apex is fatal regardless of remaining shield charges, bypassing reactive shield absorption.
- **Real-Time (Wall-Clock) Execution**: The overload channel countdown and screen flash sequence run strictly in wall-clock time, unaffected by player locomotion or micro-creep time dilation.
- **Boss Immunity Clean Seam**: Chrono-Zenith is anchored and 100% immune to damage throughout the channel and the ramp-up, with immunity terminating cleanly at the Apex when active phase combat resumes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `boss-encounters`: Update the Cataclysm Overload requirement to mandate wall-clock real-time channel progression, absolute shield-bypassing lethality in open line-of-sight at the detonation Apex, and occluded screen flash blast rendering that casts blast shadows behind solid cover obstacles.

## Impact

- **Entities & Boss Engine**:
  - `src/entities/boss/BossPhaseController.ts`: Advance `overloadTicksRemaining` in wall-clock delta time; synchronize apex detonation trigger with channel expiry.
  - `src/entities/boss/BossTransitionAction.ts`: Update `createCataclysmPulse` to enforce fatal wipe regardless of player shield charges and spawn obstacle impact feedback.
  - `src/entities/boss/CataclysmFlashRenderer.ts` (new modular component): Encapsulate 2D visibility polygon generation, shadow cone projection, and asymmetric ramp-up/down canvas overlay rendering with clean seams.
- **Combat Arena**:
  - `src/entities/Arena.ts`: Integrate `CataclysmFlashRenderer` in the render pipeline after obstacles, updating flash state in wall-clock time and evaluating lethal elimination.
- **Specs & Tests**:
  - Update `boss-encounters` spec requirements and scenarios.
  - Add comprehensive unit tests for `CataclysmFlashRenderer`, wall-clock overload progression, shield bypass lethality, and obstacle shadow occlusion.
