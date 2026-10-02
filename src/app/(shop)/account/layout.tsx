import Grid from "@mui/material/Grid";
import type { Metadata } from "next";
import { PageContainer } from "@/components/common/PageContainer";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AccountNav } from "@/features/account/components/AccountNav";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s | My account" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <PageContainer>
      <Grid container spacing={{ xs: 2, md: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <AccountNav />
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <RequireAuth fallback={<PageSkeleton />}>{children}</RequireAuth>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
