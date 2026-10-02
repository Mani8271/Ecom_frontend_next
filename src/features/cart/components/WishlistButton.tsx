"use client";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useWishlistIds, useWishlistToggle } from "../wishlist-hooks";

interface WishlistButtonProps {
  productId: number;
  variantId?: number | null;
  /** "icon" for cards, "button" for the product page. */
  variant?: "icon" | "button";
}

export function WishlistButton({ productId, variantId, variant = "icon" }: WishlistButtonProps) {
  const { data: ids = [] } = useWishlistIds();
  const toggle = useWishlistToggle();
  const saved = ids.includes(productId);
  const onClick = (event: React.MouseEvent) => {
    event.preventDefault(); // cards are links
    event.stopPropagation();
    toggle.mutate({ productId, variantId, saved });
  };
  const icon = saved ? <FavoriteIcon sx={{ color: "error.main" }} /> : <FavoriteBorderIcon />;
  const label = saved ? "Remove from wishlist" : "Save to wishlist";

  if (variant === "button") {
    return (
      <Button variant="outlined" color="inherit" size="large" startIcon={icon} onClick={onClick} aria-pressed={saved} sx={{ borderColor: "divider" }}>
        {saved ? "Wishlisted" : "Wishlist"}
      </Button>
    );
  }

  return (
    <IconButton onClick={onClick} aria-label={label} aria-pressed={saved} size="small" sx={{ bgcolor: "background.paper", boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }}>
      {icon}
    </IconButton>
  );
}
