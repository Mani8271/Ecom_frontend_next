import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";
import { Logo } from "@/components/common/Logo";
import { layout } from "@/theme/tokens";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Box component="main" sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 6 }}>
      <Stack spacing={4} sx={{ width: "100%", maxWidth: layout.authCardMaxWidth, alignItems: "center" }}>
        <Logo />
        {children}
      </Stack>
    </Box>
  );
}
