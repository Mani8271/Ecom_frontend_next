import type { Metadata } from "next";
import { OrdersPanel } from "@/features/admin/orders/OrdersPanel";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return <OrdersPanel />;
}
