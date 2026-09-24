# Tasks

## 1. RadialNovaBehavior Counter-Rotation Support

- [x] 1.1 Extend `RadialNovaConfig` and `RadialNovaBehavior` in `src/entities/behaviors/attack/RadialNovaBehavior.ts` to support `counterRotating?: boolean` and `counterOffsetPhase?: number`, tracking dual angular offsets and emitting counter-rotating projectile rings on discharge
- [x] 1.2 Add unit tests in `src/entities/behaviors/attack/RadialNovaBehavior.test.ts` verifying `counterRotating: true` discharges dual rings ($2 \times \text{pellets}$ total) with opposite angular rotations and pristine reset lifecycle

## 2. Chrono-Zenith Blueprint & Regression Verification

- [x] 2.1 Update `CHRONO_ZENITH_BLUEPRINT` Phase 3 in `src/entities/boss/BossBlueprint.ts` to configure `counterRotating: true` on its `RadialNovaBehavior`
- [x] 2.2 Update and expand unit tests in `src/entities/boss/BossBlueprint.test.ts` to verify Chrono-Zenith Phase 3 attack behavior executes twin counter-rotating novae discharging 24 projectiles per volley
- [x] 2.3 Run full test suite (`npm test`) and typecheck build (`npm run build`) to ensure zero regressions across all test suites
