import SearchOffIcon from "@mui/icons-material/SearchOff";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { PageContainer } from "@/components/common/PageContainer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { routes } from "@/config/routes";
import type { ProductListing } from "@/services/catalog/catalog.service";
import { currentPage, type SearchParams } from "../listing-params";
import { FiltersPanel, ListingPagination, MobileFilters, SortSelect } from "./ListingControls";
import { ProductGrid } from "./ProductCard";

interface ListingViewProps {
  title: string;
  description?: string | null;
  breadcrumbs?: { name: string; href: string }[];
  subcategories?: { name: string; slug: string }[];
  listing: ProductListing;
  params: SearchParams;
}

/** Shared by category pages and search: filters + sort + grid + pagination. */
export function ListingView({ title, description, breadcrumbs, subcategories, listing, params }: ListingViewProps) {
  const facets = listing.meta?.facets ?? [];
  const total = listing.pagination.total;
  const sort = listing.meta?.sort ?? "popular";

  return (
    <PageContainer>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1.5, "& a": { color: "text.secondary", textDecoration: "none" } }}>
          <NextLink href={routes.home}>Home</NextLink>
          {breadcrumbs.map((crumb, index) =>
            index === breadcrumbs.length - 1 ? (
              <Typography key={crumb.href} variant="body2" sx={{ color: "text.primary" }}>
                {crumb.name}
              </Typography>
            ) : (
              <NextLink key={crumb.href} href={crumb.href}>
                {crumb.name}
              </NextLink>
            ),
          )}
        </Breadcrumbs>
      )}

      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 720 }}>
          {description}
        </Typography>
      )}

      {subcategories && subcategories.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}>
          {subcategories.map((c) => (
            <NextLink key={c.slug} href={routes.category(c.slug)} style={{ textDecoration: "none" }}>
              <Chip label={c.name} variant="outlined" clickable />
            </NextLink>
          ))}
        </Stack>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "260px 1fr" }, gap: 4, mt: 3 }}>
        <Box component="aside" sx={{ display: { xs: "none", md: "block" } }}>
          <FiltersPanel facets={facets} params={params} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <MobileFilters facets={facets} params={params} />
            <Typography variant="body2" sx={{ color: "text.secondary", flex: 1 }}>
              {total.toLocaleString("en-IN")} product{total === 1 ? "" : "s"}
            </Typography>
            <SortSelect params={params} value={sort} />
          </Stack>

          {listing.data.length === 0 ? (
            <EmptyState icon={<SearchOffIcon />} title="No products found" description="Try removing some filters or searching for something else." />
          ) : (
            <ProductGrid products={listing.data} priorityCount={4} />
          )}

          <ListingPagination params={params} page={currentPage(params)} lastPage={listing.pagination.last_page} />
        </Box>
      </Box>
    </PageContainer>
  );
}
