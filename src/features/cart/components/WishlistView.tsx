"use client";

import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { ProductCardSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { CatalogImage } from "@/features/catalog/components/CatalogImage";
import { PriceLine } from "@/features/catalog/components/ProductCard";
import { http } from "@/services/api/http";
import { wishlistService, type WishlistEntry } from "@/services/cart/wishlist.service";
import type { ProductCard } from "@/services/catalog/types";
import { useCartKey } from "../hooks";
import { useWishlistIds, useWishlistToggle } from "../wishlist-hooks";

const PAGE_SIZE = 20;

function WishlistCard({ product, onMove, moving }: { product: ProductCard & Partial<WishlistEntry>; onMove?: () => void; moving?: boolean }) {
  const toggle = useWishlistToggle();

  return (
    <Box sx={{ position: "relative", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <IconButton
        size="small"
        aria-label={`Remove ${product.name} from wishlist`}
        onClick={() => toggle.mutate({ productId: product.id, saved: true })}
        sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <NextLink href={routes.product(product.slug)} style={{ textDecoration: "none", color: "inherit" }}>
        <CatalogImage image={product.image} alt={product.name} />
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {product.name}
          </Typography>
          {product.variant?.title && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {product.variant.title}
            </Typography>
          )}
          <PriceLine price={product.price} compareAt={product.compare_at_price} discountPct={product.discount_pct} from={product.price_varies} />
        </Box>
      </NextLink>
      <Box sx={{ p: 1.5, pt: 0, mt: "auto" }}>
        {!product.in_stock || product.available === false ? (
          <Button fullWidth size="small" disabled>
            Out of stock
          </Button>
        ) : onMove ? (
          <Button fullWidth size="small" variant="outlined" startIcon={<ShoppingBagOutlinedIcon />} onClick={onMove} loading={moving}>
            Move to bag
          </Button>
        ) : (
          <LinkButton fullWidth size="small" variant="outlined" href={routes.product(product.slug)}>
            Select options
          </LinkButton>
        )}
      </Box>
    </Box>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" } }}>{children}</Box>;
}

function Empty() {
  return (
    <EmptyState
      icon={<FavoriteBorderIcon />}
      title="Your wishlist is empty"
      description="Tap the heart on any product to save it for later."
      action={
        <LinkButton href={routes.search()} variant="contained">
          Discover products
        </LinkButton>
      }
    />
  );
}

/** Customers: server wishlist with "Move to bag". */
function CustomerWishlist() {
  const [page, setPage] = useState(1);
  const [moving, setMoving] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const cartKey = useCartKey();
  const notify = useNotify();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["wishlist", "list", page],
    queryFn: () => wishlistService.list({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  async function move(entry: WishlistEntry) {
    setMoving(entry.id);
    try {
      await wishlistService.moveToCart(entry.id, entry.variant?.id);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["wishlist"] }), queryClient.invalidateQueries({ queryKey: cartKey })]);
      notify.success("Moved to your bag", { label: "View bag", href: routes.cart });
    } catch (err) {
      notify.error(err);
    } finally {
      setMoving(null);
    }
  }

  if (isLoading) {
    return (
      <Grid>
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </Grid>
    );
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data || data.data.length === 0) return <Empty />;

  return (
    <>
      <Grid>
        {data.data.map((entry) => (
          <WishlistCard key={entry.id} product={entry} onMove={() => move(entry)} moving={moving === entry.id} />
        ))}
      </Grid>
      {data.pagination.last_page > 1 && (
        <Stack sx={{ alignItems: "center", mt: 4 }}>
          <Pagination count={data.pagination.last_page} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </Stack>
      )}
    </>
  );
}

/** Guests: saved in this browser (first 20 shown), merged into the account at login. */
function GuestWishlist() {
  const { data: ids = [], isLoading: idsLoading } = useWishlistIds();
  const shown = ids.slice(0, PAGE_SIZE);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist", "guest-cards", shown],
    queryFn: () => http.get<ProductCard[]>("/products/batch", { query: { ids: shown }, auth: false }).then((r) => r.data),
    enabled: shown.length > 0,
  });

  if (idsLoading || (shown.length > 0 && isLoading)) {
    return (
      <Grid>
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </Grid>
    );
  }
  if (products.length === 0) return <Empty />;

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }} action={<LinkButton href={routes.login(routes.wishlist)} size="small" color="inherit">Log in</LinkButton>}>
        Your wishlist is saved on this device. Log in to keep it across devices.
      </Alert>
      <Grid>
        {products.map((product) => (
          <WishlistCard key={product.id} product={product} />
        ))}
      </Grid>
    </>
  );
}

export function WishlistView({ heading = true }: { heading?: boolean }) {
  const { status } = useAuth();

  return (
    <>
      {heading && (
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Wishlist
        </Typography>
      )}
      {status === "loading" ? null : status === "authenticated" ? <CustomerWishlist /> : <GuestWishlist />}
    </>
  );
}
