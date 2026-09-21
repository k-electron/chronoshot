# ChronoShot ⏱️💥

> A top-down tactical arcade puzzle-shooter where **time moves only when you move**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-94%20passing-brightgreen.svg)]()

---

```
+-----------------------------------------------------------------------+
| ROOM 02: CROSSFIRE                    [CYLINDER: (•)(•)(•)(•)( )( )]  |
|                                                                       |
|        # # # # # # # # # # # # # # # # # # # # # # # # # #            |
|        #                                                 #            |
|        #    [▲ Enemy: Pistol]                            #            |
|        #       *   .   .   . (bullet creeping at 5%)     #            |
|        #        \                                        #            |
|        #       +-------+                                 #            |
|        #       | PILLAR|                                 #            |
|        #       +-------+                                 #            |
|        #                                                 #            |
|        #                [● You: Cyan] ----> [Crosshair]  #            |
|        #                                                 #            |
|        #                               [▲ Enemy: Shotgun]#            |
|        # # # # # # # # # # # # # [EXIT GATE] # # # # # # #            |
|                                                                       |
| TIME: [■■□□□□□□□□] 20%                      [R] RELOAD (+30 TICKS)    |
+-----------------------------------------------------------------------+
```

---

## 🎮 Overview

**ChronoShot** translates the spatial puzzle mechanics of *SUPERHOT* into the twitch-and-flank readability of a top-down geometric shooter.

Every step you take accelerates global time. When you stop, time slows to a **5% micro-creep**, allowing you to read bullet trajectories, weave through crossfires, and line up precision shots. But choose your moments wisely—reloading costs **30 simulation ticks**, advancing in-flight bullets and enemy patrols while you're vulnerable unless you take cover.

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
- Default **6-Round Revolver** featuring individual chamber tracking (`loaded` vs `spent`) and an interactive HUD rendering cylinder rotation, primer alignment, and reload prompts.

### 4. Continuous Collision Detection (CCD) Ballistics
- High-speed projectiles utilize per-tick segment raycasting against obstacle polygons and circular unit hitboxes, preventing tunneling even across massive tick jumps.

### 5. Enemy Archetypes
- **Pistol Grunt (Crimson Triangle)**: Discharges single accurate lethal rounds at steady intervals.
- **Shotgun Guard (Crimson Square)**: Discharges lethal 5-pellet buckshot spreads, forcing lateral dodges or hard cover.
- Both archetypes feature continuous line-of-sight raycasting against intervening cover obstacles.

### 6. Procedural Web Audio Synthesis with Pitch Modulation
- Zero external audio assets required; all sound effects are synthesized live using the Web Audio API.
- **Dynamic Time-Scale Modulation**: Audio playback rates and oscillator frequencies scale dynamically with `timeScale`. Sounds drop to deep sub-bass drones (~0.43x pitch, ~2.4x duration) during 5% micro-creep and pitch up to normal tempo when sprinting.

### 7. Bite-Sized Tactical Puzzle Progression
- Handcrafted room sequences with distinct spatial challenges:
  - **Room 01 (`BASIC COVER`)**: 1v1 duel teaching micro-creep peeking and precision firing.
  - **Room 02 (`CROSSFIRE`)**: 2v1 flanking engagement teaching line-of-sight breaking and reload timing.
  - **Room 03 (`HEAVY SPREAD`)**: Shotgun Guard + Pistol Grunt pressure teaching spread avoidance.
- Destroying all enemies in a room unlocks the radiant exit portal to advance to the next floor.

---

## 🕹️ Controls

| Input | Action |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move (Smoothly accelerates time to 100%) |
| <kbd>Mouse</kbd> | 360° Aim Crosshair (Does not advance time) |
| <kbd>Left Click</kbd> | Fire Revolver (+6 simulation ticks) |
| <kbd>R</kbd> | Reload Revolver (+30 simulation ticks) / Instant Restart on Death |
| <kbd>M</kbd> | Toggle Audio Mute |
| <kbd>Shift</kbd> + <kbd>R</kbd> | Restart Game from Room 1 |

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

---

## 📁 Project Structure

```text
chronoshot/
├── openspec/                     # OpenSpec durable specifications & archives
│   ├── specs/                    # Durable project capability specs
│   │   ├── combat-arena/spec.md
│   │   ├── time-engine/spec.md
│   │   └── weapon-system/spec.md
│   └── changes/archive/          # Completed change proposals
├── src/
│   ├── audio/                    # Procedural Web Audio API sound synthesizer
│   │   └── SoundSynthesizer.ts
│   ├── engine/                   # Time dilation governor & fixed-step simulator
│   │   ├── FixedStepSimulator.ts
│   │   └── TimeGovernor.ts
│   ├── entities/                 # Game entities & particle systems
│   │   ├── Arena.ts
│   │   ├── Enemy.ts
│   │   ├── Obstacle.ts
│   │   ├── ParticleSystem.ts
│   │   ├── Player.ts
│   │   └── Projectile.ts
│   ├── levels/                   # Puzzle room configurations & room progression
│   │   ├── Room.ts
│   │   └── RoomManager.ts
│   ├── math/                     # 2D vector primitives & continuous collision math
│   │   ├── collision.ts
│   │   └── vector.ts
│   ├── ui/                       # Canvas 2D interactive Cylinder HUD & Time Meter
│   │   ├── CylinderHUD.ts
│   │   └── TimeHUD.ts
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

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
