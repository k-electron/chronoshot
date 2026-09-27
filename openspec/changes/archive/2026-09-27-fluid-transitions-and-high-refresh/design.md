# Design

## Context

ChronoShot relies on a decoupled 60 Hz fixed-step physics loop (`FixedStepSimulator`), a dynamic velocity-driven time dilation system (`TimeGovernor`), and an overarching entity coordinator (`Arena`). Currently, transitions between combat states (movement to standstill, room portal passage, boss elimination) execute as instantaneous step-functions. Furthermore, while the simulator tracks residual accumulated time (`alpha`), entities are rendered at raw discrete tick coordinates, creating stepped judder on high-refresh (120–240 Hz) displays.

See `proposal.md` for motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Provide continuous visual and acoustic transitions across movement deceleration, room exit/entry, boss phase shifts, and boss defeat.
- Enforce the "No Free Pass" ballistics rule: active enemy bullets remain live and lethal during the boss defeat slow-motion aftermath.
- Enable high-refresh (60–240Hz, VRR) silky-smooth rendering without altering the deterministic 60 Hz physics quantum.
- Render crisp hairline vectors on high-DPI (Retina/4K) displays via `devicePixelRatio` buffer scaling.
- Ensure particle shards and telegraphs update continuously without freezing when UI overlays are active.

**Non-Goals:**
- Variable-timestep physics: The simulation MUST remain strictly 60 Hz deterministic fixed-step (`fixedDeltaTime = 1/60s`).
- Re-architecting weapon reload, dash, or upgrade pipeline math.
- External video/canvas library additions: All transitions must remain zero-dependency procedural Canvas 2D and Web Audio.

## Decisions

### 1. Asymmetric Time Scale Ramping in `TimeGovernor`
- **Approach**: Separate `rampUpRate` and `rampDownRate`.
  - `rampUpRate = Infinity` (or $\ge 30.0/\text{s}$): Player input commands immediately accelerate time scale towards target, guaranteeing zero input latency when dodging or firing.
  - `rampDownRate = 4.5/\text{s}`: When keys are released, time scale glides smoothly down along an exponential settling curve over ~200ms into the `0.05x` baseline.
  - Web Audio pitch and time HUD smoothly follow this decay.
- **Alternatives Considered**:
  - *Symmetric linear ramp rate*: Sluggish player responsiveness when attempting sudden evasive maneuvers; rejects the requirement to preserve control responsiveness.
  - *Fixed timer delay before dropping*: Feels like lag rather than an intentional cinematic deceleration.

### 2. Boss Defeat Lifecycle & Active Ballistics in `Arena`
- **Approach**: Introduce a discrete arena transition state `bossDefeatTransition`:
  - `active = true`, `duration = 36` ticks (~600ms wall time).
  - Boss entity is marked dead and shatters into procedural geometric shards.
  - `TimeGovernor` enforces a continuous slow-motion decay curve.
  - `fixedUpdate` continues to simulate: active projectiles, player movement/dodging, shield deflection, and player elimination continue to run!
  - If a lingering bullet strikes the player, `takeDamage` and player defeat resolve as normal (no free pass).
  - Once the transition duration completes and the player survives, `isUpgradeDraftActive = true` (Rooms 5, 10, 15) or `status = "victory"` (Room 20) smoothly transitions in.
- **Alternatives Considered**:
  - *Destroy all bullets on boss death*: The current flawed behavior where players get an unearned escape from lethal novae.
  - *Block player movement during boss death*: Unfair if bullets are still flying; player must maintain dodge capability.

### 3. Cyberpunk Iris Portal Transition in `RoomManager` and `Arena`
- **Approach**: 2-stage state machine (`"ingress" | "egress"`):
  - Ingress (~150ms): Operative velocity is pulled toward portal center; Canvas 2D clips/renders a high-contrast geometric octagonal/circular iris aperture contracting down to portal coordinates.
  - Atomic room swap: When radius reaches 0, `roomManager.advanceRoom()` and `arena.loadRoom()` run.
  - Egress (~150ms): The iris aperture expands outward from `playerSpawn` in the new room, revealing the new tactical layout; full controls unlock as radius clears the screen.
- **Alternatives Considered**:
  - *Full-screen black fade*: Generic, non-cyberpunk, feels disconnected from the spatial portal beacon.
  - *Camera pan/zoom*: ChronoShot uses fixed single-screen arena dimensions (960x640); panning requires off-screen layout generation.

### 4. Sub-Tick Render Interpolation (`lerp(prev, curr, alpha)`)
- **Approach**: `Arena.render()` queries `alpha = this.simulator.getAlpha()`.
  - Player, Enemy, and Projectile entities already track `position` and `previousPosition`.
  - Visual drawing evaluates:
    $$\vec{p}_{\text{render}} = \vec{p}_{\text{prev}} \cdot (1 - \alpha) + \vec{p}_{\text{curr}} \cdot \alpha$$
  - High-velocity bullet tracer segments render between interpolated previous and current heads.
  - At 120Hz/240Hz, frames running 0 physics ticks smoothly advance sub-pixel visual coordinates.
- **Alternatives Considered**:
  - *Interpolating within physics sub-step*: Violates deterministic physics invariants and causes CCD tunneling.
  - *Variable delta time physics*: Breaks reproducibility, unit tests, and collision stability.

### 5. High-DPI Canvas Backing Store Scaling in `main.ts`
- **Approach**:
  - Query `dpr = Math.min(window.devicePixelRatio || 1, 3)`.
  - `canvas.width = Math.round(960 * dpr); canvas.height = Math.round(640 * dpr);`
  - `canvas.style.width = "960px"; canvas.style.height = "640px";`
  - `ctx.scale(dpr, dpr);`
  - In `getCanvasCoords()`, mouse coordinates divide by `rect.width / 960`, maintaining 1:1 virtual coordinate mapping with zero gameplay code disruption.
- **Alternatives Considered**:
  - *CSS zoom*: Introduces browser-dependent sub-pixel rendering quirks and blurry canvas rasterization on Chrome/Safari.

### 6. Wall-Clock Particle Stepping during Overlays
- **Approach**: In `Arena.render(ctx, wallDeltaTime)` or `Arena.step()`, when `isUpgradeDraftActive`, `status === "victory"`, or `status === "defeat"` is true, invoke `this.particles.update(wallDeltaTime)` (or a slow-mo factor $0.4 \times \text{wallDeltaTime}$).
- Shards continue arcing, spinning, and fading out naturally behind the frosted UI glass.

## Risks / Trade-offs

- **[Risk]** Lingering boss novae hit player after boss death, causing frustrating defeat.
  - **Mitigation**: Player retains 100% control responsiveness and dash during the slow-mo collapse, and time dilation slows bullets down, making dodging rewarding rather than punishing.
- **[Risk]** Render interpolation introduces 1-frame visual latency relative to instantaneous physics state.
  - **Mitigation**: Standard 1-tick latency at 60 Hz is 16.6ms, which is imperceptible and mathematically necessary for causal interpolation (rendering between $t-1$ and $t$). Instant mouse aiming reticle remains un-interpolated hardware tracking.
- **[Risk]** DPR scaling increases fill-rate overhead on integrated GPUs.
  - **Mitigation**: Clamp `dpr` to a maximum of 3.0. ChronoShot's geometric 2D rendering profile is extremely lightweight (<1ms render pass).
