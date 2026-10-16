/**
 * ChronoShot - Vector Geometry Utilities for Pixi.js v8.
 *
 * Provides procedural dashed line/circle tessellation and octagonal aperture
 * hole cutting to match Canvas 2D setLineDash and evenodd fill semantics.
 */

export interface PathBuilder {
  moveTo(x: number, y: number): this | void;
  lineTo(x: number, y: number): this | void;
}

export interface CuttableGraphics extends PathBuilder {
  rect?(x: number, y: number, w: number, h: number): this | void;
  fill?(style?: unknown): this | void;
  poly?(points: number[] | Array<{ x: number; y: number }>): this | void;
  cut?(): this | void;
}

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Renders a segmented dashed line between two points.
 * Emits alternating sub-paths using moveTo and lineTo.
 */
export function drawDashedLine(
  g: PathBuilder,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dashLen = 4,
  gapLen = 4
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const totalLength = Math.hypot(dx, dy);

  if (totalLength <= 0.0001 || dashLen <= 0) {
    return;
  }

  const ux = dx / totalLength;
  const uy = dy / totalLength;

  let currentDist = 0;
  while (currentDist < totalLength) {
    const startX = x0 + ux * currentDist;
    const startY = y0 + uy * currentDist;
    const endDist = Math.min(currentDist + dashLen, totalLength);
    const endX = x0 + ux * endDist;
    const endY = y0 + uy * endDist;

    g.moveTo(startX, startY);
    g.lineTo(endX, endY);

    currentDist += dashLen + gapLen;
  }
}

/**
 * Renders a segmented dashed circular stroke.
 * Emits arc segments using moveTo and lineTo steps around the circumference.
 */
export function drawDashedCircle(
  g: PathBuilder,
  cx: number,
  cy: number,
  radius: number,
  dashLen = 6,
  gapLen = 4,
  subStepsPerDash = 4
): void {
  if (radius <= 0.0001 || dashLen <= 0) {
    return;
  }

  const circumference = 2 * Math.PI * radius;
  const patternLen = dashLen + gapLen;
  const numPatterns = Math.max(1, Math.round(circumference / patternLen));
  const anglePerPattern = (2 * Math.PI) / numPatterns;
  const dashRatio = dashLen / patternLen;
  const dashAngle = anglePerPattern * dashRatio;

  const steps = Math.max(1, subStepsPerDash);

  for (let i = 0; i < numPatterns; i++) {
    const patternStartAngle = i * anglePerPattern;

    for (let s = 0; s < steps; s++) {
      const a0 = patternStartAngle + (dashAngle * s) / steps;
      const a1 = patternStartAngle + (dashAngle * (s + 1)) / steps;

      const x0 = cx + radius * Math.cos(a0);
      const y0 = cy + radius * Math.sin(a0);
      const x1 = cx + radius * Math.cos(a1);
      const y1 = cy + radius * Math.sin(a1);

      if (s === 0) {
        g.moveTo(x0, y0);
      }
      g.lineTo(x1, y1);
    }
  }
}

/**
 * Computes the 8 vertices of an octagon inscribed within the given radius.
 */
export function computeOctagonVertices(
  cx: number,
  cy: number,
  radius: number
): Point2D[] {
  const vertices: Point2D[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    vertices.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return vertices;
}

/**
 * Cuts an octagonal aperture hole out of a bounding rectangle using Pixi v8 cut() semantics.
 */
export function cutOctagonalAperture(
  g: CuttableGraphics,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number
): void {
  if (typeof g.rect === "function") {
    g.rect(0, 0, width, height);
  }
  if (typeof g.fill === "function") {
    g.fill();
  }

  if (radius > 0.5 && typeof g.poly === "function" && typeof g.cut === "function") {
    const vertices = computeOctagonVertices(cx, cy, radius);
    const flatPoints: number[] = [];
    for (const v of vertices) {
      flatPoints.push(v.x, v.y);
    }
    g.poly(flatPoints);
    g.cut();
  }
}
