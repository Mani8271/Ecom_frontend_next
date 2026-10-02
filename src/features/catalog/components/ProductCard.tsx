import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { routes } from "@/config/routes";
import { formatPrice } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/services/catalog/types";
import { CatalogImage } from "./CatalogImage";

export function PriceLine({ price, compareAt, discountPct, from, size = "md" }: { price: string | null; compareAt: string | null; discountPct: number; from?: boolean; size?: "md" | "lg" }) {
  const showCompare = compareAt !== null && Number(compareAt) > Number(price);
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography variant={size === "lg" ? "h4" : "subtitle1"} component="span" sx={{ fontWeight: 700 }}>
        {from && (
          <Typography component="span" variant="caption" sx={{ color: "text.secondary", mr: 0.5 }}>
            from
          </Typography>
        )}
        {formatPrice(price)}
      </Typography>
      {showCompare && (
        <Typography variant={size === "lg" ? "body1" : "body2"} component="span" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
          {formatPrice(compareAt)}
        </Typography>
      )}
      {showCompare && discountPct > 0 && (
        <Typography variant={size === "lg" ? "body1" : "body2"} component="span" sx={{ color: "success.main", fontWeight: 600 }}>
          {discountPct}% off
        </Typography>
      )}
    </Stack>
  );
}

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  return (
    <NextLink href={routes.product(product.slug)} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
      <Box
        component="article"
        sx={{
          height: "100%",
          bgcolor: "background.paper",
          borderRadius: 3,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          transition: "box-shadow 150ms, transform 150ms",
          "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
          "&:hover img": { transform: "scale(1.03)" },
          "& img": { transition: "transform 300ms" },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CatalogImage image={product.image} alt={product.name} priority={priority} />
          <Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 8, left: 8 }}>
            {product.badges.includes("new") && <Chip size="small" label="New" color="primary" />}
            {product.badges.includes("bestseller") && <Chip size="small" label="Bestseller" color="secondary" />}
          </Stack>
          {!product.in_stock && (
            <Box sx={{ position: "absolute", inset: "auto 0 0 0", py: 0.75, textAlign: "center", bgcolor: "background.paper", opacity: 0.92 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Out of stock
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ p: 1.5 }}>
          {product.brand && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }} noWrap component="p">
              {product.brand.name}
            </Typography>
          )}
          <Typography variant="body2" component="h3" sx={{ fontWeight: 500, mb: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.6em" }}>
            {product.name}
          </Typography>
          <PriceLine price={product.price} compareAt={product.compare_at_price} discountPct={product.discount_pct} from={product.price_varies} />
          {product.rating.count > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5 }}>
              <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
              <Typography variant="caption">
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>
    </NextLink>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2.5 }, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" } }}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < priorityCount} />
      ))}
    </Box>
  );
}
