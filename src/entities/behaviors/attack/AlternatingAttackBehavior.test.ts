import { describe, expect, it } from "vitest";
import { vec2 } from "../../../math/vector";
import { AttackContext } from "./AttackBehavior";
import { AlternatingAttackBehavior } from "./AlternatingAttackBehavior";
import { FanSpreadBehavior } from "./FanSpreadBehavior";
import { TelegraphedBeamBehavior } from "./TelegraphedBeamBehavior";

describe("AlternatingAttackBehavior", () => {
  const dummyContext: AttackContext = {
    id: "boss-unit",
    position: vec2(200, 200),
    aimAngle: 0,
    radius: 20,
  };

  it("alternates between beam and fan spread on successive discharges", () => {
    const beam = new TelegraphedBeamBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 0,
    });
    const fan = new FanSpreadBehavior({
      fireCadenceTicks: 50,
      initialDelayTicks: 0,
      pellets: 3,
    });

    const alternating = new AlternatingAttackBehavior({
      behaviors: [beam, fan],
    });

    expect(alternating.currentIndex).toBe(0);

    // 1st discharge -> beam (1 projectile)
    const shots1 = alternating.discharge(dummyContext);
    expect(shots1.length).toBe(1);
    expect(alternating.currentIndex).toBe(1);

    // 2nd discharge -> fan (3 projectiles)
    const shots2 = alternating.discharge(dummyContext);
    expect(shots2.length).toBe(3);
    expect(alternating.currentIndex).toBe(0);
  });

  it("updates and cycles correctly in game loop", () => {
    const beam = new TelegraphedBeamBehavior({
      fireCadenceTicks: 20,
      initialDelayTicks: 1,
      laserChargeTicks: 5,
    });
    const fan = new FanSpreadBehavior({
      fireCadenceTicks: 20,
      initialDelayTicks: 1,
      pellets: 4,
    });

    const alternating = new AlternatingAttackBehavior({
      behaviors: [beam, fan],
    });

    // 1 tick brings beam to fire
    const shots1 = alternating.update(dummyContext, true, 1);
    expect(shots1.length).toBe(1);
    expect(alternating.currentIndex).toBe(1);

    // reset fan cooldown and update
    fan.fireCooldownTicks = 1;
    const shots2 = alternating.update(dummyContext, true, 1);
    expect(shots2.length).toBe(4);
    expect(alternating.currentIndex).toBe(0);
  });

  it("resets all child behaviors and index to 0", () => {
    const beam = new TelegraphedBeamBehavior({ fireCadenceTicks: 40 });
    const fan = new FanSpreadBehavior({ fireCadenceTicks: 40 });
    const alternating = new AlternatingAttackBehavior({
      behaviors: [beam, fan],
      startIndex: 1,
    });

    expect(alternating.currentIndex).toBe(1);
    alternating.reset();
    expect(alternating.currentIndex).toBe(0);
  });
});
