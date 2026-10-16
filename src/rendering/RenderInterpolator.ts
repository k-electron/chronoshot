/**
 * ChronoShot - RenderInterpolator
 *
 * Decouples visual frame presentation from the 60 Hz fixed-step physics quanta
 * by interpolating 2D positions based on TimeGovernor's sub-tick accumulator:
 *   p_render = p_prev * (1 - alpha) + p_curr * alpha
 */

export interface Vector2Like {
  x: number;
  y: number;
}

export function interpolatePosition(
  prev: Vector2Like,
  curr: Vector2Like,
  alpha: number
): Vector2Like {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return {
    x: prev.x + (curr.x - prev.x) * clampedAlpha,
    y: prev.y + (curr.y - prev.y) * clampedAlpha,
  };
}

export function interpolateAngle(
  prevAngle: number,
  currAngle: number,
  alpha: number
): number {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  let diff = (currAngle - prevAngle) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return prevAngle + diff * clampedAlpha;
}
