import { describe, expect, it } from "vitest";
import { GridPathfinder } from "../engine/GridPathfinder";
import { vec2 } from "../math/vector";
import { Enemy } from "./Enemy";
import { createObstacle, createPillar } from "./Obstacle";
import { Player } from "./Player";
import { CHRONO_WEAVER_BLUEPRINT, createBossPhaseController } from "./boss/BossBlueprint";
import { BossPhaseController } from "./boss/BossPhaseController";

describe("Enemy Tactical AI & Archetypes", () => {
  it("detects unobstructed line-of-sight to player", () => {
    const enemy = new Enemy({ id: "grunt-1", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });

    const canSee = enemy.checkLineOfSight(player.position, []);
    expect(canSee).toBe(true);
    expect(enemy.hasLineOfSight).toBe(true);
  });

  it("blocks line-of-sight when an obstacle or pillar is intervening", () => {
    const enemy = new Enemy({ id: "grunt-2", type: "grunt", x: 400, y: 100 });
    const player = new Player({ x: 100, y: 100 });
    const pillar = createPillar("pillar-1", 250, 100, 40);

    const canSee = enemy.checkLineOfSight(player.position, [pillar]);
    expect(canSee).toBe(false);
    expect(enemy.hasLineOfSight).toBe(false);
  });

  it("Pistol Grunt skirmishes at 120 px/s with 6-tick stutter on fire", () => {
    const enemy = new Enemy({
      id: "grunt-skirmish",
      type: "grunt",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });
    const player = new Player({ x: 100, y: 100 });

    expect(enemy.speed).toBe(120);
    expect(enemy.maxShields).toBe(0);
    expect(enemy.stutterTicks).toBe(6);

    // Tick 1: fires bullet and triggers stutter (6 - 1 = 5 ticks remaining)
    const bullets = enemy.update(player, [], 1);
    expect(bullets).toHaveLength(1);
    expect(enemy.stutterTimerTicks).toBe(5);
    expect(enemy.velocity.x).toBe(0);
    expect(enemy.velocity.y).toBe(0);
  });

  it("Shotgun Guard advances at 90 px/s with 1 shield and 5-pellet spread", () => {
    const guard = new Enemy({
      id: "guard-1",
      type: "shotgun",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });

    expect(guard.speed).toBe(90);
    expect(guard.shields).toBe(1);
    expect(guard.maxShields).toBe(1);
    expect(guard.pellets).toBe(5);

    // Hit 1: shield absorbs
    const hit1 = guard.takeDamage(1);
    expect(hit1.absorbed).toBe(true);
    expect(hit1.eliminated).toBe(false);
    expect(guard.shields).toBe(0);
    expect(guard.isAlive).toBe(true);

    // Hit 2: lethal elimination
    const hit2 = guard.takeDamage(1);
    expect(hit2.absorbed).toBe(false);
    expect(hit2.eliminated).toBe(true);
    expect(guard.isAlive).toBe(false);
  });

  it("Stalker sprints at 210 px/s with run-and-gun continuous velocity", () => {
    const stalker = new Enemy({
      id: "stalker-1",
      type: "stalker",
      x: 300,
      y: 100,
      initialDelayTicks: 1,
    });
    const player = new Player({ x: 100, y: 100 });

    expect(stalker.speed).toBe(210);
    expect(stalker.runAndGun).toBe(true);
    expect(stalker.maxShields).toBe(0);

    const bullets = stalker.update(player, [], 1);
    expect(bullets).toHaveLength(1);
    // Velocity must remain active even when discharging
    expect(stalker.velocity.x).toBeLessThan(0); // moving left toward player
    expect(stalker.stutterTimerTicks).toBe(0);
  });

  it("Aegis Warden marches at 60 px/s with 2-hit shield durability", () => {
    const warden = new Enemy({
      id: "warden-1",
      type: "warden",
      x: 400,
      y: 100,
    });

    expect(warden.speed).toBe(60);
    expect(warden.maxShields).toBe(2);
    expect(warden.shields).toBe(2);

    // 1st hit: absorbed, 1 shield remains
    const dmg1 = warden.takeDamage(1);
    expect(dmg1.absorbed).toBe(true);
    expect(dmg1.remainingShields).toBe(1);
    expect(warden.isAlive).toBe(true);

    // 2nd hit: absorbed, 0 shields remain
    const dmg2 = warden.takeDamage(1);
    expect(dmg2.absorbed).toBe(true);
    expect(dmg2.remainingShields).toBe(0);
    expect(warden.isAlive).toBe(true);

    // 3rd hit: lethal elimination
    const dmg3 = warden.takeDamage(1);
    expect(dmg3.absorbed).toBe(false);
    expect(dmg3.eliminated).toBe(true);
    expect(warden.isAlive).toBe(false);
  });

  it("Marksman charges laser telegraph for 30 ticks and halts movement while charging", () => {
    const marksman = new Enemy({
      id: "sniper-1",
      type: "marksman",
      x: 450,
      y: 100,
      fireCadenceTicks: 100,
      initialDelayTicks: 30, // exactly at laser charge threshold
    });
    const player = new Player({ x: 100, y: 100 });

    expect(marksman.laserChargeTicks).toBe(30);

    // Update tick: should enter charging laser state and halt
    const bullets1 = marksman.update(player, [], 1);
    expect(bullets1).toHaveLength(0);
    expect(marksman.isChargingLaser).toBe(true);
    expect(marksman.velocity.x).toBe(0);
    expect(marksman.velocity.y).toBe(0);

    // Advance remaining 29 ticks
    const bullets2 = marksman.update(player, [], 29);
    expect(bullets2).toHaveLength(1);
    const speed = Math.sqrt(bullets2[0].velocity.x ** 2 + bullets2[0].velocity.y ** 2);
    expect(speed).toBeCloseTo(850);
    expect(marksman.isChargingLaser).toBe(false);
  });

  it("resolves obstacle collision sliding without penetrating walls", () => {
    const enemy = new Enemy({
      id: "slider",
      type: "grunt",
      x: 90,
      y: 100,
      radius: 15,
    });
    // Wall at x: 100..120, y: 50..150
    const wall = createObstacle("wall-slide", 100, 50, 20, 100);

    // Force velocity into wall (rightward) and along wall (downward)
    enemy.velocity = vec2(100, 80);
    enemy.position.x = 95; // Penetrating (95 + 15 = 110 > 100)

    enemy.resolveObstacleCollisions([wall]);

    // Position must be pushed out to at most 100 - 15 = 85
    expect(enemy.position.x).toBeCloseTo(85);
    // Rightward velocity cancelled, downward preserved
    expect(enemy.velocity.x).toBe(0);
    expect(enemy.velocity.y).toBe(80);
  });

  it("navigates around cover using A* pathfinding when line-of-sight is obstructed", () => {
    const enemy = new Enemy({
      id: "pather",
      type: "grunt",
      x: 400,
      y: 200,
    });
    const player = new Player({ x: 100, y: 200 });
    const wall = createObstacle("wall-blocking", 250, 100, 40, 200);

    const pathfinder = new GridPathfinder(960, 640, 40);
    pathfinder.updateObstacles([wall], enemy.radius);

    // Initial update: blocked LOS triggers A* path finding
    enemy.update(player, [wall], 1, 1 / 60, pathfinder);

    expect(enemy.hasLineOfSight).toBe(false);
    expect(enemy.currentPath.length).toBeGreaterThan(0);
    // Velocity must steer around the obstacle (has vertical component)
    expect(Math.abs(enemy.velocity.x) + Math.abs(enemy.velocity.y)).toBeGreaterThan(0);
  });
});

describe("Enemy - Boss Archetype (Goliath-01)", () => {
  it("initializes with 4 shields, radius 24, and correct boss name", () => {
    const boss = new Enemy({
      id: "boss-goliath",
      type: "boss",
      x: 500,
      y: 300,
    });

    expect(boss.isBoss).toBe(true);
    expect(boss.bossName).toBe("GOLIATH-01: AEGIS COLOSSUS");
    expect(boss.radius).toBe(24);
    expect(boss.speed).toBe(55);
    expect(boss.maxShields).toBe(4);
    expect(boss.shields).toBe(4);
    expect(boss.fireCadenceTicks).toBe(60);
    expect(boss.bulletSpeed).toBe(520);
    expect(boss.stutterTicks).toBe(10);
    expect(boss.spreadAngle).toBe(0.05);
    expect(boss.pellets).toBe(1);
    expect(boss.runAndGun).toBe(false);
    expect(boss.isEnraged).toBe(false);
    expect(boss.isAlive).toBe(true);
  });

  it("absorbs up to 4 hits with takeDamage(), remaining alive with shields decrementing", () => {
    const boss = new Enemy({
      id: "boss-durability",
      type: "boss",
      x: 500,
      y: 300,
    });

    // 4 successive hits are absorbed by the energy shield
    for (let hit = 1; hit <= 4; hit++) {
      const result = boss.takeDamage(1);
      expect(result.absorbed).toBe(true);
      expect(result.eliminated).toBe(false);
      expect(result.remainingShields).toBe(4 - hit);
      expect(boss.shields).toBe(4 - hit);
      expect(boss.isAlive).toBe(true);
    }
  });

  it("triggers isEnraged = true and increased speed when breaking the 4th shield", () => {
    const boss = new Enemy({
      id: "boss-enrage",
      type: "boss",
      x: 500,
      y: 300,
    });
    const player = new Player({ x: 100, y: 300 });

    // Initial calm state
    expect(boss.isEnraged).toBe(false);
    expect(boss.speed).toBe(55);

    // Take 3 hits: still calm
    for (let i = 0; i < 3; i++) {
      boss.takeDamage(1);
      expect(boss.isEnraged).toBe(false);
      expect(boss.speed).toBe(55);
    }
    expect(boss.shields).toBe(1);

    // 4th hit breaks final shield: triggers enrage phase
    const hit4 = boss.takeDamage(1);
    expect(hit4.absorbed).toBe(true);
    expect(hit4.eliminated).toBe(false);
    expect(hit4.remainingShields).toBe(0);
    expect(boss.shields).toBe(0);
    expect(boss.isAlive).toBe(true);
    expect(boss.isEnraged).toBe(true);
    expect(boss.speed).toBe(95);

    // Updates with increased movement velocity (95 px/s toward player)
    boss.update(player, [], 1);
    expect(Math.abs(boss.velocity.x)).toBeCloseTo(95);
  });

  it("eliminates the boss on the 5th hit (shields = 0 is lethal)", () => {
    const boss = new Enemy({
      id: "boss-elimination",
      type: "boss",
      x: 500,
      y: 300,
    });

    // Break all 4 shields
    for (let i = 0; i < 4; i++) {
      boss.takeDamage(1);
    }
    expect(boss.shields).toBe(0);
    expect(boss.isAlive).toBe(true);
    expect(boss.isEnraged).toBe(true);

    // 5th hit: shields are depleted, lethal elimination
    const lethalHit = boss.takeDamage(1);
    expect(lethalHit.absorbed).toBe(false);
    expect(lethalHit.eliminated).toBe(true);
    expect(lethalHit.remainingShields).toBe(0);
    expect(boss.isAlive).toBe(false);
  });

  it("discharges 3-way spread when enraged", () => {
    const boss = new Enemy({
      id: "boss-discharge",
      type: "boss",
      x: 500,
      y: 300,
    });

    // Before enraged: single pinpoint projectile
    const calmProjectiles = boss.discharge();
    expect(calmProjectiles).toHaveLength(1);

    // Break all 4 shields to trigger enrage phase
    for (let i = 0; i < 4; i++) {
      boss.takeDamage(1);
    }
    expect(boss.isEnraged).toBe(true);

    // When enraged: 3-way spread
    const enragedProjectiles = boss.discharge();
    expect(enragedProjectiles).toHaveLength(3);
    for (const p of enragedProjectiles) {
      expect(p.owner).toBe("enemy");
      const speed = Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2);
      expect(speed).toBeCloseTo(520);
    }

    // Direct isEnraged setting also triggers 3-way spread
    const directBoss = new Enemy({
      id: "boss-direct-enrage",
      type: "boss",
      x: 500,
      y: 300,
    });
    directBoss.isEnraged = true;
    expect(directBoss.discharge()).toHaveLength(3);
  });

  it("restores boss to 4 shields and non-enraged state on reset()", () => {
    const boss = new Enemy({
      id: "boss-reset",
      type: "boss",
      x: 500,
      y: 300,
    });

    // Enrage boss
    for (let i = 0; i < 4; i++) {
      boss.takeDamage(1);
    }
    expect(boss.shields).toBe(0);
    expect(boss.isEnraged).toBe(true);
    expect(boss.speed).toBe(95);

    // Reset restores to pristine spawn state
    boss.reset();
    expect(boss.shields).toBe(4);
    expect(boss.maxShields).toBe(4);
    expect(boss.isEnraged).toBe(false);
    expect(boss.speed).toBe(55);
    expect(boss.isAlive).toBe(true);

    // Calm discharge after reset
    expect(boss.discharge()).toHaveLength(1);
  });

  describe("BossPhaseController Integration", () => {
    it("instantiates BossPhaseController by default for type === 'boss'", () => {
      const boss = new Enemy({
        id: "boss-phase-check",
        type: "boss",
        x: 500,
        y: 300,
      });

      expect(boss.phaseController).toBeDefined();
      expect(boss.phaseController?.currentPhaseIndex).toBe(0);
      expect(boss.phaseController?.totalPhases).toBe(2);
      expect(boss.phaseController?.currentPhase.phaseTitle).toBe("AEGIS FORTRESS");
      expect(boss.movement).toBe(boss.phaseController?.movement);
      expect(boss.attack).toBe(boss.phaseController?.attack);
    });

    it("swaps active movement and attack instances upon phase transition", () => {
      const boss = new Enemy({
        id: "boss-phase-swap",
        type: "boss",
        x: 500,
        y: 300,
      });

      const initialAttack = boss.attack;

      // Deplete all 4 shields to trigger transition
      for (let i = 0; i < 4; i++) {
        boss.takeDamage(1);
      }

      expect(boss.phaseController?.currentPhaseIndex).toBe(1);
      expect(boss.phaseController?.currentPhase.phaseTitle).toBe("OVERDRIVE RAM");
      expect(boss.attack).not.toBe(initialAttack);
      expect(boss.speed).toBe(95);
      expect(boss.isEnraged).toBe(true);
    });

    it("supports custom BossPhaseController initialization (Chrono-Weaver)", () => {
      const chronoController = createBossPhaseController(CHRONO_WEAVER_BLUEPRINT, { x: 500, y: 300 });
      const boss = new Enemy({
        id: "boss-chrono",
        type: "boss",
        x: 500,
        y: 300,
        chassis: CHRONO_WEAVER_BLUEPRINT.chassis,
        bossName: CHRONO_WEAVER_BLUEPRINT.name,
        phaseController: chronoController,
      });

      expect(boss.bossName).toBe("CHRONO-WEAVER: TEMPORAL ANCHOR");
      expect(boss.shields).toBe(3);
      expect(boss.speed).toBe(70);
      expect(boss.phaseController?.currentPhase.phaseTitle).toBe("STASIS ORBIT");

      // Deplete 3 shields
      for (let i = 0; i < 3; i++) {
        boss.takeDamage(1);
      }

      expect(boss.phaseController?.currentPhaseIndex).toBe(1);
      expect(boss.phaseController?.currentPhase.phaseTitle).toBe("TEMPORAL NOVA");
      expect(boss.speed).toBe(100);

      // Phase 2 discharges 12-pellet radial nova
      const novaProjectiles = boss.discharge();
      expect(novaProjectiles).toHaveLength(12);
    });

    it("reset() resets BossPhaseController to phase 0 with pristine shields", () => {
      const boss = new Enemy({
        id: "boss-controller-reset",
        type: "boss",
        x: 500,
        y: 300,
      });

      for (let i = 0; i < 4; i++) {
        boss.takeDamage(1);
      }
      expect(boss.phaseController?.currentPhaseIndex).toBe(1);

      boss.reset();
      expect(boss.phaseController?.currentPhaseIndex).toBe(0);
      expect(boss.phaseController?.shields).toBe(4);
      expect(boss.shields).toBe(4);
      expect(boss.isEnraged).toBe(false);
      expect(boss.speed).toBe(55);
    });

    it("deflects projectiles during overload channel and accepts damage once channel expires (pre-fire timing)", () => {
      const p0 = {
        phaseIndex: 0,
        phaseTitle: "PHASE 1",
        maxShields: 1,
        speed: 50,
        movement: () => ({ update: () => vec2(0, 0), reset: () => {} }),
        attack: () => ({ fireCadenceTicks: 50, fireCooldownTicks: 50, isChargingLaser: false, stutterTimerTicks: 0, update: () => [], discharge: () => [], reset: () => {} }),
        transitionTrigger: (c: any) => c.shields <= 0,
      };
      const p1 = {
        phaseIndex: 1,
        phaseTitle: "PHASE 2 // OVERLOAD",
        maxShields: 3,
        speed: 100,
        movement: () => ({ update: () => vec2(0, 0), reset: () => {} }),
        attack: () => ({ fireCadenceTicks: 50, fireCooldownTicks: 50, isChargingLaser: false, stutterTimerTicks: 0, update: () => [], discharge: () => [], reset: () => {} }),
        transitionTrigger: () => false,
        overloadChannelTicks: 30,
      };

      const controller = new BossPhaseController([p0, p1]);
      const boss = new Enemy({
        id: "boss-overload-test",
        type: "boss",
        x: 600,
        y: 320,
        phaseController: controller,
      });
      const player = new Player({ x: 200, y: 320 });

      // Break p0 shield -> transitions to p1 with 30 ticks overload channel
      boss.takeDamage(1);
      expect(boss.phaseController?.currentPhaseIndex).toBe(1);
      expect(boss.isOverloading).toBe(true);
      expect(boss.isInvulnerable).toBe(true);
      expect(boss.speed).toBe(0);

      // Mid-channel shot at tick 15: deflected!
      const midChannelHit = boss.takeDamage(1);
      expect(midChannelHit.deflected).toBe(true);
      expect(boss.shields).toBe(3);

      // Boss updates 30 ticks -> channel finishes
      boss.update(player, [], 30);
      expect(boss.isOverloading).toBe(false);
      expect(boss.isInvulnerable).toBe(false);
      expect(boss.speed).toBe(100);

      // Pre-fired bullet arrives post-channel -> successfully damages boss
      const postChannelHit = boss.takeDamage(1);
      expect(postChannelHit.deflected).toBeUndefined();
      expect(postChannelHit.remainingShields).toBe(2);
      expect(boss.shields).toBe(2);
    });
  });
});
