# Design

## Context

ChronoShot's simulation loop (`FixedStepSimulator` + `TimeGovernor`) evaluates player movement speed to scale physical time between 0.05x (idle micro-creep) and 1.00x (full speed). Previously, combat actions (firing, reloading) used action tick bursts queued via `TimeGovernor.queueTicks()`. While a 6-tick burst for gunfire produces a responsive recoil jolt, a 30-tick burst (500ms of physics) executed in a single 16.6ms render frame causes an abrupt teleport of all projectiles and enemies with zero visual telegraphing.

See `proposal.md` and delta specs for motivation and behavior contracts.

## Goals / Non-Goals

**Goals:**
- **Modular Architecture**: Encapsulate the reload state machine and lifecycle cleanly so `Player`, `Revolver`, and `Arena` have distinct, decoupled responsibilities.
- **Smooth 60 FPS Real-Time Progression**: Advance physics 1 tick per frame at 1.00x real-time speed throughout the reload duration (0.50s baseline, 0.25s with Speed Loader).
- **Physical Immobilization with Aiming Freedom**: Zero player locomotion velocity while preserving 360-degree mouse aiming.
- **Sequential Chamber Seating & Partial Retention**: Incrementally fill cylinder chambers over time, retaining completed rounds if interrupted.
- **Emergency Dash Breakout**: Seamlessly interrupt reload lock when activating Overcharge Dash.
- **Modular Visual Telemetry**: Isolate visual anchoring logic into a dedicated renderer (`ChronoAnchorRenderer`) alongside decoupled updates to `Reticle`, `CylinderHUD`, and `SoundSynthesizer`.

**Non-Goals:**
- Changing gunfire burst mechanics (+6 ticks remains an instantaneous burst for shooting).
- Introducing new reload keybindings or secondary weapon types.
- Disrupting deterministic test execution or adding wall-clock timeouts.

## Decisions

### 1. Dedicated Stateful Reload Model in `Revolver`
- **Choice**: Extend `Revolver` (implementing `Weapon`) to own reload timing and chamber state transitions rather than handling raw timers in `Player` or `Arena`.
- **Interface**:
  - `startReload(tickBurst?: number): boolean`
  - `isReloading(): boolean`
  - `getReloadProgress(): number` (0.0 to 1.0)
  - `getReloadTicksRemaining(): number`
  - `getReloadTicksTotal(): number`
  - `updateReload(deltaTicks?: number): { completed: boolean; justLoadedChamber: boolean }`
  - `cancelReload(): number` (cancels reload lock and returns count of loaded chambers retained)
- **Rationale**: Keeps weapon mechanics self-contained and easily testable without mocking entity physics or canvas contexts.
- **Alternatives Considered**: Managing reload timers entirely in `Player`. Rejected because it duplicates chamber state logic and violates weapon encapsulation.

### 2. Real-Time TimeGovernor Scaling via Active Action State
- **Choice**: During an active reload, `Arena` signals the simulation to maintain 1.00x time scale (`effectiveSpeed = player.maxSpeed`) despite the player's spatial velocity being clamped to zero. Burst queuing for reload on `TimeGovernor` is replaced by this steady real-time channel.
- **Rationale**: Eliminates the single-frame 30-tick jump while honoring the "combat actions advance time" principle. The player watches enemies and projectiles move at full 60 FPS combat speed for half a second.
- **Alternatives Considered**: Fast-forward at 2.0x or 3.0x speed. Rejected per user preference for genuine 1:1 real-time pacing (0.50s total exposure).

### 3. Modular Ground & In-World Rendering via `ChronoAnchorRenderer`
- **Choice**: Create `src/ui/ChronoAnchorRenderer.ts` to draw the ground anchor clamps, rotating calibration pips, and radial sweep arc ($0^\circ \to 360^\circ$) around the player.
- **Rationale**: Prevents `Arena.render()` from bloating further, adhering to the codebase convention seen with `EnemyRenderer` and decoupled HUDs.
- **Alternatives Considered**: Inlining canvas arc drawing directly inside `Arena.ts` or `Player.ts`. Rejected to preserve modularity.

### 4. Sequential Chamber Timing & Dash Cancellation
- **Choice**: Divide total reload ticks by the number of empty chambers to load. Every interval of $T = \lfloor \text{totalTicks} / \text{neededRounds} \rfloor$, one chamber flips from spent to loaded, triggering a ratchet click. If the player presses Dash before completion, `cancelReload()` halts future chamber loading and returns the retained rounds.
- **Rationale**: Makes partial reloads rewarding and matches the physical action of seating cartridges into a cylinder.
- **Alternatives Considered**: All-or-nothing reload (losing all progress on dash). Rejected per user direction for sequential retention.

### 5. Reticle & Cylinder HUD Feedback
- **Choice**:
  - `Reticle`: When `isReloading` is active, draw a hairline circular progress arc around the center micro-dot and shift crosshair color to amber (`#ffb703`).
  - `CylinderHUD`: Dynamically highlight chambers loading in sequence, update status typography to `CYCLING // X/Y TICKS`, and display `[SPACE] DASH TO ABORT` when Overcharge Dash is available.
- **Rationale**: Ensures the player has immediate feedback both at their focal point (the reticle) and in the peripheral status dial.

## Risks / Trade-offs

- **[Risk] High-speed incoming projectiles during reload**: Real-time 0.50s exposure means a player reloading close to enemies could be struck by incoming fire.
  - *Mitigation*: The player retains free 360-degree vision/aiming, can see the projectiles in real time at 60 FPS, and can instantly break the lock with Overcharge Dash if unlocked.
- **[Risk] Existing unit tests expecting instant reload in 1 tick**: Existing tests like `player.reload(governor)` and `weapon.reload()` previously refilled ammo synchronously in one call.
  - *Mitigation*: Provide explicit methods for instant refill (`weapon.reset()`, `player.replenishAll()`) and ensure tests verify both the multi-tick cycle and legacy instant scenarios where appropriate.
