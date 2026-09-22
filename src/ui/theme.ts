/**
 * UI Theme & Typography Configuration for ChronoShot.
 *
 * Provides a unified design token system for minimalist HUD rendering,
 * reticle styling, and tactile telemetry.
 */

export const UITheme = {
  fontFamily: '"SF Mono", "Segoe UI Mono", "Roboto Mono", "Cascadia Code", monospace',

  colors: {
    // Primary backgrounds and glassmorphism
    bgDark: "#0b0d11",
    panelBg: "rgba(11, 15, 22, 0.75)",
    panelBgSolid: "#0f131a",
    panelBorder: "#1e293b",
    panelBorderLight: "#334155",
    hairline: "#222c3c",

    // Tactical time and player accents
    cyan: "#00f0ff",
    cyanMuted: "#00bcd4",
    cyanDim: "rgba(0, 240, 255, 0.25)",
    cyanGlow: "rgba(0, 240, 255, 0.12)",
    white: "#ffffff",

    // Danger and dry-fire indicators
    crimson: "#ff3344",
    crimsonDim: "rgba(255, 51, 68, 0.35)",
    crimsonGlow: "rgba(255, 51, 68, 0.15)",
    amber: "#ffb700",
    green: "#10b981",

    // Typography hierarchy
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textDim: "#3b4554",
  },
} as const;

/**
 * Helper to construct a canvas font string with uniform fallback hierarchy.
 */
export function getUIFont(sizePx: number, weight: "normal" | "bold" | "600" | "700" | "800" | "900" = "normal"): string {
  return `${weight} ${sizePx}px ${UITheme.fontFamily}`;
}
