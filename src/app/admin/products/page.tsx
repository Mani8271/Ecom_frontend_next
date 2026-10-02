import type { Metadata } from "next";
import { ProductsPanel } from "@/features/admin/products/ProductsPanel";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return <ProductsPanel />;
}
