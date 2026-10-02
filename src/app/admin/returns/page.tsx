import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { ReturnsPanel } from "@/features/admin/returns/ReturnsPanel";

export const metadata: Metadata = { title: "Returns" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReturnsPanel />
    </Suspense>
  );
}
