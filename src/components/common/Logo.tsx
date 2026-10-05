import Box from "@mui/material/Box";
import NextLink from "next/link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { fontFamilies } from "@/theme/typography";

/** Text wordmark (swap for an SVG logo later without touching callers). */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <NextLink href={routes.home} aria-label={`${siteConfig.name} home`} style={{ textDecoration: "none", display: "inline-flex" }}>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.5, lineHeight: 1 }}>
        <Box component="span" sx={{ fontFamily: fontFamilies.display, fontWeight: 600, fontSize: size === "sm" ? 20 : { xs: 22, md: 26 }, color: "text.primary" }}>
          Loomi
        </Box>
        <Box component="span" sx={{ fontWeight: 700, fontSize: size === "sm" ? 13 : { xs: 14, md: 16 }, color: "primary.dark", letterSpacing: 2, textTransform: "uppercase" }}>
          Trends
        </Box>
      </Box>
    </NextLink>
  );
}
