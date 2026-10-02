import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { InventoryDashboard } from "@/features/admin/inventory/InventoryViews";

export const metadata: Metadata = { title: "Inventory" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InventoryDashboard />
    </Suspense>
  );
}
