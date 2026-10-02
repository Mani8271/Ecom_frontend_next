import type { Metadata } from "next";
import { BrandsPanel } from "@/features/admin/catalog/BrandsPanel";

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return <BrandsPanel />;
}
