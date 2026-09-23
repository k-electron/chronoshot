import { beforeEach, describe, expect, it, vi } from "vitest";
import { Enemy } from "../entities/Enemy";
import { vec2, Vector2D } from "../math/vector";
import {
  EnemyRenderer,
  RenderableEnemy,
  renderChassis,
  renderDottedSightline,
  renderEnemy,
  renderLaserTelegraph,
  renderMuzzle,
  renderShieldAura,
  renderShieldPips,
  renderShieldRings,
  renderSightline,
  resolveEnemyChassis,
} from "./EnemyRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe("EnemyRenderer", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  describe("resolveEnemyChassis", () => {
    it("respects explicit chassis property when provided", () => {
      expect(
        resolveEnemyChassis({
          isAlive: true,
          position: vec2(0, 0),
          aimAngle: 0,
          radius: 16,
          shields: 0,
          type: "grunt",
          chassis: "hexagon",
        })
      ).toBe("hexagon");
    });

    it("maps standard enemy archetype types to corresponding chassis shapes", () => {
      const base = {
        isAlive: true,
        position: vec2(0, 0),
        aimAngle: 0,
        radius: 16,
        shields: 0,
      };

      expect(resolveEnemyChassis({ ...base, type: "grunt" })).toBe("diamond");
      expect(resolveEnemyChassis({ ...base, type: "shotgun" })).toBe("rounded");
      expect(resolveEnemyChassis({ ...base, type: "stalker" })).toBe("chevron");
      expect(resolveEnemyChassis({ ...base, type: "warden" })).toBe("hexagon");
      expect(resolveEnemyChassis({ ...base, type: "marksman" })).toBe("star");
      expect(resolveEnemyChassis({ ...base, type: "boss" })).toBe("octagon");
    });

    it("falls back to diamond when type is unknown or missing", () => {
      const base = {
        isAlive: true,
        position: vec2(0, 0),
        aimAngle: 0,
        radius: 16,
        shields: 0,
      };

      expect(resolveEnemyChassis({ ...base, type: "unknown" as any })).toBe("diamond");
      expect(resolveEnemyChassis(base)).toBe("diamond");
    });
  });

  describe("renderChassis", () => {
    it("renders diamond chassis (Pistol Grunt) with sharp directional diamond path", () => {
      renderChassis(ctx, "diamond", 16);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(16 * 1.3, 0);
      expect(ctx.lineTo).toHaveBeenCalledWith(-16 * 0.8, -16);
      expect(ctx.lineTo).toHaveBeenCalledWith(-16 * 0.4, 0);
      expect(ctx.lineTo).toHaveBeenCalledWith(-16 * 0.8, 16);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#e53935");
      expect(ctx.strokeStyle).toBe("#ff7961");
    });

    it("renders rounded chassis (Shotgun Guard) with circular hull", () => {
      renderChassis(ctx, "rounded", 18);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalledWith(0, 0, 18, 0, Math.PI * 2);
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#d32f2f");
      expect(ctx.strokeStyle).toBe("#ff6659");
    });

    it("renders chevron chassis (Stalker) with 3-pointed forward dart", () => {
      renderChassis(ctx, "chevron", 14);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(14 * 1.4, 0);
      expect(ctx.lineTo).toHaveBeenCalledWith(-14 * 0.9, -14 * 0.9);
      expect(ctx.lineTo).toHaveBeenCalledWith(-14 * 0.3, 0);
      expect(ctx.lineTo).toHaveBeenCalledWith(-14 * 0.9, 14 * 0.9);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#ff1744");
      expect(ctx.strokeStyle).toBe("#ff5252");
    });

    it("renders hexagon chassis (Aegis Warden) with 6-sided polygon", () => {
      renderChassis(ctx, "hexagon", 20);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalledTimes(5);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#b71c1c");
      expect(ctx.strokeStyle).toBe("#ff8a80");
    });

    it("renders star chassis (Marksman) with 4-pointed crosshair star", () => {
      renderChassis(ctx, "star", 15);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      // 4 points * 2 = 8 vertices (1 moveTo + 7 lineTo)
      expect(ctx.lineTo).toHaveBeenCalledTimes(7);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#880e4f");
      expect(ctx.strokeStyle).toBe("#f06292");
    });

    it("renders octagon chassis (Boss Goliath-01) in standard state", () => {
      renderChassis(ctx, "octagon", 24, false);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalledTimes(7); // 8-sided polygon
      expect(ctx.closePath).toHaveBeenCalled();
      // Octagon hull + inner core
      expect(ctx.arc).toHaveBeenCalledWith(0, 0, 24 * 0.45, 0, Math.PI * 2);
      expect(ctx.fillStyle).toBe("#b71c1c");
      expect(ctx.strokeStyle).toBe("#ffffff");
    });

    it("renders octagon chassis (Boss Goliath-01) in enraged state with enrage glow", () => {
      renderChassis(ctx, "octagon", 24, true);

      // Enraged color scheme and glow ring
      expect(ctx.arc).toHaveBeenCalledWith(0, 0, 24 * 1.25, 0, Math.PI * 2);
      expect(ctx.arc).toHaveBeenCalledWith(0, 0, 24 * 0.45, 0, Math.PI * 2);
      expect(ctx.fillStyle).toBe("#ff1744");
      expect(ctx.strokeStyle).toBe("#ff80ab");
    });

    it("renders pentagon chassis fallback", () => {
      renderChassis(ctx, "pentagon", 16);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalledTimes(4);
      expect(ctx.closePath).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe("#d32f2f");
    });
  });

  describe("renderMuzzle", () => {
    it("renders pistol pointer for diamond chassis", () => {
      renderMuzzle(ctx, "diamond", 16);
      expect(ctx.fillRect).toHaveBeenCalledWith(16 * 1.1, -2, 6, 4);
    });

    it("renders dual forward-flaring muzzle prongs for rounded chassis", () => {
      renderMuzzle(ctx, "rounded", 18);
      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.moveTo).toHaveBeenCalledWith(18 - 2, -1.5);
      expect(ctx.moveTo).toHaveBeenCalledWith(18 - 2, 1.5);
      expect(ctx.fill).toHaveBeenCalledTimes(2);
    });

    it("renders needle barrel for chevron chassis", () => {
      renderMuzzle(ctx, "chevron", 14);
      expect(ctx.fillRect).toHaveBeenCalledWith(14 * 1.1, -1.5, 7, 3);
    });

    it("renders heavy slug muzzle for hexagon chassis", () => {
      renderMuzzle(ctx, "hexagon", 20);
      expect(ctx.fillRect).toHaveBeenCalledWith(20 - 2, -3, 9, 6);
    });

    it("renders precision sniper barrel for star chassis", () => {
      renderMuzzle(ctx, "star", 15);
      expect(ctx.fillRect).toHaveBeenCalledWith(15 * 0.6, -1.5, 14, 3);
    });

    it("renders dual cannon barrels for octagon chassis", () => {
      renderMuzzle(ctx, "octagon", 24);
      expect(ctx.fillRect).toHaveBeenCalledWith(24 - 2, -6, 12, 4);
      expect(ctx.fillRect).toHaveBeenCalledWith(24 - 2, 2, 12, 4);
    });

    it("renders dual barrel fallback for pentagon chassis", () => {
      renderMuzzle(ctx, "pentagon", 16);
      expect(ctx.fillRect).toHaveBeenCalledWith(16 - 2, -4, 8, 3);
      expect(ctx.fillRect).toHaveBeenCalledWith(16 - 2, 1, 8, 3);
    });
  });

  describe("Shield Rendering", () => {
    it("renders concentric shield rings for active shields", () => {
      renderShieldRings(ctx, vec2(100, 200), 16, 3);

      expect(ctx.arc).toHaveBeenCalledTimes(3);
      expect(ctx.arc).toHaveBeenNthCalledWith(1, 100, 200, 16 + 5 + 0 * 4, 0, Math.PI * 2);
      expect(ctx.arc).toHaveBeenNthCalledWith(2, 100, 200, 16 + 5 + 1 * 4, 0, Math.PI * 2);
      expect(ctx.arc).toHaveBeenNthCalledWith(3, 100, 200, 16 + 5 + 2 * 4, 0, Math.PI * 2);
      expect(ctx.stroke).toHaveBeenCalledTimes(3);
    });

    it("does not render shield rings when shields are 0", () => {
      renderShieldRings(ctx, vec2(100, 200), 16, 0);
      expect(ctx.arc).not.toHaveBeenCalled();
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("renders shield pips above the unit with active and depleted indicators", () => {
      renderShieldPips(ctx, vec2(100, 200), 16, 1, 3);

      // 3 pips total: 1 active, 2 depleted
      expect(ctx.fillRect).toHaveBeenCalledTimes(3);
      expect(ctx.strokeRect).toHaveBeenCalledTimes(3);
    });

    it("renders unified shield aura with both rings and pips", () => {
      renderShieldAura(ctx, vec2(100, 200), 16, 2, 2);

      // 2 rings + 2 pips
      expect(ctx.arc).toHaveBeenCalledTimes(2);
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
      expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
    });
  });

  describe("Sightline & Laser Telegraph", () => {
    it("renders vivid crimson laser telegraph with target tracking dot", () => {
      renderLaserTelegraph(ctx, vec2(100, 100), vec2(300, 100), true);

      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(ctx.lineTo).toHaveBeenCalledWith(300, 100);
      expect(ctx.stroke).toHaveBeenCalled();

      // Destination aim dot
      expect(ctx.arc).toHaveBeenCalledWith(300, 100, 4, 0, Math.PI * 2);
      expect(ctx.fill).toHaveBeenCalled();
    });

    it("skips laser telegraph when isCharging is false", () => {
      renderLaserTelegraph(ctx, vec2(100, 100), vec2(300, 100), false);
      expect(ctx.stroke).not.toHaveBeenCalled();
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("renders tactical dotted sightline during line-of-sight tracking", () => {
      renderDottedSightline(ctx, vec2(100, 100), vec2(300, 100));

      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 6]);
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(ctx.lineTo).toHaveBeenCalledWith(300, 100);
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it("coordinates renderSightline based on charging laser state and LoS", () => {
      // Case 1: Charging laser takes priority
      renderSightline(ctx, vec2(50, 50), vec2(200, 50), true, true);
      expect(ctx.arc).toHaveBeenCalledWith(200, 50, 4, 0, Math.PI * 2); // Laser dot

      // Case 2: Only line of sight
      ctx = createMockContext();
      renderSightline(ctx, vec2(50, 50), vec2(200, 50), false, true);
      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 6]);

      // Case 3: Neither
      ctx = createMockContext();
      renderSightline(ctx, vec2(50, 50), vec2(200, 50), false, false);
      expect(ctx.stroke).not.toHaveBeenCalled();
    });
  });

  describe("renderEnemy & EnemyRenderer facade", () => {
    it("skips rendering when enemy is dead", () => {
      const deadEnemy: RenderableEnemy = {
        isAlive: false,
        position: vec2(100, 100),
        aimAngle: 0,
        radius: 16,
        shields: 0,
        type: "grunt",
      };

      EnemyRenderer.render(ctx, deadEnemy);
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.translate).not.toHaveBeenCalled();
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("renders living enemy with transform matrix, chassis, and muzzle", () => {
      const enemy: RenderableEnemy = {
        isAlive: true,
        position: vec2(250, 180),
        aimAngle: 1.57,
        radius: 16,
        shields: 0,
        chassis: "diamond",
      };

      renderEnemy(ctx, enemy);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.translate).toHaveBeenCalledWith(250, 180);
      expect(ctx.rotate).toHaveBeenCalledWith(1.57);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it("renders active shields and charging laser when targetPosition is provided", () => {
      const enemy: RenderableEnemy = {
        isAlive: true,
        position: vec2(150, 200),
        aimAngle: 0,
        radius: 20,
        shields: 2,
        maxShields: 2,
        chassis: "hexagon",
        isChargingLaser: true,
      };

      const target: Vector2D = vec2(400, 200);
      EnemyRenderer.render(ctx, enemy, target);

      // Shield rings and pips
      expect(ctx.arc).toHaveBeenCalledWith(150, 200, 25, 0, Math.PI * 2);
      // Laser telegraph and target dot
      expect(ctx.lineTo).toHaveBeenCalledWith(400, 200);
      expect(ctx.arc).toHaveBeenCalledWith(400, 200, 4, 0, Math.PI * 2);
    });

    it("projects sightline forward when targetPosition is omitted", () => {
      const enemy: RenderableEnemy = {
        isAlive: true,
        position: vec2(100, 100),
        aimAngle: 0,
        radius: 15,
        shields: 0,
        chassis: "star",
        hasLineOfSight: true,
      };

      EnemyRenderer.render(ctx, enemy);

      // Projected 400px forward: x = 100 + 400 = 500, y = 100
      expect(ctx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(ctx.lineTo).toHaveBeenCalledWith(500, 100);
      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 6]);
    });

    it("renders actual Enemy instance without throwing or requiring type casts", () => {
      const enemy = new Enemy({
        id: "grunt-01",
        type: "grunt",
        x: 300,
        y: 200,
      });

      expect(() => {
        EnemyRenderer.render(ctx, enemy, vec2(100, 100));
      }).not.toThrow();

      expect(ctx.translate).toHaveBeenCalledWith(300, 200);
    });

    it("renders boss Enemy instance with enrage glow", () => {
      const boss = new Enemy({
        id: "boss-01",
        type: "boss",
        x: 400,
        y: 300,
      });
      boss.isEnraged = true;

      expect(() => {
        EnemyRenderer.render(ctx, boss);
      }).not.toThrow();

      // Octagon + inner core + enrage ring
      expect(ctx.translate).toHaveBeenCalledWith(400, 300);
    });
  });
});
