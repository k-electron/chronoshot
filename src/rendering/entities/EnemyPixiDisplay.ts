/**
 * ChronoShot - EnemyPixiDisplay
 *
 * Manages persistent Pixi v8 display objects for enemy combat units:
 * - Procedural hull chassis (diamond, rounded, chevron, hexagon, star, octagon)
 * - Muzzle barrel hardpoints and active hit-count shield aura rings
 * - Passive dotted sightlines (via drawDashedLine) and solid Marksman charge lasers
 */

import { Container, Graphics } from "pixi.js";
import { Enemy } from "../../entities/Enemy";
import { resolveEnemyChassis } from "../../ui/EnemyRenderer";
import { interpolatePosition, Vector2Like } from "../RenderInterpolator";
import { drawDashedLine } from "../vectorGeometry";

export class EnemyPixiDisplay {
  public readonly container: Container;
  public readonly telegraphGraphics: Graphics;
  public readonly hullGraphics: Graphics;
  public readonly shieldGraphics: Graphics;

  constructor() {
    this.container = new Container();
    this.telegraphGraphics = new Graphics();
    this.shieldGraphics = new Graphics();
    this.hullGraphics = new Graphics();

    // Order: telegraph lines beneath shield & chassis
    this.container.addChild(this.telegraphGraphics);
    this.container.addChild(this.shieldGraphics);
    this.container.addChild(this.hullGraphics);
  }

  /**
   * Updates enemy visual display with sub-tick interpolation and procedural vectors.
   */
  public update(enemy: Enemy, playerPos: Vector2Like | null, alpha: number): void {
    if (!enemy.isAlive) {
      this.container.visible = false;
      return;
    }
    this.container.visible = true;

    // 1. Interpolated unit coordinates
    const renderPos = interpolatePosition(enemy.previousPosition, enemy.position, alpha);
    this.container.x = renderPos.x;
    this.container.y = renderPos.y;

    // 2. Telegraph lines (passive dashed sightline or solid charging laser)
    this.telegraphGraphics.clear();
    const isCharging = enemy.isChargingLaser;
    const hasLOS = enemy.hasLineOfSight;

    if (playerPos && (isCharging || hasLOS)) {
      // Convert player pos to local container coordinates
      const targetLocalX = playerPos.x - renderPos.x;
      const targetLocalY = playerPos.y - renderPos.y;

      if (isCharging) {
        // Solid crimson charging laser beam
        this.telegraphGraphics
          .moveTo(0, 0)
          .lineTo(targetLocalX, targetLocalY)
          .stroke({ width: 2, color: 0xff1744, alpha: 0.9 });

        this.telegraphGraphics
          .circle(targetLocalX, targetLocalY, 4)
          .fill({ color: 0xff1744 });
      } else if (hasLOS) {
        // Passive dashed sightline using drawDashedLine
        drawDashedLine(this.telegraphGraphics, 0, 0, targetLocalX, targetLocalY, 4, 6);
        this.telegraphGraphics.stroke({ width: 1, color: 0xff3232, alpha: 0.25 });
      }
    }

    // 3. Shield aura ring
    this.shieldGraphics.clear();
    if (enemy.shields > 0) {
      const shieldRadius = enemy.radius + 5;
      this.shieldGraphics
        .circle(0, 0, shieldRadius)
        .stroke({ width: 2, color: 0x00f0ff, alpha: 0.8 });
    }

    // 4. Procedural Hull Geometry & Hardpoint
    this.hullGraphics.clear();
    this.hullGraphics.rotation = enemy.aimAngle;
    const chassis = resolveEnemyChassis(enemy);
    const r = enemy.radius;
    const isEnraged = enemy.isEnraged || enemy.isOverloading || false;

    this.renderChassisGeometry(chassis, r, isEnraged);
    this.renderMuzzleHardpoint(chassis, r);
  }

  private renderChassisGeometry(chassis: string, r: number, isEnraged: boolean): void {
    const g = this.hullGraphics;

    switch (chassis) {
      case "diamond": {
        // Pistol Grunt: sharp directional diamond
        g.poly([
          r * 1.3, 0,
          -r * 0.8, -r,
          -r * 0.4, 0,
          -r * 0.8, r,
        ])
          .fill({ color: 0xe53935 })
          .stroke({ width: 2, color: 0xff7961 });
        break;
      }

      case "rounded": {
        // Shotgun Guard: heavy rounded hull
        g.circle(0, 0, r)
          .fill({ color: 0xd32f2f })
          .stroke({ width: 2, color: 0xff6659 });
        break;
      }

      case "chevron": {
        // Stalker: swept-back chevron
        g.poly([
          r * 1.4, 0,
          -r * 0.9, -r * 0.9,
          -r * 0.3, 0,
          -r * 0.9, r * 0.9,
        ])
          .fill({ color: 0xc62828 })
          .stroke({ width: 2, color: 0xff5252 });
        break;
      }

      case "hexagon": {
        // Aegis Warden: reinforced hexagon
        const hexPoints: number[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          hexPoints.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        g.poly(hexPoints)
          .fill({ color: 0xb71c1c })
          .stroke({ width: 2, color: 0xff8a80 });
        break;
      }

      case "star": {
        // Marksman Sniper: four-pointed cross-star
        const starPoints: number[] = [];
        const outer = r * 1.2;
        const inner = r * 0.45;
        for (let i = 0; i < 8; i++) {
          const dist = i % 2 === 0 ? outer : inner;
          const angle = (i * Math.PI) / 4;
          starPoints.push(Math.cos(angle) * dist, Math.sin(angle) * dist);
        }
        g.poly(starPoints)
          .fill({ color: 0xd50000 })
          .stroke({ width: 2, color: 0xff1744 });
        break;
      }

      case "octagon":
      default: {
        // Boss hull: wide octagon
        const octPoints: number[] = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          octPoints.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        const fillColor = isEnraged ? 0xd50000 : 0x880e4f;
        const strokeColor = isEnraged ? 0xff1744 : 0xff4081;
        g.poly(octPoints)
          .fill({ color: fillColor })
          .stroke({ width: 3, color: strokeColor });
        break;
      }
    }
  }

  private renderMuzzleHardpoint(chassis: string, r: number): void {
    const g = this.hullGraphics;

    switch (chassis) {
      case "diamond":
        g.rect(r * 1.1, -1.5, 6, 3).fill({ color: 0xff8a80 });
        break;
      case "rounded":
        g.rect(r - 2, -4, 8, 8).fill({ color: 0xff8a80 });
        break;
      case "chevron":
        g.rect(r * 1.2, -1, 5, 2).fill({ color: 0xff8a80 });
        break;
      case "hexagon":
        g.rect(r - 2, -3, 8, 6).fill({ color: 0xff8a80 });
        break;
      case "star":
        g.rect(r * 1.1, -1, 10, 2).fill({ color: 0xff1744 });
        break;
      case "octagon":
        g.rect(r - 4, -4, 12, 8).fill({ color: 0xff80ab });
        break;
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
