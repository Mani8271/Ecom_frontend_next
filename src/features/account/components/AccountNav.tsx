"use client";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

const items = [
  { href: routes.account.root, label: "Overview", icon: <DashboardOutlinedIcon /> },
  { href: routes.account.orders, label: "Orders", icon: <ReceiptLongOutlinedIcon /> },
  { href: routes.account.wishlist, label: "Wishlist", icon: <FavoriteBorderIcon /> },
  { href: routes.account.addresses, label: "Addresses", icon: <LocationOnOutlinedIcon /> },
  { href: routes.account.reviews, label: "Reviews", icon: <RateReviewOutlinedIcon /> },
  { href: routes.account.profile, label: "Profile", icon: <PersonOutlineIcon /> },
  { href: routes.account.settings, label: "Settings", icon: <LockOutlinedIcon /> },
];

function activeHref(pathname: string): string | false {
  if (pathname === routes.account.security) return routes.account.settings;
  const match = items.filter((item) => item.href !== routes.account.root && pathname.startsWith(item.href))[0];
  return match?.href ?? (pathname === routes.account.root ? routes.account.root : false);
}

/** Vertical list on desktop, scrollable tabs on mobile. */
export function AccountNav() {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <>
      <List component="nav" aria-label="Account" sx={{ display: { xs: "none", md: "block" }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, p: 1 }}>
        {items.map((item) => (
          <ListItemButton key={item.href} component={NextLink} href={item.href} selected={active === item.href} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Tabs value={active} variant="scrollable" allowScrollButtonsMobile aria-label="Account" sx={{ display: { xs: "flex", md: "none" }, borderBottom: 1, borderColor: "divider" }}>
        {items.map((item) => (
          <Tab key={item.href} value={item.href} label={item.label} component={NextLink} href={item.href} />
        ))}
      </Tabs>
    </>
  );
}
