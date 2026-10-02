import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDetailView } from "@/features/admin/customers/CustomerViews";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <CustomerDetailView customerId={id} />;
}
