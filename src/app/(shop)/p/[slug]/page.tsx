import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PageContainer } from "@/components/common/PageContainer";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { ProductGrid } from "@/features/catalog/components/ProductCard";
import { ProductOverview } from "@/features/catalog/components/ProductOverview";
import { RecentlyViewedSection, TrackRecentlyViewed } from "@/features/catalog/components/RecentlyViewed";
import { ProductReviews } from "@/features/reviews/ProductReviews";
import { isApiError } from "@/services/api/errors";
import { catalogService } from "@/services/catalog/catalog.service";
import type { ProductCard, ProductDetail } from "@/services/catalog/types";

const getProduct = cache(async (slug: string) => {
  try {
    return (await catalogService.product(slug)).data;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  const image = product.media[0]?.urls.lg ?? product.image?.lg;
  return {
    title: product.seo.title,
    description: product.seo.description ?? undefined,
    keywords: product.seo.keywords ?? undefined,
    alternates: { canonical: routes.product(product.slug) },
    openGraph: { title: product.seo.title, description: product.seo.description ?? undefined, images: image ? [image] : undefined },
  };
}

/** schema.org Product markup for rich results. */
function productJsonLd(product: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo.description ?? undefined,
    sku: product.style_code ?? product.variants[0]?.sku,
    image: product.media.map((m) => m.urls.lg ?? m.urls.original).filter(Boolean),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: siteConfig.currency,
      lowPrice: product.price,
      highPrice: product.variants.reduce((max, v) => Math.max(max, Number(v.price)), 0) || product.price,
      offerCount: product.variants.length,
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}${routes.product(product.slug)}`,
    },
    ...(product.rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } } : {}),
  };
}

function Rail({ title, products }: { title: string; products: ProductCard[] | undefined }) {
  if (!products || products.length === 0) return null;
  return (
    <Box component="section" sx={{ mt: { xs: 6, md: 10 } }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2.5 }}>
        {title}
      </Typography>
      <ProductGrid products={products.slice(0, 8)} />
    </Box>
  );
}

export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  // Recommendation rails are optional: a failure hides the rail, never the page.
  const [related, similar, together] = await Promise.all([
    catalogService.related(slug).then((r) => r.data).catch(() => undefined),
    catalogService.similar(slug).then((r) => r.data).catch(() => undefined),
    catalogService.boughtTogether(slug).then((r) => r.data).catch(() => undefined),
  ]);
  const similarIds = new Set((similar ?? []).map((p) => p.id));

  return (
    <PageContainer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }} />
      <TrackRecentlyViewed productId={product.id} />

      <Breadcrumbs sx={{ mb: 2, "& a": { color: "text.secondary", textDecoration: "none" } }}>
        <NextLink href={routes.home}>Home</NextLink>
        {product.breadcrumbs.map((crumb) => (
          <NextLink key={crumb.slug} href={routes.category(crumb.slug)}>
            {crumb.name}
          </NextLink>
        ))}
        <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <ProductOverview product={product} />

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1.1fr 1fr" }, gap: { xs: 4, md: 6 }, mt: { xs: 5, md: 8 } }}>
        <Box>
          {product.features.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Key features
              </Typography>
              <Stack component="ul" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
                {product.features.map((feature) => (
                  <Stack key={feature} component="li" direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                    <CheckCircleOutlineIcon fontSize="small" sx={{ color: "primary.main", mt: 0.25 }} />
                    <Typography variant="body1">{feature}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
          {product.description && (
            <Box>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Product details
              </Typography>
              {/* Sanitized on the server (HtmlSanitizer) before it is stored. */}
              <Box sx={{ typography: "body1", color: "text.secondary", "& p": { mt: 0, mb: 1.5 }, "& ul": { pl: 3 } }} dangerouslySetInnerHTML={{ __html: product.description }} />
            </Box>
          )}
        </Box>

        {product.specifications.length > 0 && (
          <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Specifications
            </Typography>
            {product.specifications.map((group) => (
              <Box key={group.group} sx={{ mb: 3 }}>
                {product.specifications.length > 1 && (
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {group.group}
                  </Typography>
                )}
                <Table size="small">
                  <TableBody>
                    {group.items.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell component="th" scope="row" sx={{ color: "text.secondary", width: "40%", pl: 0 }}>
                          {item.name}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Rail title="Frequently bought together" products={together} />

      <Box sx={{ mt: { xs: 6, md: 10 } }}>
        <ProductReviews slug={product.slug} productName={product.name} />
      </Box>

      <Rail title="Similar products" products={similar} />
      <Rail title="You may also like" products={related?.filter((p) => !similarIds.has(p.id))} />
      <RecentlyViewedSection excludeId={product.id} />
    </PageContainer>
  );
}
