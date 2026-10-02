import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { LowStockView } from "@/features/admin/inventory/InventoryViews";

export const metadata: Metadata = { title: "Low stock" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LowStockView />
    </Suspense>
  );
}
