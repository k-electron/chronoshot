/**
 * Enemy Procedural Hull & Sightline Renderer for ChronoShot.
 *
 * Decoupled Canvas 2D rendering module for all hostile combat units:
 * - Geometric chassis shapes (diamond, rounded, chevron, hexagon, star, octagon)
 * - Directional barrel & muzzle hardpoints
 * - Radiant hit-count shield rings and tactile shield pips
 * - Aimed charging laser sightline telegraphs with target tracking dots
 * - Faint dotted tactical sightlines during active line-of-sight tracking
 *
 * Adheres to zero-allocation hot-loop performance standards.
 */

import { EnemyType } from "../entities/Enemy";
import { Vector2D } from "../math/vector";
import { UITheme } from "./theme";

export type EnemyChassisType =
  | "diamond"
  | "rounded"
  | "chevron"
  | "hexagon"
  | "star"
  | "octagon"
  | "pentagon";

export interface RenderableEnemy {
  readonly isAlive: boolean;
  readonly position: Vector2D;
  readonly aimAngle: number;
  readonly radius: number;
  readonly shields: number;
  readonly maxShields?: number;
  readonly type?: EnemyType | string;
  readonly chassis?: EnemyChassisType;
  readonly isChargingLaser?: boolean;
  readonly hasLineOfSight?: boolean;
  readonly isBoss?: boolean;
  readonly isEnraged?: boolean;
}

// Pre-allocated scratch vector to eliminate GC churn during hot simulation rendering
const scratchTargetVec: Vector2D = { x: 0, y: 0 };

/**
 * Resolves the visual chassis geometry for an enemy based on explicit chassis or archetype type.
 */
export function resolveEnemyChassis(enemy: RenderableEnemy): EnemyChassisType {
  if (enemy.chassis) {
    return enemy.chassis;
  }

  switch (enemy.type) {
    case "grunt":
      return "diamond";
    case "shotgun":
      return "rounded";
    case "stalker":
      return "chevron";
    case "warden":
      return "hexagon";
    case "marksman":
    case "sniper":
      return "star";
    case "boss":
      return "octagon";
    default:
      return "diamond";
  }
}

/**
 * Procedurally draws the unit chassis geometry, fill, and high-contrast perimeter strokes
 * in local entity coordinates (assumes translation and rotation are already applied to ctx).
 */
export function renderChassis(
  ctx: CanvasRenderingContext2D,
  chassis: EnemyChassisType | string,
  radius: number,
  isEnraged: boolean = false
): void {
  switch (chassis) {
    case "diamond": {
      // Pistol Grunt: sharp directional diamond
      ctx.beginPath();
      ctx.moveTo(radius * 1.3, 0);
      ctx.lineTo(-radius * 0.8, -radius);
      ctx.lineTo(-radius * 0.4, 0);
      ctx.lineTo(-radius * 0.8, radius);
      ctx.closePath();

      ctx.fillStyle = "#e53935";
      ctx.fill();
      ctx.strokeStyle = "#ff7961";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case "rounded": {
      // Shotgun Guard: heavy rounded circle hull
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);

      ctx.fillStyle = "#d32f2f";
      ctx.fill();
      ctx.strokeStyle = "#ff6659";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case "chevron": {
      // Stalker: sleek swept-back chevron/arrowhead dart
      ctx.beginPath();
      ctx.moveTo(radius * 1.4, 0);
      ctx.lineTo(-radius * 0.9, -radius * 0.9);
      ctx.lineTo(-radius * 0.3, 0);
      ctx.lineTo(-radius * 0.9, radius * 0.9);
      ctx.closePath();

      ctx.fillStyle = "#ff1744";
      ctx.fill();
      ctx.strokeStyle = "#ff5252";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case "hexagon": {
      // Aegis Warden: reinforced heavy hexagon
      ctx.beginPath();
      const sides = 6;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = "#b71c1c";
      ctx.fill();
      ctx.strokeStyle = "#ff8a80";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      break;
    }

    case "star": {
      // Marksman: 4-pointed precision crosshair star
      ctx.beginPath();
      const points = 4;
      for (let p = 0; p < points * 2; p++) {
        const a = (p / (points * 2)) * Math.PI * 2;
        const r = p % 2 === 0 ? radius * 1.3 : radius * 0.55;
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
      break;
    }

    case "octagon": {
      // Goliath-01 Aegis Colossus: 8-sided heavy titan chassis
      ctx.beginPath();
      const sides = 8;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = isEnraged ? "#4a000a" : "#2d0a10";
      ctx.fill();
      ctx.strokeStyle = isEnraged ? "#ff1744" : "#ff4d6d";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Enrage aura glow ring
      if (isEnraged) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
        ctx.strokeStyle = UITheme.colors.crimsonGlow;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Pulsing glowing reactor core
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = isEnraged ? "#ff1744" : "#b71c1c";
      ctx.fill();
      ctx.strokeStyle = isEnraged ? "#ff80ab" : "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case "pentagon":
    default: {
      // Faceted heavy pentagon fallback
      ctx.beginPath();
      const sides = 5;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = "#d32f2f";
      ctx.fill();
      ctx.strokeStyle = "#ff6659";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
  }
}

/**
 * Procedurally draws the weapon muzzle/barrel hardpoints in local entity coordinates.
 */
export function renderMuzzle(
  ctx: CanvasRenderingContext2D,
  chassis: EnemyChassisType | string,
  radius: number
): void {
  ctx.fillStyle = UITheme.colors.white;

  switch (chassis) {
    case "diamond": {
      // Grunt: Single forward firing pointer
      ctx.fillRect(radius * 1.1, -2, 6, 4);
      break;
    }

    case "rounded": {
      // Shotgun Guard: Dual forward-flaring muzzle prongs
      // Upper prong flaring outwards
      ctx.beginPath();
      ctx.moveTo(radius - 2, -1.5);
      ctx.lineTo(radius + 7, -2.5);
      ctx.lineTo(radius + 7, -6);
      ctx.lineTo(radius - 2, -4.5);
      ctx.closePath();
      ctx.fill();

      // Lower prong flaring outwards
      ctx.beginPath();
      ctx.moveTo(radius - 2, 1.5);
      ctx.lineTo(radius + 7, 2.5);
      ctx.lineTo(radius + 7, 6);
      ctx.lineTo(radius - 2, 4.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "chevron": {
      // Stalker: High-velocity needle barrel
      ctx.fillRect(radius * 1.1, -1.5, 7, 3);
      break;
    }

    case "hexagon": {
      // Aegis Warden: Heavy reinforced slug muzzle
      ctx.fillRect(radius - 2, -3, 9, 6);
      break;
    }

    case "star": {
      // Marksman: Long precision sniper barrel
      ctx.fillRect(radius * 0.6, -1.5, 14, 3);
      break;
    }

    case "octagon": {
      // Boss Goliath-01: Heavy twin-slug cannon barrels
      ctx.fillRect(radius - 2, -6, 12, 4);
      ctx.fillRect(radius - 2, 2, 12, 4);
      break;
    }

    case "pentagon":
    default: {
      // Dual barrel rectangular pointers
      ctx.fillRect(radius - 2, -4, 8, 3);
      ctx.fillRect(radius - 2, 1, 8, 3);
      break;
    }
  }
}

/**
 * Renders concentric radiant shield rings around a shielded unit in world coordinates.
 */
export function renderShieldRings(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  radius: number,
  shields: number
): void {
  if (shields <= 0) return;

  ctx.save();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
  ctx.lineWidth = 1.5;

  for (let s = 0; s < shields; s++) {
    const ringRadius = radius + 5 + s * 4;
    ctx.beginPath();
    ctx.arc(position.x, position.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders discrete tactical shield pips horizontally above the unit in world coordinates.
 */
export function renderShieldPips(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  radius: number,
  shields: number,
  maxShields?: number
): void {
  const totalPips = Math.max(shields, maxShields ?? shields);
  if (totalPips <= 0) return;

  const pipWidth = 6;
  const pipHeight = 3;
  const spacing = 3;
  const totalWidth = totalPips * pipWidth + (totalPips - 1) * spacing;
  const startX = position.x - totalWidth / 2;
  const y = position.y - radius - 10;

  ctx.save();
  for (let i = 0; i < totalPips; i++) {
    const px = startX + i * (pipWidth + spacing);
    ctx.fillStyle = i < shields ? "rgba(0, 240, 255, 0.9)" : "rgba(0, 240, 255, 0.2)";
    ctx.fillRect(px, y, pipWidth, pipHeight);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
    ctx.lineWidth = 0.75;
    ctx.strokeRect(px, y, pipWidth, pipHeight);
  }
  ctx.restore();
}

/**
 * Renders both concentric radiant shield rings and tactile shield pips.
 */
export function renderShieldAura(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  radius: number,
  shields: number,
  maxShields?: number
): void {
  if (shields > 0 || (maxShields !== undefined && maxShields > 0)) {
    renderShieldRings(ctx, position, radius, shields);
    renderShieldPips(ctx, position, radius, shields, maxShields);
  }
}

/**
 * Renders an intense crimson charging laser telegraph beam and an aim target dot at the destination.
 */
export function renderLaserTelegraph(
  ctx: CanvasRenderingContext2D,
  from: Vector2D,
  to: Vector2D,
  isCharging: boolean = true
): void {
  if (!isCharging) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 23, 68, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Crimson aim target dot at destination
  ctx.fillStyle = "#ff1744";
  ctx.beginPath();
  ctx.arc(to.x, to.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Renders a subtle tactical dotted sightline indicating active line-of-sight acquisition.
 */
export function renderDottedSightline(
  ctx: CanvasRenderingContext2D,
  from: Vector2D,
  to: Vector2D
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 50, 50, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Coordinates sightline telegraphs based on charging state and line of sight.
 */
export function renderSightline(
  ctx: CanvasRenderingContext2D,
  from: Vector2D,
  to: Vector2D,
  isCharging: boolean = false,
  hasLineOfSight: boolean = false
): void {
  if (isCharging) {
    renderLaserTelegraph(ctx, from, to, true);
  } else if (hasLineOfSight) {
    renderDottedSightline(ctx, from, to);
  }
}

/**
 * Main procedural drawing function for an enemy unit.
 *
 * Coordinates sightline telegraphs, shield rings/pips, and rotated geometric chassis
 * with zero heap allocations in the 60 Hz rendering loop.
 */
export function renderEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: RenderableEnemy,
  targetPosition?: Vector2D
): void {
  if (!enemy.isAlive) {
    return;
  }

  // 1. Sightline / Charging Laser beam in world coordinates
  if (enemy.isChargingLaser || enemy.hasLineOfSight) {
    let target = targetPosition;
    if (!target) {
      scratchTargetVec.x = enemy.position.x + Math.cos(enemy.aimAngle) * 400;
      scratchTargetVec.y = enemy.position.y + Math.sin(enemy.aimAngle) * 400;
      target = scratchTargetVec;
    }
    renderSightline(
      ctx,
      enemy.position,
      target,
      enemy.isChargingLaser ?? false,
      enemy.hasLineOfSight ?? false
    );
  }

  // 2. Radiant concentric shield rings and shield pips in world coordinates
  if (enemy.shields > 0) {
    renderShieldAura(ctx, enemy.position, enemy.radius, enemy.shields, enemy.maxShields);
  }

  // 3. Chassis body & weapon muzzles in local rotated coordinates
  const chassis = resolveEnemyChassis(enemy);
  const isEnraged = enemy.isEnraged ?? false;

  ctx.save();
  ctx.translate(enemy.position.x, enemy.position.y);
  ctx.rotate(enemy.aimAngle);

  renderChassis(ctx, chassis, enemy.radius, isEnraged);
  renderMuzzle(ctx, chassis, enemy.radius);

  ctx.restore();
}

/**
 * Decoupled procedural enemy renderer namespace and static facade.
 */
export class EnemyRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    enemy: RenderableEnemy,
    targetPosition?: Vector2D
  ): void {
    renderEnemy(ctx, enemy, targetPosition);
  }

  public static renderChassis = renderChassis;
  public static renderMuzzle = renderMuzzle;
  public static renderShieldRings = renderShieldRings;
  public static renderShieldPips = renderShieldPips;
  public static renderShieldAura = renderShieldAura;
  public static renderLaserTelegraph = renderLaserTelegraph;
  public static renderDottedSightline = renderDottedSightline;
  public static renderSightline = renderSightline;
  public static resolveEnemyChassis = resolveEnemyChassis;
}

export default EnemyRenderer;
