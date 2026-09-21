/**
 * 2D Vector mathematics module for ChronoShot.
 *
 * Provides pure, zero-allocation-friendly 2D vector interfaces and functions
 * for physics, continuous collision detection, line-of-sight raycasting,
 * and directional aiming.
 */

export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Creates a new 2D vector.
 */
export function vec2(x: number, y: number): Vector2D {
  return { x, y };
}

/**
 * Vector addition: returns a + b.
 */
export function vecAdd(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Vector subtraction: returns a - b.
 */
export function vecSub(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scalar multiplication: returns v * scalar.
 */
export function vecScale(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Computes squared length of vector (|v|^2).
 * Preferred for distance comparisons to avoid expensive square root.
 */
export function vecLengthSq(v: Vector2D): number {
  return v.x * v.x + v.y * v.y;
}

/**
 * Computes Euclidean length (magnitude) of vector.
 */
export function vecLength(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Computes squared Euclidean distance between two points.
 */
export function vecDistanceSq(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * Computes Euclidean distance between two points.
 */
export function vecDistance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt(vecDistanceSq(a, b));
}

/**
 * Normalizes vector to unit length.
 * If vector magnitude is zero (or effectively zero), returns (0, 0).
 */
export function vecNormalize(v: Vector2D): Vector2D {
  const lenSq = vecLengthSq(v);
  if (lenSq < 1e-12) {
    return { x: 0, y: 0 };
  }
  const invLen = 1 / Math.sqrt(lenSq);
  return { x: v.x * invLen, y: v.y * invLen };
}

/**
 * Vector dot product (a . b = a.x * b.x + a.y * b.y).
 */
export function vecDot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * 2D perp-dot / cross product (a.x * b.y - a.y * b.x).
 * Represents the signed area of the parallelogram formed by the vectors.
 */
export function vecCross(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Linear interpolation between two vectors.
 */
export function vecLerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Computes the angle in radians of the vector (from -PI to PI).
 */
export function vecAngle(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Constructs a vector from an angle in radians and magnitude.
 */
export function vecFromAngle(angleRadians: number, length = 1): Vector2D {
  return {
    x: Math.cos(angleRadians) * length,
    y: Math.sin(angleRadians) * length,
  };
}

/**
 * Rotates a 2D vector by angle in radians around the origin.
 */
export function vecRotate(v: Vector2D, angleRadians: number): Vector2D {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}
