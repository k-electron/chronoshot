/**
 * Zero-dependency typography & text measurement utilities for HTML5 Canvas 2D.
 *
 * Provides safe text truncation, word-wrapping with line budgets, and robust
 * text measurement with fallback support for unmocked/headless canvas environments.
 */

/**
 * Measures the pixel width of a string on the given Canvas 2D context.
 * Gracefully falls back to standard monospace aspect ratio estimation (7px per character)
 * if measureText is not implemented or returns invalid metrics in test environments.
 */
export function measureTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string
): number {
  if (!text) {
    return 0;
  }
  if (typeof ctx.measureText === "function") {
    const metrics = ctx.measureText(text);
    if (metrics && typeof metrics.width === "number") {
      return metrics.width;
    }
  }
  return text.length * 7;
}

/**
 * Truncates text with an ellipsis ('…') so that its rendered width does not exceed maxWidth.
 * If the string already fits, it is returned unchanged.
 */
export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  ellipsis: string = "…"
): string {
  if (!text || maxWidth <= 0) {
    return "";
  }

  if (measureTextWidth(ctx, text) <= maxWidth) {
    return text;
  }

  const ellipsisWidth = measureTextWidth(ctx, ellipsis);
  if (ellipsisWidth > maxWidth) {
    return "";
  }

  // Binary search for maximal substring that fits with ellipsis
  let low = 1;
  let high = text.length - 1;
  let best = "";

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid) + ellipsis;
    if (measureTextWidth(ctx, candidate) <= maxWidth) {
      best = candidate;
      low = mid + 1; // Try longer
    } else {
      high = mid - 1; // Try shorter
    }
  }

  return best.length > 0 ? best : ellipsis;
}

/**
 * Word-wraps text into an array of lines fitting within maxWidth.
 * Enforces an optional maxLines budget; if text exceeds maxLines, the final line
 * is cleanly truncated with an ellipsis.
 */
export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = Infinity
): string[] {
  if (!text || maxWidth <= 0 || maxLines <= 0) {
    return [];
  }

  const words = text.trim().split(/\s+/);
  if (words.length === 0 || (words.length === 1 && words[0] === "")) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (measureTextWidth(ctx, testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      // Check if advancing to a new line would exceed maxLines
      if (lines.length + 1 >= maxLines) {
        // We are on the final permitted line; truncate the remainder
        const remaining = currentLine ? `${currentLine} ${words.slice(i).join(" ")}` : words.slice(i).join(" ");
        lines.push(truncateText(ctx, remaining, maxWidth));
        currentLine = "";
        break;
      }

      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}
