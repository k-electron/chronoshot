# Design

## Context

ChronoShot relies on a deterministic 60 Hz physics quanta simulation (`FixedStepSimulator`), dynamic time dilation (`TimeGovernor`), data-driven boss state machines (`BossBlueprint`, `BossPhaseController`), and a decoupled roguelike augmentation pipeline (`UpgradePipeline`, `UpgradeRegistry`). 

Currently, the campaign sequence terminates at Room 14 ("The Crucible"), with milestone bosses at Room 5 (Goliath-01) and Room 10 (Chrono-Weaver). See `proposal.md` for the motivation to expand the progression to Room 19 and introduce the Level 15 step-function boss.

## Goals / Non-Goals

**Goals:**
- Implement Vektor-Prime as a 3-phase milestone boss blueprint at Room 15 with multi-tier shield durability, kiting laser/spread attacks, dynamic escort summons, and an aggressive 16-pellet rotating nova overdrive.
- Implement the `overchargeDash` augmentation into the upgrade registry and pipeline, enabling <kbd>Space</kbd>/<kbd>Shift</kbd> burst translation with a +12 tick action burst on `TimeGovernor`, projectile deflection, and a 90-tick cooldown.
- Seamlessly trigger the 3rd freeze-frame upgrade draft upon Vektor-Prime defeat, drawing 3 options from the 5 remaining eligible registry upgrades.
- Implement concrete level definitions for Rooms 15, 16, 17, 18, and 19 in `src/levels/Room.ts`, linearly escalating threat budgets from 240 to 285 points.
- Update `RoomManager` and campaign victory telemetry to recognize 19 completed tactical protocols.

**Non-Goals:**
- Room 20 and beyond (explicitly deferred to a separate follow-up spec per user directive).
- Endless procedural director redesign (procedural endless mode already leverages `LevelDirector` and dynamically scales).
- External audio or sprite binaries (procedural Web Audio synthesis and hairline Canvas 2D geometry remain mandatory).

## Decisions

### 1. Vektor-Prime Blueprint & Phase Composition
- **Decision**: Define `VEKTOR_PRIME_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` utilizing `BossPhaseConfig` with 3 discrete phases.
  - **Phase 1 (Fortress Aegis)**: 5 shields, `DirectAdvanceBehavior` at 50 px/s, `SingleSlugBehavior` (cadence 50 ticks, speed 550 px/s, spread 0.03). `onPhaseExit` combines violet radial shockwave (`#a855f7`, 36 particles, radius 320), `createAudioCue("shieldBreak")`, and escort summon (1 Shotgun Guard, 1 Stalker).
  - **Phase 2 (Phase Warp / Kiter)**: 3 shields, `KiterBehavior` (minDist: 280, maxDist: 460, speed: 85 px/s), utilizing an alternating/composite attack behavior cycling between `TelegraphedBeamBehavior` (25-tick laser charge) and a 3-pellet `FanSpreadBehavior`. `onPhaseExit` combines crimson shockwave (`#ff1744`, 48 particles, radius 380), overdrive audio cue, and escort summon (2 Stalkers).
  - **Phase 3 (Singularity Nova Overdrive)**: 0 shields (exposed core), `DirectAdvanceBehavior` at 115 px/s, `RadialNovaBehavior` (16 pellets, cadence 65 ticks, speed 420 px/s, angular offset step 0.12).
- **Alternatives Considered**: Creating a monolithic, hardcoded `VektorPrimeBoss` class. Rejected because the modular `BossPhaseController` and behavior composability already support arbitrary phase sequences and keep boss logic declarative and testable.

### 2. Overcharge Dash Mechanics & Engine Integration
- **Decision**: Treat Overcharge Dash as an active tactical augmentation activated by key input (<kbd>Space</kbd> or <kbd>Shift</kbd>) that queues `+12` simulation ticks onto `TimeGovernor` while applying an instantaneous impulse (480 px/s) along the current movement vector (or cursor angle if stationary).
  - **Invulnerability / Deflection**: Active for the duration of the dash impulse (approx. 12–15 ticks), deflecting incoming projectiles without consuming shield charges.
  - **Cooldown**: 90 ticks tracked on the player entity / pipeline, rendered with a hairline charge indicator on the HUD.
- **Alternatives Considered**: Passive speed boost only (similar to `kineticStride`). Rejected because an active dash provides high-agency micro-creep weaving and capitalizes on the time-engine's discrete action bursts.

### 3. Level Director Sector Routing
- **Decision**: Update `LevelDirector.generateBossRoom(roomNumber)` to route milestone bosses based on sector/room index:
  - Sector 1 (Room 5): `GOLIATH_01_BLUEPRINT`
  - Sector 2 (Room 10): `CHRONO_WEAVER_BLUEPRINT`
  - Sector 3 and beyond (Room 15+): `VEKTOR_PRIME_BLUEPRINT`
- **Alternatives Considered**: Randomly sampling bosses for Sector 3+. Rejected because scripted campaign progression requires deterministic, escalating boss encounters.

### 4. Campaign Gauntlet (Rooms 16–19)
- **Decision**: Implement distinct handcrafted rooms in `src/levels/Room.ts`:
  - `createRoom15`: Vektor-Prime boss arena with bunker cover and escort spawn anchors.
  - `createRoom16`: Zenith Entry (Budget 240) — Split corridors, 1 Warden, 2 Shotguns, 2 Stalkers, 2 Grunts.
  - `createRoom17`: Twin Bastions (Budget 255) — Fortified bunkers, 2 Wardens, 2 Marksmen, 2 Shotguns.
  - `createRoom18`: Chrono Choke (Budget 270) — Pillar choke lanes, 2 Wardens, 3 Stalkers, 2 Shotguns, 1 Grunt.
  - `createRoom19`: Protocol Zenith (Budget 285) — Campaign Climax, 3 Wardens (6 shields!), 2 Marksmen, 2 Stalkers, 1 Shotgun.
- **Alternatives Considered**: Procedurally generating Rooms 16–19 in the campaign sequence. Rejected to maintain handcrafted tactical puzzle quality for the fixed campaign.

## Risks / Trade-offs

- **[Risk: Dash Impulse Clipping Through Obstacles]** → *Mitigation*: The player update loop runs iterative circle-AABB obstacle resolution (`resolveObstacleCollisions`) and arena bounding clamps after position integration, ensuring high-speed translations slide along walls rather than tunneling.
- **[Risk: Boss Phase 2 Telemetry & Shield Pip Synchronization]** → *Mitigation*: `BossTelemetryHUD` already dynamically binds to `boss.phaseController.currentPhaseIndex` and `boss.phaseController.shields`, rendering `PHASE X/3` and correct shield pips automatically.
- **[Risk: Campaign Completion Screen Regression]** → *Mitigation*: Update `RoomManager.renderGameVictory()` text and tests to verify 19 protocols conquered, keeping backward compatibility with restart keys.
