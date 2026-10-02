import type { Metadata } from "next";
import { ReportsIndex } from "@/features/admin/reports/ReportViews";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <ReportsIndex />;
}
