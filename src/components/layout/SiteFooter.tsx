import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/common/AppLink";
import { Logo } from "@/components/common/Logo";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const columns = [
  {
    title: "Your account",
    links: [
      { label: "Login", href: routes.login() },
      { label: "Orders", href: routes.account.orders },
      { label: "Wishlist", href: routes.wishlist },
      { label: "Addresses", href: routes.account.addresses },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping", href: routes.help.shipping },
      { label: "Returns & refunds", href: routes.help.returns },
      { label: "Contact us", href: routes.help.contact },
    ],
  },
];

export function SiteFooter() {
  return (
    <Box component="footer" sx={{ mt: 8, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Logo />
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 2, maxWidth: 380 }}>
              {siteConfig.description}
            </Typography>
          </Grid>
          {columns.map((column) => (
            <Grid key={column.title} size={{ xs: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                {column.title}
              </Typography>
              <Stack spacing={1}>
                {column.links.map((link) => (
                  <AppLink key={link.href} href={link.href} variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
                    {link.label}
                  </AppLink>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
