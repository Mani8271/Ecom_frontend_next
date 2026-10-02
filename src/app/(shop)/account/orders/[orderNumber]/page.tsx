import type { Metadata } from "next";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={orderNumber} />;
}
