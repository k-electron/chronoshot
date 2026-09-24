# Design: Room 20 Cataclysm Lethality Desync and Lifecycle Fixes

## Context

See `proposal.md` for motivation. In ChronoShot, combat lifecycle events and rendering rely on the `isAlive` flag and `Arena.status`. Previously:
1. `this.status = "defeat"` was only set inside the projectile collision check loop when a projectile impacted the player.
2. `createCataclysmPulse` in `src/entities/boss/BossTransitionAction.ts` is the only non-projectile lethal damage source in the game. It calls `player.takeDamage(damage)` without updating arena status or checking if the hit eliminated the player.
3. In `Arena.render`, the player chassis is only rendered when `this.player.isAlive` is true, and the Defeat HUD is only rendered when `this.status === "defeat"`. When eliminated by Cataclysm Pulse, the player chassis stopped rendering, but the Defeat HUD never triggered, locking the game into 0.05x micro-creep with an invisible player.
4. `createMinionEscortSpawn` pushed raw config objects into `ctx.arena.enemies` because `ctx.arena.spawnEnemy` was never implemented.
5. In `LevelDirector.ts`, Room 20 boss coordinates were hardcoded to `width - 200` (760), overlapping `redoubt-pillar-east` (bounds 716..764).
6. In `Enemy.ts`, boss speed was cached on initialization and never updated from `phaseController.speed` during phase transitions.

## Goals / Non-Goals

**Goals:**
- Guarantee that any non-bullet player elimination immediately triggers the full defeat lifecycle (cyan shatter particles, defeat sound, `this.status = "defeat"`, and Defeat HUD activation).
- Ensure Cataclysm Pulse provides distinct audiovisual feedback when absorbing a hit with Reactive Shield versus inflicting lethal damage.
- Provide a clean `Arena.spawnEnemy(config: EnemyConfig): Enemy` method to instantiate and register fully functional live `Enemy` instances during boss transitions.
- Align `LevelDirector` Room 20 boss coordinates with `ApexRedoubtTemplate` clearance guidelines (`width - 350`).
- Ensure multi-phase bosses dynamically update their movement speed when transitioning between phases.

**Non-Goals:**
- Modifying Cataclysm Overload channel timings, telegraph visuals, or cover line-of-sight raycast algorithms.
- Changing boss hit points, weapon parameters, or escort archetype compositions.

## Decisions

### 1. Global Player Elimination Lifecycle Check in `Arena.fixedUpdate`
- **Choice**: Add a centralized check in `Arena.fixedUpdate` immediately following physics sub-stepping:
  ```ts
  if (this.status === "playing" && !this.player.isAlive) {
    this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
    this.particles.emitShatter(this.player.position, 22, "#00f0ff", 240);
    this.status = "defeat";
  }
  ```
- **Rationale**: Decouples defeat state transitions from individual damage sources. Even if new environmental hazards, area-of-effect abilities, or self-inflicted damage mechanics are introduced, the arena will never remain in an invalid `"playing"` state when the player is dead.
- **Alternatives Considered**: Only updating `arena.status` inside `createCataclysmPulse`. Rejected because it creates tight coupling and leaves the engine vulnerable to identical desyncs if other non-bullet damage sources are added.

### 2. Immediate Audiovisual Feedback in `createCataclysmPulse`
- **Choice**: Inspect the `DamageResult` returned by `player.takeDamage(damage)`:
  - If `absorbed` (shield consumed): emit shield deflection/break sparks and play shield audio.
  - If `eliminated`: emit impact debris and inform `ctx.arena` (if present) to trigger defeat state.
- **Rationale**: Gives instantaneous physical tactile feedback when the Cataclysm shockwave connects with the player chassis, rather than silently depleting shields or killing the player.

### 3. Dynamic Entity Spawning via `Arena.spawnEnemy`
- **Choice**: Implement `spawnEnemy(config: EnemyConfig): Enemy` on `Arena`:
  ```ts
  public spawnEnemy(config: EnemyConfig): Enemy {
    const enemy = new Enemy(config);
    if (enemy.phaseController) {
      enemy.phaseController.transitionContextExtras = {
        arena: this,
        particles: this.particles,
        soundSynth: this.soundSynth,
      };
    }
    this.enemies.push(enemy);
    return enemy;
  }
  ```
  Update `createMinionEscortSpawn` to call `ctx.arena.spawnEnemy(item)` or fallback to `new Enemy(item)`.
- **Rationale**: Ensures all enemies in `arena.enemies` have full `Enemy` prototype methods (`update`, `reset`, `takeDamage`, getters for `isAlive`), preventing runtime crashes during room resets and ensuring escorts render and engage properly.

### 4. LevelDirector Room 20 Milestone Boss Placement
- **Choice**: In `LevelDirector.generateBossRoom`, evaluate `roomNumber === 20`:
  ```ts
  x: roomNumber === 20 ? this.arenaWidth - 350 : this.arenaWidth - 200,
  ```
- **Rationale**: Directly resolves the geometry clash with `redoubt-pillar-east` (size 48, center 740), placing Chrono-Zenith at `(610, 320)` with over 100px of clearance from adjacent obstacles.

### 5. Boss Speed Synchronization on Phase Transition
- **Choice**: In `Enemy.takeDamage()` and `Enemy.update()`, whenever `res.transitioned` or `transitioned` occurs on a unit with a `phaseController`:
  ```ts
  this.speed = this.phaseController.speed;
  ```
- **Rationale**: Ensures Chrono-Zenith accelerates through phases (45 px/s -> 95 px/s -> 105 px/s -> 125 px/s) as designed in `CHRONO_ZENITH_BLUEPRINT`.

## Risks / Trade-offs

- **[Risk] Duplicate Defeat Triggers**: If a projectile and Cataclysm pulse hit the player on the same simulation frame.
  - **Mitigation**: Guarded by `if (this.status === "playing")`. The first event transitions status to `"defeat"`; subsequent checks in the same tick are no-ops.
- **[Risk] Active Escorts Delaying Victory Portal**: Spawning live escorts during boss phase transitions means the portal will remain locked until both boss and escorts are neutralized.
  - **Mitigation**: This is the intended design of `createMinionEscortSpawn` and `checkVictoryCondition`. The tactical tip for Room 20 explicitly tells the player: "coordinate fire against escort hostiles."
