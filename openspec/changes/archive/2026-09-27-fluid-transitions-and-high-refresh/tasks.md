# Tasks

## 1. Asymmetric Time Scale Ramping & Sound Doppler

- [x] 1.1 Update `TimeGovernor` to support decoupled `rampUpRate` (instant attack) and `rampDownRate` (smooth ~200ms settling decay) with tests in `src/engine/TimeGovernor.test.ts`
- [x] 1.2 Verify `SoundSynthesizer` pitch calculations smoothly glide with the continuous `TimeGovernor` decay curve without pitch stepping

## 2. Persistent Wall-Clock Particle Simulation

- [x] 2.1 Update `Arena.step` and `Arena.render` so `ParticleSystem.update()` advances with wall-clock delta time when UI overlays (upgrade draft, pause, victory, defeat) are active
- [x] 2.2 Add unit tests in `src/entities/Arena.test.ts` and `src/entities/ParticleSystem.test.ts` asserting particles advance their lifetime and position during `isUpgradeDraftActive = true` and `status = "victory"`

## 3. Boss Defeat Slow-Motion Decay & Ballistics Peril

- [x] 3.1 Implement `bossDefeatTransition` state machine in `Arena`, delaying reward presentation for 30 simulation ticks while decaying time dilation and continuing physics updates
- [x] 3.2 Ensure active in-flight projectiles continue continuous collision detection during boss defeat decay, verifying player can be damaged or eliminated if hit by lingering bullets
- [x] 3.3 Add unit tests in `src/entities/Arena.test.ts` asserting boss projectiles remain live/lethal, reward menus are deferred, and lethal hits cause defeat during collapse

## 4. Cyberpunk Iris Portal Transition

- [x] 4.1 Implement `portalTransition` state machine in `Arena` and `RoomManager` managing `"ingress"` (inward pull and aperture contraction) and `"egress"` (aperture expansion at new spawn)
- [x] 4.2 Add geometric aperture rendering in `RoomManager` / `Arena` with hairline cyberpunk framing
- [x] 4.3 Add unit tests in `src/levels/RoomManager.test.ts` and `src/entities/Arena.test.ts` verifying portal entry triggers the transition sequence before atomic room loading

## 5. Sub-Tick Render Interpolation & High-DPI Display Scaling

- [x] 5.1 Implement sub-tick coordinate interpolation (`lerp(previousPosition, position, alpha)`) in `Arena.render()` for Player, Enemies, and Projectiles
- [x] 5.2 Configure `main.ts` and `index.html` canvas backing store buffer scaling using `window.devicePixelRatio` and context scaling while preserving 960x640 virtual coordinate mouse tracking
- [x] 5.3 Add unit tests verifying `Arena.render()` passes interpolated coordinates to canvas draw methods and handles fractional alpha values correctly

## 6. End-to-End Verification & Validation

- [x] 6.1 Run full Vitest test suite (`npm test`) to verify all existing and new tests pass with zero regressions
- [x] 6.2 Validate change artifacts with `openspec validate fluid-transitions-and-high-refresh --strict`
