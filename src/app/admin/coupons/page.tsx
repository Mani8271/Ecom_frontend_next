import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { CouponsPanel } from "@/features/admin/marketing/CouponsPanel";

export const metadata: Metadata = { title: "Coupons" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CouponsPanel />
    </Suspense>
  );
}
