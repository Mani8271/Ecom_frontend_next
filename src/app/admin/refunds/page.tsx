import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { RefundsPanel } from "@/features/admin/payments/PaymentViews";

export const metadata: Metadata = { title: "Refunds" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RefundsPanel />
    </Suspense>
  );
}
