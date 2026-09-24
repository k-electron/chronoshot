# ChronoShot ⏱️💥

> A top-down tactical arcade puzzle-shooter where **time moves only when you move**.

[![CI](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml/badge.svg)](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-690%20passing-brightgreen.svg)]()

---

```
+-----------------------------------------------------------------------+
| 05 // SECTOR 1 BOSS          CHRONO // 0.05x [||        ] [ESC] PAUSE|
| [BOSS // GOLIATH-01: AEGIS COLOSSUS]               SHIELDS: [▮▮▮▮]    |
|                                                                       |
|        # # # # # # # # # # # # # # # # # # # # # # # # # #            |
|        #                                                 #            |
|        #    [▲ Escort: Grunt]                            #            |
|        #       *   .   .   . (bullet creeping at 5%)     #            |
|        #        \                                        #            |
|        #       +-------+               /-----\           #            |
|        #       | BUNKER|              | (x)   | <-- BOSS #            |
|        #       +-------+               \-----/           #            |
|        #                                                 #            |
|        #                [● You: Cyan] ----> [· Reticle]  #            |
|        #                                                 #            |
|        #                               [▲ Escort: Grunt] #            |
|        # # # # # # # # # # # # # [EXIT GATE] # # # # # # #            |
|                                                                       |
| (O) 6 / 6 CYLINDER                                                    |
|     READY                                                             |
+-----------------------------------------------------------------------+
```

---

## 🎮 Overview

**ChronoShot** translates the spatial puzzle mechanics of *SUPERHOT* into the twitch-and-flank readability of a top-down geometric roguelike shooter.

Every step you take accelerates global time. When you stop, time slows to a **5% micro-creep**, allowing you to read bullet trajectories, weave through crossfires, and line up precision shots. But choose your moments wisely—reloading costs **30 simulation ticks**, advancing in-flight bullets and enemy patrols while you're vulnerable unless you take cover.

Conquer **Sector 1**, eliminate the colossal **Goliath-01** boss, draft powerful tactical augmentations in freeze-frame triumph, and push through the escalated baseline of **Zone 2** in pure, high-stakes permadeath runs.

---

## ✨ Core Mechanics

### 1. Dynamic Time Dilation
- **Micro-Creep Baseline (5%)**: Time never fully freezes when stationary. Bullets crawl forward slowly, maintaining constant tactical urgency.
- **Velocity-Driven Time Scale (5% → 100%)**: Player movement velocity smoothly ramps time up to full speed and decelerates when keys are released.
- **Continuous Aiming**: Mouse aiming is free and decoupled from time progression, allowing tactical line-of-sight checks without advancing the world.

### 2. Action Tick Bursts & The Reload Dilemma
- **Discharge Burst (+6 Ticks)**: Firing pushes an immediate short tick advance simulating firearm discharge duration.
- **Reload Window (+30 Ticks)**: Reloading consumes a substantial block of simulation ticks. If you reload in the open, creeping bullets surge forward and strike you. Sprint behind a pillar to reload safely!

### 3. Modular Weapon System & Cylinder HUD
- Declarative `WeaponConfig` schema supporting magazine capacity, cooldowns, bullet velocity, spread, and action tick costs.
- Default **6-Round Revolver** featuring individual chamber tracking (`loaded` vs `spent`) and an interactive HUD rendering cylinder rotation, primer alignment, and reload prompts. Dynamically expands to **8 chambers** upon installing the Extended Cylinder augmentation.

### 4. Continuous Collision Detection (CCD) Ballistics
- High-speed projectiles utilize per-tick segment raycasting against obstacle polygons and circular unit hitboxes, preventing tunneling even across massive tick jumps.

### 5. Differentiated Enemy Catalog & Boss Encounters
Hostiles are differentiated across mobility, shields, weapon cadence, ballistic spreads, and firing styles:
- **Pistol Grunt (Crimson Diamond)**: 120 px/s skirmisher firing single accurate rounds at a 50-tick cadence with a 6-tick discharge stutter.
- **Shotgun Guard (Crimson Pentagon)**: 90 px/s heavy breacher with a 1-hit energy shield and a 5-pellet lethal buckshot fan at an 80-tick cadence.
- **Stalker Rusher (Crimson Chevron)**: 210 px/s high-velocity glass cannon with aggressive pursuit and run-and-gun rapid fire (32-tick cadence) that never halts.
- **Aegis Warden (Heavy Crimson Hexagon)**: 60 px/s frontline tank with 2-hit shield durability (requiring 3 total rounds to eliminate) and heavy suppressive slugs at a 65-tick cadence.
- **Marksman Sniper (Crimson 4-Point Star)**: 80 px/s long-range sniper that kites players, halts movement to project a charging red targeting laser for 30 ticks, and discharges hyper-velocity rounds (850 px/s) at a 110-tick cadence.
- **Goliath-01 Aegis Colossus (Sector 1 Boss - Octagonal Titan)**: Driven by the modular `BossPhaseController` and declarative `BossBlueprint` system. Phase 1 (AEGIS FORTRESS) deploys 4-hit multi-layer shields with pinpoint heavy slugs at 55 px/s; upon shield depletion, emits an expanding radial particle shockwave and triggers Phase 2 (OVERDRIVE RAM) surging forward at 95 px/s with a 3-way scatter shot.
- **Chrono-Weaver (Milestone Boss Archetype - Temporal Anchor)**: Dual-phase boss combining long-range kiting laser beams in Phase 1 with 12-pellet 360-degree rotating radial novae (`RadialNovaBehavior`, supporting both omnidirectional single rings and twin counter-rotating novae) and Stalker escort summons in Phase 2.
- **Vektor-Prime (Milestone Boss Archetype - Phase Sovereign)**: High-tier 3-phase milestone boss encountered at Room 15. Begins in Phase 1 (AEGIS OVERLORD) as a 5-shield fortress with heavy dual-slug suppression at 50-tick cadence; upon reaching 3 shields, triggers a 20-particle cyan shockwave, summons 2 Grunt escorts, and initiates Phase 2 (TEMPORAL DISRUPTOR) kiting at 100 px/s with alternating telegraphed laser beams and 3-pellet fan spreads; at 0 shields, triggers another shockwave and unleashes Phase 3 (OVERDRIVE APEX) charging at 140 px/s with 16-pellet rotating 360-degree radial novae.
- **Chrono-Zenith (Room 20 Final Milestone Boss - Zero Sovereign)**: The supreme 4-phase encounter awaiting at Room 20 inside the fortified `ApexRedoubtTemplate`. Features escalating combat forms, speed acceleration, escort summons, and telegraphed **Cataclysm Overload** invulnerability channels (75/65/60 ticks) culminating in lethal arena-wide shockwave pulses that can only be survived by breaking line-of-sight behind tactical bunker pillars:
  - **Phase 1: CITADEL BASTION** (5 shields, 45 px/s, alternating heavy slugs and 3-pellet fan spread with 2 Grunt escorts)
  - **Phase 2: TEMPORAL WARP** (3 shields, 75-tick Cataclysm Overload channel, 95 px/s standoff sniper kiter with 1 Shotgun Guard + 1 Stalker escort)
  - **Phase 3: SINGULARITY TEMPEST** (2 shields, 65-tick Cataclysm Overload channel, 105 px/s kiter with 1 Warden escort and twin counter-rotating 12-pellet radial novae discharging 24 projectiles per volley in opposing rotation spirals)
  - **Phase 4: ZERO-POINT OVERDRIVE** (0 shields, 60-tick Cataclysm Overload channel, 125 px/s direct advance core pursuit with continuous rotating 16-pellet novae)
  Skilled operatives can pre-fire ballistic rounds during Cataclysm Overload channels and sprint behind cover so their shots land the moment the boss becomes vulnerable.

### 6. Roguelike Tactical Augmentations & Upgrade Pipeline
Powered by a decoupled data-driven architecture (`UpgradePipeline`, `UpgradeRegistry`, and `UpgradeDraftHUD`):
- **Dynamic Draft Engine**: Milestone boss elimination triggers an immediate freeze-frame overlay rendering dynamic $N$-card draft pools with responsive click hit-testing.
- **Compounding Stat Modifiers**: The upgrade pipeline aggregates weapon magazine capacity, reload duration, movement speed, projectile speed, and shield charges seamlessly into player mechanics.
- **Catalog of Tactical Perks**:
  - **Extended Cylinder**: Expands revolver from 6 to 8 chambers, enabling multi-target takedowns without reload exposure. Cylinder HUD dial dynamically scales to 8 radial pips.
  - **Speed Loader**: Slashes reload burst cost from +30 to +15 simulation ticks for rapid recovery behind cover.
  - **Reactive Shield**: Equips the player with 1 kinetic deflection shield per room that absorbs a lethal projectile impact before shattering.
  - **Kinetic Stride**: Boosts player locomotion velocity by +25%, widening evasion margins and positioning agility.
  - **Chrono Burst**: Accelerates projectile muzzle velocity by +30%, compressing travel time and eliminating hostile evasion windows.
  - **Phase Deflector**: Grants +2 hit-count shield buffers per combat room for enduring intense crossfires.
  - **Overcharge Dash**: Grants a tactical dash impulse (<kbd>Space</kbd> or <kbd>Shift</kbd>) queuing a +12 simulation tick burst, 480 px/s velocity sprint, deflection frames that safely bounce enemy projectiles off kinetic shielding, and a 90-tick cooldown.

### 7. 40px Grid A* Pathfinding & Intelligent Navigation
- Discrete $24 \times 16$ tile-grid A* pathfinder with obstacle clearance inflation ($16\text{px}$) navigates complex wall and pillar layouts with zero corner snagging.
- **Line-of-Sight String Pulling**: When line-of-sight to the player is obstructed, units follow A* waypoints; once line-of-sight is re-established, units transition to smooth direct-vector steering (rushers close distance, kiters retreat).
- Smooth wall-sliding collision physics prevents units from sticking or clipping into barrier edges.

### 8. Hit-Count Shield Durability System
- Shield barriers absorb discrete projectile impacts, directly interfacing with the player's cylinder economy.
- Concentric radiant electric cyan barrier rings visually communicate active shield charges for both enemies and the player's reactive shield.
- Procedural audio pings on deflection (`playShieldDeflect`) and resonant energy pops on shield depletion (`playShieldBreak`) before units become vulnerable to lethal elimination.

### 9. Procedural Web Audio Synthesis with Pitch Modulation
- Zero external audio assets required; all sound effects (gunfire, dry-fire clicks, cylinder reload clicks, obstacle impacts, shield deflections, shield breaks, sniper laser charging, upgrade chime arpeggios, boss defeat rumbles, and victory fanfare) are synthesized live using the Web Audio API.
- **Dynamic Time-Scale Modulation**: Audio playback rates and oscillator frequencies scale dynamically with `timeScale`. Sounds drop to deep sub-bass drones (~0.43x pitch, ~2.4x duration) during 5% micro-creep and pitch up to normal tempo when sprinting.

### 10. 20-Room Tactical Campaign & Pure Permadeath
- Handcrafted room sequences teaching each archetype and mechanics progressively across four sectors:
  - **Room 01 (`BASIC COVER`)**: 1v1 duel against a mobile Pistol Grunt teaching micro-creep peeking and leading shots.
  - **Room 02 (`ARMORED BREACH`)**: Shotgun Guard (1 shield) + Grunt teaching shield breaking and buckshot evasion.
  - **Room 03 (`INFILTRATION`)**: High-speed Stalker rusher + Grunt in a zigzag corridor teaching rapid target acquisition.
  - **Room 04 (`THE LINE OF FIRE`)**: Marksman sniper nest with 30-tick laser telegraph + Shotgun Guard advance teaching sightline evasion.
  - **Room 05 (`SECTOR 1 BOSS`)**: Goliath-01 Aegis Colossus (4 shields) + Grunt escorts testing complete combat mastery, triggering Upgrade Draft 1.
  - **Room 06 (`BREACH PROTOCOL`)**: Zone 2 baseline launch with dual Stalker pincer sprint + Shotgun Guard suppression.
  - **Room 07 (`CROSSFIRE CORRIDOR`)**: Dual Marksman Snipers holding crisscrossing sightlines while an Aegis Warden advances.
  - **Room 08 (`KILLBOX ENCLOSURE`)**: High-density 5-enemy squad in a tight pillbox arena forcing tactical reloading.
  - **Room 09 (`THE IRON GATE`)**: Climax with dual Aegis Wardens, Marksman sniper, and Stalker rusher requiring 6 total shield breaks.
  - **Room 10 (`CHRONO-WEAVER`)**: Milestone Boss 2 (Temporal Anchor) pairing precision standoff laser beams in Phase 1 with 360-degree radial novae and Stalker summons in Phase 2, triggering Upgrade Draft 2.
  - **Room 11 (`VANGUARD BREACH`)**: Sector 3 entry calibration testing 2-upgrade builds against Warden, Shotgun, and Stalker vanguard squads.
  - **Room 12 (`TWIN BUNKER CROSSFIRE`)**: Multi-shield siege featuring dual advancing Wardens pinned by perimeter snipers.
  - **Room 13 (`SPLIT FLANK MATRIX`)**: Corridor containment preventing dual high-speed Stalker pincer rushes.
  - **Room 14 (`THE CRUCIBLE`)**: Peak pre-boss gauntlet testing full mastery across Wardens, Snipers, Shotguns, and Stalkers.
  - **Room 15 (`VEKTOR-PRIME`)**: Milestone Boss 3 (Phase Sovereign) deploying 5 energy shields, alternating laser/fan kiting, escort summons, and 16-pellet radial novae, triggering Upgrade Draft 3.
  - **Room 16 (`ZENITH ENTRY`)**: Sector 4 vanguard entry testing 3-upgrade synergies against mixed Warden, Shotgun, and Stalker forces.
  - **Room 17 (`TWIN BASTIONS`)**: Fortified bunker siege requiring disciplined cover peeking against dual snipers and wardens.
  - **Room 18 (`CHRONO CHOKE`)**: Relentless close-quarters containment testing rapid target prioritization against triple stalkers and wardens.
  - **Room 19 (`PROTOCOL ZENITH`)**: Ultimate campaign gauntlet featuring a coordinated quadrant matrix of Wardens, Snipers, and Stalkers.
  - **Room 20 (`PROTOCOL OMEGA`)**: Supreme campaign climax against Chrono-Zenith: Zero Sovereign inside the fortified Apex Redoubt. Overcoming its 4 escalating phases and Cataclysm Pulses triggers the MISSION ACCOMPLISHED Campaign Victory screen, celebrating completion of all 20 tactical protocols.
- **Cascading Boss Checkpoint Rollback**: On defeat, the dual-card defeat screen gives players the choice between **Rollback** (<kbd>R</kbd> or click) and **Full Reset** (<kbd>Shift+R</kbd> or click). Rollback evaluates the room of elimination, cascading down sector-by-sector (Rooms 1–5 $\to$ Room 1, Rooms 6–10 $\to$ Room 5 Goliath-01, Rooms 11–15 $\to$ Room 10 Chrono-Weaver, Rooms 16–20 $\to$ Room 15 Vektor-Prime, Endless Mode $\to$ Room 20 Chrono-Zenith), restoring clean pre-boss upgrade snapshots. Repeated failure in a boss fight or sector demotes the player down the checkpoint ladder tier-by-tier until Room 1.

### 11. Modular Level Director & Endless Survival Mode
- **Composable Tactical Layouts**: 7 geometry templates (`CenterPillarsTemplate`, `TwinBunkersTemplate`, `SplitCorridorTemplate`, `KillboxLanesTemplate`, `ArenaQuadrantTemplate`, `ApexRedoubtTemplate`, `ApexColosseumTemplate`) providing varied obstacle geometries, tactical sightlines, and verified spawn safety ($\ge 280\text{px}$ from player).
- **Threat-Budget Encounter Spawner (`EncounterDirector`)**: Scales difficulty by assigning numerical threat budgets across hostiles while enforcing squad composition constraints (maximum 2 Marksman snipers per room, mandatory frontline escorts) and non-overlapping safe spawn sampling ($\ge 48\text{px}$ unit separation).
- **Deterministic Seeded PRNG (`LevelDirector`)**: High-performance Mulberry32 pseudo-random number generator enabling 100% reproducible room seeds, daily challenges, and milestone boss synthesis on every 5th room (Sector 1: Goliath-01, Sector 2: Chrono-Weaver, Sector 3: Vektor-Prime, Sector 4: Chrono-Zenith).
- **Endless Survival Mode (`EndlessDirector` & `ApexColosseumTemplate`)**: Upon defeating Chrono-Zenith in Room 20, the Mission Accomplished overlay presents dual options: **Endless Protocol** (<kbd>E</kbd> / <kbd>Space</kbd> / click) to enter the endless gauntlet, or **Expedition Reset** (<kbd>R</kbd> / <kbd>Shift+R</kbd> / click) to restart at Room 1. Choosing Endless Protocol deploys the operative directly into the infinite tactical Apex Colosseum:
  - **Full Augmentation Loadout**: Automatically installs all 7 upgrades (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`), tops shields off to maximum capacity (3 shields), and loads cylinder to 8 rounds.
  - **Climbing Threat Budget**: Threat budget steadily scales upward ($50 + \lfloor \text{ticks}/120 \rfloor \times 5$), spawning mixed hostile squads according to dynamic threat costs.
  - **Fair Distant Spatial Sampling**: Enemies only spawn at distant coordinates ($\ge 350\text{px}$ from player, $\ge 48\text{px}$ from other units, completely outside obstacle collision boundaries) to eliminate cheap, unavoidable deaths.
  - **Materialization Reticles**: Queued hostiles display 30-tick expanding geometric telegraph rings before materializing into active combatants.
  - **In-Canvas Endless Telemetry HUD**: Persistent real-time status HUD displaying current active threat budget, survival duration (MM:SS), and total kill counter.

---

## 🕹️ Controls

| Input | Action |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move (Smoothly accelerates time to 100%) |
| <kbd>Mouse</kbd> | 360° Hardware Aim Reticle (Does not advance time) |
| <kbd>Left Click</kbd> | Fire Revolver (+6 simulation ticks) / Resume from Pause / Select Upgrade Card / Select Defeat or Victory Card |
| <kbd>Space</kbd> / <kbd>Shift</kbd> | Overcharge Dash (+12 tick burst, 480 px/s sprint, deflection frames) |
| <kbd>E</kbd> / <kbd>Space</kbd> | Select Endless Protocol on Campaign Victory Screen |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Select Tactical Augmentation during Post-Boss Draft |
| <kbd>R</kbd> | Reload Revolver / Checkpoint Rollback on Defeat / Reset Expedition on Victory Screen |
| <kbd>Shift</kbd> + <kbd>R</kbd> | Quick Restart Current Room / Full Expedition Reset on Defeat or Victory Screen |
| <kbd>Esc</kbd> / <kbd>P</kbd> | Toggle Tactical Pause & Controls Matrix |
| <kbd>M</kbd> | Toggle Audio Mute |

---

## 🏗️ Architecture

```
+-------------------------------------------------------------------------+
|                        BROWSER INPUT & WINDOW                           |
|       (Keyboard: WASD, R, Space | Mouse: Screen Coords, Left Click)     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           TIME GOVERNOR                                 |
|  - Tracks player movement speed to calculate timeScale [0.05 .. 1.0]     |
|  - Queues immediate tick bursts for Fire (+6) and Reload (+30)          |
|  - Converts wall-clock deltaTime into simulation accumulator ticks      |
+-------------------------------------------------------------------------+
                                    |
                                    v  (discrete ticks)
+-------------------------------------------------------------------------+
|                       FIXED-STEP SIMULATOR                              |
|  - Fixed 60 Hz physics loop decoupled from rendering framerate          |
|  - Continuous Collision Detection (Raycasts against Obstacles & Hitboxes)|
|  - Enemy AI Decision Cycles (Line-of-Sight, Firing Timers)              |
|  - Room State & Victory / Defeat Evaluations                            |
+-------------------------------------------------------------------------+
                                    |
                                    v  (interpolated frame state)
+-------------------------------------------------------------------------+
|                       CANVAS 2D RENDERER                                |
|  - High-contrast geometric minimalism (Cyan Player, Crimson Enemies)    |
|  - Glowing bullet tracers, fading trails, and crystalline shatter shards |
|  - Interactive Revolver Cylinder HUD & Time Dilation Meter              |
+-------------------------------------------------------------------------+
```

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/k-electron/chronoshot.git
cd chronoshot

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

Visit the local URL printed in your terminal (typically `http://localhost:5173`) in your web browser.

### Running Tests
ChronoShot features an **outcome-based** test suite covering vector math, collision physics, time dilation acceleration curves, action bursts, revolver state machines, and room state transitions:

```bash
# Run unit & integration test suite with Vitest
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
npm run build
npm run preview
```

### Continuous Integration & Cloudflare Pages Hosting

- **GitHub Actions**: Automated CI (`.github/workflows/ci.yml`) runs on all pull requests and pushes to `main`. It validates dependencies, TypeScript compilation, Vite production build, and all 690 Vitest unit & integration tests under Node 26.
- **Cloudflare Pages Hosting**:
  1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
  2. Select the `k-electron/chronoshot` repository.
  3. Set the build configuration:
     - **Framework preset**: `Vite` (or None)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Environment variables**: Add `NODE_VERSION` = `26` (also auto-detected from `.nvmrc`)
  4. Click **Save and Deploy**. Cloudflare Pages automatically delivers edge-cached static assets with security headers (`public/_headers`) and generates instant preview URLs for each pull request.

---

## 📁 Project Structure

```text
chronoshot/
├── .github/
│   └── workflows/                # GitHub Actions CI automation (Node 26)
│       └── ci.yml
├── .nvmrc                        # Pinned Node runtime (Node 26)
├── AGENTS.md                     # Architecture and instructions for AI coding assistants
├── CONTRIBUTING.md               # Guidelines for contributors and PR submission
├── openspec/                     # OpenSpec durable specifications & archives
│   ├── specs/                    # Durable project capability specs
│   │   ├── boss-encounters/spec.md
│   │   ├── combat-arena/spec.md
│   │   ├── procedural-levels/spec.md
│   │   ├── roguelike-upgrades/spec.md
│   │   ├── time-engine/spec.md
│   │   └── weapon-system/spec.md
│   └── changes/                  # Active and completed changes
├── public/                       # Static public assets copied to dist/ root
│   ├── _headers                  # Cloudflare Pages edge cache & security headers
│   ├── _redirects                # SPA fallback rule
│   └── favicon.svg               # Vector reticle favicon
├── src/
│   ├── audio/                    # Procedural Web Audio API sound synthesizer
│   │   └── SoundSynthesizer.ts
│   ├── engine/                   # Time dilation governor & fixed-step simulator
│   │   ├── FixedStepSimulator.ts
│   │   ├── GridPathfinder.ts
│   │   └── TimeGovernor.ts
│   ├── entities/                 # Game entities, behaviors, and boss systems
│   │   ├── behaviors/            # Modular movement & attack strategy patterns
│   │   ├── boss/                 # Modular boss phase state machine & blueprints
│   │   ├── Arena.ts
│   │   ├── Enemy.ts
│   │   ├── EnemyFactory.ts
│   │   ├── Obstacle.ts
│   │   ├── ParticleSystem.ts
│   │   ├── Player.ts
│   │   └── Projectile.ts
│   ├── levels/                   # Procedural level director & tactical templates
│   │   ├── templates/            # Composable cover & geometry layout templates
│   │   │   ├── ApexColosseumTemplate.ts
│   │   │   └── ApexRedoubtTemplate.ts
│   │   ├── EncounterDirector.ts
│   │   ├── EndlessDirector.ts
│   │   ├── LevelDirector.ts
│   │   ├── Room.ts
│   │   └── RoomManager.ts
│   ├── math/                     # 2D vector primitives & continuous collision math
│   │   ├── collision.ts
│   │   └── vector.ts
│   ├── ui/                       # Minimalist HUD, tactical reticle, boss & enemy renderers
│   │   ├── BossTelemetryHUD.ts
│   │   ├── ChronoAnchorRenderer.ts
│   │   ├── CylinderHUD.ts
│   │   ├── DefeatHUD.ts
│   │   ├── EndlessTelemetryHUD.ts
│   │   ├── EnemyRenderer.ts
│   │   ├── Reticle.ts
│   │   ├── theme.ts
│   │   ├── TimeHUD.ts
│   │   ├── UpgradeDraftHUD.ts
│   │   └── VictoryHUD.ts
│   ├── upgrades/                 # Roguelike upgrade registry & stat pipeline
│   │   ├── definitions/
│   │   ├── UpgradeDefinition.ts
│   │   ├── UpgradePipeline.ts
│   │   └── UpgradeRegistry.ts
│   ├── weapons/                  # Modular weapon schema & 6-shot revolver state
│   │   ├── Revolver.ts
│   │   └── Weapon.ts
│   └── main.ts                   # Game entrypoint & canvas loop initialization
├── index.html                    # Single-page canvas container
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 Specifications

ChronoShot is developed following [OpenSpec](https://github.com/openspec/openspec) standard specification-driven workflows. Durable capability specifications can be found under [`openspec/specs/`](openspec/specs/):
- **`time-engine`**: Time dilation curves, micro-creep, and action tick bursts.
- **`weapon-system`**: Modular firearm configurations and the 6-round revolver.
- **`combat-arena`**: 2D arena layout, obstacle cover, enemy AI, 1-hit lethality, and puzzle rooms.
- **`boss-encounters`**: Multi-phase boss architecture, shield absorption, radial novae, and telemetry.
- **`roguelike-upgrades`**: Data-driven upgrade pipeline, dynamic card draft UI, and stat compounding.
- **`procedural-levels`**: Modular layout templates, threat-budget spawner, and deterministic PRNG.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
