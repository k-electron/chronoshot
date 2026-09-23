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
import { RoomConfig } from "../levels/Room";
import { RoomManager } from "../levels/RoomManager";
import { vecLength, Vector2D } from "../math/vector";
import { CylinderHUD } from "../ui/CylinderHUD";
import { Reticle } from "../ui/Reticle";
import { getUIFont, UITheme } from "../ui/theme";
import { TimeHUD } from "../ui/TimeHUD";
import { Enemy } from "./Enemy";
import { createObstacle, createPillar, Obstacle } from "./Obstacle";
import { ParticleSystem } from "./ParticleSystem";
import { Player } from "./Player";
import { Projectile } from "./Projectile";

export type ArenaStatus = "playing" | "victory" | "defeat";

export interface ArenaInput {
  moveDir: Vector2D;
  mousePos: Vector2D;
  shoot: boolean;
  reload: boolean;
  restart: boolean;
  togglePause?: boolean;
  upgradeChoice?: 1 | 2 | 3;
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

  public status: ArenaStatus = "playing";
  public isPaused: boolean = false;
  public isUpgradeDraftActive: boolean = false;

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
    this.enemies = room.enemies.map((cfg) => new Enemy(cfg));
    this.player.reset(room.playerSpawn);
    this.projectiles = [];
    this.particles.clear();
    this.timeGovernor.reset();
    this.simulator.reset();
  }

  /**
   * Applies the selected tactical augmentation and advances progression to the next room.
   */
  public applyUpgrade(choice: 1 | 2 | 3): void {
    if (choice === 1) {
      this.player.setAugmentation("extendedCylinder", true);
    } else if (choice === 2) {
      this.player.setAugmentation("speedLoader", true);
    } else if (choice === 3) {
      this.player.setAugmentation("reactiveShield", true);
    }

    this.soundSynth?.playUpgradeChime(this.timeGovernor.getTimeScale());
    this.isUpgradeDraftActive = false;

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
    // Instant room restart trigger
    if (input.restart) {
      this.restart();
      return;
    }

    // Intercept upgrade draft selection inputs
    if (this.isUpgradeDraftActive) {
      if (input.upgradeChoice) {
        this.applyUpgrade(input.upgradeChoice);
        return;
      }
      if (input.shoot) {
        const { x, y } = input.mousePos;
        if (y >= 170 && y <= 460) {
          if (x >= 60 && x <= 320) {
            this.applyUpgrade(1);
            return;
          }
          if (x >= 350 && x <= 610) {
            this.applyUpgrade(2);
            return;
          }
          if (x >= 640 && x <= 900) {
            this.applyUpgrade(3);
            return;
          }
        }
      }
      return;
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

      // Reload cycle command
      if (input.reload) {
        const reloaded = this.player.reload(this.timeGovernor);
        if (reloaded) {
          this.timeHUD.notifyBurst(this.player.weapon.config.reloadTickBurst, "reload");
          this.soundSynth?.playReload(this.timeGovernor.getTimeScale());
        }
      }
    }

    const inputSpeed = vecLength(input.moveDir) * this.player.maxSpeed;
    const activeSpeed = Math.max(this.player.getSpeed(), inputSpeed);

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

    // 2. Update Enemies AI
    for (const enemy of this.enemies) {
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

    // 3. Update Projectiles with Continuous Collision Detection
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
            if (hit.damageResult.remainingShields === 0) {
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
              if (enemy.isBoss) {
                this.soundSynth?.playBossDefeat(this.timeGovernor.getTimeScale());
                this.particles.emitShatter(hit.point, 36, "#ff2a44", 320);
                this.isUpgradeDraftActive = true;
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

    // 4. Update Particle System shards
    this.particles.update(fixedDt);

    // Check enemy elimination status
    this.checkVictoryCondition();

    // 5. Check exit portal stepping if room manager is active
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
    if (this.isUpgradeDraftActive) {
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
   * Instantly restarts the combat room back to pristine initial setup.
   * In campaign mode, player defeat enforces pure permadeath back to Room 1.
   */
  public restart(): void {
    if (this.roomManager) {
      this.roomManager.restartGame();
      this.player.clearAugmentations();
      this.isUpgradeDraftActive = false;
      this.loadRoom(this.roomManager.getCurrentRoom());
    } else {
      this.status = "playing";
      this.isUpgradeDraftActive = false;
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

    // 4. Enemies (Crimson geometric polygons)
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) {
        continue;
      }

      // Render concentric radiant shield rings if unit has active shields
      if (enemy.shields > 0) {
        ctx.save();
        for (let s = 0; s < enemy.shields; s++) {
          const ringRadius = enemy.radius + 5 + s * 4;
          ctx.beginPath();
          ctx.arc(enemy.position.x, enemy.position.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(enemy.aimAngle);

      if (enemy.type === "boss") {
        // Boss: Imposing 8-sided reinforced octagonal titan
        ctx.beginPath();
        const sides = 8;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * enemy.radius;
          const py = Math.sin(a) * enemy.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = enemy.isEnraged ? "#4a000a" : "#2d0a10";
        ctx.fill();
        ctx.strokeStyle = enemy.isEnraged ? "#ff1744" : "#ff4d6d";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pulsing glowing core
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = enemy.isEnraged ? "#ff1744" : "#b71c1c";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Heavy twin-slug cannon barrels
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius - 2, -6, 12, 4);
        ctx.fillRect(enemy.radius - 2, 2, 12, 4);
      } else if (enemy.type === "shotgun") {
        // Shotgun Guard: faceted heavy pentagon
        ctx.beginPath();
        const sides = 5;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * enemy.radius;
          const py = Math.sin(a) * enemy.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = "#d32f2f";
        ctx.fill();
        ctx.strokeStyle = "#ff6659";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Heavy dual-barrel pointer
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius - 2, -4, 8, 3);
        ctx.fillRect(enemy.radius - 2, 1, 8, 3);
      } else if (enemy.type === "stalker") {
        // Stalker: sleek swept-back chevron/arrowhead
        ctx.beginPath();
        ctx.moveTo(enemy.radius * 1.4, 0);
        ctx.lineTo(-enemy.radius * 0.9, -enemy.radius * 0.9);
        ctx.lineTo(-enemy.radius * 0.3, 0);
        ctx.lineTo(-enemy.radius * 0.9, enemy.radius * 0.9);
        ctx.closePath();

        ctx.fillStyle = "#ff1744";
        ctx.fill();
        ctx.strokeStyle = "#ff5252";
        ctx.lineWidth = 2;
        ctx.stroke();

        // High-velocity needle barrel
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius * 1.1, -1.5, 7, 3);
      } else if (enemy.type === "warden") {
        // Aegis Warden: reinforced heavy hexagon
        ctx.beginPath();
        const sides = 6;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * enemy.radius;
          const py = Math.sin(a) * enemy.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = "#b71c1c";
        ctx.fill();
        ctx.strokeStyle = "#ff8a80";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Heavy reinforced slug muzzle
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius - 2, -3, 9, 6);
      } else if (enemy.type === "marksman") {
        // Marksman: 4-pointed precision crosshair star
        ctx.beginPath();
        const points = 4;
        for (let p = 0; p < points * 2; p++) {
          const a = (p / (points * 2)) * Math.PI * 2;
          const r = p % 2 === 0 ? enemy.radius * 1.3 : enemy.radius * 0.55;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = "#880e4f";
        ctx.fill();
        ctx.strokeStyle = "#f06292";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Long precision sniper barrel
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius * 0.6, -1.5, 14, 3);
      } else {
        // Pistol Grunt: sharp directional diamond
        ctx.beginPath();
        ctx.moveTo(enemy.radius * 1.3, 0);
        ctx.lineTo(-enemy.radius * 0.8, -enemy.radius);
        ctx.lineTo(-enemy.radius * 0.4, 0);
        ctx.lineTo(-enemy.radius * 0.8, enemy.radius);
        ctx.closePath();

        ctx.fillStyle = "#e53935";
        ctx.fill();
        ctx.strokeStyle = "#ff7961";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Firing pointer
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.radius * 1.1, -2, 6, 4);
      }

      // Sightline / Charging Laser beam
      if (enemy.isChargingLaser) {
        // Vivid crimson charging laser telegraph
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "rgba(255, 23, 68, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.position.x, enemy.position.y);
        ctx.lineTo(this.player.position.x, this.player.position.y);
        ctx.stroke();

        // Aim target dot on player
        ctx.fillStyle = "#ff1744";
        ctx.beginPath();
        ctx.arc(this.player.position.x, this.player.position.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (enemy.hasLineOfSight) {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "rgba(255, 50, 50, 0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(enemy.position.x, enemy.position.y);
        ctx.lineTo(this.player.position.x, this.player.position.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        ctx.restore();
      }
    }

    // 5. Player (Cyan directional circle and crosshair sightline)
    if (this.player.isAlive) {
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
    this.cylinderHUD.render(ctx, this.player.weapon, wallDeltaTime);

    // Boss Telemetry HUD (when active boss is present)
    const activeBoss = this.enemies.find((e) => e.isBoss && e.isAlive);
    if (activeBoss) {
      this.renderBossTelemetry(ctx, activeBoss);
    }

    // Room Progression Header
    if (this.roomManager) {
      this.roomManager.renderRoomHeader(ctx, this.width);
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
        ctx.fillText("[ESC] PAUSE", this.width - 24, 46);
        ctx.restore();
      }

      this.reticle.update(wallDeltaTime);
      this.reticle.render(ctx, this.player.aimTarget, this.timeGovernor.getTimeScale());
    }

    // Upgrade Draft Overlay
    if (this.isUpgradeDraftActive) {
      this.renderUpgradeDraft(ctx);
    }

    // 9. Modernized Game Over / Victory Overlays
    if (this.status === "defeat") {
      ctx.save();
      ctx.fillStyle = "rgba(7, 9, 14, 0.88)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const roomNum = this.roomManager ? this.roomManager.getCurrentRoom().roomNumber : 1;
      const totalRooms = this.roomManager ? this.roomManager.getRoomCount() : 9;
      const tier = roomNum <= 5 ? "TIER 1" : "TIER 2";
      const roomTitle = this.roomManager ? this.roomManager.getCurrentRoom().title : "ROOM 01";

      const augs = this.player.getAugmentations();
      let augText = "NONE";
      if (augs.extendedCylinder) augText = "EXTENDED CYLINDER (8 CHAMBERS)";
      else if (augs.speedLoader) augText = "SPEED LOADER (+15 TICKS)";
      else if (augs.reactiveShield) augText = "REACTIVE SHIELD (1 HIT BUFFER)";

      // Subtle hairline border
      ctx.beginPath();
      ctx.moveTo(this.width / 2 - 200, this.height / 2 - 70);
      ctx.lineTo(this.width / 2 + 200, this.height / 2 - 70);
      ctx.strokeStyle = UITheme.colors.crimsonDim;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = getUIFont(30, "800");
      ctx.fillStyle = UITheme.colors.crimson;
      ctx.fillText("PROTOCOL TERMINATED", this.width / 2, this.height / 2 - 38);

      ctx.font = getUIFont(11, "600");
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText("CRITICAL LETHAL TRAUMA SUSTAINED // RUN FAILED", this.width / 2, this.height / 2 - 10);

      // Run Statistics
      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = UITheme.colors.cyan;
      ctx.fillText(`SECTOR: ${tier}  |  ${roomTitle}  [${roomNum}/${totalRooms}]`, this.width / 2, this.height / 2 + 20);

      ctx.font = getUIFont(10, "600");
      ctx.fillStyle = UITheme.colors.textSecondary;
      ctx.fillText(`INSTALLED AUGMENTATION: ${augText}`, this.width / 2, this.height / 2 + 42);

      ctx.font = getUIFont(12, "bold");
      ctx.fillStyle = UITheme.colors.textPrimary;
      ctx.fillText("PRESS [R] TO INITIATE NEW RUN (LEVEL 1)", this.width / 2, this.height / 2 + 76);

      ctx.beginPath();
      ctx.moveTo(this.width / 2 - 200, this.height / 2 + 105);
      ctx.lineTo(this.width / 2 + 200, this.height / 2 + 105);
      ctx.strokeStyle = UITheme.colors.crimsonDim;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    } else if (this.status === "victory") {
      if (this.roomManager && this.roomManager.isGameCompleted()) {
        this.roomManager.renderGameVictory(ctx, this.width, this.height);
      } else {
        ctx.save();
        ctx.fillStyle = "rgba(4, 12, 16, 0.85)";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 160, this.height / 2 - 50);
        ctx.lineTo(this.width / 2 + 160, this.height / 2 - 50);
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
        ctx.moveTo(this.width / 2 - 160, this.height / 2 + 80);
        ctx.lineTo(this.width / 2 + 160, this.height / 2 + 80);
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
    ctx.save();
    const barW = 380;
    const barH = 34;
    const barX = (this.width - barW) / 2;
    const barY = 16;

    // Glass panel backing
    ctx.fillStyle = "rgba(10, 14, 20, 0.92)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.lineWidth = 1;
    ctx.strokeStyle = boss.isEnraged ? UITheme.colors.crimson : UITheme.colors.panelBorder;
    ctx.strokeRect(barX, barY, barW, barH);

    // Corner accent tabs
    const corner = 6;
    ctx.strokeStyle = boss.isEnraged ? UITheme.colors.crimson : UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barX, barY + corner);
    ctx.lineTo(barX, barY);
    ctx.lineTo(barX + corner, barY);
    ctx.moveTo(barX + barW - corner, barY);
    ctx.lineTo(barX + barW, barY);
    ctx.lineTo(barX + barW, barY + corner);
    ctx.stroke();

    // Boss Designation
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = getUIFont(11, "bold");
    ctx.fillStyle = boss.isEnraged ? UITheme.colors.crimson : UITheme.colors.cyan;
    const title = boss.bossName ?? "GOLIATH-01: AEGIS COLOSSUS";
    ctx.fillText(title, barX + 16, barY + barH / 2);

    // Shield Pips or Enraged Status
    if (boss.isEnraged) {
      ctx.textAlign = "right";
      ctx.font = getUIFont(10, "bold");
      ctx.fillStyle = UITheme.colors.crimson;
      ctx.fillText("CORE VULNERABLE // ENRAGED", barX + barW - 16, barY + barH / 2);
    } else {
      ctx.textAlign = "right";
      ctx.font = getUIFont(9, "bold");
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText("SHIELDS", barX + barW - 90, barY + barH / 2);

      const pipSize = 10;
      const pipGap = 5;
      const totalPips = boss.maxShields || 4;
      const pipsStartX = barX + barW - 16 - totalPips * (pipSize + pipGap);

      for (let p = 0; p < totalPips; p++) {
        const px = pipsStartX + p * (pipSize + pipGap);
        const py = barY + (barH - pipSize) / 2;
        if (p < boss.shields) {
          ctx.fillStyle = UITheme.colors.cyan;
          ctx.fillRect(px, py, pipSize, pipSize);
          ctx.strokeStyle = UITheme.colors.white;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pipSize, pipSize);
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(px, py, pipSize, pipSize);
          ctx.strokeStyle = UITheme.colors.hairline;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pipSize, pipSize);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Renders the immediate freeze-frame upgrade selection overlay offering 3 curated cards.
   */
  public renderUpgradeDraft(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Veiled translucent dark backdrop
    ctx.fillStyle = "rgba(7, 10, 15, 0.94)";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Header
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(22, "800");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("// TACTICAL AUGMENTATION PROTOCOL", this.width / 2, 60);

    ctx.font = getUIFont(12, "600");
    ctx.fillStyle = UITheme.colors.textSecondary;
    ctx.fillText("SECTOR 1 BOSS NEUTRALIZED — SELECT 1 COMBAT SYSTEM UPGRADE", this.width / 2, 95);

    // 3. Three Curated Cards
    const cardY = 145;
    const cardW = 260;
    const cardH = 320;
    const gap = 30;
    const startX = (this.width - (3 * cardW + 2 * gap)) / 2;

    const cards = [
      {
        key: "[1]",
        archetype: "FIREPOWER // CAPACITY",
        title: "EXTENDED CYLINDER",
        stat: "6 → 8 CHAMBERS",
        desc: "Expands revolver capacity by +2 chambers. Neutralize multiple heavily armored hostiles without mid-combat reload vulnerability.",
        accent: UITheme.colors.cyan,
      },
      {
        key: "[2]",
        archetype: "TEMPO // CYCLING",
        title: "SPEED LOADER",
        stat: "+15 TICK RELOAD",
        desc: "Halves ammunition cycle exposure from 30 ticks to 15 ticks. Enables aggressive repositioning and rapid tactical recovery under fire.",
        accent: "#ffb703",
      },
      {
        key: "[3]",
        archetype: "DEFENSE // RESILIENCE",
        title: "REACTIVE SHIELD",
        stat: "+1 SHIELD HIT BUFFER",
        desc: "Deploys a kinetic deflection barrier that absorbs 1 lethal projectile impact per room before shattering. Crucial for permadeath runs.",
        accent: "#06d6a0",
      },
    ];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cx = startX + i * (cardW + gap);

      // Card glass background
      ctx.fillStyle = "rgba(13, 17, 24, 0.96)";
      ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.lineWidth = 1;
      ctx.strokeStyle = UITheme.colors.panelBorder;
      ctx.strokeRect(cx, cardY, cardW, cardH);

      // Card accent top bar
      ctx.fillStyle = card.accent;
      ctx.fillRect(cx, cardY, cardW, 3);

      // Key prompt badge
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(cx + 20, cardY + 20, 44, 24);
      ctx.strokeStyle = card.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 20, cardY + 20, 44, 24);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = getUIFont(12, "bold");
      ctx.fillStyle = card.accent;
      ctx.fillText(card.key, cx + 42, cardY + 32);

      // Archetype
      ctx.textAlign = "left";
      ctx.font = getUIFont(9, "bold");
      ctx.fillStyle = UITheme.colors.textMuted;
      ctx.fillText(card.archetype, cx + 74, cardY + 32);

      // Title
      ctx.font = getUIFont(15, "800");
      ctx.fillStyle = UITheme.colors.textPrimary;
      ctx.fillText(card.title, cx + 20, cardY + 80);

      // Stat Highlight Box
      ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
      ctx.fillRect(cx + 20, cardY + 105, cardW - 40, 36);
      ctx.strokeStyle = card.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 20, cardY + 105, cardW - 40, 36);

      ctx.textAlign = "center";
      ctx.font = getUIFont(12, "bold");
      ctx.fillStyle = card.accent;
      ctx.fillText(card.stat, cx + cardW / 2, cardY + 123);

      // Description
      ctx.textAlign = "left";
      ctx.font = getUIFont(10, "normal");
      ctx.fillStyle = UITheme.colors.textSecondary;
      this.wrapText(ctx, card.desc, cx + 20, cardY + 165, cardW - 40, 16);

      // Select button
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(cx + 20, cardY + cardH - 45, cardW - 40, 28);
      ctx.strokeStyle = card.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 20, cardY + cardH - 45, cardW - 40, 28);

      ctx.textAlign = "center";
      ctx.font = getUIFont(11, "bold");
      ctx.fillStyle = card.accent;
      ctx.fillText(`INSTALL ${card.key}`, cx + cardW / 2, cardY + cardH - 31);
    }

    // 4. Footer prompt
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = getUIFont(11, "600");
    ctx.fillStyle = UITheme.colors.textMuted;
    ctx.fillText("PRESS [1], [2], OR [3] OR CLICK A CARD TO INSTALL AND ADVANCE TO ZONE 2", this.width / 2, cardY + cardH + 20);

    ctx.restore();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(" ");
    let line = "";
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}
