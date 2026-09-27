/**
 * Cataclysm Flash Controller for ChronoShot.
 *
 * Implements real-time screen flash ramp-up, apex detonation luminance,
 * snappy ramp-down dissipation, and 2D visibility polygon shadow occlusion
 * during boss Cataclysm Overload channel sequences.
 */

import { rayIntersectsAABB } from "../../math/collision";
import { Vector2D } from "../../math/vector";
import { Obstacle } from "../Obstacle";

export type CataclysmFlashStatus = "idle" | "ramping_up" | "apex" | "ramping_down";

export const CATACLYSM_FLASH_COLORS = {
  CYAN: "#00f0ff",     // Phase 1 / Default
  PURPLE: "#a855f7",   // Phase 2 / Temporal Warp
  CRIMSON: "#ff1744",  // Phase 3 / Singularity Tempest / Cataclysm Pulse
  AMBER: "#ffab00",    // Phase 4 / Overdrive
} as const;

export interface CataclysmFlashConfig {
  rampUpDuration?: number;    // default: 0.25s (250ms)
  rampDownDuration?: number;  // default: 0.07s (70ms)
  peakAlpha?: number;         // default: 0.9
  useGradient?: boolean;      // default: true
}

interface Segment {
  a: Vector2D;
  b: Vector2D;
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Converts a hex or rgb color string to an rgba(r, g, b, alpha) string.
 */
export function hexToRgba(hexOrColor: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  if (hexOrColor.startsWith("rgb")) {
    const match = hexOrColor.match(/\d+(\.\d+)?/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${clampedAlpha.toFixed(3)})`;
    }
    return hexOrColor;
  }

  let hex = hexOrColor.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }

  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha.toFixed(3)})`;
  }

  return `rgba(0, 240, 255, ${clampedAlpha.toFixed(3)})`;
}

/**
 * Computes a 2D visibility polygon from an origin point within an arena bounded by [width, height],
 * casting radial rays to silhouette vertices and obstacles, clipping against solid obstacle geometry.
 */
export function computeVisibilityPolygon(
  origin: Vector2D,
  obstacles: readonly Obstacle[] = [],
  width: number = 960,
  height: number = 640
): Vector2D[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  // 1. Collect all boundary and obstacle segments
  const segments: Segment[] = [
    { a: { x: 0, y: 0 }, b: { x: width, y: 0 } },
    { a: { x: width, y: 0 }, b: { x: width, y: height } },
    { a: { x: width, y: height }, b: { x: 0, y: height } },
    { a: { x: 0, y: height }, b: { x: 0, y: 0 } },
  ];

  const corners: Vector2D[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  for (const obs of obstacles) {
    const minX = obs.bounds?.min?.x ?? obs.x;
    const minY = obs.bounds?.min?.y ?? obs.y;
    const maxX = obs.bounds?.max?.x ?? (obs.x + obs.width);
    const maxY = obs.bounds?.max?.y ?? (obs.y + obs.height);

    if (maxX <= minX || maxY <= minY) {
      continue;
    }

    const c0 = { x: minX, y: minY };
    const c1 = { x: maxX, y: minY };
    const c2 = { x: maxX, y: maxY };
    const c3 = { x: minX, y: maxY };

    segments.push({ a: c0, b: c1 });
    segments.push({ a: c1, b: c2 });
    segments.push({ a: c2, b: c3 });
    segments.push({ a: c3, b: c0 });

    corners.push(c0, c1, c2, c3);
  }

  // 2. Collect angles to all corners relative to origin
  const angles: number[] = [];
  for (const c of corners) {
    const dx = c.x - origin.x;
    const dy = c.y - origin.y;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
      continue;
    }
    angles.push(Math.atan2(dy, dx));
  }

  // Deduplicate angles
  angles.sort((a, b) => a - b);
  const uniqueAngles: number[] = [];
  for (let i = 0; i < angles.length; i++) {
    if (
      uniqueAngles.length === 0 ||
      Math.abs(angles[i] - uniqueAngles[uniqueAngles.length - 1]) > 1e-6
    ) {
      uniqueAngles.push(angles[i]);
    }
  }

  // 3. For each angle, cast rays at theta - 1e-4, theta, theta + 1e-4
  const rayAngles: number[] = [];
  for (const theta of uniqueAngles) {
    rayAngles.push(normalizeAngle(theta - 1e-4));
    rayAngles.push(normalizeAngle(theta));
    rayAngles.push(normalizeAngle(theta + 1e-4));
  }

  rayAngles.sort((a, b) => a - b);
  const uniqueRayAngles: number[] = [];
  for (const a of rayAngles) {
    if (
      uniqueRayAngles.length === 0 ||
      Math.abs(a - uniqueRayAngles[uniqueRayAngles.length - 1]) > 1e-7
    ) {
      uniqueRayAngles.push(a);
    }
  }

  // 4. Ray-segment intersection: find minimum distance t > 0
  const polygon: Vector2D[] = [];
  for (const phi of uniqueRayAngles) {
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);

    let minT = Infinity;
    for (const seg of segments) {
      const sx = seg.b.x - seg.a.x;
      const sy = seg.b.y - seg.a.y;
      const denom = dx * sy - dy * sx;
      if (Math.abs(denom) < 1e-9) {
        continue;
      }

      const vx = seg.a.x - origin.x;
      const vy = seg.a.y - origin.y;
      const t = (vx * sy - vy * sx) / denom;
      const u = (vx * dy - vy * dx) / denom;

      if (t > 1e-5 && u >= -1e-6 && u <= 1 + 1e-6) {
        if (t < minT) {
          minT = t;
        }
      }
    }

    if (minT < Infinity) {
      polygon.push({
        x: origin.x + minT * dx,
        y: origin.y + minT * dy,
      });
    }
  }

  // 5. Sort intersection points by angle [-PI, PI]
  polygon.sort(
    (a, b) =>
      Math.atan2(a.y - origin.y, a.x - origin.x) -
      Math.atan2(b.y - origin.y, b.x - origin.x)
  );

  return polygon;
}

/**
 * Checks whether a given point is illuminated by the flash origin
 * (i.e. line of sight between origin and point is unobstructed by any solid obstacle).
 */
export function isPointIlluminated(
  point: Vector2D,
  origin: Vector2D,
  obstacles: readonly Obstacle[] = []
): boolean {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1e-4) {
    return true;
  }

  const dir: Vector2D = { x: dx / dist, y: dy / dist };

  for (const obstacle of obstacles) {
    const minX = obstacle.bounds?.min?.x ?? obstacle.x;
    const minY = obstacle.bounds?.min?.y ?? obstacle.y;
    const maxX = obstacle.bounds?.max?.x ?? (obstacle.x + obstacle.width);
    const maxY = obstacle.bounds?.max?.y ?? (obstacle.y + obstacle.height);

    const hit = rayIntersectsAABB(
      origin,
      dir,
      { x: minX, y: minY },
      { x: maxX, y: maxY },
      dist
    );

    if (hit && hit.distance < dist - 1e-4) {
      return false;
    }
  }

  return true;
}

/**
 * Determines whether a 2D point lies inside a 2D polygon using ray-casting / winding algorithm.
 */
export function isPointInPolygon(
  point: Vector2D,
  polygon: readonly Vector2D[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

export class CataclysmFlashController {
  private _status: CataclysmFlashStatus = "idle";
  private origin: Vector2D = { x: 0, y: 0 };
  private color: string = CATACLYSM_FLASH_COLORS.CYAN;
  private timer: number = 0;
  private rampDownStartAlpha: number = 0.9;

  public rampUpDuration: number;
  public rampDownDuration: number;
  public peakAlpha: number;
  public useGradient: boolean;

  constructor(config: CataclysmFlashConfig = {}) {
    this.rampUpDuration = config.rampUpDuration ?? 0.25;
    this.rampDownDuration = config.rampDownDuration ?? 0.07;
    this.peakAlpha = config.peakAlpha ?? 0.9;
    this.useGradient = config.useGradient ?? true;
  }

  /**
   * Triggers the ramp-up phase towards the apex flash.
   */
  public triggerRampUp(
    origin: Vector2D,
    color: string = CATACLYSM_FLASH_COLORS.CYAN,
    duration?: number
  ): void {
    this._status = "ramping_up";
    this.origin = { x: origin.x, y: origin.y };
    this.color = color;
    if (duration !== undefined && duration > 0) {
      this.rampUpDuration = duration;
    }
    this.timer = 0;
    this.rampDownStartAlpha = this.peakAlpha;
  }

  /**
   * Alias for triggerRampUp.
   */
  public trigger(
    origin: Vector2D,
    color: string = CATACLYSM_FLASH_COLORS.CYAN,
    duration?: number
  ): void {
    this.triggerRampUp(origin, color, duration);
  }

  /**
   * Forces or transitions immediately to the apex flash state.
   */
  public triggerApex(): void {
    this._status = "apex";
    this.timer = 0;
    this.rampDownStartAlpha = this.peakAlpha;
  }

  /**
   * Transitions from apex (or current state) into the snappy ramp-down dissipation.
   */
  public triggerRampDown(duration?: number): void {
    this.rampDownStartAlpha = this.getAlpha();
    this._status = "ramping_down";
    if (duration !== undefined && duration > 0) {
      this.rampDownDuration = duration;
    }
    this.timer = 0;
  }

  /**
   * Updates flash timing in unscaled wall-clock time.
   */
  public update(wallDeltaTime: number): void {
    if (wallDeltaTime <= 0 || this._status === "idle") {
      return;
    }

    if (this._status === "ramping_up") {
      this.timer += wallDeltaTime;
      if (this.timer >= this.rampUpDuration - 1e-6) {
        this._status = "apex";
        this.timer = 0;
        this.rampDownStartAlpha = this.peakAlpha;
      }
    } else if (this._status === "ramping_down") {
      this.timer += wallDeltaTime;
      if (this.timer >= this.rampDownDuration - 1e-6) {
        this._status = "idle";
        this.timer = 0;
      }
    }
  }

  /**
   * Resets the flash controller to idle state.
   */
  public reset(): void {
    this._status = "idle";
    this.timer = 0;
    this.rampDownStartAlpha = 0;
  }

  /**
   * Returns whether the flash sequence is currently active.
   */
  public isActive(): boolean {
    return this._status !== "idle";
  }

  /**
   * Returns whether the flash is currently at maximum luminance Apex.
   */
  public isAtApex(): boolean {
    return this._status === "apex";
  }

  /**
   * Returns the current lifecycle status.
   */
  public getStatus(): CataclysmFlashStatus {
    return this._status;
  }

  /**
   * Public getter for the current lifecycle status.
   */
  public get status(): CataclysmFlashStatus {
    return this._status;
  }

  /**
   * Returns current flash opacity in [0, 1].
   */
  public getAlpha(): number {
    switch (this._status) {
      case "idle":
        return 0;
      case "ramping_up": {
        if (this.rampUpDuration <= 0) return this.peakAlpha;
        const progress = Math.min(1, Math.max(0, this.timer / this.rampUpDuration));
        return Math.min(this.peakAlpha, Math.pow(progress, 2) * this.peakAlpha);
      }
      case "apex":
        return this.peakAlpha;
      case "ramping_down": {
        if (this.rampDownDuration <= 0) return 0;
        const progress = Math.min(1, Math.max(0, this.timer / this.rampDownDuration));
        return Math.max(0, (1 - progress) * this.rampDownStartAlpha);
      }
    }
  }

  /**
   * Returns the active flash color.
   */
  public getColor(): string {
    return this.color;
  }

  /**
   * Returns the active flash origin.
   */
  public getOrigin(): Vector2D {
    return { x: this.origin.x, y: this.origin.y };
  }

  /**
   * Evaluates if a point is illuminated by this flash controller's current origin.
   */
  public isPointIlluminated(point: Vector2D, obstacles: readonly Obstacle[]): boolean {
    return isPointIlluminated(point, this.origin, obstacles);
  }

  /**
   * Computes the 2D visibility polygon from this flash controller's current origin.
   */
  public computeVisibilityPolygon(
    origin: Vector2D = this.origin,
    obstacles: readonly Obstacle[] = [],
    width: number = 960,
    height: number = 640
  ): Vector2D[] {
    return computeVisibilityPolygon(origin, obstacles, width, height);
  }

  /**
   * Renders the occluded screen flash to a 2D canvas context.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    obstacles: readonly Obstacle[],
    width: number = 960,
    height: number = 640
  ): void {
    if (!this.isActive()) {
      return;
    }

    const alpha = this.getAlpha();
    if (alpha <= 0.001) {
      return;
    }

    const polygon = computeVisibilityPolygon(this.origin, obstacles, width, height);
    if (polygon.length < 3) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();

    if (this.useGradient && typeof ctx.createRadialGradient === "function") {
      const maxRadius = Math.max(width, height);
      const grad = ctx.createRadialGradient(
        this.origin.x,
        this.origin.y,
        0,
        this.origin.x,
        this.origin.y,
        maxRadius
      );
      grad.addColorStop(0, hexToRgba(this.color, alpha));
      grad.addColorStop(0.5, hexToRgba(this.color, alpha * 0.85));
      grad.addColorStop(1, hexToRgba(this.color, alpha * 0.4));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = hexToRgba(this.color, alpha);
    }

    ctx.fill();
    ctx.restore();
  }
}
