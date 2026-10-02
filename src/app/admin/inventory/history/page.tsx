import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { StockHistoryView } from "@/features/admin/inventory/InventoryViews";

export const metadata: Metadata = { title: "Stock history" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StockHistoryView />
    </Suspense>
  );
}
