"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/common/Logo";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { activeNavHref, adminNav } from "../nav";

const DRAWER_WIDTH = 248;


function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const active = activeNavHref(pathname, adminNav.flatMap((s) => s.items.filter((i) => hasPermission(i.permission)).map((i) => i.href)));

  return (
    <Box component="nav" aria-label="Admin" sx={{ py: 1, overflowY: "auto" }}>
      {adminNav.map((section, index) => {
        const items = section.items.filter((item) => hasPermission(item.permission));
        if (items.length === 0) return null;
        return (
          <List
            key={section.heading ?? index}
            dense
            subheader={section.heading ? <ListSubheader sx={{ bgcolor: "transparent", lineHeight: 2.5 }}>{section.heading}</ListSubheader> : undefined}
          >
            {items.map((item) => (
              <ListItemButton
                key={item.href}
                component={NextLink}
                href={item.href}
                selected={active === item.href}
                onClick={onNavigate}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  "&.Mui-selected": { bgcolor: "primary.light", color: "primary.dark", "& .MuiListItemIcon-root": { color: "primary.dark" } },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        );
      })}
    </Box>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push(routes.login(routes.admin.root));
  }

  const drawer = (
    <>
      <Toolbar sx={{ gap: 1 }}>
        <Logo size="sm" />
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 1 }}>
          ADMIN
        </Typography>
      </Toolbar>
      <NavList onNavigate={() => setMobileOpen(false)} />
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ displayPrint: "none", width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" }, mr: 1 }}>
              {user?.name}
            </Typography>
            <Tooltip title="View store">
              <IconButton component={NextLink} href={routes.home} target="_blank" aria-label="View store">
                <StorefrontOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} aria-label="Logout">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ displayPrint: "none", width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Toolbar sx={{ displayPrint: "none" }} />
        {children}
      </Box>
    </Box>
  );
}
