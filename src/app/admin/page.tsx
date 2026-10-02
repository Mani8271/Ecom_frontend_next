import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { CommandCenter } from "@/features/admin/analytics/CommandCenter";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CommandCenter />
    </Suspense>
  );
}
