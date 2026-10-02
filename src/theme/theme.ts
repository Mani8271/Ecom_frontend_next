"use client";

import { createTheme, darken, lighten, type Shadows } from "@mui/material/styles";
import { brand, neutral, status } from "./colors";
import { components } from "./components";
import { breakpoints, elevation, radius, SPACING_UNIT } from "./tokens";
import { typography } from "./typography";

/**
 * Text on light backgrounds needs ≥ 4.5:1 contrast. Bright brand colors often
 * don't reach that, so links/text use a derived darker shade of the brand
 * color. Buttons get an automatically computed contrast text color.
 */
const TEXT_SAFE_DARKEN = 0.35;

const shadows = [
  elevation.none,
  elevation.xs,
  elevation.sm,
  elevation.sm,
  elevation.md,
  ...Array(20).fill(elevation.lg),
] as Shadows;

export const theme = createTheme({
  cssVariables: true,
  breakpoints: { values: breakpoints },
  spacing: SPACING_UNIT,
  shape: { borderRadius: radius.md },
  shadows,
  typography,
  palette: {
    mode: "light",
    contrastThreshold: 4.5,
    primary: {
      main: brand.primary,
      light: lighten(brand.primary, 0.85),
      dark: darken(brand.primary, TEXT_SAFE_DARKEN),
    },
    secondary: { main: brand.secondary },
    warning: { main: status.warning },
    error: { main: status.error },
    success: { main: status.success },
    info: { main: status.info },
    background: { default: neutral.background, paper: neutral.surface },
    text: { primary: neutral.text, secondary: neutral.textMuted },
    divider: neutral.border,
    grey: { 100: neutral.surfaceMuted },
    accent: { main: brand.accent, contrastText: neutral.text },
  },
  components,
});

/** Denser variant for admin screens; same colors. */
export const adminTheme = createTheme(theme, {
  components: {
    MuiButton: { defaultProps: { size: "small" } },
    MuiTextField: { defaultProps: { size: "small" } },
  },
});
