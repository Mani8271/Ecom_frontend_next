import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { SalesAnalytics } from "@/features/admin/analytics/SalesAnalytics";

export const metadata: Metadata = { title: "Sales analytics" };

export default function AdminSalesAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SalesAnalytics />
    </Suspense>
  );
}
