import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { OutOfStockView } from "@/features/admin/inventory/InventoryViews";

export const metadata: Metadata = { title: "Out of stock" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OutOfStockView />
    </Suspense>
  );
}
