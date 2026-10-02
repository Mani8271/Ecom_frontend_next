"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { LinkButton } from "@/components/common/LinkButton";
import { PageContainer } from "@/components/common/PageContainer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { CatalogImage } from "@/features/catalog/components/CatalogImage";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/services/cart/types";
import { useCart, useCartActions } from "../hooks";
import { CouponBox } from "./CouponBox";
import { OrderSummary } from "./OrderSummary";
import { QuantitySelector } from "./QuantitySelector";

function LineRow({ line }: { line: CartLine }) {
  const { status } = useAuth();
  const { update, remove, moveToWishlist } = useCartActions();
  const busy = update.isPending || remove.isPending || moveToWishlist.isPending;
  const blocking = line.issues.filter((i) => i.code !== "PRICE_CHANGED");
  const priceNote = line.issues.find((i) => i.code === "PRICE_CHANGED");
  const unavailable = line.issues.some((i) => i.code === "UNAVAILABLE" || i.code === "OUT_OF_STOCK");

  return (
    <Stack direction="row" spacing={2} sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: blocking.length ? "warning.main" : "divider", borderRadius: 4, opacity: busy ? 0.7 : 1 }}>
      <NextLink href={routes.product(line.product.slug)} style={{ flexShrink: 0, width: 96 }}>
        <CatalogImage image={line.image} alt={line.product.name} sizes="96px" sx={{ borderRadius: 2 }} />
      </NextLink>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {line.product.brand && (
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
            {line.product.brand}
          </Typography>
        )}
        <Typography component={NextLink} href={routes.product(line.product.slug)} variant="subtitle2" sx={{ display: "block", color: "text.primary", textDecoration: "none" }}>
          {line.product.name}
        </Typography>
        {line.options.length > 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {line.options.map((o) => `${o.name}: ${o.value}`).join(" · ")}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mt: 0.75, flexWrap: "wrap" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {formatPrice(line.line_subtotal)}
          </Typography>
          {line.compare_at_price && (
            <Typography variant="body2" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
              {formatPrice(Number(line.compare_at_price) * line.quantity)}
            </Typography>
          )}
          {line.discount_pct > 0 && (
            <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
              {line.discount_pct}% off
            </Typography>
          )}
          {line.quantity > 1 && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ({formatPrice(line.unit_price)} each)
            </Typography>
          )}
        </Stack>

        {blocking.map((issue) => (
          <Alert key={issue.code} severity="warning" sx={{ mt: 1, py: 0 }}>
            {issue.message}
          </Alert>
        ))}
        {priceNote && (
          <Alert severity="info" sx={{ mt: 1, py: 0 }}>
            {priceNote.message}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          {!unavailable && line.id !== null && (
            <QuantitySelector
              size="small"
              value={line.quantity}
              max={Math.max(line.quantity, line.max_quantity)}
              disabled={busy}
              onChange={(quantity) => line.id !== null && update.mutate({ itemId: line.id, quantity })}
              label={`Quantity of ${line.product.name}`}
            />
          )}
          {status === "authenticated" && line.id !== null && (
            <Button size="small" startIcon={<FavoriteBorderIcon />} onClick={() => line.id !== null && moveToWishlist.mutate(line.id)} disabled={busy}>
              Move to wishlist
            </Button>
          )}
          <Button size="small" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={() => line.id !== null && remove.mutate(line.id)} disabled={busy}>
            Remove
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

export function CartView() {
  const { data: cart, isLoading, error, refetch } = useCart();
  const { clear } = useCartActions();

  if (isLoading) {
    return (
      <PageContainer>
        <ListSkeleton rows={3} height={140} />
      </PageContainer>
    );
  }
  if (error) {
    return (
      <PageContainer>
        <ErrorState error={error} onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <EmptyState
          icon={<ShoppingBagOutlinedIcon />}
          title="Your bag is waiting for something special."
          description="Explore our collections and add your favourites to the bag."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "center" }}>
              <LinkButton href={routes.search()} variant="contained">
                Continue shopping
              </LinkButton>
              <LinkButton href={routes.wishlist} variant="outlined">
                View wishlist
              </LinkButton>
            </Stack>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Shopping bag{" "}
          <Typography component="span" variant="h6" sx={{ color: "text.secondary" }}>
            ({cart.item_count} item{cart.item_count === 1 ? "" : "s"})
          </Typography>
        </Typography>
        <Button color="inherit" size="small" onClick={() => clear.mutate()} loading={clear.isPending}>
          Clear bag
        </Button>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 380px" }, gap: { xs: 3, md: 4 }, alignItems: "start" }}>
        <Stack spacing={2}>
          {cart.items.map((line) => (
            <LineRow key={line.variant_id} line={line} />
          ))}
        </Stack>

        <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
          <CouponBox cart={cart} />
          {cart.totals && (
            <OrderSummary totals={cart.totals} itemCount={cart.item_count} couponCode={cart.coupon?.code}>
              {!cart.can_checkout && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  Some items need attention before you can check out.
                </Alert>
              )}
              <LinkButton href={routes.checkout} variant="contained" size="large" fullWidth disabled={!cart.can_checkout} aria-disabled={!cart.can_checkout}>
                Place order
              </LinkButton>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", mt: 1.5, color: "text.secondary" }}>
                <VerifiedUserOutlinedIcon fontSize="small" />
                <Typography variant="caption">Safe and secure payments · Easy returns</Typography>
              </Stack>
            </OrderSummary>
          )}
        </Stack>
      </Box>
    </PageContainer>
  );
}
