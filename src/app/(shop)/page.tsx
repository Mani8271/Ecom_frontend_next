import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { LinkButton } from "@/components/common/LinkButton";
import { routes } from "@/config/routes";
import { CatalogImage } from "@/features/catalog/components/CatalogImage";
import { ProductGrid } from "@/features/catalog/components/ProductCard";
import { catalogService } from "@/services/catalog/catalog.service";

// Hero and value props are static; merchandised sections will come from GET /home (CMS).
const promises = [
  { icon: <LocalShippingOutlinedIcon />, title: "Fast delivery", text: "Quick, tracked shipping across India" },
  { icon: <AssignmentReturnOutlinedIcon />, title: "Easy returns", text: "Hassle-free returns on eligible items" },
  { icon: <VerifiedUserOutlinedIcon />, title: "Secure payments", text: "UPI, cards, net banking and COD" },
];

export default async function HomePage() {
  // Sections disappear quietly if the API is down; the page itself still renders.
  const [categories, newArrivals] = await Promise.all([
    catalogService.categoryTree(0, 12).catch(() => null),
    catalogService.products({ new_arrival: 1, sort: "newest", limit: 8, facets: 0 }).catch(() => null),
  ]);

  return (
    <>
      <Box sx={{ bgcolor: "primary.light", borderBottom: 1, borderColor: "divider" }}>
        <Container maxWidth="xl" sx={{ py: { xs: 7, md: 12 } }}>
          <Stack spacing={3} sx={{ maxWidth: 640 }}>
            <Typography variant="overline" sx={{ color: "primary.dark" }}>
              New season collection
            </Typography>
            <Typography variant="h1">Timeless style, made for every celebration.</Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 520 }}>
              Discover handpicked ethnic and western wear for men, women and kids, from everyday comfort to festive elegance.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <LinkButton href={routes.search()} variant="contained" size="large">
                Shop now
              </LinkButton>
              <LinkButton href={routes.register} variant="outlined" size="large" color="secondary">
                Join Loomi Trends
              </LinkButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={2}>
          {promises.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 4 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 2.5, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
                <Box sx={{ color: "primary.dark", display: "flex" }}>{item.icon}</Box>
                <Box>
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.text}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>

      {categories && categories.data.length > 0 && (
        <Container maxWidth="xl" sx={{ pb: { xs: 4, md: 6 } }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2.5 }}>
            Shop by category
          </Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" } }}>
            {categories.data.map((category) => (
              <NextLink key={category.id} href={routes.category(category.slug)} style={{ textDecoration: "none", color: "inherit" }}>
                <Box sx={{ borderRadius: 3, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "background.paper", "&:hover": { boxShadow: 2 } }}>
                  <CatalogImage image={category.image} alt={category.name} ratio="1 / 1" sizes="(max-width: 600px) 50vw, 16vw" />
                  <Typography variant="subtitle2" sx={{ p: 1.5, textAlign: "center" }}>
                    {category.name}
                  </Typography>
                </Box>
              </NextLink>
            ))}
          </Box>
        </Container>
      )}

      {newArrivals && newArrivals.data.length > 0 && (
        <Container maxWidth="xl" sx={{ pb: { xs: 6, md: 10 } }}>
          <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 2.5 }}>
            <Typography variant="h5" component="h2">
              New arrivals
            </Typography>
            <NextLink href={routes.search()} style={{ textDecoration: "none" }}>
              <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600 }}>
                View all
              </Typography>
            </NextLink>
          </Stack>
          <ProductGrid products={newArrivals.data} />
        </Container>
      )}
    </>
  );
}
