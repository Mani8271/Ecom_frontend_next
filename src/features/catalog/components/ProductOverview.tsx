"use client";

import BoltIcon from "@mui/icons-material/Bolt";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/config/routes";
import { QuantitySelector } from "@/features/cart/components/QuantitySelector";
import { WishlistButton } from "@/features/cart/components/WishlistButton";
import { useCartActions } from "@/features/cart/hooks";
import type { ProductAxis, ProductDetail, ProductMedia, ProductVariant } from "@/services/catalog/types";
import { srcSetOf } from "./CatalogImage";
import { PriceLine } from "./ProductCard";

type Selection = Record<string, number>;

function matches(variant: ProductVariant, selection: Selection): boolean {
  return Object.entries(selection).every(([code, id]) => variant.options[code] === id);
}

function initialSelection(product: ProductDetail): Selection {
  if (product.variants.length === 1) return { ...product.variants[0].options };
  // Preselect the first axis (usually Color) so the gallery shows a real variant.
  const first = product.axes[0];
  const option = first?.options.find((o) => o.in_stock) ?? first?.options[0];
  return first && option ? { [first.code]: option.id } : {};
}

/** Images for the selection: variant-linked ones first, then product-wide ones. */
function galleryFor(product: ProductDetail, selection: Selection): ProductMedia[] {
  const linked = new Set(product.variants.flatMap((v) => v.media_ids));
  const general = product.media.filter((m) => !linked.has(m.id));
  const chosen = product.variants.filter((v) => matches(v, selection)).flatMap((v) => v.media_ids);
  if (chosen.length === 0) return product.media;
  const ids = new Set(chosen);
  return [...product.media.filter((m) => ids.has(m.id)), ...general];
}

function Gallery({ media, name }: { media: ProductMedia[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = media[Math.min(active, media.length - 1)];

  if (!current) {
    return <Box sx={{ aspectRatio: "3 / 4", bgcolor: "action.hover", borderRadius: 3 }} />;
  }

  return (
    <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
      {media.length > 1 && (
        <Stack direction={{ xs: "row", sm: "column" }} spacing={1} sx={{ overflow: "auto", flexShrink: 0 }}>
          {media.map((m, index) => (
            <ButtonBase
              key={m.id}
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}`}
              sx={{ width: 64, flexShrink: 0, aspectRatio: "3 / 4", borderRadius: 1.5, overflow: "hidden", border: 2, borderColor: index === active ? "primary.main" : "transparent" }}
            >
              <Box component="img" src={m.urls.thumb ?? m.urls.original ?? undefined} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </ButtonBase>
          ))}
        </Stack>
      )}
      <Box sx={{ flex: 1, position: "relative", aspectRatio: "3 / 4", borderRadius: 3, overflow: "hidden", bgcolor: "action.hover" }}>
        <Box
          component="img"
          src={current.urls.lg ?? current.urls.md ?? current.urls.original ?? undefined}
          srcSet={srcSetOf(current.urls)}
          sizes="(max-width: 900px) 100vw, 50vw"
          alt={current.alt || name}
          fetchPriority="high"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
    </Stack>
  );
}

function AxisSelector({ axis, product, selection, onSelect }: { axis: ProductAxis; product: ProductDetail; selection: Selection; onSelect: (id: number) => void }) {
  const selectedId = selection[axis.code];
  const selectedLabel = axis.options.find((o) => o.id === selectedId)?.label;
  const swatches = axis.display_type === "swatch" && axis.options.some((o) => o.swatch);

  // An option is buyable if an in-stock variant has it together with the other chosen options.
  const others = Object.fromEntries(Object.entries(selection).filter(([code]) => code !== axis.code));
  const state = (optionId: number) => {
    const candidates = product.variants.filter((v) => v.options[axis.code] === optionId && matches(v, others));
    return { exists: candidates.length > 0, inStock: candidates.some((v) => v.in_stock) };
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {axis.name}
        {selectedLabel && (
          <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
            {selectedLabel}
          </Typography>
        )}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label={axis.name}>
        {axis.options.map((option) => {
          const { exists, inStock } = state(option.id);
          const selected = option.id === selectedId;
          const label = `${option.label}${inStock ? "" : " (out of stock)"}`;

          return swatches ? (
            <Tooltip key={option.id} title={label}>
              <ButtonBase
                role="radio"
                aria-checked={selected}
                aria-label={label}
                disabled={!exists}
                onClick={() => onSelect(option.id)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: 2,
                  borderColor: selected ? "primary.main" : "divider",
                  p: 0.5,
                  opacity: inStock ? 1 : 0.4,
                }}
              >
                <Box sx={{ width: "100%", height: "100%", borderRadius: "50%", bgcolor: option.swatch ?? "action.hover", border: 1, borderColor: "divider" }} />
              </ButtonBase>
            </Tooltip>
          ) : (
            <Button
              key={option.id}
              role="radio"
              aria-checked={selected}
              aria-label={label}
              disabled={!exists}
              variant={selected ? "contained" : "outlined"}
              color={selected ? "primary" : "inherit"}
              onClick={() => onSelect(option.id)}
              sx={{ minWidth: 56, textDecoration: inStock ? "none" : "line-through", borderColor: "divider" }}
            >
              {option.label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

const MAX_PER_ORDER = 10;

/** Quantity, Add to bag, Buy now and Wishlist for the selected variant. */
function PurchaseActions({ product, variant, missing }: { product: ProductDetail; variant?: ProductVariant; missing?: string }) {
  const router = useRouter();
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const max = Math.max(1, Math.min(MAX_PER_ORDER, variant?.stock_left ?? MAX_PER_ORDER));
  const qty = Math.min(quantity, max);
  const ready = Boolean(variant?.in_stock);
  const label = !product.in_stock ? "Out of stock" : missing ? `Select ${missing}` : variant && !variant.in_stock ? "Out of stock" : "Add to bag";

  const buy = async (goToBag: boolean) => {
    if (!variant) return;
    await add.mutateAsync({ variantId: variant.id, quantity: qty, silent: goToBag });
    if (goToBag) router.push(routes.checkout);
  };

  return (
    <Stack spacing={2}>
      {ready && (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2">Quantity</Typography>
          <QuantitySelector value={qty} max={max} onChange={setQuantity} />
        </Stack>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ maxWidth: 560 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingBagOutlinedIcon />}
          disabled={!ready || add.isPending}
          loading={add.isPending && !add.variables?.silent}
          onClick={() => buy(false).catch(() => undefined)}
          sx={{ flex: 1 }}
        >
          {label}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<BoltIcon />}
          disabled={!ready || add.isPending}
          loading={add.isPending && Boolean(add.variables?.silent)}
          onClick={() => buy(true).catch(() => undefined)}
          sx={{ flex: 1 }}
        >
          Buy now
        </Button>
        <WishlistButton productId={product.id} variantId={variant?.id} variant="button" />
      </Stack>
    </Stack>
  );
}

/** Gallery + variant picker + price; they share the selected options. */
export function ProductOverview({ product }: { product: ProductDetail }) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product));
  const complete = product.axes.every((axis) => selection[axis.code] !== undefined);
  const variant = complete ? product.variants.find((v) => matches(v, selection)) : undefined;
  const missing = product.axes.find((axis) => selection[axis.code] === undefined);

  const select = (code: string, id: number) =>
    setSelection((current) => {
      const next = { ...current, [code]: id };
      // Drop later choices that no longer combine into an existing variant.
      return product.variants.some((v) => matches(v, next)) ? next : { [code]: id };
    });

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { md: "1.1fr 1fr" }, gap: { xs: 3, md: 6 } }}>
      <Gallery key={JSON.stringify(selection[product.axes[0]?.code ?? ""])} media={galleryFor(product, selection)} name={product.name} />

      <Stack spacing={3}>
        <Box>
          {product.brand && (
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              {product.brand.name}
            </Typography>
          )}
          <Typography variant="h4" component="h1">
            {product.name}
          </Typography>
          {product.short_description && (
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
              {product.short_description}
            </Typography>
          )}
        </Box>

        <Box>
          {variant ? (
            <PriceLine price={variant.price} compareAt={variant.compare_at_price} discountPct={variant.compare_at_price ? Math.floor((1 - Number(variant.price) / Number(variant.compare_at_price)) * 100) : 0} size="lg" />
          ) : (
            <PriceLine price={product.price} compareAt={product.compare_at_price} discountPct={product.discount_pct} from={product.price_varies} size="lg" />
          )}
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Inclusive of all taxes
          </Typography>
        </Box>

        {product.axes.map((axis) => (
          <AxisSelector key={axis.code} axis={axis} product={product} selection={selection} onSelect={(id) => select(axis.code, id)} />
        ))}

        {variant && !variant.in_stock && <Alert severity="warning">This option is out of stock.</Alert>}
        {variant?.stock_left && (
          <Typography variant="body2" sx={{ color: "warning.main", fontWeight: 600 }}>
            Hurry, only {variant.stock_left} left!
          </Typography>
        )}

        <PurchaseActions product={product} variant={variant} missing={missing?.name} />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", color: "text.secondary" }}>
          <LocalShippingOutlinedIcon fontSize="small" />
          <Typography variant="body2">Fast delivery across India · Easy returns</Typography>
        </Stack>

        {variant && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            SKU: {variant.sku}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
