import type { Metadata } from "next";
import { CategoriesPanel } from "@/features/admin/catalog/CategoriesPanel";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return <CategoriesPanel />;
}
