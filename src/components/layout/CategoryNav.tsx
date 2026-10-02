import Box from "@mui/material/Box";
import NextLink from "next/link";
import { routes } from "@/config/routes";
import { catalogService } from "@/services/catalog/catalog.service";

/** Top-level categories under the header. Hidden (not an error page) if the API is unreachable. */
export async function CategoryNav() {
  const tree = await catalogService.categoryTree(0, 12).catch(() => null);
  const categories = tree?.data ?? [];
  if (categories.length === 0) return null;

  return (
    <Box
      component="nav"
      aria-label="Categories"
      sx={{
        display: "flex",
        gap: { xs: 2.5, md: 4 },
        overflowX: "auto",
        pb: 1.25,
        scrollbarWidth: "none",
        "& a": { color: "text.primary", textDecoration: "none", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", py: 0.5 },
        "& a:hover": { color: "primary.dark" },
      }}
    >
      <NextLink href={routes.search()}>All products</NextLink>
      {categories.map((category) => (
        <NextLink key={category.id} href={routes.category(category.slug)}>
          {category.name}
        </NextLink>
      ))}
    </Box>
  );
}
