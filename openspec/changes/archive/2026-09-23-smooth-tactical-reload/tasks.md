# Tasks

## 1. Modular Weapon & Revolver Reload State

- [x] 1.1 Extend `Weapon` interface and `Revolver` with stateful reload lifecycle methods (`startReload`, `isReloading`, `getReloadProgress`, `getReloadTicksRemaining`, `getReloadTicksTotal`, `updateReload`, `cancelReload`) and verify with unit tests in `src/weapons/Weapon.test.ts`
- [x] 1.2 Implement sequential chamber loading intervals and partial chamber retention upon cancellation in `Revolver` and verify with unit tests in `src/weapons/Weapon.test.ts`

## 2. Player Locomotion, Aiming, and Dash Breakout

- [x] 2.1 Update `Player` to coordinate weapon reload, clamp movement velocity, ignore WASD inputs during reload, and maintain continuous 360-degree mouse aiming and verify with unit tests in `src/entities/Player.test.ts`
- [x] 2.2 Implement emergency Overcharge Dash breakout in `Player.triggerDash`, ensuring it cancels reload lock while retaining loaded chambers, and verify with unit tests in `src/entities/Player.test.ts`

## 3. Simulation & Real-Time TimeGovernor Coordination

- [x] 3.1 Update `TimeGovernor` and `Arena` to drive 1.00x real-time simulation during active reload without instantaneous single-frame tick bursts and verify with unit tests in `src/engine/TimeGovernor.test.ts` and `src/entities/Arena.test.ts`

## 4. Modular Visual Telemetry & Audio Synchronization

- [x] 4.1 Create modular `ChronoAnchorRenderer` in `src/ui/ChronoAnchorRenderer.ts` to draw ground lock clamps, circular radial progress arc, and spent brass particle ejections and verify with unit tests in `src/ui/ChronoAnchorRenderer.test.ts`
- [x] 4.2 Update `Reticle` to render circular reload progress sweep and amber cycling color state and verify with unit tests in `src/ui/HUD.test.ts`
- [x] 4.3 Update `CylinderHUD` to visualize sequential chamber filling, cycling status text, and dash breakout prompt and verify with unit tests in `src/ui/HUD.test.ts`
- [x] 4.4 Update `SoundSynthesizer` to support incremental ratchet clicks and completion latch and verify with unit tests in `src/audio/SoundSynthesizer.test.ts`

## 5. System Integration & Verification

- [x] 5.1 Integrate reload telemetry into `Arena.render()` and `Arena.update()` and verify complete test suite passes via `npm test`
- [x] 5.2 Validate change specification using `openspec validate smooth-tactical-reload --strict`
