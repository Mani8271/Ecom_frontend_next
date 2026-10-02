import type { TypographyVariantsOptions } from "@mui/material/styles";

/** Font CSS variables are provided by next/font in app/layout.tsx. */
export const fontFamilies = {
  sans: "var(--font-sans), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "var(--font-display), Georgia, 'Times New Roman', serif",
} as const;

export const typography: TypographyVariantsOptions = {
  fontFamily: fontFamilies.sans,
  htmlFontSize: 16,
  fontSize: 14,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: { fontFamily: fontFamilies.display, fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15 },
  h2: { fontFamily: fontFamilies.display, fontWeight: 600, fontSize: "clamp(1.625rem, 3vw, 2.25rem)", lineHeight: 1.2 },
  h3: { fontFamily: fontFamilies.display, fontWeight: 600, fontSize: "clamp(1.375rem, 2.4vw, 1.75rem)", lineHeight: 1.25 },
  h4: { fontWeight: 600, fontSize: "1.375rem", lineHeight: 1.3 },
  h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.35 },
  h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
  subtitle1: { fontWeight: 500, fontSize: "1rem" },
  subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
  body1: { fontSize: "1rem", lineHeight: 1.6 },
  body2: { fontSize: "0.875rem", lineHeight: 1.55 },
  button: { fontWeight: 600, textTransform: "none", letterSpacing: 0.2 },
  caption: { fontSize: "0.75rem" },
  overline: { fontWeight: 600, letterSpacing: 1.2 },
};
