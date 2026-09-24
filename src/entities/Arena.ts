/**
 * Arena Module for ChronoShot.
 *
 * Coordinates the tactical combat arena environment:
 * - Fixed-step simulation integrated with TimeGovernor
 * - Player navigation, crosshair aiming, and revolver mechanics
 * - Enemy AI tracking, line-of-sight checks, and discharge cadence
 * - Continuous Collision Detection for projectiles against walls and entities
 * - 1-hit lethality, geometric particle shatter system, and instant restart on 'R'
 */

import { SoundSynthesizer } from "../audio/SoundSynthesizer";
import { FixedStepSimulator } from "../engine/FixedStepSimulator";
import { TimeGovernor } from "../engine/TimeGovernor";
import { createRoom20, RoomConfig } from "../levels/Room";
import { createEndlessSurvivalRoom, RoomManager } from "../levels/RoomManager";
import { EndlessDirector, MaterializingUnit } from "../levels/EndlessDirector";
import { vec2, vecLength, vecNormalize, Vector2D } from "../math/vector";
import { CylinderHUD } from "../ui/CylinderHUD";
import { Reticle } from "../ui/Reticle";
import { ChronoAnchorRenderer } from "../ui/ChronoAnchorRenderer";
import { getUIFont, UITheme } from "../ui/theme";
import { TimeHUD } from "../ui/TimeHUD";
import { Enemy, EnemyConfig } from "./Enemy";
import { EnemyRenderer } from "../ui/EnemyRenderer";
import { BossTelemetryHUD } from "../ui/BossTelemetryHUD";
import { EndlessTelemetryHUD } from "../ui/EndlessTelemetryHUD";
import { createObstacle, createPillar, Obstacle } from "./Obstacle";
import { ParticleSystem } from "./ParticleSystem";
import { Player } from "./Player";
import { Projectile } from "./Projectile";
import { UpgradeDefinition } from "../upgrades/UpgradeDefinition";
import { DEFAULT_UPGRADE_REGISTRY } from "../upgrades/UpgradeRegistry";
import { extendedCylinder } from "../upgrades/definitions/extendedCylinder";
import { reactiveShield } from "../upgrades/definitions/reactiveShield";
import { speedLoader } from "../upgrades/definitions/speedLoader";
import { UpgradeDraftHUD } from "../ui/UpgradeDraftHUD";
import { DefeatHUD } from "../ui/DefeatHUD";
import { VictoryHUD } from "../ui/VictoryHUD";

export type ArenaStatus = "playing" | "victory" | "defeat";

export interface ArenaInput {
  moveDir: Vector2D;
  mousePos: Vector2D;
  shoot: boolean;
  reload: boolean;
  restart: boolean;
  fullReset?: boolean;
  dash?: boolean;
  togglePause?: boolean;
  upgradeChoice?: 1 | 2 | 3 | number;
  endlessChoice?: boolean;
}

export class Arena {
  public readonly width: number;
  public readonly height: number;

  public player: Player;
  public enemies: Enemy[] = [];
  public obstacles: Obstacle[] = [];
  public projectiles: Projectile[] = [];
  public particles: ParticleSystem;

  public timeGovernor: TimeGovernor;
  public simulator: FixedStepSimulator;

  public cylinderHUD: CylinderHUD;
  public timeHUD: TimeHUD;
  public reticle: Reticle;

  public roomManager?: RoomManager;
  public soundSynth?: SoundSynthesizer;
  public endlessDirector?: EndlessDirector;

  public status: ArenaStatus = "playing";
  public isPaused: boolean = false;
  public isUpgradeDraftActive: boolean = false;
  public activeUpgradeDraft: UpgradeDefinition[] = [];
  public hoveredUpgradeCardIndex: number | null = null;
  public hoveredDefeatCardIndex: number | null = null;
  public hoveredVictoryCardIndex: number | null = null;
  public checkpointLoadouts: Map<number, string[]> = new Map();

  constructor(
    width = 960,
    height = 640,
    roomManager?: RoomManager,
    soundSynth?: SoundSynthesizer
  ) {
    this.width = width;
    this.height = height;

    this.timeGovernor = new TimeGovernor();
    this.simulator = new FixedStepSimulator();
    this.particles = new ParticleSystem();
    this.reticle = new Reticle();
    this.roomManager = roomManager;
    this.soundSynth = soundSynth ?? new SoundSynthesizer();
    this.endlessDirector = this.roomManager?.endlessDirector;

    this.player = new Player({ x: 140, y: height / 2 });
    this.cylinderHUD = new CylinderHUD({ x: 60, y: height - 55, radius: 26, chamberRadius: 5 });
    this.timeHUD = new TimeHUD({ x: width - 160 - 24, y: 20, width: 160, height: 3 });

    if (this.roomManager) {
      this.loadRoom(this.roomManager.getCurrentRoom());
    } else {
      this.setupDefaultLayout();
    }
  }

  /**
   * Sets up a tactical arena with perimeter barriers and central cover pillars.
   */
  public setupDefaultLayout(): void {
    this.obstacles = [];

    // Perimeter boundary walls
    const wallThick = 20;
    this.obstacles.push(createObstacle("wall-top", 0, 0, this.width, wallThick));
    this.obstacles.push(
      createObstacle("wall-bottom", 0, this.height - wallThick, this.width, wallThick)
    );
    this.obstacles.push(createObstacle("wall-left", 0, 0, wallThick, this.height));
    this.obstacles.push(
      createObstacle("wall-right", this.width - wallThick, 0, wallThick, this.height)
    );

    // Central tactical cover pillars and barrier blocks
    this.obstacles.push(createPillar("pillar-center-top", 440, 200, 50));
    this.obstacles.push(createPillar("pillar-center-bottom", 440, 440, 50));
    this.obstacles.push(createObstacle("divider-wall", 300, 290, 24, 120));
    this.obstacles.push(createObstacle("cover-block", 580, 270, 70, 30));

    // Initialize enemy forces
    this.enemies = [
      new Enemy({
        id: "grunt-1",
        type: "grunt",
        x: 720,
        y: 190,
        fireCadenceTicks: 50,
      }),
      new Enemy({
        id: "shotgun-guard",
        type: "shotgun",
        x: 780,
        y: 450,
        fireCadenceTicks: 80,
      }),
      new Enemy({
        id: "grunt-2",
        type: "grunt",
        x: 620,
        y: 490,
        fireCadenceTicks: 55,
      }),
    ];
  }

  /**
   * Configures arena entities, barriers, and player spawn for a specific puzzle room.
   */
  public loadRoom(room: RoomConfig): void {
    this.status = "playing";
    this.isPaused = false;
    this.isUpgradeDraftActive = false;
    this.obstacles = [...room.obstacles];
    this.enemies = room.enemies.map((cfg) => {
      const enemy = new Enemy(cfg);
      if (enemy.phaseController) {
        enemy.phaseController.transitionContextExtras = {
          arena: this,
          particles: this.particles,
          soundSynth: this.soundSynth,
        };
      }
      return enemy;
    });
    this.player.reset(room.playerSpawn);
    this.projectiles = [];
    this.particles.clear();
    this.timeGovernor.reset();
    this.simulator.reset();

    if (this.roomManager && !this.roomManager.isEndlessMode()) {
      this.endlessDirector = undefined;
    }

    // Capture pre-combat loadout snapshot upon milestone boss room entry
    if ([5, 10, 15, 20].includes(room.roomNumber)) {
      if (!this.checkpointLoadouts.has(room.roomNumber)) {
        this.checkpointLoadouts.set(room.roomNumber, [...this.player.upgradePipeline.getActiveIds()]);
      }
    }
  }

  /**
   * Dynamically constructs and registers an active enemy combat unit into the arena roster.
   */
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

  /**
   * Starts Endless Survival Mode:
   * - Transitions RoomManager to Apex Colosseum room with EndlessDirector
   * - Equips player with all 7 combat augmentations and full shields
   * - Clears existing projectiles and initializes dynamic spawner
   */
  public startEndlessMode(): void {
    if (this.roomManager) {
      const endlessRoom = this.roomManager.startEndlessMode();
      this.endlessDirector = this.roomManager.endlessDirector;
      this.loadRoom(endlessRoom);
    } else {
      this.endlessDirector = new EndlessDirector();
      this.endlessDirector.reset();
      const endlessRoom = createEndlessSurvivalRoom(this.width, this.height);
      this.loadRoom(endlessRoom);
    }
    this.player.equipFullEndlessLoadout();
    this.status = "playing";
    this.hoveredVictoryCardIndex = null;
  }

  /**
   * Drops the operative directly onto the post-Zenith campaign victory screen,
   * matching the exact state as having legitimately conquered Room 20:
   * - Room 20 completed (gameCompleted = true, currentRoomIndex = 19)
   * - Pre-Zenith loadout: Extended Cylinder, Speed Loader, Reactive Shield (8 ammo capacity, 1 shield)
   * - Pre-boss checkpoint loadouts populated for Rooms 5, 10, 15, and 20
   * - Active Mission Accomplished overlay with interactive cards (Endless Protocol vs Expedition Reset)
   */
  public bypassToCampaignVictory(): void {
    if (this.roomManager) {
      this.roomManager.bypassToCampaignVictory();
      this.loadRoom(this.roomManager.getCurrentRoom());
    } else {
      this.loadRoom(createRoom20(this.width, this.height));
    }

    // Neutralize any enemies instantiated by loadRoom
    this.enemies = [];
    this.projectiles = [];
    this.particles.clear();
    this.isUpgradeDraftActive = false;
    this.activeUpgradeDraft = [];
    this.hoveredVictoryCardIndex = null;
    this.endlessDirector = undefined;

    // Equip pre-Zenith Sector 4 loadout (3 drafted augmentations)
    const preZenithLoadout = [
      "extended-cylinder",
      "speed-loader",
      "reactive-shield",
    ];
    this.player.setLoadoutFromIds(preZenithLoadout);
    this.player.weapon.reload();
    if (this.player.maxShields > 0) {
      this.player.shields = this.player.maxShields;
    }

    // Populate historical boss checkpoint snapshots
    this.checkpointLoadouts.set(5, []);
    this.checkpointLoadouts.set(10, ["extended-cylinder"]);
    this.checkpointLoadouts.set(15, ["extended-cylinder", "speed-loader"]);
    this.checkpointLoadouts.set(20, [...preZenithLoadout]);

    this.status = "victory";
  }

  /**
   * Returns current active draft options, falling back to curated Sector 1 baseline.
   */
  public getDraftOptions(): UpgradeDefinition[] {
    if (this.activeUpgradeDraft.length > 0) {
      return this.activeUpgradeDraft;
    }
    return [
      DEFAULT_UPGRADE_REGISTRY.get("extended-cylinder") ?? extendedCylinder,
      DEFAULT_UPGRADE_REGISTRY.get("speed-loader") ?? speedLoader,
      DEFAULT_UPGRADE_REGISTRY.get("reactive-shield") ?? reactiveShield,
    ];
  }

  /**
   * Activates upgrade draft overlay, sampling from UpgradeRegistry or using curated options.
   */
  public openUpgradeDraft(options?: UpgradeDefinition[]): void {
    this.isUpgradeDraftActive = true;
    this.hoveredUpgradeCardIndex = null;
    if (options && options.length > 0) {
      this.activeUpgradeDraft = [...options];
    } else {
      const roomNum = this.roomManager?.getCurrentRoom().roomNumber;
      if (roomNum === 5) {
        this.activeUpgradeDraft = [
          DEFAULT_UPGRADE_REGISTRY.get("extended-cylinder") ?? extendedCylinder,
          DEFAULT_UPGRADE_REGISTRY.get("speed-loader") ?? speedLoader,
          DEFAULT_UPGRADE_REGISTRY.get("reactive-shield") ?? reactiveShield,
        ];
      } else {
        const sampled = DEFAULT_UPGRADE_REGISTRY.sampleDraft(
          3,
          this.player.upgradePipeline.getActiveIds()
        );
        this.activeUpgradeDraft = sampled.length > 0 ? sampled : this.getDraftOptions();
      }
    }
  }

  /**
   * Applies the selected tactical augmentation and advances progression to the next room.
   */
  public applyUpgrade(choice: 1 | 2 | 3 | number): void {
    const draftCards = this.getDraftOptions();
    const upgrade = draftCards[choice - 1];
    if (upgrade) {
      this.player.acquireUpgrade(upgrade);
    } else {
      if (choice === 1) {
        this.player.setAugmentation("extendedCylinder", true);
      } else if (choice === 2) {
        this.player.setAugmentation("speedLoader", true);
      } else if (choice === 3) {
        this.player.setAugmentation("reactiveShield", true);
      }
    }

    this.soundSynth?.playUpgradeChime(this.timeGovernor.getTimeScale());
    this.isUpgradeDraftActive = false;
    this.activeUpgradeDraft = [];
    this.hoveredUpgradeCardIndex = null;

    if (this.roomManager && this.roomManager.hasNextRoom()) {
      this.roomManager.advanceRoom();
      this.loadRoom(this.roomManager.getCurrentRoom());
    }
  }

  /**
   * Advances the arena simulation: handles input, updates time dilation,
   * runs discrete fixed physics ticks, checks continuous collisions,
   * enforces 1-hit lethality, and monitors win/loss conditions.
   */
  public step(wallDeltaTime: number, input: ArenaInput): void {
    // In defeat state, track hovered defeat card and process defeat actions
    if (this.status === "defeat") {
      const roomNum = this.roomManager
        ? this.roomManager.getCurrentRoom().roomNumber
        : 1;
      const isSingleCard = roomNum <= 5;

      this.hoveredDefeatCardIndex = DefeatHUD.getCardAt(
        input.mousePos.x,
        input.mousePos.y,
        this.width,
        this.height,
        isSingleCard ? 1 : 2
      );

      if (input.fullReset) {
        this.restart();
        return;
      }

      if (input.restart) {
        if (isSingleCard) {
          this.restart();
        } else {
          this.rollbackToCheckpoint();
        }
        return;
      }

      if (input.shoot) {
        if (this.hoveredDefeatCardIndex === 0) {
          if (isSingleCard) {
            this.restart();
          } else {
            this.rollbackToCheckpoint();
          }
          return;
        } else if (this.hoveredDefeatCardIndex === 1 && !isSingleCard) {
          this.restart();
          return;
        }
      }
      return;
    } else {
      this.hoveredDefeatCardIndex = null;
    }

    // In victory state, track hovered victory card and process victory actions
    if (this.status === "victory") {
      this.hoveredVictoryCardIndex = VictoryHUD.getCardAt(
        input.mousePos.x,
        input.mousePos.y,
        this.width,
        this.height
      );

      if (
        input.endlessChoice ||
        (input.shoot && this.hoveredVictoryCardIndex === 0)
      ) {
        this.startEndlessMode();
        return;
      }

      if (
        input.fullReset ||
        input.restart ||
        (input.shoot && this.hoveredVictoryCardIndex === 1)
      ) {
        this.restart();
        return;
      }

      return;
    } else {
      this.hoveredVictoryCardIndex = null;
    }

    // Instant room restart trigger
    if (input.fullReset) {
      this.restart();
      return;
    }
    if (input.restart) {
      this.restart();
      return;
    }

    // Intercept upgrade draft selection inputs
    if (this.isUpgradeDraftActive) {
      const draftCards = this.getDraftOptions();
      this.hoveredUpgradeCardIndex = UpgradeDraftHUD.getCardAt(
        input.mousePos.x,
        input.mousePos.y,
        draftCards.length,
        this.width,
        this.height
      );

      if (input.upgradeChoice) {
        this.applyUpgrade(input.upgradeChoice);
        return;
      }
      if (input.shoot) {
        if (this.hoveredUpgradeCardIndex !== null) {
          this.applyUpgrade((this.hoveredUpgradeCardIndex + 1) as 1 | 2 | 3);
          return;
        }
      }
      return;
    } else {
      this.hoveredUpgradeCardIndex = null;
    }

    // Toggle simulation pause state
    if (input.togglePause) {
      this.isPaused = !this.isPaused;
      return;
    }

    // Continuous 360-degree aiming (independent of time dilation)
    this.player.setAimTarget(input.mousePos);

    if (this.isPaused) {
      if (input.shoot) {
        this.isPaused = false;
      }
      return;
    }

    if (this.status === "playing") {
      // Weapon discharge command
      if (input.shoot) {
        const firedBullets = this.player.fire(this.timeGovernor);
        if (firedBullets.length > 0) {
          this.timeHUD.notifyBurst(this.player.weapon.config.fireTickBurst, "fire");
          this.projectiles.push(...firedBullets);
          this.soundSynth?.playFire(this.timeGovernor.getTimeScale());
        } else if (this.player.weapon.wasDryFired()) {
          this.reticle.triggerDryFire();
          this.soundSynth?.playDryClick(this.timeGovernor.getTimeScale());
          this.player.weapon.clearDryFire();
        }
      }

      // Reload cycle command (smooth real-time anchored exposure)
      if (input.reload) {
        const reloaded = this.player.startReload();
        if (reloaded) {
          this.timeHUD.notifyBurst(this.player.getReloadTicksTotal(), "reload");
          this.particles.emitShatter(this.player.position, 6, "#ffd166", 80);
          this.soundSynth?.playReload(1.0);
        }
      }

      // Tactical dash command
      if (input.dash) {
        const dashed = this.player.triggerDash(this.timeGovernor, input.moveDir);
        if (dashed) {
          this.timeHUD.notifyBurst(this.player.dashDurationTicks, "dash");
          const dashNormal = vecLength(input.moveDir) > 0 ? vecNormalize(input.moveDir) : vec2(0, -1);
          this.particles.emitShieldSparks(this.player.position, dashNormal, 16);
          this.soundSynth?.playShieldDeflect(this.timeGovernor.getTimeScale());
        }
      }
    }

    // Synchronize 1.00x real-time simulation during active reload channel
    if (this.player.isReloading()) {
      this.timeGovernor.setTimeScaleOverride(1.0);
    } else if (this.timeGovernor.getTimeScaleOverride() !== null) {
      this.timeGovernor.setTimeScaleOverride(null);
    }

    const inputSpeed = vecLength(input.moveDir) * this.player.maxSpeed;
    const activeSpeed = this.player.isReloading()
      ? this.player.maxSpeed
      : Math.max(this.player.getSpeed(), inputSpeed);

    // Fixed-step simulation coordinated through TimeGovernor
    this.simulator.stepWithGovernor(
      this.timeGovernor,
      wallDeltaTime,
      activeSpeed,
      this.player.maxSpeed,
      (fixedDt, _currentTick) => {
        this.fixedUpdate(fixedDt, input);
      }
    );

    // Global player elimination check (for non-bullet lethal hazards)
    if (this.status === "playing" && !this.player.isAlive) {
      this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
      this.particles.emitShatter(this.player.position, 22, "#00f0ff", 240);
      this.status = "defeat";
    }

    // Evaluate room clearance / exit portal status
    this.checkVictoryCondition();

    if (
      this.status === "playing" &&
      this.roomManager &&
      this.roomManager.isExitUnlocked()
    ) {
      if (
        this.roomManager.isPlayerInExitPortal(
          this.player.position,
          this.player.radius
        )
      ) {
        this.soundSynth?.playVictory(this.timeGovernor.getTimeScale());
        if (this.roomManager.hasNextRoom()) {
          this.roomManager.advanceRoom();
          this.loadRoom(this.roomManager.getCurrentRoom());
        } else {
          this.roomManager.advanceRoom(); // Flags game completed
          this.status = "victory";
        }
      }
    }
  }

  /**
   * Discrete physics sub-step (deterministic 60 Hz quanta).
   */
  private fixedUpdate(fixedDt: number, input: ArenaInput): void {
    // 1. Update Player
    this.player.update(input.moveDir, fixedDt, this.obstacles, {
      width: this.width,
      height: this.height,
    });

    if (this.player.wasChamberLoadedThisTick()) {
      this.soundSynth?.playChamberLoad(1.0, this.player.weapon.getAmmo());
    }
    if (this.player.wasReloadCompletedThisTick()) {
      this.soundSynth?.playReloadLatch(1.0);
    }

    if (this.player.dashActiveTicks > 0) {
      this.particles.emitShatter(this.player.position, 2, "#00f0ff", 60);
    }

    // 2. Endless dynamic reinforcements
    if (this.endlessDirector) {
      const readyConfigs = this.endlessDirector.update(
        this.player.position,
        this.enemies,
        this.obstacles,
        1
      );
      for (const cfg of readyConfigs) {
        this.enemies.push(new Enemy(cfg));
      }
    }

    // 3. Update Enemies AI
    for (const enemy of [...this.enemies]) {
      if (enemy.isAlive) {
        const wasCharging = enemy.isChargingLaser;
        const enemyBullets = enemy.update(this.player, this.obstacles, 1, fixedDt);
        if (!wasCharging && enemy.isChargingLaser) {
          this.soundSynth?.playSniperCharge(this.timeGovernor.getTimeScale());
        }
        if (enemyBullets.length > 0) {
          this.projectiles.push(...enemyBullets);
          this.soundSynth?.playFire(this.timeGovernor.getTimeScale());
        }
      }
    }

    // 4. Update Projectiles with Continuous Collision Detection
    for (const bullet of this.projectiles) {
      if (!bullet.isAlive) {
        continue;
      }

      const targets =
        bullet.owner === "player"
          ? this.enemies.filter((e) => e.isAlive)
          : this.player.isAlive
          ? [this.player]
          : [];

      const hit = bullet.update(fixedDt, this.obstacles, targets);

      if (hit) {
        if (hit.type === "obstacle") {
          // Impact spark debris & audio thwack
          this.particles.emitImpactSparks(hit.point, hit.normal, 6);
          this.soundSynth?.playImpact(this.timeGovernor.getTimeScale());
        } else if (hit.type === "unit" && hit.unit) {
          if (hit.damageResult?.absorbed) {
            // Shield absorbed hit!
            if (hit.damageResult.deflected) {
              this.particles.emitShieldSparks(hit.point, hit.normal, 8);
              this.soundSynth?.playShieldDeflect(this.timeGovernor.getTimeScale());
            } else if (hit.damageResult.remainingShields === 0) {
              // Shield break burst & audio
              this.particles.emitShieldBreak(hit.point, 16);
              this.soundSynth?.playShieldBreak(this.timeGovernor.getTimeScale());
            } else {
              // Shield deflection sparks & audio ping
              this.particles.emitShieldSparks(hit.point, hit.normal, 8);
              this.soundSynth?.playShieldDeflect(this.timeGovernor.getTimeScale());
            }
          } else {
            // Lethal hit crystalline shatter
            if (hit.unit.id === "player") {
              this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
              this.particles.emitShatter(this.player.position, 22, "#00f0ff", 240);
              this.status = "defeat";
            } else {
              const enemy = hit.unit as Enemy;
              if (this.endlessDirector) {
                this.endlessDirector.recordKill();
              }
              if (enemy.isBoss) {
                this.soundSynth?.playBossDefeat(this.timeGovernor.getTimeScale());
                this.particles.emitShatter(hit.point, 36, "#ff2a44", 320);
                const isFinalBoss =
                  this.roomManager &&
                  (this.roomManager.getCurrentRoom().roomNumber === 20 ||
                    !this.roomManager.hasNextRoom());
                if (isFinalBoss) {
                  this.soundSynth?.playVictory(this.timeGovernor.getTimeScale());
                  this.status = "victory";
                  this.roomManager?.advanceRoom();
                } else {
                  this.openUpgradeDraft();
                }
              } else {
                this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
                this.particles.emitShatter(hit.point, 18, "#ff2a44", 220);
                this.checkVictoryCondition();
              }
            }
          }
        }
      }
    }

    // Cull destroyed / terminated projectiles
    this.projectiles = this.projectiles.filter((b) => b.isAlive);

    // 5. Update Particle System shards
    this.particles.update(fixedDt);

    // Check enemy elimination status
    this.checkVictoryCondition();

    // Global player elimination check (for non-bullet lethal damage e.g. Cataclysm Overload shockwaves)
    if (this.status === "playing" && !this.player.isAlive) {
      this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
      this.particles.emitShatter(this.player.position, 22, "#00f0ff", 240);
      this.status = "defeat";
    }

    // 6. Check exit portal stepping if room manager is active
    if (
      this.status === "playing" &&
      !this.isUpgradeDraftActive &&
      this.roomManager &&
      this.roomManager.isExitUnlocked()
    ) {
      if (
        this.roomManager.isPlayerInExitPortal(
          this.player.position,
          this.player.radius
        )
      ) {
        this.soundSynth?.playVictory(this.timeGovernor.getTimeScale());
        if (this.roomManager.hasNextRoom()) {
          this.roomManager.advanceRoom();
          this.loadRoom(this.roomManager.getCurrentRoom());
        } else {
          this.roomManager.advanceRoom(); // Flags game completed
          this.status = "victory";
        }
      }
    }
  }

  private checkVictoryCondition(): void {
    if (this.isUpgradeDraftActive || this.endlessDirector) {
      return;
    }
    const aliveEnemies = this.enemies.some((e) => e.isAlive);
    if (!aliveEnemies && this.player.isAlive) {
      if (this.roomManager) {
        const justUnlocked = this.roomManager.updateEnemyState(this.enemies);
        if (justUnlocked) {
          this.soundSynth?.playVictory(this.timeGovernor.getTimeScale());
        }
      } else {
        this.status = "victory";
      }
    }
  }

  /**
   * Rolls back combat progression to the calculated boss checkpoint and restores
   * the exact augmentation set possessed upon initially entering that boss room.
   */
  public rollbackToCheckpoint(): void {
    this.hoveredDefeatCardIndex = null;
    if (!this.roomManager) {
      this.restart();
      return;
    }
    const target = this.roomManager.rollbackToCheckpoint();
    let snapshot = this.checkpointLoadouts.get(target.roomNumber);
    if (!snapshot) {
      const defaultAugs = [
        "extended-cylinder",
        "speed-loader",
        "reactive-shield",
      ];
      snapshot = defaultAugs.slice(0, target.requiredAugmentationCount);
    }
    this.player.setLoadoutFromIds(snapshot);
    this.isUpgradeDraftActive = false;
    this.activeUpgradeDraft = [];
    this.hoveredUpgradeCardIndex = null;
    this.loadRoom(this.roomManager.getCurrentRoom());
  }

  /**
   * Instantly restarts the combat room back to pristine initial setup (Full Run Reset).
   */
  public restart(): void {
    this.checkpointLoadouts.clear();
    this.hoveredDefeatCardIndex = null;
    this.endlessDirector = undefined;
    if (this.roomManager) {
      this.roomManager.restartGame();
      this.player.clearAugmentations();
      this.isUpgradeDraftActive = false;
      this.activeUpgradeDraft = [];
      this.loadRoom(this.roomManager.getCurrentRoom());
    } else {
      this.status = "playing";
      this.isUpgradeDraftActive = false;
      this.activeUpgradeDraft = [];
      this.player.reset();
      this.player.clearAugmentations();
      for (const enemy of this.enemies) {
        enemy.reset();
      }
      this.projectiles = [];
      this.particles.clear();
      this.timeGovernor.reset();
      this.simulator.reset();
    }
  }

  /**
   * Renders the complete arena scene onto Canvas 2D context.
   */
  public render(ctx: CanvasRenderingContext2D, wallDeltaTime = 0.016): void {
    // 1. Clear background
    ctx.fillStyle = "#0e1117";
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle tactical floor grid
    ctx.strokeStyle = "#161b22";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 2. Exit Portal (floor energy beacon)
    if (this.roomManager) {
      this.roomManager.renderPortal(ctx, wallDeltaTime);
    }

    // 3. Obstacles (walls & pillars)
    for (const obs of this.obstacles) {
      ctx.fillStyle = "#1e242f";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeStyle = "#384556";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }

    // 3. Projectiles (with high-velocity luminous tracer trails)
    for (const bullet of this.projectiles) {
      const isPlayerBullet = bullet.owner === "player";
      ctx.strokeStyle = isPlayerBullet ? "#00f0ff" : "#ff3344";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(bullet.previousPosition.x, bullet.previousPosition.y);
      ctx.lineTo(bullet.position.x, bullet.position.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bullet.position.x, bullet.position.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Cataclysm Hazard Warning Auras (for overloading bosses)
    for (const enemy of this.enemies) {
      if (enemy.isAlive && enemy.isOverloading) {
        this.renderCataclysmAura(ctx, enemy);
      }
    }

    // Materialization telegraph rings (in Endless Mode)
    if (this.endlessDirector) {
      for (const unit of this.endlessDirector.getMaterializationQueue()) {
        this.renderMaterializationTelegraph(ctx, unit);
      }
    }

    // Enemies (Crimson geometric polygons rendered via decoupled EnemyRenderer)
    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        EnemyRenderer.render(ctx, enemy, this.player.position);
      }
    }

    // 5. Player (Cyan directional circle, crosshair sightline, and ground chrono-anchor)
    if (this.player.isAlive) {
      ChronoAnchorRenderer.render(ctx, {
        position: this.player.position,
        radius: this.player.radius,
        progress: this.player.getReloadProgress(),
        isReloading: this.player.isReloading(),
      });

      if (this.player.shields > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.player.position.x, this.player.position.y, this.player.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(this.player.position.x, this.player.position.y);
      ctx.rotate(this.player.aimAngle);

      // Body circle
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#00bcd4";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00f0ff";
      ctx.stroke();

      // Core visor
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Gun barrel pointer
      ctx.fillStyle = "#e0f7fa";
      ctx.fillRect(this.player.radius - 2, -2, 10, 4);

      ctx.restore();
    }

    // 6. Particle shards
    this.particles.render(ctx);

    // 7. HUDs (Time Gauge & Revolver Cylinder)
    this.timeHUD.render(ctx, this.timeGovernor, wallDeltaTime);
    this.cylinderHUD.render(ctx, this.player.weapon, wallDeltaTime, this.player.isDashReady());

    // Boss Telemetry HUD (when active boss is present)
    const activeBoss = this.enemies.find((e) => e.isBoss && e.isAlive);
    if (activeBoss) {
      this.renderBossTelemetry(ctx, activeBoss);
    }

    // Endless Telemetry HUD (when endless mode is active)
    if (this.endlessDirector) {
      EndlessTelemetryHUD.render(
        ctx,
        {
          threatBudget: this.endlessDirector.getThreatBudget(),
          survivalTime: this.endlessDirector.getSurvivalTimeFormatted(),
          kills: this.endlessDirector.getKills(),
          activeThreat: this.endlessDirector.calculateActiveThreat(this.enemies),
        },
        this.width
      );
    }

    // Room Progression Header
    if (this.roomManager) {
      this.roomManager.renderRoomHeader(ctx, this.width, !!activeBoss);
    }

    // 8. In-Canvas Precision Reticle & Pause States
    if (this.status === "playing") {
      if (this.isPaused) {
        this.renderPauseOverlay(ctx);
      } else {
        // Corner pause hint during active combat
        ctx.save();
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.font = getUIFont(10, "600");
        ctx.fillStyle = UITheme.colors.textMuted;
        ctx.fillText("[ESC] PAUSE", this.width - 24, 66);
        ctx.restore();
      }

      if (!this.isUpgradeDraftActive && !this.isPaused) {
        this.reticle.update(wallDeltaTime);
        this.reticle.render(
          ctx,
          this.player.aimTarget,
          this.timeGovernor.getTimeScale(),
          this.player.getReloadProgress(),
          this.player.isReloading()
        );
      }
    }

    // Upgrade Draft Overlay
    if (this.isUpgradeDraftActive) {
      this.renderUpgradeDraft(ctx, this.hoveredUpgradeCardIndex);
    }

    // 9. Modernized Game Over / Victory Overlays
    if (this.status === "defeat") {
      const roomNum = this.roomManager ? this.roomManager.getCurrentRoom().roomNumber : 1;
      const totalRooms = this.roomManager ? this.roomManager.getRoomCount() : 20;
      const tier =
        roomNum <= 5
          ? "TIER 1"
          : roomNum <= 10
            ? "TIER 2"
            : roomNum <= 15
              ? "TIER 3"
              : "TIER 4";
      const roomTitle = this.roomManager ? this.roomManager.getCurrentRoom().title : "ROOM 01";
      const isEndless =
        this.endlessDirector !== undefined || (this.roomManager?.isEndlessMode() ?? false);
      const rollbackTarget = this.roomManager
        ? this.roomManager.getRollbackTarget()
        : {
            roomNumber: 1,
            roomIndex: 0,
            bossName: "BASIC COVER",
            loadoutDescription: "Full expedition reset (0 Augmentations)",
            requiredAugmentationCount: 0,
          };

      const endlessStats = this.endlessDirector
        ? {
            survivalTime: this.endlessDirector.getSurvivalTimeFormatted(),
            maxThreat: this.endlessDirector.getThreatBudget(),
            kills: this.endlessDirector.getKills(),
          }
        : undefined;

      DefeatHUD.render(
        ctx,
        {
          roomNumber: roomNum,
          totalRooms,
          tier,
          roomTitle,
          rollbackTarget,
          isEndless,
          endlessStats,
          hoveredCardIndex: this.hoveredDefeatCardIndex,
        },
        this.width,
        this.height
      );
    } else if (this.status === "victory") {
      if (this.roomManager && this.roomManager.isGameCompleted()) {
        this.roomManager.renderGameVictory(ctx, this.width, this.height, this.hoveredVictoryCardIndex);
      } else {
        ctx.save();
        ctx.fillStyle = "rgba(4, 12, 16, 0.85)";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 200, this.height / 2 - 50);
        ctx.lineTo(this.width / 2 + 200, this.height / 2 - 50);
        ctx.strokeStyle = UITheme.colors.cyanDim;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = getUIFont(32, "800");
        ctx.fillStyle = UITheme.colors.cyan;
        ctx.fillText("AREA NEUTRALIZED", this.width / 2, this.height / 2 - 16);

        ctx.font = getUIFont(11, "600");
        ctx.fillStyle = UITheme.colors.textMuted;
        ctx.fillText("ALL HOSTILES ELIMINATED // EXIT GATE UNLOCKED", this.width / 2, this.height / 2 + 16);

        ctx.font = getUIFont(12, "bold");
        ctx.fillStyle = UITheme.colors.textPrimary;
        ctx.fillText("STEP INTO EXIT GATE OR PRESS [R] TO RESTART", this.width / 2, this.height / 2 + 52);

        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 200, this.height / 2 + 80);
        ctx.lineTo(this.width / 2 + 200, this.height / 2 + 80);
        ctx.strokeStyle = UITheme.colors.cyanDim;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  /**
   * Renders the Swiss-style minimalist pause card with full tactical control matrix.
   */
  public renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Veiled translucent dark backdrop
    ctx.fillStyle = "rgba(7, 10, 15, 0.88)";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Central minimalist control card
    const cardW = 500;
    const cardH = 320;
    const cardX = (this.width - cardW) / 2;
    const cardY = (this.height - cardH) / 2;

    // Card glass fill and hairline border
    ctx.fillStyle = "rgba(13, 17, 24, 0.95)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.lineWidth = 1;
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Subtle corner accent notches
    const cornerSize = 10;
    ctx.strokeStyle = UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(cardX, cardY + cornerSize);
    ctx.lineTo(cardX, cardY);
    ctx.lineTo(cardX + cornerSize, cardY);
    // Top-right
    ctx.moveTo(cardX + cardW - cornerSize, cardY);
    ctx.lineTo(cardX + cardW, cardY);
    ctx.lineTo(cardX + cardW, cardY + cornerSize);
    // Bottom-left
    ctx.moveTo(cardX, cardY + cardH - cornerSize);
    ctx.lineTo(cardX, cardY + cardH);
    ctx.lineTo(cardX + cornerSize, cardY + cardH);
    // Bottom-right
    ctx.moveTo(cardX + cardW - cornerSize, cardY + cardH);
    ctx.lineTo(cardX + cardW, cardY + cardH);
    ctx.lineTo(cardX + cardW, cardY + cardH - cornerSize);
    ctx.stroke();

    // Card Header
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("// TACTICAL SIMULATION PAUSED", this.width / 2, cardY + 22);

    ctx.font = getUIFont(10, "600");
    ctx.fillStyle = UITheme.colors.textMuted;
    ctx.fillText("OPERATIONAL CONTROLS MATRIX", this.width / 2, cardY + 40);

    // Divider line
    ctx.beginPath();
    ctx.moveTo(cardX + 25, cardY + 60);
    ctx.lineTo(cardX + cardW - 25, cardY + 60);
    ctx.strokeStyle = UITheme.colors.hairline;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Control rows
    const controls = [
      { key: "[WASD] / [ARROWS]", desc: "TACTICAL MOVEMENT (TIME PROGRESSION)" },
      { key: "[MOUSE]", desc: "360° HARDWARE AIM RETICLE" },
      { key: "[L-CLICK]", desc: "DISCHARGE WEAPON (+6 TICKS)" },
      { key: "[R]", desc: "RELOAD REVOLVER CYLINDER (+30 TICKS)" },
      { key: "[SHIFT + R]", desc: "INSTANT PROTOCOL RESTART" },
      { key: "[M]", desc: "TOGGLE AUDIO SYNTHESIZER" },
      { key: "[ESC] / [P]", desc: "TOGGLE PAUSE / RESUME COMBAT" },
    ];

    let rowY = cardY + 74;
    for (const ctrl of controls) {
      ctx.textAlign = "left";
      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = UITheme.colors.cyan;
      ctx.fillText(ctrl.key, cardX + 35, rowY);

      ctx.textAlign = "right";
      ctx.font = getUIFont(10, "600");
      ctx.fillStyle = UITheme.colors.textSecondary;
      ctx.fillText(ctrl.desc, cardX + cardW - 35, rowY);

      rowY += 24;
    }

    // Bottom action prompt
    ctx.beginPath();
    ctx.moveTo(cardX + 25, cardY + cardH - 46);
    ctx.lineTo(cardX + cardW - 25, cardY + cardH - 46);
    ctx.strokeStyle = UITheme.colors.hairline;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("PRESS [ESC] OR CLICK ANYWHERE TO RESUME", this.width / 2, cardY + cardH - 30);

    ctx.restore();
  }

  /**
   * Renders real-time boss telemetry anchored at top-center during boss combat.
   */
  public renderBossTelemetry(ctx: CanvasRenderingContext2D, boss: Enemy): void {
    BossTelemetryHUD.render(
      ctx,
      {
        name: boss.bossName ?? "GOLIATH-01: AEGIS COLOSSUS",
        currentPhase: boss.phaseController
          ? boss.phaseController.currentPhaseIndex + 1
          : boss.isEnraged
            ? 2
            : 1,
        totalPhases: boss.phaseController
          ? boss.phaseController.phases.length
          : 2,
        phaseTitle: boss.phaseController
          ? boss.phaseController.currentPhase.phaseTitle
          : undefined,
        shields: boss.shields,
        maxShields: boss.maxShields || 4,
        isAlive: boss.isAlive,
        isEnraged: boss.isEnraged,
      },
      this.width
    );
  }

  /**
   * Evaluates the appropriate canvas cursor styling based on the current arena state:
   * - In upgrade draft: 'pointer' if hovering over a selectable upgrade card, 'default' otherwise.
   * - In pause, victory, or defeat screens: 'default'.
   * - During active combat play: 'none' (delegating aim tracking to Reticle).
   */
  public getDesiredCursor(mousePos?: Vector2D): string {
    if (this.isUpgradeDraftActive) {
      if (mousePos) {
        const draftCards = this.getDraftOptions();
        const cardIndex = UpgradeDraftHUD.getCardAt(
          mousePos.x,
          mousePos.y,
          draftCards.length,
          this.width,
          this.height
        );
        if (cardIndex !== null) {
          return "pointer";
        }
      }
      return "default";
    }

    if (this.status === "defeat") {
      if (mousePos) {
        const roomNum = this.roomManager
          ? this.roomManager.getCurrentRoom().roomNumber
          : 1;
        const isSingleCard = roomNum <= 5;
        const cardIndex = DefeatHUD.getCardAt(
          mousePos.x,
          mousePos.y,
          this.width,
          this.height,
          isSingleCard ? 1 : 2
        );
        if (cardIndex !== null) {
          return "pointer";
        }
      }
      return "default";
    }

    if (this.status === "victory") {
      if (mousePos) {
        const cardIndex = VictoryHUD.getCardAt(
          mousePos.x,
          mousePos.y,
          this.width,
          this.height
        );
        if (cardIndex !== null) {
          return "pointer";
        }
      }
      return "default";
    }

    if (this.isPaused) {
      return "default";
    }

    return "none";
  }

  /**
   * Renders the immediate freeze-frame upgrade selection overlay offering curated or sampled cards.
   */
  public renderUpgradeDraft(
    ctx: CanvasRenderingContext2D,
    hoveredIndex: number | null = this.hoveredUpgradeCardIndex
  ): void {
    const draftCards = this.getDraftOptions();
    const currentRoom = this.roomManager?.getCurrentRoom()?.roomNumber ?? 5;
    const sectorNumber = Math.max(1, Math.ceil(currentRoom / 5));
    UpgradeDraftHUD.render(ctx, draftCards, this.width, this.height, hoveredIndex, sectorNumber);
  }

  /**
   * Renders pulsating hazard aura around boss during Cataclysm Overload channel.
   */
  public renderCataclysmAura(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    ctx.save();
    const pos = enemy.position;
    const pulse = Math.sin(enemy.overloadTicksRemaining * 0.3) * 6;
    const auraRadius = Math.max(1, enemy.radius * 3.5 + pulse);

    // Radial hazard aura
    const grad = ctx.createRadialGradient(pos.x, pos.y, enemy.radius, pos.x, pos.y, auraRadius);
    grad.addColorStop(0, "rgba(255, 42, 68, 0.45)");
    grad.addColorStop(0.6, "rgba(255, 100, 0, 0.25)");
    grad.addColorStop(1, "rgba(255, 42, 68, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dashed warning perimeter
    ctx.strokeStyle = "#ff2a44";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, auraRadius * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // Warning text
    ctx.setLineDash([]);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(10, "bold");
    ctx.fillStyle = "#ff2a44";
    ctx.fillText("⚠ CATACLYSM OVERLOAD // SEEK COVER ⚠", pos.x, pos.y - enemy.radius - 18);

    ctx.restore();
  }

  /**
   * Renders a 30-tick converging telegraph reticle at a reinforcement spawn location.
   */
  public renderMaterializationTelegraph(
    ctx: CanvasRenderingContext2D,
    unit: MaterializingUnit
  ): void {
    ctx.save();
    const progress = 1 - Math.max(0, unit.ticksRemaining / 30);
    const radius = unit.radius + (1 - progress) * 20;

    // Outer converging reticle ring
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + progress * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner core dot
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 42, 68, 0.75)";
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 4 * progress, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair ticks
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1;
    const tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(unit.x - radius - tickLen, unit.y);
    ctx.lineTo(unit.x - radius + 2, unit.y);
    ctx.moveTo(unit.x + radius - 2, unit.y);
    ctx.lineTo(unit.x + radius + tickLen, unit.y);
    ctx.moveTo(unit.x, unit.y - radius - tickLen);
    ctx.lineTo(unit.x, unit.y - radius + 2);
    ctx.moveTo(unit.x, unit.y + radius - 2);
    ctx.lineTo(unit.x, unit.y + radius + tickLen);
    ctx.stroke();

    // Label
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(9, "bold");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("MATERIALIZING", unit.x, unit.y + radius + 12);

    ctx.restore();
  }
}
