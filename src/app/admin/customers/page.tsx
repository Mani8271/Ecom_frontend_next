import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { CustomersPanel } from "@/features/admin/customers/CustomerViews";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomersPanel />
    </Suspense>
  );
}
