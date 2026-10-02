import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import { Logo } from "@/components/common/Logo";
import { layout } from "@/theme/tokens";
import { CategoryNav } from "./CategoryNav";
import { HeaderActions } from "./HeaderActions";
import { HeaderSearch } from "./HeaderSearch";

/** Server-rendered shell; only search and account actions are client islands. */
export function SiteHeader() {
  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: layout.headerHeight, gap: { xs: 1, md: 3 } }}>
          <Logo />
          <Box sx={{ flex: 1, maxWidth: 560, mx: "auto", display: { xs: "none", md: "block" } }}>
            <HeaderSearch />
          </Box>
          <Box sx={{ ml: "auto" }}>
            <HeaderActions />
          </Box>
        </Toolbar>
        <Box sx={{ display: { xs: "block", md: "none" }, pb: 1.5 }}>
          <HeaderSearch />
        </Box>
        <CategoryNav />
      </Container>
    </AppBar>
  );
}
