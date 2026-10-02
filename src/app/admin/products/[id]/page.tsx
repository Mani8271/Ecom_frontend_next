import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { ProductEditor } from "@/features/admin/products/ProductEditor";

export const metadata: Metadata = { title: "Edit product" };

export default async function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductEditor productId={productId} />
    </Suspense>
  );
}
