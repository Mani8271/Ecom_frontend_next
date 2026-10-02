import type { Metadata } from "next";
import { OrdersList } from "@/features/orders/components/OrdersList";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return <OrdersList />;
}
