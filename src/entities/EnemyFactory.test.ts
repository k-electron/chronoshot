import { describe, expect, it } from "vitest";
import { BLUEPRINTS, BossAttackBehavior, EnemyFactory } from "./EnemyFactory";
import { EnemyType } from "./Enemy";
import { DirectAdvanceBehavior } from "./behaviors/movement/DirectAdvanceBehavior";
import { KiterBehavior } from "./behaviors/movement/KiterBehavior";
import { SingleSlugBehavior } from "./behaviors/attack/SingleSlugBehavior";
import { FanSpreadBehavior } from "./behaviors/attack/FanSpreadBehavior";
import { TelegraphedBeamBehavior } from "./behaviors/attack/TelegraphedBeamBehavior";
import { vec2 } from "../math/vector";

describe("EnemyFactory & Blueprints", () => {
  it("registers valid blueprints for all 6 baseline archetypes", () => {
    const types: EnemyType[] = ["grunt", "shotgun", "stalker", "warden", "marksman", "boss"];
    for (const type of types) {
      const bp = EnemyFactory.getBlueprint(type);
      expect(bp).toBeDefined();
      expect(bp.type).toBe(type);
      expect(bp.radius).toBeGreaterThan(0);
      expect(bp.speed).toBeGreaterThan(0);
      expect(bp.fireCadenceTicks).toBeGreaterThan(0);
      expect(bp.bulletSpeed).toBeGreaterThan(0);
      expect(bp.chassis).toBeDefined();
      expect(bp.createMovement()).toBeDefined();
      expect(bp.createAttack()).toBeDefined();
    }
  });

  it("instantiates correct movement and attack behaviors per blueprint", () => {
    expect(BLUEPRINTS.grunt.createMovement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(BLUEPRINTS.grunt.createAttack()).toBeInstanceOf(SingleSlugBehavior);

    expect(BLUEPRINTS.shotgun.createMovement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(BLUEPRINTS.shotgun.createAttack()).toBeInstanceOf(FanSpreadBehavior);

    expect(BLUEPRINTS.stalker.createMovement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(BLUEPRINTS.stalker.createAttack()).toBeInstanceOf(SingleSlugBehavior);

    expect(BLUEPRINTS.warden.createMovement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(BLUEPRINTS.warden.createAttack()).toBeInstanceOf(SingleSlugBehavior);

    expect(BLUEPRINTS.marksman.createMovement()).toBeInstanceOf(KiterBehavior);
    expect(BLUEPRINTS.marksman.createAttack()).toBeInstanceOf(TelegraphedBeamBehavior);

    expect(BLUEPRINTS.boss.createMovement()).toBeInstanceOf(DirectAdvanceBehavior);
    expect(BLUEPRINTS.boss.createAttack()).toBeInstanceOf(BossAttackBehavior);
  });

  it("BossAttackBehavior switches from single slug to 3-pellet fan spread on enrage", () => {
    const bossAttack = new BossAttackBehavior({
      bulletSpeed: 520,
      spreadAngle: 0.05,
      pellets: 1,
    });

    const ctx = {
      id: "boss-1",
      position: vec2(100, 100),
      aimAngle: 0,
      radius: 24,
    };

    // Phase 1 (un-enraged)
    const normalShots = bossAttack.discharge(ctx);
    expect(normalShots).toHaveLength(1);
    expect(Math.round(Math.hypot(normalShots[0].velocity.x, normalShots[0].velocity.y))).toBe(520);

    // Phase 2 (enraged)
    bossAttack.isEnraged = true;
    const enragedShots = bossAttack.discharge(ctx);
    expect(enragedShots).toHaveLength(3);

    // Reset restores pristine state
    bossAttack.reset();
    expect(bossAttack.isEnraged).toBe(false);
  });
});
