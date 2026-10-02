import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { REPORTS } from "@/features/admin/reports/report-list";
import { ReportView } from "@/features/admin/reports/ReportViews";

export async function generateMetadata({ params }: PageProps<"/admin/reports/[type]">): Promise<Metadata> {
  const { type } = await params;
  return { title: REPORTS.find((r) => r.type === type)?.title ?? "Report" };
}

export default async function AdminReportPage({ params }: PageProps<"/admin/reports/[type]">) {
  const { type } = await params;
  if (!REPORTS.some((r) => r.type === type)) notFound();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportView key={type} type={type} />
    </Suspense>
  );
}
