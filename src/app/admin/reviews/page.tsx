import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { ReviewsPanel } from "@/features/admin/marketing/ReviewsPanel";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReviewsPanel />
    </Suspense>
  );
}
