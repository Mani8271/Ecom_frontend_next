import { shadowRgb } from "./colors";

/** Border radius scale (px). theme.shape.borderRadius = radius.md. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Base spacing unit (px): theme.spacing(1) = 8px. */
export const SPACING_UNIT = 8;

/** Layout widths. */
export const layout = {
  containerMaxWidth: "xl",
  headerHeight: { xs: 60, md: 72 },
  authCardMaxWidth: 440,
} as const;

/** Breakpoints (min-width, px), mobile-first. */
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

const shadow = (y: number, blur: number, alpha: number) => `0 ${y}px ${blur}px rgb(${shadowRgb} / ${alpha})`;

/** Soft elevation scale; MUI needs 25 entries. */
export const elevation = {
  none: "none",
  xs: shadow(1, 2, 0.06),
  sm: `${shadow(1, 3, 0.08)}, ${shadow(1, 2, 0.04)}`,
  md: `${shadow(4, 12, 0.08)}, ${shadow(2, 4, 0.04)}`,
  lg: `${shadow(12, 32, 0.12)}, ${shadow(4, 8, 0.05)}`,
} as const;

export const motion = {
  fast: 150,
  standard: 220,
} as const;
