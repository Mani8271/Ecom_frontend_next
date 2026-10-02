/**
 * THE single source of color for the whole app (storefront + admin).
 *
 * Change PRIMARY_COLOR and every button, link, header accent, chip, focus ring,
 * form control and admin highlight follows. Hover/active/text-safe shades are
 * derived in theme.ts; never hardcode colors in components (lint enforces it).
 */

export const PRIMARY_COLOR = "#5CBA5C";
export const SECONDARY_COLOR = "#1E2A3B";

export const brand = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
  /** Warm marigold accent: ratings, highlights, "new" badges. */
  accent: "#E0A82E",
} as const;

export const neutral = {
  background: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceMuted: "#F3F2EE",
  text: "#1A1D1F",
  textMuted: "#62676C",
  border: "#E6E4DE",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const status = {
  success: "#2E7D32",
  warning: "#B26A00",
  error: "#C62828",
  info: "#1565C0",
} as const;

/** RGB channels used for shadows and overlays (alpha applied where used). */
export const shadowRgb = "17 24 39";

export const colors = { brand, neutral, status, shadowRgb } as const;

/**
 * Data-visualisation palette (charts only), led by the brand green. Chosen to
 * stay distinguishable for common colour-vision deficiencies.
 */
export const chart = [PRIMARY_COLOR, "#2F6FB5", "#E0A82E", "#7B5EA7", "#D9534F", "#3AAFA9", "#8C6D46", "#9AA5B1"] as const;
