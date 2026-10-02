import type { Components, Theme } from "@mui/material/styles";
import { elevation, motion, radius } from "./tokens";

/**
 * Global component overrides. Only reference theme values here
 * (palette, shape, spacing); never literal colors.
 */
export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      html: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
      body: { backgroundColor: theme.palette.background.default },
      "::selection": { backgroundColor: theme.palette.primary.light, color: theme.palette.primary.contrastText },
      "@media (prefers-reduced-motion: reduce)": {
        "*, *::before, *::after": { transitionDuration: "0.01ms !important", animationDuration: "0.01ms !important" },
      },
    }),
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.md,
        paddingInline: theme.spacing(2.5),
        minHeight: 44, // comfortable touch target
        transition: `background-color ${motion.fast}ms, box-shadow ${motion.fast}ms`,
      }),
      sizeSmall: { minHeight: 34 },
      sizeLarge: { minHeight: 52, fontSize: "1rem" },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      }),
    },
  },
  MuiLink: {
    defaultProps: { underline: "hover" },
    styleOverrides: {
      root: ({ theme }) => ({ color: theme.palette.primary.dark, fontWeight: 500 }),
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.lg,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: radius.lg },
    },
  },
  MuiTextField: {
    defaultProps: { fullWidth: true },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.md,
        backgroundColor: theme.palette.background.paper,
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 2 },
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: radius.pill, fontWeight: 500 },
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: "inherit" },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: radius.md, boxShadow: elevation.lg },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: radius.lg },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: radius.md },
    },
  },
  MuiSkeleton: {
    defaultProps: { animation: "wave" },
  },
  MuiTooltip: {
    defaultProps: { arrow: true },
  },
};
