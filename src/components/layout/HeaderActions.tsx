"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCartCount } from "@/features/cart/hooks";
import { useWishlistCount } from "@/features/cart/wishlist-hooks";

const accountLinks = [
  { href: routes.account.profile, label: "My profile", icon: <PersonOutlineIcon fontSize="small" /> },
  { href: routes.account.orders, label: "Orders", icon: <ReceiptLongOutlinedIcon fontSize="small" /> },
  { href: routes.account.addresses, label: "Addresses", icon: <LocationOnOutlinedIcon fontSize="small" /> },
  { href: routes.account.security, label: "Security", icon: <LockOutlinedIcon fontSize="small" /> },
];

export function HeaderActions() {
  const { status, user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  async function handleLogout() {
    setAnchor(null);
    await logout();
    router.push(routes.home);
  }

  return (
    <Stack direction="row" spacing={{ xs: 0, sm: 0.5 }} sx={{ alignItems: "center" }}>
      {status === "loading" && <Skeleton variant="circular" width={36} height={36} />}

      {status === "guest" && (
        <Button component={NextLink} href={routes.login(pathname === "/" ? undefined : pathname)} startIcon={<PersonOutlineIcon />} color="inherit">
          Login
        </Button>
      )}

      {status === "authenticated" && user && (
        <>
          <Tooltip title="Account">
            <IconButton onClick={(event) => setAnchor(event.currentTarget)} aria-label="Account menu" aria-haspopup="menu">
              <Avatar src={user.avatar?.thumb ?? undefined} alt={user.name} sx={{ width: 32, height: 32, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 14 }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <Stack sx={{ px: 2, py: 1, minWidth: 220 }}>
              <Typography variant="subtitle2" noWrap>
                Hello, {user.name.split(" ")[0]}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {user.email}
              </Typography>
            </Stack>
            <Divider />
            {accountLinks.map((link) => (
              <MenuItem key={link.href} component={NextLink} href={link.href} onClick={() => setAnchor(null)}>
                <ListItemIcon>{link.icon}</ListItemIcon>
                {link.label}
              </MenuItem>
            ))}
            {hasPermission("admin.access") && (
              <MenuItem component={NextLink} href={routes.admin.root} onClick={() => setAnchor(null)}>
                <ListItemIcon>
                  <AdminPanelSettingsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Admin panel
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </>
      )}

      <Tooltip title="Wishlist">
        <IconButton component={NextLink} href={routes.wishlist} aria-label={`Wishlist, ${wishlistCount} items`}>
          <Badge badgeContent={wishlistCount} color="primary" max={99}>
            <FavoriteBorderIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Bag">
        <IconButton component={NextLink} href={routes.cart} aria-label={`Shopping bag, ${cartCount} items`}>
          <Badge badgeContent={cartCount} color="primary" max={99}>
            <ShoppingBagOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
