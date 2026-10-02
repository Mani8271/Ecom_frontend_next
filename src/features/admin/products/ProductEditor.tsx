"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/common/LinkButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatPriceRange } from "@/lib/format";
import { ImagesEditor } from "./ImagesEditor";
import { ProductForm } from "./ProductForm";
import { ProductStatusChip } from "./ProductStatusChip";
import { useProduct } from "./queries";
import { VariantsEditor } from "./VariantsEditor";

const TABS = ["details", "variants", "images"] as const;
type EditorTab = (typeof TABS)[number];

export function ProductEditor({ productId }: { productId: number }) {
  const { data: product, isLoading, error, refetch } = useProduct(productId);
  const { hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab: EditorTab = TABS.includes(requested as EditorTab) ? (requested as EditorTab) : "details";

  if (isLoading) return <PageSkeleton />;
  if (error || !product) return <ErrorState error={error} title="Couldn't load this product" onRetry={() => refetch()} />;

  const canEdit = hasPermission("products.update");

  return (
    <>
      <LinkButton href={routes.admin.products} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>
        Products
      </LinkButton>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" component="h1" noWrap>
            {product.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {product.primary_category.name} · {formatPriceRange(product.min_price, product.max_price)} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
            {product.in_stock ? "" : " · Out of stock"}
          </Typography>
        </Box>
        <ProductStatusChip status={product.status} />
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, next: EditorTab) => router.replace(next === "details" ? pathname : `${pathname}?tab=${next}`, { scroll: false })}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="details" label="Details" />
        <Tab value="variants" label={`Variants & stock (${product.variants.length})`} />
        <Tab value="images" label={`Images (${product.media.filter((m) => m.collection === "gallery" || m.collection === "main").length})`} />
      </Tabs>

      {!canEdit && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          You can view this product but not change it.
        </Typography>
      )}
      {tab === "details" && <ProductForm product={product} />}
      {tab === "variants" && <VariantsEditor product={product} />}
      {tab === "images" && <ImagesEditor product={product} />}
    </>
  );
}
