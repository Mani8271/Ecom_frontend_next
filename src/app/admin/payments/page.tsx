import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PaymentsPanel } from "@/features/admin/payments/PaymentViews";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PaymentsPanel />
    </Suspense>
  );
}
