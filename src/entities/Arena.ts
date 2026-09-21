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

  public roomManager?: RoomManager;
  public soundSynth?: SoundSynthesizer;

  public status: ArenaStatus = "playing";

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
    this.roomManager = roomManager;
    this.soundSynth = soundSynth ?? new SoundSynthesizer();

    this.player = new Player({ x: 140, y: height / 2 });
    this.cylinderHUD = new CylinderHUD({ x: 70, y: height - 60 });
    this.timeHUD = new TimeHUD({ x: 24, y: 24 });

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
    this.obstacles = [...room.obstacles];
    this.enemies = room.enemies.map((cfg) => new Enemy(cfg));
    this.player.reset(room.playerSpawn);
    this.projectiles = [];
    this.particles.clear();
    this.timeGovernor.reset();
    this.simulator.reset();
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

    // Continuous 360-degree aiming (independent of time dilation)
    this.player.setAimTarget(input.mousePos);

    if (this.status === "playing") {
      // Weapon discharge command
      if (input.shoot) {
        const firedBullets = this.player.fire(this.timeGovernor);
        if (firedBullets.length > 0) {
          this.timeHUD.notifyBurst(this.player.weapon.config.fireTickBurst, "fire");
          this.projectiles.push(...firedBullets);
          this.soundSynth?.playFire(this.timeGovernor.getTimeScale());
        } else if (this.player.weapon.wasDryFired()) {
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
        const enemyBullets = enemy.update(this.player, this.obstacles, 1);
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
          // 1-Hit Lethality crystalline shatter
          this.soundSynth?.playShatter(this.timeGovernor.getTimeScale());
          if (hit.unit.id === "player") {
            this.particles.emitShatter(this.player.position, 22, "#00f0ff", 240);
            this.status = "defeat";
          } else {
            this.particles.emitShatter(hit.point, 18, "#ff2a44", 220);
            this.checkVictoryCondition();
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
   */
  public restart(): void {
    if (this.roomManager) {
      if (this.roomManager.isGameCompleted()) {
        this.roomManager.restartGame();
      } else {
        this.roomManager.restartCurrentRoom();
      }
      this.loadRoom(this.roomManager.getCurrentRoom());
    } else {
      this.status = "playing";
      this.player.reset();
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

      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(enemy.aimAngle);

      if (enemy.type === "shotgun") {
        // Shotgun Guard: faceted heavy octagon/pentagon
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

      // Sightline beam if tracking player
      if (enemy.hasLineOfSight) {
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

    // Room Progression Header
    if (this.roomManager) {
      this.roomManager.renderRoomHeader(ctx, this.width);
    }

    // 8. Game Over / Victory Overlay
    if (this.status === "defeat") {
      ctx.save();
      ctx.fillStyle = "rgba(10, 0, 0, 0.65)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "900 48px monospace";
      ctx.fillStyle = "#ff3344";
      ctx.fillText("DEFEATED", this.width / 2, this.height / 2 - 24);

      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#e0e6ed";
      ctx.fillText("PRESS [R] TO INSTANTLY RESTART", this.width / 2, this.height / 2 + 28);
      ctx.restore();
    } else if (this.status === "victory") {
      if (this.roomManager && this.roomManager.isGameCompleted()) {
        this.roomManager.renderGameVictory(ctx, this.width, this.height);
      } else {
        ctx.save();
        ctx.fillStyle = "rgba(0, 20, 10, 0.6)";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "900 48px monospace";
        ctx.fillStyle = "#00f0ff";
        ctx.fillText("AREA CLEARED", this.width / 2, this.height / 2 - 24);

        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#e0e6ed";
        ctx.fillText("PRESS [R] TO RESTART ENCOUNTER", this.width / 2, this.height / 2 + 28);
        ctx.restore();
      }
    }
  }
}
